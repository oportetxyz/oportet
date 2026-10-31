---
"oportet": patch
---

`Porto.create()` from the React Native entry now throws a plain error asking for a `mode` when none is passed, in place of the dialog `host` error raised during setup. The types are unchanged.
