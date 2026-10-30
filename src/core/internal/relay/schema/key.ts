/**
 * RPC account key.
 *
 * @see https://github.com/oportetxyz/relay/blob/main/src/types/key.rs
 */

import * as z from 'zod/mini'
import * as u from '../../schema/utils.js'
import * as Permission from './permission.js'

export const Key = z.object({
  /** The expiry of the key. */
  expiry: u.number(),
  /** Whether the digest was prehashed. */
  prehash: z.optional(z.boolean()),
  /** Public key. */
  publicKey: u.hex(),
  /** Role. */
  role: z.union([z.literal('admin'), z.literal('normal')]),
  /** Key type. */
  type: z.union([
    z.literal('p256'),
    z.literal('secp256k1'),
    z.literal('webauthnp256'),
  ]),
})
export type Key = z.infer<typeof Key>

/** WebAuthn credential details the relay keeps per key, as a sign-in hint. */
export const Metadata = z.object({
  /** How the authenticator is attached to the device that created the credential. */
  attachment: z.optional(
    z.union([z.literal('platform'), z.literal('cross-platform')]),
  ),
  /** Credential ID (base64url). */
  credentialId: z.optional(z.string()),
  /** Transports the authenticator reported at creation (e.g. `usb`, `nfc`, `internal`). */
  transports: z.optional(z.readonly(z.array(z.string()))),
})
export type Metadata = z.infer<typeof Metadata>

/** Metadata for the key with the given hash. */
export const MetadataEntry = z.object({
  ...Metadata.shape,
  /** The hash of the key. */
  keyHash: u.hex(),
})
export type MetadataEntry = z.infer<typeof MetadataEntry>

export const WithPermissions = z.object({
  ...Key.shape,
  /** WebAuthn credential metadata. Only WebAuthn keys carry it. */
  metadata: z.optional(Metadata),
  /** Represents key permissions. */
  permissions: z.readonly(z.array(Permission.Permission)),
})
export type WithPermissions = z.infer<typeof WithPermissions>
