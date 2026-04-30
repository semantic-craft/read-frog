import type { ControlsConfig } from "@/entrypoints/subtitles.content/platforms"
import { getContainingShadowRoot } from "@/utils/host/dom/node"

export function resolvePlayerContainer(
  element: HTMLElement | null,
  controlsConfig?: ControlsConfig,
): HTMLElement | null {
  const playerContainer = controlsConfig?.findPlayerContainer?.()
  if (playerContainer)
    return playerContainer

  const shadowRoot = element ? getContainingShadowRoot(element) : null
  const shadowHost = shadowRoot?.host as HTMLElement | undefined
  return shadowHost?.parentElement ?? null
}
