import { i18n } from '#imports'
import { Input } from '@repo/ui/components/input'
import { cn } from '@repo/ui/lib/utils'
import hotkeys from 'hotkeys-js'
import { useEffect, useRef, useState } from 'react'
import { formatHotkey } from '@/utils/os'

const MODIFIERS = ['shift', 'alt', 'ctrl', 'command'] as const

const HOTKEYS_MODIFIERS = Object.keys(hotkeys.modifier)

const DISMISS_CODE = ['Space', 'Escape']

hotkeys.filter = (event: KeyboardEvent) => {
  return (event.target as HTMLInputElement).tagName === 'INPUT'
}

export function ShortcutKeySelector(
  { value: initialHotkeys, onChange, className }:
  { value: string[], onChange?: (hotkeys: string[]) => void, className?: string },
) {
  const [inRecording, setInRecording] = useState(false)
  const [shortcutKey, setShortcutKey] = useState(initialHotkeys)

  const formatShortcut = formatHotkey(shortcutKey)

  const recordDomRef = useRef<HTMLInputElement>(null)

  const clearHotkeys = () => setShortcutKey([])

  const resetShortcutKey = () => {
    setShortcutKey(initialHotkeys)
    onChange?.(initialHotkeys)
  }

  const startRecord = () => {
    setInRecording(true)
    setShortcutKey([])
  }

  const endRecord = () => {
    setInRecording(false)
    if (shortcutKey.length === 0) {
      resetShortcutKey()
    }
  }

  useEffect(() => {
    if (isValidShortcut(shortcutKey) && inRecording) {
      recordDomRef.current?.blur()
      onChange?.(shortcutKey)
    }
  }, [shortcutKey, inRecording, onChange, initialHotkeys])

  useEffect(() => {
    hotkeys('*', { keyup: true, single: true }, (event: KeyboardEvent) => {
      if (!inRecording)
        return

      if (DISMISS_CODE.includes(event.code))
        return

      const ownModifiers = collectModifiers()

      if (!ownModifiers.length)
        return

      const pressedKeyString = hotkeys.getPressedKeyString()

      const normalKey = getNormalKey(pressedKeyString)

      const targetHotkeys = [...ownModifiers, ...normalKey]

      setShortcutKey(targetHotkeys)

      // Returning false stops the event and prevents default browser events
      return false
    })

    return () => hotkeys.unbind()
  }, [inRecording])

  return (
    <Input
      ref={recordDomRef}
      className={cn('select-none', className)}
      onFocus={startRecord}
      onBlur={endRecord}
      onKeyUp={clearHotkeys}
      value={formatShortcut}
      placeholder={i18n.t('shortcutKeySelector.placeholder')}
    />
  )
}

function getNormalKey(pressedKeyString: string[]) {
  return pressedKeyString.filter(key => !HOTKEYS_MODIFIERS.includes(key))
}

function getModifiers(pressedKeyString: string[]) {
  return pressedKeyString.filter(key => HOTKEYS_MODIFIERS.includes(key))
}

function isValidShortcut(hotkeys: string[]) {
  const modifiers = getModifiers(hotkeys)
  const hasModifiers = !!modifiers.length

  const normalKey = getNormalKey(hotkeys)
  const onlyHasOneNormalKey = normalKey.length === 1
  return hasModifiers && onlyHasOneNormalKey
}

function collectModifiers() {
  const ownModifiers = MODIFIERS.filter(modifier => hotkeys[modifier])
  return Array.from(new Set(ownModifiers))
}
