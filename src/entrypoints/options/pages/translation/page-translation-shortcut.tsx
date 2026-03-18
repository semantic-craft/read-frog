import { browser, i18n } from "#imports"
import { useAtom } from "jotai"
import { useEffect, useEffectEvent, useState } from "react"
import { ShortcutKeyRecorder } from "@/components/shortcut-key-recorder"
import { Button } from "@/components/ui/base-ui/button"
import { configFieldsAtomMap } from "@/utils/atoms/config"
import { openExtensionShortcutSettings } from "@/utils/browser-shortcuts"
import { PAGE_TRANSLATION_BROWSER_COMMAND } from "@/utils/constants/commands"
import { DEFAULT_AUTO_TRANSLATE_SHORTCUT_KEY } from "@/utils/constants/translate"
import { formatHotkey } from "@/utils/os"
import { ConfigCard } from "../../components/config-card"

export function PageTranslationShortcut() {
  const [translateConfig, setTranslateConfig] = useAtom(configFieldsAtomMap.translate)
  const [browserShortcut, setBrowserShortcut] = useState("")
  const shortcut = translateConfig.page.shortcut ?? DEFAULT_AUTO_TRANSLATE_SHORTCUT_KEY

  const loadBrowserShortcut = useEffectEvent(async () => {
    try {
      const commands = await browser.commands.getAll()
      const command = commands.find(item => item.name === PAGE_TRANSLATION_BROWSER_COMMAND)
      setBrowserShortcut(command?.shortcut ?? "")
    }
    catch {
      setBrowserShortcut("")
    }
  })

  useEffect(() => {
    void loadBrowserShortcut()

    const handleFocus = () => {
      void loadBrowserShortcut()
    }

    window.addEventListener("focus", handleFocus)
    return () => {
      window.removeEventListener("focus", handleFocus)
    }
  }, [])

  const updateShortcut = (shortcut: string[]) => {
    void setTranslateConfig({
      ...translateConfig,
      page: {
        ...translateConfig.page,
        shortcut,
      },
    })
  }

  return (
    <ConfigCard id="page-translation-shortcut" title={i18n.t("options.translation.pageTranslationShortcut.title")} description={i18n.t("options.translation.pageTranslationShortcut.description")}>
      <div className="flex flex-col gap-4">
        <ShortcutKeyRecorder shortcutKey={shortcut} onChange={updateShortcut} />
        <div className="rounded-lg border p-4 flex flex-col gap-3">
          <div className="space-y-1">
            <h3 className="text-sm font-medium">
              {i18n.t("options.translation.pageTranslationShortcut.browserShortcut.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {i18n.t("options.translation.pageTranslationShortcut.browserShortcut.description")}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              <span className="text-muted-foreground">
                {i18n.t("options.translation.pageTranslationShortcut.browserShortcut.current")}
                :
                {" "}
              </span>
              <span className="font-medium">
                {browserShortcut
                  ? formatHotkey(browserShortcut.split("+"))
                  : i18n.t("options.translation.pageTranslationShortcut.browserShortcut.notSet")}
              </span>
            </p>
            <Button variant="outline" onClick={() => void openExtensionShortcutSettings()}>
              {i18n.t("options.translation.pageTranslationShortcut.browserShortcut.openSettings")}
            </Button>
          </div>
        </div>
      </div>
    </ConfigCard>
  )
}
