---
"oportet": patch
---

Importing the React Native entry no longer warns that `react-native-passkeys` is missing. `Porto.defaultConfig.mode` is now built the first time it is read, so an app that passes its own mode to `Porto.create()` never builds it. A missing module still warns when the default mode is used.
