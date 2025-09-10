import { Icon } from '@iconify/react'
import { useAtom, useAtomValue } from 'jotai'
import { useCallback, useEffect, useRef } from 'react'
import { isTranslatePopoverVisibleAtom, mouseClickPositionAtom, selectionContentAtom } from './atom'

interface PopoverWrapperProps {
  title: string
  icon: string
  children: React.ReactNode
  onClose?: () => void
}

export function PopoverWrapper({ title, icon, children, onClose }: PopoverWrapperProps) {
  const [isVisible, setIsVisible] = useAtom(isTranslatePopoverVisibleAtom)
  const mouseClickPosition = useAtomValue(mouseClickPositionAtom)
  const selectionContent = useAtomValue(selectionContentAtom)
  const popoverRef = useRef<HTMLDivElement>(null)

  const handleClose = useCallback(() => {
    setIsVisible(false)
    onClose?.()
  }, [setIsVisible, onClose])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current) {
        const eventPath = event.composedPath()
        const isClickInsideTooltip = eventPath.includes(popoverRef.current)
        if (!isClickInsideTooltip) {
          handleClose()
        }
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isVisible, handleClose])

  if (!isVisible || !mouseClickPosition || !selectionContent) {
    return null
  }

  return (
    <div
      ref={popoverRef}
      className="fixed z-[2147483647] bg-white dark:bg-zinc-800 border rounded-lg w-[300px] shadow-lg"
      style={{
        left: mouseClickPosition.x,
        top: mouseClickPosition.y,
      }}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Icon icon={icon} strokeWidth={0.8} className="size-4.5 text-zinc-600 dark:text-zinc-400" />
          <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100">{title}</h2>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded"
        >
          <Icon icon="tabler:x" strokeWidth={1} className="size-4 text-zinc-600 dark:text-zinc-400" />
        </button>
      </div>
      {children}
    </div>
  )
}
