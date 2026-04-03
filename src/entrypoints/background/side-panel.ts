import type { Browser } from "#imports"
import { browser } from "#imports"
import { logger } from "@/utils/logger"
import { onMessage } from "@/utils/message"

interface SidePanelCompatBrowser {
  sidePanel?: {
    open: (options: Browser.sidePanel.OpenOptions) => Promise<void>
  }
  sidebarAction?: {
    open: () => Promise<void>
  }
}

export async function openBrowserSidePanel(
  browserApi: SidePanelCompatBrowser,
  sender?: Browser.runtime.MessageSender,
  warn: (...args: unknown[]) => void = logger.warn,
): Promise<boolean> {
  try {
    if (browserApi.sidePanel?.open) {
      const tabId = sender?.tab?.id
      const windowId = sender?.tab?.windowId

      if (typeof tabId === "number") {
        await browserApi.sidePanel.open({ tabId })
        return true
      }

      if (typeof windowId === "number") {
        await browserApi.sidePanel.open({ windowId })
        return true
      }

      warn("[Background] Unable to open side panel without tab or window context", { sender })
      return false
    }

    if (browserApi.sidebarAction?.open) {
      await browserApi.sidebarAction.open()
      return true
    }
  }
  catch (error) {
    warn("[Background] Failed to open side panel", error)
    return false
  }

  warn("[Background] Side panel API is not available in this browser")
  return false
}

export function setupSidePanelMessageHandlers() {
  onMessage("openSidePanel", async (message) => {
    return await openBrowserSidePanel(
      browser as unknown as SidePanelCompatBrowser,
      message.sender,
    )
  })
}
