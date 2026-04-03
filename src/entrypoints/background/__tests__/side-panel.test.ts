import type { Browser } from "#imports"
import { describe, expect, it, vi } from "vitest"
import { openBrowserSidePanel } from "../side-panel"

function createSender(tab?: Partial<Browser.tabs.Tab>): Browser.runtime.MessageSender | undefined {
  if (!tab) {
    return undefined
  }

  return {
    tab: tab as Browser.tabs.Tab,
  }
}

describe("background side panel", () => {
  it("opens the browser side panel for the sender tab when available", async () => {
    const open = vi.fn().mockResolvedValue(undefined)

    const opened = await openBrowserSidePanel(
      { sidePanel: { open } },
      createSender({ id: 7, windowId: 3 }),
      vi.fn(),
    )

    expect(opened).toBe(true)
    expect(open).toHaveBeenCalledWith({ tabId: 7 })
  })

  it("falls back to the sender window when the tab id is unavailable", async () => {
    const open = vi.fn().mockResolvedValue(undefined)

    const opened = await openBrowserSidePanel(
      { sidePanel: { open } },
      createSender({ windowId: 3 }),
      vi.fn(),
    )

    expect(opened).toBe(true)
    expect(open).toHaveBeenCalledWith({ windowId: 3 })
  })

  it("falls back to sidebarAction when the Chrome sidePanel API is unavailable", async () => {
    const open = vi.fn().mockResolvedValue(undefined)

    const opened = await openBrowserSidePanel(
      { sidebarAction: { open } },
      createSender({ id: 7, windowId: 3 }),
      vi.fn(),
    )

    expect(opened).toBe(true)
    expect(open).toHaveBeenCalledOnce()
  })

  it("warns instead of throwing when sender tab context is unavailable", async () => {
    const open = vi.fn().mockResolvedValue(undefined)
    const warn = vi.fn()

    const opened = await openBrowserSidePanel(
      { sidePanel: { open } },
      undefined,
      warn,
    )

    expect(opened).toBe(false)
    expect(open).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledWith(
      "[Background] Unable to open side panel without tab or window context",
      { sender: undefined },
    )
  })

  it("warns instead of throwing when the side panel API rejects", async () => {
    const error = new Error("gesture lost")
    const open = vi.fn().mockRejectedValue(error)
    const warn = vi.fn()

    const opened = await openBrowserSidePanel(
      { sidePanel: { open } },
      createSender({ id: 7, windowId: 3 }),
      warn,
    )

    expect(opened).toBe(false)
    expect(warn).toHaveBeenCalledWith("[Background] Failed to open side panel", error)
  })
})
