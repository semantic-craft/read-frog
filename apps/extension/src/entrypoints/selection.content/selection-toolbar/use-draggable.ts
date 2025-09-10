import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

interface Position {
  x: number
  y: number
}

interface UseDraggableOptions {
  initialPosition?: Position
  onPositionChange?: (position: Position) => void
}

interface UseDraggableReturn {
  position: Position
  isDragging: boolean
  ref: React.RefObject<HTMLElement | null>
  style: {
    left: number
    top: number
  }
}

/**
 * Custom hook for making elements draggable
 * @param options - Configuration options for draggable behavior
 * @returns Object containing position, drag state, ref and styles
 */
export function useDraggable(options: UseDraggableOptions = {}): UseDraggableReturn {
  const { initialPosition = { x: 0, y: 0 }, onPositionChange } = options

  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })
  const [position, setPosition] = useState<Position>(initialPosition)
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    setPosition({
      x: initialPosition.x,
      y: initialPosition.y,
    })
  }, [initialPosition.x, initialPosition.y])

  // Handle mouse move during drag
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (isDragging) {
      const newPosition = {
        x: event.clientX - dragOffset.x,
        y: event.clientY - dragOffset.y,
      }
      setPosition(newPosition)
      onPositionChange?.(newPosition)
    }
  }, [isDragging, dragOffset, onPositionChange])

  // Handle mouse up to end drag
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Handle mouse down to start drag
  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (!ref.current || event.button !== 0)
      return

    const rect = ref.current.getBoundingClientRect()
    setDragOffset({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    })
    setIsDragging(true)

    // Prevent text selection during drag
    event.preventDefault()
  }, [])

  // Add/remove event listeners for drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Add/remove mousedown listener to the ref element
  useEffect(() => {
    const element = ref.current
    if (element) {
      element.addEventListener('mousedown', handleMouseDown)
      return () => {
        element.removeEventListener('mousedown', handleMouseDown)
      }
    }
  // ref.current may be null. Add the listener when it becomes available and update it on ref changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleMouseDown, ref.current])

  return {
    position,
    isDragging,
    ref,
    style: {
      left: position.x,
      top: position.y,
    },
  }
}
