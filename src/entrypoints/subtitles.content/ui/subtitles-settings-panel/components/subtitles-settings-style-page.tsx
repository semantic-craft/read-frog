import { Activity, useRef } from "react"
import { cn } from "@/utils/styles/utils"
import { SubtitlesStylePanelBody, SubtitlesStylePanelHeader } from "./subtitles-style-editor"
import { useSubtitlesPanelDismiss } from "./use-subtitles-panel-dismiss"

const PANEL_INTERNAL_PORTAL_SELECTOR = "[data-slot='select-content'][data-variant='panel']"

interface SubtitlesSettingsStylePageProps {
  onBack: () => void
  onClose: () => void
  open: boolean
}

export function SubtitlesSettingsStylePage({
  onBack,
  onClose,
  open,
}: SubtitlesSettingsStylePageProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useSubtitlesPanelDismiss({
    enabled: open,
    onClose,
    panelRef,
    ignoredSelectors: [PANEL_INTERNAL_PORTAL_SELECTOR],
  })

  return (
    <div className="absolute inset-0 z-40 pointer-events-none overflow-visible font-light">
      <Activity mode={open ? "visible" : "hidden"}>
        <div
          className={cn(
            "absolute inset-y-3 right-3 z-40 transition-[opacity,transform] duration-200 ease-out",
            open ? "translate-x-0 opacity-100" : "translate-x-3 opacity-0",
          )}
        >
          <div
            ref={panelRef}
            data-slot="subtitles-style-panel"
            data-state={open ? "open" : "closed"}
            className="pointer-events-auto relative isolate z-40 flex h-full w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,20,25,0.95)_0%,rgba(10,12,16,0.9)_100%)] text-white shadow-[0_22px_48px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/14" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_72%)]" />
            <div className="pointer-events-none absolute left-[-2rem] bottom-[-3rem] size-28 rounded-full bg-white/[0.035] blur-3xl" />

            <div className="flex h-full min-h-0 flex-col">
              <SubtitlesStylePanelHeader onBack={onBack} />
              <SubtitlesStylePanelBody />
            </div>
          </div>
        </div>
      </Activity>
    </div>
  )
}
