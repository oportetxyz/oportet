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
 * Instantiates a Porto instance for React Native.
 *
 * `mode` stays optional in the types, but React Native has no default that can
 * run: the default dialog mode has no `host`.
 */
export function create(
  parameters: ExactPartial<Porto.Config> | undefined = {},
): Porto.Porto {
  if (!parameters.mode)
    throw new Error(
      '`Porto.create()` needs a `mode` on React Native. Pass one, for example `Mode.relay({ webAuthn })`.',
    )

  return Porto.create(parameters)
}
