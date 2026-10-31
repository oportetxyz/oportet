import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

// why: the warning is only reachable inside React Native, and it fires while
// the module evaluates, so each test takes a fresh copy under a stubbed product.
async function load() {
  vi.resetModules()
  return await import('./Porto.js')
}

const passkeysWarning = expect.stringContaining(
  'react-native-passkeys methods are not available',
)

describe('react-native Porto', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { product: 'ReactNative' })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  test('behavior: importing warns about nothing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await load()

    expect(warn).not.toHaveBeenCalled()
  })

  test('behavior: a mode passed to create() is used and builds no default', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { create } = await load()
    const { relay } = await import('../Mode.js')
    const mode = relay({ webAuthn: { createFn: vi.fn(), getFn: vi.fn() } })

    expect(create({ mode })._internal.config.mode).toBe(mode)
    expect(warn).not.toHaveBeenCalled()
  })

  test.each([
    ['nothing', undefined],
    ['no mode', {}],
    ['an undefined mode', { mode: undefined }],
    ['a null mode', { mode: null }],
  ])('error: create() with %s says to pass a mode', async (_, parameters) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { create } = await load()

    expect(() => create(parameters)).toThrow(
      '`Porto.create()` needs a `mode` on React Native. Pass one, for example `Mode.relay({ webAuthn })`.',
    )
    expect(warn).not.toHaveBeenCalled()
  })

  test('behavior: a missing module still warns once the default is used', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { defaultConfig } = await load()

    expect(warn).not.toHaveBeenCalled()

    void defaultConfig.mode

    expect(warn).toHaveBeenCalledWith(passkeysWarning)
  })
})
