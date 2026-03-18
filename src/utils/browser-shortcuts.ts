import { browser } from "#imports"

export function getBrowserShortcutSettingsUrl() {
  switch (import.meta.env.BROWSER) {
    case "edge":
      return "edge://extensions/shortcuts"
    default:
      return "chrome://extensions/shortcuts"
  }
}

export async function openExtensionShortcutSettings() {
  const commandsApi = browser.commands as typeof browser.commands & {
    openShortcutSettings?: () => Promise<void>
  }

  if (typeof commandsApi.openShortcutSettings === "function") {
    await commandsApi.openShortcutSettings()
    return
  }

  await browser.tabs.create({ url: getBrowserShortcutSettingsUrl() })
}
