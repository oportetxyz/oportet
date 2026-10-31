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

  test('behavior: a mode passed to create() builds no default', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { create } = await load()
    const { relay } = await import('../Mode.js')

    create({ mode: relay({ webAuthn: { createFn: vi.fn(), getFn: vi.fn() } }) })

    expect(warn).not.toHaveBeenCalled()
  })

  test('behavior: create() with nothing uses one shared default', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { create, defaultConfig } = await load()
    const mode = defaultConfig.mode
    // why: the default's dialog has no host to set up against; what is under
    // test is which mode create() picks.
    vi.spyOn(mode, 'setup').mockReturnValue(() => {})

    expect(mode.name).toBe('reactNative')
    expect(create()._internal.config.mode).toBe(mode)
    expect(create()._internal.config.mode).toBe(mode)
  })

  test('behavior: a missing module still warns once the default is used', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { defaultConfig } = await load()

    expect(warn).not.toHaveBeenCalled()

    void defaultConfig.mode

    expect(warn).toHaveBeenCalledWith(passkeysWarning)
  })
})
