import { Activity, useMemo, useRef } from "react"
import { cn } from "@/utils/styles/utils"
import { useSubtitlesUI } from "../../subtitles-ui-context"
import { useControlsInfo } from "../../use-controls-visible"
import { useSubtitlesPanelDismiss } from "./use-subtitles-panel-dismiss"

interface SettingsPanelShellProps {
  children: React.ReactNode
  onClose: () => void
  open: boolean
}

export function SettingsPanelShell({
  children,
  onClose,
  open,
}: SettingsPanelShellProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const { controlsConfig } = useSubtitlesUI()
  const { controlsHeight, controlsVisible } = useControlsInfo(rootRef, controlsConfig)

  const bottomOffset = useMemo(
    () => (controlsVisible ? controlsHeight + 18 : 22),
    [controlsHeight, controlsVisible],
  )

  useSubtitlesPanelDismiss({
    enabled: open,
    onClose,
    panelRef,
  })

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 z-40 pointer-events-none overflow-visible font-light"
    >
      <Activity mode={open ? "visible" : "hidden"}>
        <div
          className={cn(
            "absolute right-4 z-40 transition-[bottom,opacity,transform] duration-200 ease-out",
            open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
          )}
          style={{ bottom: `${bottomOffset}px` }}
        >
          <div
            ref={panelRef}
            data-slot="subtitles-settings-panel"
            className="pointer-events-auto relative isolate z-40 w-[min(17rem,calc(100vw-2rem))] overflow-hidden rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,20,25,0.95)_0%,rgba(10,12,16,0.9)_100%)] text-white shadow-[0_22px_48px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/14" />
            <div className="pointer-events-none absolute -right-12 -bottom-14 size-32 rounded-full bg-[#d8a94b]/9 blur-3xl" />
            <div className="px-2 py-2.5">
              <div className="space-y-1.5">{children}</div>
            </div>
          </div>
        </div>
      </Activity>
    </div>
  )
}
