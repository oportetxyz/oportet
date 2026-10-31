import { describe, expect, test, vi } from 'vitest'
import * as Porto from '../Porto.js'
import * as Mode from './mode.js'

const address = '0x5684abc7d4d24af1b4ef1e7a0a2b7d6d6c0e1111'
const key = { credentialId: 'stale', publicKey: '0x01' }

function connect(loadAccounts: () => Promise<never>) {
  const porto = Porto.create({
    announceProvider: false,
    mode: Mode.from({
      actions: { loadAccounts } as never,
      name: 'test',
    }),
  })

  return porto.provider.request({
    method: 'wallet_connect',
    params: [
      {
        capabilities: { selectAccount: { address, key } },
      },
    ],
  } as never)
}

describe('wallet_connect with a stored account', () => {
  test('behavior: a stale key retry keeps the address and drops the key', async () => {
    const loadAccounts = vi.fn(async (): Promise<never> => {
      throw new Error('stale credential')
    })

    await expect(connect(loadAccounts)).rejects.toThrow()

    const calls = loadAccounts.mock.calls as unknown as {
      address?: string
      key?: unknown
    }[][]

    expect(calls).toHaveLength(2)
    expect(calls[0]?.[0]).toMatchObject({ address, key })
    expect(calls[1]?.[0]?.address).toBe(address)
    expect(calls[1]?.[0]?.key).toBeUndefined()
  })
})
