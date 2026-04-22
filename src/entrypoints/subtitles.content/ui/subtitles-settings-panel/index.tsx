import { useAtom } from "jotai"
import {
  subtitlesSettingsPanelOpenAtom,
  subtitlesSettingsPanelViewAtom,
} from "../../atoms"
import { DownloadSourceSubtitles } from "./components/download-source-subtitles"
import { SettingsPanelShell } from "./components/settings-panel-shell"
import { OpenSubtitlesStylePanelAction } from "./components/subtitles-settings-action"
import { SubtitlesSettingsStylePage } from "./components/subtitles-settings-style-page"
import { SubtitlesToggle } from "./components/subtitles-toggle"

export function SubtitlesSettingsPanel() {
  const [mainMenuOpen, setMainMenuOpen] = useAtom(subtitlesSettingsPanelOpenAtom)
  const [panelView, setPanelView] = useAtom(subtitlesSettingsPanelViewAtom)

  const closePanels = () => {
    setMainMenuOpen(false)
    setPanelView("main")
  }

  const openStylePanel = () => {
    setMainMenuOpen(false)
    setPanelView("style")
  }

  const returnToMainMenu = () => {
    setPanelView("main")
    setMainMenuOpen(true)
  }

  return (
    <>
      <SettingsPanelShell open={mainMenuOpen} onClose={closePanels}>
        <SubtitlesToggle />
        <DownloadSourceSubtitles />
        <OpenSubtitlesStylePanelAction onOpen={openStylePanel} />
      </SettingsPanelShell>
      <SubtitlesSettingsStylePage
        open={panelView === "style"}
        onBack={returnToMainMenu}
        onClose={closePanels}
      />
    </>
  )
}
