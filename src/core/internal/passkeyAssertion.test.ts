import * as Hash from 'ox/Hash'
import * as Hex from 'ox/Hex'
import * as P256 from 'ox/P256'
import * as PublicKey from 'ox/PublicKey'
import * as WebAuthnP256 from 'ox/WebAuthnP256'
import { hashTypedData } from 'viem'
import { describe, expect, test } from 'vitest'
import { findAdminKeyIndex, replaySafeDigest } from './passkeyAssertion.js'

const account = '0x5684abc7d4d24af1b4ef1e7a0a2b7d6d6c0e1111'
const digest = Hash.keccak256(Hex.fromString('sign in'))

function passkey() {
  const privateKey = P256.randomPrivateKey()
  const publicKey = PublicKey.toHex(P256.getPublicKey({ privateKey }))

  return {
    assert(challenge: Hex.Hex) {
      const { metadata, payload } = WebAuthnP256.getSignPayload({
        challenge,
        origin: 'https://id.oportet.xyz',
        rpId: 'id.oportet.xyz',
      })

      return {
        metadata,
        signature: P256.sign({ hash: true, payload, privateKey }),
      }
    },
    key: { publicKey, role: 'admin', type: 'webauthn-p256' },
  }
}

describe('replaySafeDigest', () => {
  test('is bound to the account', () => {
    expect(replaySafeDigest(account, digest)).not.toBe(digest)
    expect(replaySafeDigest(account, digest)).not.toBe(
      replaySafeDigest('0x742d35Cc6634C0532925a3b844Bc454e4438f44e', digest),
    )
  })

  // The contract's scheme, through viem rather than ox: EIP-712 under a domain
  // holding only verifyingContract, over ERC1271Sign(bytes32 digest).
  test('matches what the account rehashes in isValidSignature', () => {
    expect(replaySafeDigest(account, digest)).toBe(
      hashTypedData({
        domain: { verifyingContract: account },
        message: { digest },
        primaryType: 'ERC1271Sign',
        types: {
          ERC1271Sign: [{ name: 'digest', type: 'bytes32' }],
        },
      }),
    )
  })
})

describe('findAdminKeyIndex', () => {
  const challenge = replaySafeDigest(account, digest)

  test('finds the first passkey', () => {
    const first = passkey()

    expect(
      findAdminKeyIndex([first.key], challenge, first.assert(challenge)),
    ).toBe(0)
  })

  test('finds a second passkey, not the first key on the account', () => {
    const first = passkey()
    const second = passkey()

    expect(
      findAdminKeyIndex(
        [first.key, second.key],
        challenge,
        second.assert(challenge),
      ),
    ).toBe(1)
  })

  test("refuses another account's passkey", () => {
    const owner = passkey()
    const stranger = passkey()

    expect(
      findAdminKeyIndex([owner.key], challenge, stranger.assert(challenge)),
    ).toBe(-1)
  })

  test('refuses a signature over a different challenge', () => {
    const owner = passkey()

    expect(
      findAdminKeyIndex([owner.key], challenge, owner.assert(digest)),
    ).toBe(-1)
  })

  test('skips session keys and malformed keys', () => {
    const owner = passkey()

    expect(
      findAdminKeyIndex(
        [
          { ...owner.key, role: 'session' },
          { publicKey: '0x01', role: 'admin', type: 'webauthn-p256' },
        ],
        challenge,
        owner.assert(challenge),
      ),
    ).toBe(-1)
  })
})
