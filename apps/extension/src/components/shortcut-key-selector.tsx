import { i18n } from '#imports'
import { Input } from '@repo/ui/components/input'
import { cn } from '@repo/ui/lib/utils'
import hotkeys from 'hotkeys-js'
import { useEffect, useRef, useState } from 'react'

// metaKey : command
// altKey : alt or option
// shiftKey: shift
// ctrlKey: ctrl or control

const MODIFIERS = ['shift', 'alt', 'ctrl', 'command'] as const

const UPPERCASE_MODIFIERS = ['Shift', 'Alt', 'Control', 'Meta']

const isModifier = (event: KeyboardEvent) => UPPERCASE_MODIFIERS.includes(event.key)

hotkeys.filter = (event: KeyboardEvent) => {
  return (event.target as HTMLInputElement).tagName === 'INPUT'
}

export function ShortcutKeySelector(
  { value: initialHotkeys, onChange, className }:
  { value: string[], onChange?: (hotkeys: string[]) => void, className?: string },
) {
  const [inRecording, setInRecording] = useState(false)
  const [shortcutKey, setShortcutKey] = useState(initialHotkeys)

  const formatShortcut = shortcutKey.map(shortcut => shortcut.toUpperCase()).join('+')

  const recordDomRef = useRef<HTMLInputElement>(null)

  const clearHotkeys = () => setShortcutKey([])

  const startRecord = () => {
    recordDomRef.current?.focus()
    setInRecording(true)
  }

  const endRecord = () => {
    setInRecording(false)
    setShortcutKey((hotkeys) => {
      const newHotkeys = isValidShortcut(hotkeys) ? hotkeys : initialHotkeys
      onChange?.(newHotkeys)
      return newHotkeys
    })
  }

  useEffect(() => {
    hotkeys('*', { keyup: true, single: false }, (event: KeyboardEvent) => {
      if (!inRecording)
        return

      const ownModifiers = collectModifiers()

      if (!ownModifiers.length)
        return

      const normalKey = isModifier(event) ? [] : [event.key]

      const targetHotkeys = [...ownModifiers, ...normalKey]

      if (!targetHotkeys.length || isValidShortcut(targetHotkeys)) {
        recordDomRef.current?.blur()
      }

      setShortcutKey(targetHotkeys)
    })

    return () => hotkeys.unbind()
  }, [inRecording])

  return (
    <Input
      ref={recordDomRef}
      className={cn('select-none', className)}
      onClick={startRecord}
      onBlur={endRecord}
      onKeyUp={clearHotkeys}
      value={formatShortcut}
      placeholder={i18n.t('shortcutKeySelector.placeholder')}
    />
  )
}

function isValidShortcut(hotkeys: string[]) {
  // 大于一个修饰符 仅有一个非修饰符
  const hasModifiers = MODIFIERS.some(modifier => hotkeys.includes(modifier))
  const onlyHasOneNormalKey = hotkeys.filter(hotkey => MODIFIERS.findIndex(modifier => modifier === hotkey) === -1).length === 1
  return hasModifiers && onlyHasOneNormalKey
}

function collectModifiers() {
  const ownModifiers = MODIFIERS.filter((modifier) => {
    return hotkeys[modifier]
  })
  return Array.from(new Set(ownModifiers))
}
