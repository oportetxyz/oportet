---
"oportet": patch
---

Fixed `loadAccounts` for an address with no key: it signed a digest the account's ERC-1271 check rejects, took the account from the passkey's user handle, and took any passkey for the first key. A passkey that is not an admin key of the account is now refused, and the retry after a stale key keeps the address.
