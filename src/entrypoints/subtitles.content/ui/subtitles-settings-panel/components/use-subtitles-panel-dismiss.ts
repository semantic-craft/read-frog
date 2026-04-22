import type { RefObject } from "react"
import { useEffect, useEffectEvent } from "react"
import { TRANSLATE_BUTTON_CLASS, TRANSLATE_BUTTON_CONTAINER_ID } from "@/utils/constants/subtitles"

function isElement(value: EventTarget | null): value is Element {
  return value instanceof Element
}

function isTranslateTriggerTarget(path: EventTarget[]) {
  return path.some(target =>
    isElement(target)
    && (target.id === TRANSLATE_BUTTON_CONTAINER_ID || target.classList.contains(TRANSLATE_BUTTON_CLASS)),
  )
}

interface UseSubtitlesPanelDismissOptions {
  enabled: boolean
  onClose: () => void
  panelRef: RefObject<HTMLElement | null>
  ignoredSelectors?: string[]
}

export function useSubtitlesPanelDismiss({
  enabled,
  onClose,
  panelRef,
  ignoredSelectors = [],
}: UseSubtitlesPanelDismissOptions) {
  const onPointerDown = useEffectEvent((event: PointerEvent) => {
    if (!enabled) {
      return
    }

    const path = event.composedPath()
    const clickedInsidePanel = !!panelRef.current && path.includes(panelRef.current)
    const clickedTrigger = isTranslateTriggerTarget(path)
    const clickedIgnoredSurface = ignoredSelectors.some(selector =>
      path.some(target => isElement(target) && target.matches(selector)),
    )

    if (clickedInsidePanel || clickedTrigger || clickedIgnoredSurface) {
      return
    }

    onClose()
  })

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (!enabled) {
      return
    }

    if (event.key === "Escape") {
      onClose()
    }
  })

  useEffect(() => {
    document.addEventListener("pointerdown", onPointerDown, true)
    document.addEventListener("keydown", onKeyDown, true)

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true)
      document.removeEventListener("keydown", onKeyDown, true)
    }
  }, [])
}
