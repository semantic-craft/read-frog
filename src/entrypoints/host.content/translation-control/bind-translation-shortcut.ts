import type { Hotkey } from "@tanstack/hotkeys"
import type { PageTranslationManager } from "./page-translation"
import type { Config } from "@/types/config/config"
import { HotkeyManager } from "@tanstack/hotkeys"
import { storage } from "#imports"
import { ANALYTICS_FEATURE, ANALYTICS_SURFACE } from "@/types/analytics"
import { createFeatureUsageContext } from "@/utils/analytics"
import { getLocalConfig } from "@/utils/config/storage"
import { CONFIG_STORAGE_KEY } from "@/utils/constants/config"
import { isPageTranslationShortcutEmpty, isValidConfiguredPageTranslationShortcut } from "@/utils/page-translation-shortcut"

/**
 * Binds page translation shortcut key from local config and keeps it in sync with
 * option-page updates so already-open tabs do not need a reload after the user
 * changes the page translation shortcut.
 */
export async function bindTranslationShortcutKey(pageTranslationManager: PageTranslationManager) {
  let activeShortcut: string | null = null
  let cleanupRegisteredShortcut = () => {}

  const togglePageTranslation = () => {
    if (pageTranslationManager.isActive) {
      pageTranslationManager.stop()
    }
    else {
      void pageTranslationManager.start(
        createFeatureUsageContext(ANALYTICS_FEATURE.PAGE_TRANSLATION, ANALYTICS_SURFACE.SHORTCUT),
      )
    }
  }

  const bindShortcut = (shortcut: string | null | undefined) => {
    const nextShortcut = shortcut?.trim() ?? ""
    if (nextShortcut === activeShortcut) {
      return
    }

    cleanupRegisteredShortcut()
    cleanupRegisteredShortcut = () => {}
    activeShortcut = nextShortcut

    if (isPageTranslationShortcutEmpty(nextShortcut) || !isValidConfiguredPageTranslationShortcut(nextShortcut)) {
      return
    }

    const registration = HotkeyManager.getInstance().register(
      nextShortcut as Hotkey,
      togglePageTranslation,
      {
        ignoreInputs: true,
        preventDefault: true,
        stopPropagation: true,
      },
    )
    cleanupRegisteredShortcut = () => registration.unregister()
  }

  const bindConfigShortcut = (config: Config | null | undefined) => {
    bindShortcut(config?.translate?.page?.shortcut)
  }

  let didReceiveStorageUpdate = false
  const unwatchConfig = storage.watch<Config>(`local:${CONFIG_STORAGE_KEY}`, (config) => {
    didReceiveStorageUpdate = true
    bindConfigShortcut(config)
  })

  const config = await getLocalConfig()
  if (!didReceiveStorageUpdate) {
    bindConfigShortcut(config)
  }

  return () => {
    unwatchConfig()
    cleanupRegisteredShortcut()
  }
}
