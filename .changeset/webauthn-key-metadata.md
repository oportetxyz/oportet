---
"oportet": patch
---

WebAuthn keys now carry the credential's metadata (credential id, authenticator attachment, transports) to the relay, which keeps it so a client can tell a security key from a platform passkey at sign-in. `Key.createWebAuthnP256` reads it from the new credential, `Key.fromWebAuthnP256` takes it as `metadata`, `Key.toRelay` sends it with WebAuthn keys only, and `Key.fromRelay` keeps what `wallet_getKeys` returns. The relay schemas accept `keyMetadata` in quotes and in the upgrade context, so a signed quote that carries it still verifies. A relay without the field ignores it.
