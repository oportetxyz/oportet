import * as Bytes from 'ox/Bytes'
import * as Hex from 'ox/Hex'
import * as P256 from 'ox/P256'
import * as PersonalMessage from 'ox/PersonalMessage'
import * as PublicKey from 'ox/PublicKey'
import * as WebAuthnP256 from 'ox/WebAuthnP256'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import * as Key from '../../../viem/Key.js'
import * as RelayActions from '../../../viem/RelayActions.js'
import { replaySafeDigest } from '../passkeyAssertion.js'
import { relay } from './relay.js'

// The system sheet and the relay are the two things outside this path. What
// the sheet returns and which keys the chain holds is what these tests vary.
vi.mock('ox/WebAuthnP256', async (original) => ({
  ...(await original<typeof WebAuthnP256>()),
  sign: vi.fn(),
}))
vi.mock('../../../viem/RelayActions.js', async (original) => ({
  ...(await original<typeof RelayActions>()),
  getKeys: vi.fn(),
}))
vi.mock('../tokens.js', () => ({ getTokens: async () => [] }))
vi.mock('../erc8010.js', () => ({
  wrap: async (_: unknown, { signature }: { signature: Hex.Hex }) => signature,
}))

const account = '0x5684abc7d4d24af1b4ef1e7a0a2b7d6d6c0e1111'
const stranger = '0x742d35cc6634c0532925a3b844bc454e4438f44e'
const message = 'onramp.xyz wants you to sign in'
const digest = PersonalMessage.getSignPayload(Hex.fromString(message))

vi.mock('../siwe.js', () => ({
  buildMessage: async () => 'onramp.xyz wants you to sign in',
}))

function passkey() {
  const privateKey = P256.randomPrivateKey()
  // Unprefixed, as the chain holds it.
  const publicKey = PublicKey.toHex(P256.getPublicKey({ privateKey }), {
    includePrefix: false,
  })

  return {
    key: {
      expiry: 0,
      hash: publicKey.slice(0, 66),
      id: publicKey,
      publicKey,
      role: 'admin',
      type: 'webauthn-p256',
    },
    /** Answers the sheet as this passkey, whose handle claims `userHandle`. */
    pick(userHandle: string) {
      vi.mocked(WebAuthnP256.sign).mockImplementation((async ({
        challenge,
      }: {
        challenge: Hex.Hex
      }) => {
        const { metadata, payload } = WebAuthnP256.getSignPayload({
          challenge,
          origin: 'https://id.oportet.xyz',
          rpId: 'id.oportet.xyz',
        })

        return {
          metadata,
          raw: {
            id: publicKey.slice(0, 18),
            response: { userHandle: Bytes.fromHex(userHandle as Hex.Hex) },
          },
          signature: P256.sign({ hash: true, payload, privateKey }),
        }
      }) as never)
    },
  } as const
}

function onChain(...keys: ReturnType<typeof passkey>['key'][]) {
  vi.mocked(RelayActions.getKeys).mockResolvedValue(keys as never)
}

async function unlock(signIn = true) {
  const { accounts } = await relay().actions.loadAccounts({
    address: account,
    internal: { client: { chain: { id: 1 } } },
    signInWithEthereum: signIn ? { nonce: 'abc12345' } : undefined,
  } as never)

  return accounts[0]!
}

describe('loadAccounts for a named account, no key', () => {
  beforeEach(() => {
    vi.mocked(WebAuthnP256.sign).mockReset()
  })

  test('has the passkey sign what the account will verify', async () => {
    const owner = passkey()
    onChain(owner.key)
    owner.pick(account)

    await unlock()

    expect(vi.mocked(WebAuthnP256.sign).mock.calls[0]?.[0].challenge).toBe(
      replaySafeDigest(account, digest),
    )
  })

  test('connects the owner', async () => {
    const owner = passkey()
    onChain(owner.key)
    owner.pick(account)

    const result = await unlock()

    expect(result.address).toBe(account)
    expect(result.signInWithEthereum?.message).toBe(message)
  })

  test('refuses a passkey of another account, whose handle says so', async () => {
    const owner = passkey()
    const other = passkey()
    onChain(owner.key)
    other.pick(stranger)

    await expect(unlock()).rejects.toThrow('not a key of this account')
  })

  test('refuses a passkey whose handle forges the account', async () => {
    const owner = passkey()
    const thief = passkey()
    onChain(owner.key)
    thief.pick(account)

    await expect(unlock()).rejects.toThrow('not a key of this account')
  })

  test('refuses a foreign passkey even with nothing to sign', async () => {
    const owner = passkey()
    const thief = passkey()
    onChain(owner.key)
    thief.pick(account)

    await expect(unlock(false)).rejects.toThrow('not a key of this account')
  })

  test('connects the owner with nothing to sign', async () => {
    const owner = passkey()
    onChain(owner.key)
    owner.pick(account)

    await expect(unlock(false)).resolves.toMatchObject({ address: account })
  })

  test('signs with the second passkey as the second key', async () => {
    const first = passkey()
    const second = passkey()
    onChain(first.key, second.key)
    second.pick(account)

    const result = await unlock()

    const signature = result.signInWithEthereum?.signature as Hex.Hex
    const asFirst = Key.wrapSignature('0x', {
      keyType: 'webauthn-p256',
      publicKey: first.key.publicKey,
    })
    const asSecond = Key.wrapSignature('0x', {
      keyType: 'webauthn-p256',
      publicKey: second.key.publicKey,
    })

    expect(signature.endsWith(asSecond.slice(2))).toBe(true)
    expect(signature.endsWith(asFirst.slice(2))).toBe(false)
  })
})
