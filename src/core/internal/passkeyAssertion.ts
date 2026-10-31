import type * as Address from 'ox/Address'
import type * as Hex from 'ox/Hex'
import * as PublicKey from 'ox/PublicKey'
import * as TypedData from 'ox/TypedData'
import * as WebAuthnP256 from 'ox/WebAuthnP256'

/**
 * The digest a passkey has to sign for the account's ERC-1271 check to pass.
 * `isValidSignature` rehashes what it is given under the account's own domain,
 * so a signature over the bare digest never verifies.
 */
export function replaySafeDigest(account: Address.Address, digest: Hex.Hex) {
  return TypedData.getSignPayload({
    domain: { verifyingContract: account },
    message: { digest },
    primaryType: 'ERC1271Sign',
    types: {
      ERC1271Sign: [{ name: 'digest', type: 'bytes32' }],
    },
  })
}

/**
 * Index of the admin passkey that produced `assertion`, or -1 when none did.
 *
 * The user handle is written by whoever created the passkey, so it says nothing
 * about which account a passkey belongs to. Only the signature does.
 */
export function findAdminKeyIndex(
  keys: readonly {
    publicKey: Hex.Hex
    role: string
    type: string
  }[],
  challenge: Hex.Hex,
  assertion: Pick<WebAuthnP256.sign.ReturnType, 'metadata' | 'signature'>,
): number {
  return keys.findIndex((key) => {
    if (key.type !== 'webauthn-p256' || key.role !== 'admin') return false
    try {
      return WebAuthnP256.verify({
        challenge,
        metadata: assertion.metadata,
        publicKey: PublicKey.fromHex(key.publicKey),
        signature: assertion.signature,
      })
    } catch {
      return false
    }
  })
}
