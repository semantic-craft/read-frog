import { useEffect } from '#imports'
import { Icon } from '@iconify/react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { createHighlightData } from '../utils'
import { isAiPopoverVisibleAtom, isTooltipVisibleAtom, mouseClickPositionAtom, selectionContentAtom, selectionRangeAtom } from './atom'
import { PopoverWrapper } from './popover-wrapper'

export function AiButton() {
  const setIsTooltipVisible = useSetAtom(isTooltipVisibleAtom)
  const setIsAiPopoverVisible = useSetAtom(isAiPopoverVisibleAtom)
  const setMousePosition = useSetAtom(mouseClickPositionAtom)

  const handleClick = async (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = rect.left
    const y = rect.top

    setMousePosition({ x, y })
    setIsTooltipVisible(false)
    setIsAiPopoverVisible(true)
  }

  // eslint-disable-next-line turbo/no-undeclared-env-vars
  if (!import.meta.env.DEV) {
    return null
  }

  return (
    <button type="button" className="size-6 flex items-center justify-center hover:bg-zinc-300 dark:hover:bg-zinc-700 cursor-pointer" onClick={handleClick}>
      <Icon icon="hugeicons:ai-innovation-02" strokeWidth={0.8} className="size-4" />
    </button>
  )
}

export function AiPopover() {
  const [isVisible, setIsVisible] = useAtom(isAiPopoverVisibleAtom)
  const selectionContent = useAtomValue(selectionContentAtom)
  const selectionRange = useAtomValue(selectionRangeAtom)

  useEffect(() => {
    if (!selectionRange || !isVisible) {
      return
    }

    const highlightData = createHighlightData(selectionRange)
    // eslint-disable-next-line no-console
    console.log('%c seda [ highlightData.context ]-46', 'font-size:13px; background:pink; color:#bf2c9f;', highlightData.context)
  }, [selectionRange, isVisible])

  return (
    <PopoverWrapper
      title="AI"
      icon="hugeicons:ai-innovation-02"
      isVisible={isVisible}
      setIsVisible={setIsVisible}
    >
      <div className="p-4 border-b">
        <div className="border-b pb-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{selectionContent}</p>
        </div>
        <div className="pt-4">
          <p className="text-sm">
            AI Generating ...
          </p>
        </div>
      </div>
    </PopoverWrapper>
  )
}
