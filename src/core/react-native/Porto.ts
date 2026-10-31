import type { ExactPartial } from '../internal/types.js'
import * as Mode from '../Mode.js'
import * as Porto from '../Porto.js'

let defaultMode: ReturnType<typeof Mode.reactNative> | undefined

export const defaultConfig = {
  ...Porto.defaultConfig,
  // why a getter: building this mode warns when no passkeys module was given,
  // and an app that passes its own mode never uses it. Built on first read, so
  // only a real use can warn.
  get mode() {
    defaultMode ??= Mode.reactNative()
    return defaultMode
  },
} as const satisfies Partial<Porto.Config>

/**
 * Instantiates a Porto instance with React Native mode.
 */
export function create(
  parameters: ExactPartial<Porto.Config> | undefined = {},
): Porto.Porto {
  return Porto.create({
    ...parameters,
    mode: parameters.mode ?? defaultConfig.mode,
  })
}
