import { beforeEach, describe, expect, it, vi } from "vitest"
import { ANALYTICS_FEATURE, ANALYTICS_SURFACE } from "@/types/analytics"
import { getTranslationStateKey } from "@/utils/constants/storage-keys"

const mockState = vi.hoisted(() => ({
  contextMenusCreate: vi.fn(),
  contextMenusRemoveAll: vi.fn(),
  contextMenusUpdate: vi.fn(),
  contextMenusOnClickedAddListener: vi.fn(),
  createFeatureUsageContext: vi.fn((feature: string, surface: string) => ({
    feature,
    surface,
    startedAt: 123,
  })),
  ensureInitializedConfig: vi.fn(),
  i18nT: vi.fn((key: string) => {
    const translations: Record<string, string> = {
      "contextMenu.translate": "Translate",
      "contextMenu.translateSelection": "Translate \"%s\"",
      "contextMenu.showOriginal": "Show Original",
    }

    return translations[key] ?? key
  }),
  sendMessage: vi.fn(),
  storageGetItem: vi.fn(),
  storageSetItem: vi.fn(),
  storageWatch: vi.fn(),
  tabsOnActivatedAddListener: vi.fn(),
  tabsOnUpdatedAddListener: vi.fn(),
  tabsQuery: vi.fn(),
  storageSessionOnChangedAddListener: vi.fn(),
}))

vi.mock("#imports", () => ({
  browser: {
    contextMenus: {
      create: mockState.contextMenusCreate,
      onClicked: {
        addListener: mockState.contextMenusOnClickedAddListener,
      },
      removeAll: mockState.contextMenusRemoveAll,
      update: mockState.contextMenusUpdate,
    },
    storage: {
      session: {
        onChanged: {
          addListener: mockState.storageSessionOnChangedAddListener,
        },
      },
    },
    tabs: {
      onActivated: {
        addListener: mockState.tabsOnActivatedAddListener,
      },
      onUpdated: {
        addListener: mockState.tabsOnUpdatedAddListener,
      },
      query: mockState.tabsQuery,
    },
  },
  i18n: {
    t: mockState.i18nT,
  },
  storage: {
    getItem: mockState.storageGetItem,
    setItem: mockState.storageSetItem,
    watch: mockState.storageWatch,
  },
}))

vi.mock("wxt/browser", () => ({
  browser: {
    contextMenus: {
      create: mockState.contextMenusCreate,
      onClicked: {
        addListener: mockState.contextMenusOnClickedAddListener,
      },
      removeAll: mockState.contextMenusRemoveAll,
      update: mockState.contextMenusUpdate,
    },
    storage: {
      session: {
        onChanged: {
          addListener: mockState.storageSessionOnChangedAddListener,
        },
      },
    },
    tabs: {
      onActivated: {
        addListener: mockState.tabsOnActivatedAddListener,
      },
      onUpdated: {
        addListener: mockState.tabsOnUpdatedAddListener,
      },
      query: mockState.tabsQuery,
    },
  },
}))

vi.mock("wxt/utils/storage", () => ({
  storage: {
    getItem: mockState.storageGetItem,
    setItem: mockState.storageSetItem,
    watch: mockState.storageWatch,
  },
}))

vi.mock("#i18n", () => ({
  i18n: {
    t: mockState.i18nT,
  },
}))

vi.mock("../config", () => ({
  ensureInitializedConfig: mockState.ensureInitializedConfig,
}))

vi.mock("@/utils/analytics", () => ({
  createFeatureUsageContext: mockState.createFeatureUsageContext,
}))

vi.mock("@/utils/message", () => ({
  sendMessage: mockState.sendMessage,
}))

function getRegisteredContextMenuClickHandler() {
  const handler = mockState.contextMenusOnClickedAddListener.mock.calls.at(-1)?.[0]
  if (!handler) {
    throw new Error("Expected context menu click listener to be registered")
  }

  return handler as (info: { menuItemId: string, selectionText?: string }, tab?: { id?: number }) => Promise<void>
}

describe("background context menu", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    mockState.contextMenusRemoveAll.mockResolvedValue(undefined)
    mockState.contextMenusUpdate.mockResolvedValue(undefined)
    mockState.sendMessage.mockResolvedValue(undefined)
    mockState.storageGetItem.mockResolvedValue(undefined)
    mockState.storageSetItem.mockResolvedValue(undefined)
    mockState.tabsQuery.mockResolvedValue([{ id: 7 }])
    mockState.ensureInitializedConfig.mockResolvedValue({
      contextMenu: {
        enabled: true,
      },
    })
  })

  it("creates separate page and selection context-menu entries and keeps page title updates on the page item", async () => {
    mockState.storageGetItem.mockResolvedValue({
      enabled: true,
    })

    const { initializeContextMenu } = await import("../context-menu")
    await initializeContextMenu()

    expect(mockState.contextMenusRemoveAll).toHaveBeenCalledOnce()
    expect(mockState.contextMenusCreate).toHaveBeenNthCalledWith(1, {
      contexts: ["page"],
      id: "read-frog-translate",
      title: "Translate",
    })
    expect(mockState.contextMenusCreate).toHaveBeenNthCalledWith(2, {
      contexts: ["selection"],
      id: "read-frog-translate-selection",
      title: "Translate \"%s\"",
    })
    expect(mockState.contextMenusUpdate).toHaveBeenCalledWith("read-frog-translate", {
      title: "Show Original",
    })
  })

  it("keeps page-translation toggling on the page menu item", async () => {
    const { registerContextMenuListeners } = await import("../context-menu")
    registerContextMenuListeners()

    mockState.storageGetItem.mockResolvedValue({
      enabled: false,
    })

    await getRegisteredContextMenuClickHandler()({
      menuItemId: "read-frog-translate",
    }, {
      id: 42,
    })

    expect(mockState.storageSetItem).toHaveBeenCalledWith(getTranslationStateKey(42), {
      enabled: true,
    })
    expect(mockState.sendMessage).toHaveBeenCalledWith("askManagerToTogglePageTranslation", {
      enabled: true,
      analyticsContext: {
        feature: ANALYTICS_FEATURE.PAGE_TRANSLATION,
        surface: ANALYTICS_SURFACE.CONTEXT_MENU,
        startedAt: 123,
      },
    }, 42)
    expect(mockState.contextMenusUpdate).toHaveBeenCalledWith("read-frog-translate", {
      title: "Translate",
    })
  })

  it("routes the selection menu item into selection translation instead of page translation", async () => {
    const { registerContextMenuListeners } = await import("../context-menu")
    registerContextMenuListeners()

    await getRegisteredContextMenuClickHandler()({
      menuItemId: "read-frog-translate-selection",
      selectionText: "Selected text",
    }, {
      id: 42,
    })

    expect(mockState.storageSetItem).not.toHaveBeenCalled()
    expect(mockState.sendMessage).toHaveBeenCalledWith("openSelectionToolbarTranslate", {
      selectedText: "Selected text",
      analyticsContext: {
        feature: ANALYTICS_FEATURE.SELECTION_TRANSLATION,
        surface: ANALYTICS_SURFACE.CONTEXT_MENU,
        startedAt: 123,
      },
    }, 42)
  })
})
