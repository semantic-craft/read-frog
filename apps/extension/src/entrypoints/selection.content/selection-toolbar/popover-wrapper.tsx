import { Icon } from '@iconify/react'
import { useAtomValue } from 'jotai'
import { useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { MARGIN } from '@/utils/constants/selection'
import { mouseClickPositionAtom, selectionContentAtom } from './atom'
import { useDraggable } from './use-draggable'

interface PopoverWrapperProps {
  title: string
  icon: string
  children: React.ReactNode
  onClose?: () => void
  isVisible: boolean
  setIsVisible: (isVisible: boolean) => void
  ref?: React.Ref<PopoverWrapperRef>
}

export interface PopoverWrapperRef {
  scrollToBottom: () => void
}

export function PopoverWrapper({ title, icon, children, onClose, isVisible, setIsVisible, ref }: PopoverWrapperProps) {
  const mouseClickPosition = useAtomValue(mouseClickPositionAtom)
  const selectionContent = useAtomValue(selectionContentAtom)
  const contentRef = useRef<HTMLDivElement>(null)

  const { dragRef, containerRef: popoverRef, style: popoverStyle, isDragging } = useDraggable({
    initialPosition: mouseClickPosition || { x: 0, y: 0 },
    margin: MARGIN,
    isVisible,
  })

  useImperativeHandle(ref, () => ({
    scrollToBottom: () => {
      requestAnimationFrame(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = contentRef.current.scrollHeight
        }
      })
    },
  }), [])

  const handleClose = useCallback(() => {
    setIsVisible(false)
    onClose?.()
  }, [setIsVisible, onClose])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!popoverRef.current) {
        return
      }
      const eventPath = event.composedPath()
      const isClickInsideTooltip = eventPath.includes(popoverRef.current)
      if (!isClickInsideTooltip) {
        handleClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [handleClose, popoverRef])

  // 处理滚动穿透问题
  useEffect(() => {
    const contentElement = contentRef.current
    if (!contentElement)
      return

    const handleWheel = (e: WheelEvent) => {
      const { scrollTop, scrollHeight, clientHeight } = contentElement

      // 检查是否在滚动边界
      const isAtTop = scrollTop === 0
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1

      // 如果向上滚动且已经在顶部，或者向下滚动且已经在底部，阻止事件传播
      if ((e.deltaY < 0 && isAtTop) || (e.deltaY > 0 && isAtBottom)) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.stopPropagation()
    }

    // 添加非 passive 的事件监听器
    contentElement.addEventListener('wheel', handleWheel, { passive: false })
    contentElement.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      contentElement.removeEventListener('wheel', handleWheel)
      contentElement.removeEventListener('touchmove', handleTouchMove)
    }
  }, [isVisible])

  if (!isVisible || !mouseClickPosition || !selectionContent) {
    return null
  }

  return (
    <div
      className="fixed z-[2147483647] bg-white dark:bg-zinc-800 border rounded-lg w-[500px] shadow-lg flex flex-col"
      ref={popoverRef as React.RefObject<HTMLDivElement>}
      style={popoverStyle}
      onWheel={(e) => {
        // 防止滚动穿透到背景页面
        e.stopPropagation()
      }}
      onTouchMove={(e) => {
        // 防止触摸滚动穿透到背景页面
        e.stopPropagation()
      }}
    >
      <div
        ref={dragRef as React.RefObject<HTMLDivElement>}
        className="group relative flex items-center justify-between p-4 border-b hover:cursor-grab active:cursor-grabbing select-none"
      >
        {/* Drag icon positioned at top */}
        <div
          className={`absolute top-0 left-1/2 transform -translate-x-1/2 p-1 transition-all duration-200 ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          style={{
            color: isDragging ? 'var(--read-frog-primary)' : undefined,
          }}
        >
          <Icon icon="tabler:grip-horizontal" className="size-4" />
        </div>

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
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto"
      >
        {children}
      </div>
    </div>
  )
}
