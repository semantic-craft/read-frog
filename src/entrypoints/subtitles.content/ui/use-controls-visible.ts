import type { ControlsConfig } from "@/entrypoints/subtitles.content/platforms"
import { useEffect, useEffectEvent, useState } from "react"
import { resolvePlayerContainer } from "./player-container"

interface ControlsInfo {
  controlsVisible: boolean
  controlsHeight: number
}

export function useControlsInfo(
  elementRef: React.RefObject<HTMLElement | null>,
  controlsConfig?: ControlsConfig,
): ControlsInfo {
  const [info, setInfo] = useState<ControlsInfo>({ controlsVisible: false, controlsHeight: 0 })

  const updateInfo = useEffectEvent((container: HTMLElement) => {
    if (!controlsConfig)
      return

    const nextInfo = {
      controlsVisible: controlsConfig.checkVisibility(container),
      controlsHeight: controlsConfig.measureHeight(container),
    }

    setInfo(prev => prev.controlsVisible === nextInfo.controlsVisible && prev.controlsHeight === nextInfo.controlsHeight
      ? prev
      : nextInfo)
  })

  const setupObserver = useEffectEvent(() => {
    if (!controlsConfig)
      return

    const playerContainer = resolvePlayerContainer(elementRef.current, controlsConfig)
    if (!playerContainer)
      return

    updateInfo(playerContainer)

    const observer = new MutationObserver(() => {
      updateInfo(playerContainer)
    })

    observer.observe(playerContainer, {
      attributes: true,
      attributeFilter: ["class"],
    })

    const resizeObserver = new ResizeObserver(() => {
      updateInfo(playerContainer)
    })
    resizeObserver.observe(playerContainer)

    return () => {
      observer.disconnect()
      resizeObserver.disconnect()
    }
  })

  useEffect(() => {
    return setupObserver()
  }, [])

  return info
}
