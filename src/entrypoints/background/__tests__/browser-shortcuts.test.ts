import { beforeEach, describe, expect, it, vi } from "vitest"
import { ANALYTICS_FEATURE, ANALYTICS_SURFACE } from "@/types/analytics"

const addListenerMock = vi.fn()
const queryMock = vi.fn()
const getItemMock = vi.fn()
const sendMessageMock = vi.fn()
const loggerWarnMock = vi.fn()
const loggerErrorMock = vi.fn()

vi.mock("#imports", () => ({
  browser: {
    commands: {
      onCommand: {
        addListener: addListenerMock,
      },
    },
    tabs: {
      query: queryMock,
    },
  },
  storage: {
    getItem: getItemMock,
  },
}))

vi.mock("@/utils/message", () => ({
  sendMessage: sendMessageMock,
}))

vi.mock("@/utils/logger", () => ({
  logger: {
    warn: loggerWarnMock,
    error: loggerErrorMock,
  },
}))

function getRegisteredCommandHandler() {
  const registration = addListenerMock.mock.calls[0]
  if (!registration) {
    throw new Error("Command listener not registered")
  }

  return registration[0] as (command: string) => Promise<void>
}

describe("registerBrowserShortcutListeners", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    queryMock.mockResolvedValue([])
    getItemMock.mockResolvedValue(undefined)
    sendMessageMock.mockResolvedValue(undefined)
  })

  it("toggles page translation on for the active tab", async () => {
    queryMock.mockResolvedValue([{ id: 123, url: "https://example.com/article" }])
    getItemMock.mockResolvedValue({ enabled: false })

    const { registerBrowserShortcutListeners } = await import("../browser-shortcuts")
    registerBrowserShortcutListeners()

    const handler = getRegisteredCommandHandler()
    await handler("toggle-page-translation")

    expect(getItemMock).toHaveBeenCalledWith("session:translationState.123")
    expect(sendMessageMock).toHaveBeenCalledWith(
      "tryToSetEnablePageTranslationByTabId",
      expect.objectContaining({
        tabId: 123,
        enabled: true,
        analyticsContext: expect.objectContaining({
          feature: ANALYTICS_FEATURE.PAGE_TRANSLATION,
          surface: ANALYTICS_SURFACE.SHORTCUT,
          startedAt: expect.any(Number),
        }),
      }),
    )
  })

  it("toggles page translation off without analytics context", async () => {
    queryMock.mockResolvedValue([{ id: 456, url: "https://example.com/article" }])
    getItemMock.mockResolvedValue({ enabled: true })

    const { registerBrowserShortcutListeners } = await import("../browser-shortcuts")
    registerBrowserShortcutListeners()

    const handler = getRegisteredCommandHandler()
    await handler("toggle-page-translation")

    expect(sendMessageMock).toHaveBeenCalledWith(
      "tryToSetEnablePageTranslationByTabId",
      {
        tabId: 456,
        enabled: false,
        analyticsContext: undefined,
      },
    )
  })

  it("warns when there is no active tab", async () => {
    const { registerBrowserShortcutListeners } = await import("../browser-shortcuts")
    registerBrowserShortcutListeners()

    const handler = getRegisteredCommandHandler()
    await handler("toggle-page-translation")

    expect(loggerWarnMock).toHaveBeenCalled()
    expect(sendMessageMock).not.toHaveBeenCalled()
  })

  it("ignores unsupported active tab urls", async () => {
    queryMock.mockResolvedValue([{ id: 789, url: "chrome://extensions/" }])

    const { registerBrowserShortcutListeners } = await import("../browser-shortcuts")
    registerBrowserShortcutListeners()

    const handler = getRegisteredCommandHandler()
    await handler("toggle-page-translation")

    expect(loggerWarnMock).toHaveBeenCalledWith(
      "[BrowserShortcut] Active tab does not support page translation",
      {
        tabId: 789,
        url: "chrome://extensions/",
      },
    )
    expect(getItemMock).not.toHaveBeenCalled()
    expect(sendMessageMock).not.toHaveBeenCalled()
  })
})
