import { useAtomValue, useSetAtom } from "jotai"
import logo from "@/assets/icons/read-frog.png"
import { TRANSLATE_BUTTON_CLASS } from "@/utils/constants/subtitles"
import { cn } from "@/utils/styles/utils"
import {
  subtitlesSettingsPanelOpenAtom,
  subtitlesSettingsPanelViewAtom,
  subtitlesStore,
  subtitlesVisibleAtom,
} from "../atoms"

export function SubtitlesTranslateButton() {
  const isVisible = useAtomValue(subtitlesVisibleAtom, { store: subtitlesStore })
  const mainMenuOpen = useAtomValue(subtitlesSettingsPanelOpenAtom, { store: subtitlesStore })
  const panelView = useAtomValue(subtitlesSettingsPanelViewAtom, { store: subtitlesStore })
  const setPanelOpen = useSetAtom(subtitlesSettingsPanelOpenAtom, { store: subtitlesStore })
  const setPanelView = useSetAtom(subtitlesSettingsPanelViewAtom, { store: subtitlesStore })

  const panelOpen = mainMenuOpen || panelView === "style"

  return (
    <button
      type="button"
      aria-label="Subtitle Translation Panel"
      aria-pressed={panelOpen}
      onClick={() => {
        if (panelView === "style") {
          setPanelView("main")
          setPanelOpen(false)
          return
        }

        if (mainMenuOpen) {
          setPanelOpen(false)
          return
        }

        setPanelView("main")
        setPanelOpen(true)
      }}
      className={cn(
        `${TRANSLATE_BUTTON_CLASS} relative m-0 flex h-full w-12 cursor-pointer items-center justify-center rounded-[14px] border-none p-0 transition-all duration-200`,
        panelOpen
          ? "bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
          : "bg-transparent",
      )}
    >
      <img
        src={logo}
        alt="Subtitle Toggle"
        className={cn(
          "block h-8 w-8 object-contain transition-all duration-200",
          isVisible ? "opacity-100 saturate-110" : "opacity-75 saturate-90",
          panelOpen && "scale-[1.02]",
        )}
      />
      <div
        className={cn(
          "absolute right-0 bottom-1 min-w-7 rounded-md px-1 py-0.5 text-center text-[8px] leading-none font-semibold tracking-[0.08em] transition-colors duration-200",
          isVisible
            ? "bg-[#d8a94b] text-[#24190a] shadow-[0_2px_8px_rgba(216,169,75,0.35)]"
            : "bg-white/18 text-white/92",
        )}
      >
        {isVisible ? "ON" : "OFF"}
      </div>
    </button>
  )
}
