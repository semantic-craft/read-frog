import type { CSSProperties } from 'react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

interface Position {
  x: number
  y: number
}

interface UseDraggableOptions {
  initialPosition?: Position
  onPositionChange?: (position: Position) => void
  margin?: number
}

interface UseDraggableReturn {
  position: Position
  isDragging: boolean
  dragRef: React.RefObject<HTMLElement | null>
  containerRef: React.RefObject<HTMLElement | null>
  style: CSSProperties
}

/**
 * Custom hook for making elements draggable
 * @param options - Configuration options for draggable behavior
 * @returns Object containing position, drag state, ref and styles
 */
export function useDraggable(options: UseDraggableOptions = {}): UseDraggableReturn {
  const { initialPosition = { x: 0, y: 0 }, onPositionChange, margin = 20 } = options

  const [isDragging, setIsDragging] = useState(false)
  const dragOffsetRef = useRef<Position>({ x: 0, y: 0 })
  const positionRef = useRef<Position>(initialPosition)
  const dragRef = useRef<HTMLElement>(null)
  const containerRef = useRef<HTMLElement>(null)

  // 直接操作 DOM 的 transform; not React re-rendering and browser layout re-rendering
  const updatePosition = useCallback((newPosition: Position) => {
    if (!containerRef.current) {
      return
    }

    // Get container dimensions for boundary detection
    const containerRect = containerRef.current.getBoundingClientRect()
    const containerWidth = containerRect.width
    const containerHeight = containerRect.height

    // Calculate boundaries considering container size
    const minX = margin
    const maxX = window.innerWidth - containerWidth - margin
    const minY = margin
    const maxY = window.innerHeight - containerHeight - margin

    // Clamp position to keep container within viewport
    const clampedPosition = {
      x: Math.max(minX, Math.min(newPosition.x, maxX)),
      y: Math.max(minY, Math.min(newPosition.y, maxY)),
    }

    containerRef.current.style.transform = `translate(${clampedPosition.x}px, ${clampedPosition.y}px)`
    positionRef.current = clampedPosition
    onPositionChange?.(clampedPosition)
  }, [onPositionChange, margin])

  useLayoutEffect(() => {
    updatePosition(initialPosition)
  }, [initialPosition, updatePosition])

  // Handle mouse move during drag
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (isDragging) {
      const newPosition = {
        x: event.clientX - dragOffsetRef.current.x,
        y: event.clientY - dragOffsetRef.current.y,
      }
      updatePosition(newPosition)
    }
  }, [isDragging, updatePosition])

  // Handle mouse up to end drag
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Handle mouse down to start drag
  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (!dragRef.current || event.button !== 0)
      return

    const rect = dragRef.current.getBoundingClientRect()
    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
    setIsDragging(true)

    // Prevent text selection during drag
    event.preventDefault()
  }, [])

  // Add/remove event listeners for drag
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  useEffect(() => {
    const element = dragRef.current
    if (!element)
      return

    element.addEventListener('mousedown', handleMouseDown)
    return () => {
      element.removeEventListener('mousedown', handleMouseDown)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleMouseDown, dragRef.current])

  return {
    position: positionRef.current,
    isDragging,
    dragRef,
    containerRef,
    style: {
      position: 'fixed',
    },
  }
}
