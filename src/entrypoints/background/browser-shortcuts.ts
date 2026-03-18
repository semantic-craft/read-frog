import { browser, storage } from "#imports"
import { ANALYTICS_FEATURE, ANALYTICS_SURFACE } from "@/types/analytics"
import { createFeatureUsageContext } from "@/utils/analytics"
import { PAGE_TRANSLATION_BROWSER_COMMAND } from "@/utils/constants/commands"
import { getTranslationStateKey } from "@/utils/constants/storage-keys"
import { logger } from "@/utils/logger"
import { sendMessage } from "@/utils/message"

const PAGE_TRANSLATION_SUPPORTED_URL_PREFIXES = [
  "http://",
  "https://",
  "file://",
] as const

export function registerBrowserShortcutListeners() {
  browser.commands.onCommand.addListener(async (command) => {
    if (command !== PAGE_TRANSLATION_BROWSER_COMMAND) {
      return
    }

    try {
      const [activeTab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      })

      if (!activeTab?.id) {
        logger.warn("[BrowserShortcut] No active tab found")
        return
      }

      if (!canTogglePageTranslationOnTab(activeTab.url)) {
        logger.warn("[BrowserShortcut] Active tab does not support page translation", {
          tabId: activeTab.id,
          url: activeTab.url,
        })
        return
      }

      const translationState = await storage.getItem<{ enabled: boolean }>(
        getTranslationStateKey(activeTab.id),
      )
      const enabled = !(translationState?.enabled ?? false)

      void sendMessage("tryToSetEnablePageTranslationByTabId", {
        tabId: activeTab.id,
        enabled,
        analyticsContext: enabled
          ? createFeatureUsageContext(ANALYTICS_FEATURE.PAGE_TRANSLATION, ANALYTICS_SURFACE.SHORTCUT)
          : undefined,
      })
    }
    catch (error) {
      logger.error("[BrowserShortcut] Failed to toggle page translation", error)
    }
  })
}

function canTogglePageTranslationOnTab(url: string | undefined) {
  if (!url) {
    return false
  }

  return PAGE_TRANSLATION_SUPPORTED_URL_PREFIXES.some(prefix => url.startsWith(prefix))
}
