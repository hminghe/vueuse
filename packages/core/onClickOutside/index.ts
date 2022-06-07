import { ref } from 'vue-demi'
import type { MaybeElementRef } from '../unrefElement'
import { unrefElement } from '../unrefElement'
import { useEventListener } from '../useEventListener'
import type { ConfigurableWindow } from '../_configurable'
import { defaultWindow } from '../_configurable'

export interface OnClickOutsideOptions extends ConfigurableWindow {
  /**
   * List of elements that should not trigger the event.
   */
  ignore?: MaybeElementRef[]
  /**
   * Use capturing phase for internal event listener.
   * @default true
   */
  capture?: boolean
}

/**
 * Listen for clicks outside of an element.
 *
 * @see https://vueuse.org/onClickOutside
 * @param target
 * @param handler
 * @param options
 */
export function onClickOutside(
  target: MaybeElementRef,
  handler: (evt: PointerEvent) => void,
  options: OnClickOutsideOptions = {},
) {
  const { window = defaultWindow, ignore, capture = true } = options

  if (!window)
    return

  const shouldListen = ref(true)

  let fallback: number

  const checkIgnore  = (event: PointerEvent) => {
    const composedPath = event.composedPath()
    return ignore && ignore.length > 0 && ignore.some((target) => {
      const el = unrefElement(target)
      return el && (event.target === el || composedPath.includes(el))
    })
  }

  const checkShouldListen = (event: PointerEvent) => {
    const el = unrefElement(target)
    return !!el && el !== event.target && !event.composedPath().includes(el) && !checkIgnore(event)
  }

  const listener = (event: PointerEvent) => {
    window.clearTimeout(fallback)

    if (!shouldListen.value || !checkShouldListen(event))
      return

    handler(event)
  }

  const cleanup = [
    useEventListener(window, 'click', listener, { passive: true, capture }),
    useEventListener(window, 'pointerdown', (e) => {
      shouldListen.value = checkShouldListen(e)
    }, { passive: true }),
    useEventListener(window, 'pointerup', (e) => {
      fallback = window.setTimeout(() => listener(e), 50)
    }, { passive: true }),
  ]

  const stop = () => cleanup.forEach(fn => fn())

  return stop
}
