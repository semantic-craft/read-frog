import { useEffect, useRef, useState } from 'react'

export const MODIFIERS = ['ctrl', 'meta', 'alt', 'shift'] as const

export type ShortcutKeyModifier = (typeof MODIFIERS)[number]

export type WrappedShortcutModifier = `${ShortcutKeyModifier}Key`

const allowedChars = [
  'backquote',
  'space',
  'enter',
  'minus',
  'plus',
  'equal',
  'backspace',
  'escape',
  'pageup',
  'pagedown',
  'home',
  'end',
  'delete',
  'tab',
  'bracketleft',
  'bracketright',
  'semicolon',
  'quote',
  'comma',
  'period',
  'slash',
  'backslash',
  'up',
  'down',
  'left',
  'right',
]

const mappedKeys: Record<string, string> = {
  'esc': 'escape',
  'return': 'enter',
  '.': 'period',
  ',': 'comma',
  '-': 'slash',
  ' ': 'space',
  '`': 'backquote',
  '#': 'backslash',
  '+': 'bracketright',
  'ShiftLeft': 'shift',
  'ShiftRight': 'shift',
  'AltLeft': 'alt',
  'AltRight': 'alt',
  'MetaLeft': 'meta',
  'MetaRight': 'meta',
  'OSLeft': 'meta',
  'OSRight': 'meta',
  'ControlLeft': 'ctrl',
  'ControlRight': 'ctrl',
}

export function formatHotkey(key: string): string {
  return (mappedKeys[key] || key)
    .trim()
    .toLowerCase()
    .replace(/key|digit|numpad|arrow/, '')
}

function decorateModifier(modifier: ShortcutKeyModifier): WrappedShortcutModifier {
  return `${modifier}Key`
}

function verify(hotkey: Set<string>) {
  const hasModifier = MODIFIERS.some(modifier => hotkey.has(modifier))

  return hasModifier
}

// #region record-option
export interface Options {
  onClean?: () => void
  onConfirm?: (validHotkey: Set<string>) => void
}

export function useRecordHotkey({ onClean, onConfirm }: Options) {
  const recordDomRef = useRef<HTMLInputElement | null>(null)
  const blurRef = useRef<'escape' | 'enter' | null>(null)
  const [keys, setKeys] = useState(() => new Set<string>())
  const [inRecording, setInRecording] = useState(false)

  const reset = () => {
    setKeys(new Set())
    blurRef.current = null
  }

  const start = () => {
    reset()
    setInRecording(true)
    recordDomRef.current?.focus?.()
  }

  const stop = () => {
    reset()
    setInRecording(false)
    recordDomRef.current?.blur?.()
  }

  const isValid = verify(keys)

  useEffect(() => {
    const recordDom = recordDomRef.current

    if (!recordDom)
      return

    const stopRecordHotkey = () => {
      setInRecording(false)

      if (isValid && blurRef.current !== 'escape') {
        onConfirm?.(keys)
      }
      else {
        onClean?.()
        reset()
      }

      blurRef.current = null
    }

    const startRecordHotKey = (event: KeyboardEvent) => {
      const pressedKey = formatHotkey(event.code)

      if (!inRecording) {
        return
      }

      event.stopPropagation()
      event.preventDefault()

      // Define allowed keys
      const keyIsAlphaNum = event.keyCode >= 48 && event.keyCode <= 90 // 48-90 is a-z, A-Z, 0-9
      const keyIsBetweenF1andF12 = event.keyCode >= 112 && event.keyCode <= 123 // 112-123 is F1-F12
      const keyIsAllowedChar = allowedChars.includes(pressedKey)

      const modifiers = new Set(MODIFIERS.filter(modifier => event[decorateModifier(modifier)]))

      if (modifiers.size > 0) {
        const normalKey = (keyIsAlphaNum || keyIsBetweenF1andF12 || keyIsAllowedChar) && pressedKey
        setKeys(new Set([...Array.from(modifiers), normalKey].filter(Boolean) as string[]))
      }
      else {
        reset()
      }
    }

    recordDom.addEventListener('blur', stopRecordHotkey)
    recordDom.addEventListener('keydown', startRecordHotKey)

    return () => {
      recordDom.removeEventListener('blur', stopRecordHotkey)
      recordDom.removeEventListener('keydown', startRecordHotKey)
    }
  }, [recordDomRef.current])

  return [recordDomRef, { start, stop, reset, inRecording }] as const
}
