---
"oportet": patch
---

`loadAccounts` with an address and no key now signs the replay-safe digest the account's ERC-1271 check needs, and refuses a passkey that is not an admin key of that account. A second passkey on the account is matched by its signature instead of being taken for the first key.
