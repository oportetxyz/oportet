# oportet

**oportet** — Latin, _"it is necessary."_ The self-custodial account SDK a wallet needs.

oportet is a fork of Porto, the smart-account SDK by Ithaca: passkey authentication, session keys, EIP-7702 smart accounts, and relay-mode signing — abstracting gas, chain IDs, and seed phrases away from the user.

### Acknowledgements

oportet builds on two upstreams:

- **[Porto](https://github.com/ithacaxyz/porto)** (Ithaca) — the original account SDK that oportet forks.
- **[porto-rise · RISE Wallet](https://github.com/risechain/porto-rise)** (RISE) — the React Native and passkey groundwork that oportet extends.

<p>
  <a href="https://github.com/ithacaxyz/porto/blob/main/LICENSE-MIT">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/license-MIT-blue.svg?colorA=21262d&colorB=21262d&style=flat">
      <img src="https://img.shields.io/badge/license-MIT-blue.svg?colorA=f6f8fa&colorB=f6f8fa&style=flat" alt="MIT License">
    </picture>
  </a>
  <a href="https://github.com/ithacaxyz/porto/blob/main/LICENSE-APACHE">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/license-APACHE-blue.svg?colorA=21262d&colorB=21262d&style=flat">
      <img src="https://img.shields.io/badge/license-APACHE-blue.svg?colorA=f6f8fa&colorB=f6f8fa&style=flat" alt="APACHE License">
    </picture>
  </a>
</p>

## Features

- **Passkey Authentication**: No seed phrases - use biometrics or security keys
- **Session Keys**: Gasless transactions for improved UX
- **ERC-7702 Permissions**: Granular control over wallet capabilities
- **Wagmi Integration**: Drop-in replacement for traditional wallet connectors
- **Multi-platform**: Works on web, mobile (React Native), and desktop

## Quick Start

### Installation

```bash
# npm
npm i oportet wagmi viem @tanstack/react-query

# pnpm
pnpm add oportet wagmi viem @tanstack/react-query

# yarn
yarn add oportet wagmi viem @tanstack/react-query

# bun
bun add oportet wagmi viem @tanstack/react-query
```

### Basic Setup

#### 1. Configure the Oportet Connector

```tsx
import { Chains, Porto } from 'oportet'
import { porto } from 'oportet/wagmi'
import { createConfig, http } from 'wagmi'

// Export the connector for advanced usage
export const oportetConnector = porto(Porto.defaultConfig)

// Create wagmi config
export const config = createConfig({
  chains: [Chains.riseTestnet],
  connectors: [oportetConnector],
  transports: {
    [Chains.riseTestnet.id]: http('https://testnet.riselabs.xyz'),
  },
})
```

#### 2. Set Up Providers

```tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from './config'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

#### 3. Connect to Wallet

```tsx
import { useConnect, useConnection, useDisconnect, useConnectors } from 'wagmi'

export function WalletButton() {
  const { address, isConnected } = useConnection()
  const connect = useConnect()
  const disconnect = useDisconnect()
  const connectors = useConnectors()

  if (isConnected) {
    return (
      <div>
        <span>{address}</span>
        <button onClick={() => disconnect.mutate()}>Disconnect</button>
      </div>
    )
  }

  const oportetConnector = connectors.find(c => c.id === 'com.oportet.identity')
  if (!oportetConnector) return null

  return (
    <button onClick={() => connect.mutate({ connector: oportetConnector })}>
      Connect with Passkey
    </button>
  )
}
```

### Advanced Features

#### Session Keys

Create session keys for gasless transactions:

```tsx
import { Hooks } from 'oportet/wagmi'

const grantPermissions = Hooks.useGrantPermissions()

const createSession = async () => {
  await grantPermissions.mutateAsync({
    key: { publicKey: '...', type: 'p256' },
    expiry: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    permissions: {
      calls: [{
        to: '0x...',
        signature: '0x...',
      }],
    },
  })
}
```

#### Batched Transactions

```tsx
import { useSendCalls } from 'wagmi'

const sendCalls = useSendCalls()

await sendCalls.mutateAsync({
  calls: [
    { to: TOKEN_ADDRESS, data: approveCalldata },
    { to: DEX_ADDRESS, data: swapCalldata },
  ],
  atomicRequired: true,
})
```

## Development

### Apps

```bash
pnpm install # Install dependencies
pnpm dev # Run id, playground, and iframe dialog
```

### Tests

```bash
pnpm install # Install dependencies
pnpm test # Test
```

### Contracts

```bash
# Install Foundry
foundryup

forge build --config-path ./contracts/account/foundry.toml # Build
forge test --config-path ./contracts/account/foundry.toml # Test

forge build --config-path ./contracts/demo/foundry.toml # Build
forge test --config-path ./contracts/demo/foundry.toml # Test
```

## License

<sup>
Licensed under either of <a href="LICENSE-APACHE">Apache License, Version
2.0</a> or <a href="LICENSE-MIT">MIT license</a> at your option.
</sup>

<br>

<sub>
Unless you explicitly state otherwise, any contribution intentionally submitted
for inclusion in these packages by you, as defined in the Apache-2.0 license,
shall be dual licensed as above, without any additional terms or conditions.
</sub>
