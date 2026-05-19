import type { PageTranslationManager } from "../page-translation"
import type { Config } from "@/types/config/config"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { bindTranslationShortcutKey } from "../bind-translation-shortcut"

const {
  mockGetLocalConfig,
  mockRegister,
  mockStorageWatch,
  mockUnregister,
  mockUnwatchConfig,
} = vi.hoisted(() => ({
  mockGetLocalConfig: vi.fn(),
  mockRegister: vi.fn(),
  mockStorageWatch: vi.fn(),
  mockUnregister: vi.fn(),
  mockUnwatchConfig: vi.fn(),
}))

vi.mock("#imports", () => ({
  storage: {
    watch: mockStorageWatch,
  },
}))

vi.mock("wxt/utils/storage", () => ({
  storage: {
    watch: mockStorageWatch,
  },
}))

vi.mock("@tanstack/hotkeys", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/hotkeys")>()

  return {
    ...actual,
    HotkeyManager: {
      getInstance: () => ({
        register: mockRegister,
      }),
    },
  }
})

vi.mock("@/utils/config/storage", () => ({
  getLocalConfig: mockGetLocalConfig,
}))

function createManager(isActive = false): PageTranslationManager {
  return {
    isActive,
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
  } as unknown as PageTranslationManager
}

describe("bindTranslationShortcutKey", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRegister.mockReturnValue({
      unregister: mockUnregister,
    })
    mockStorageWatch.mockReturnValue(mockUnwatchConfig)
  })

  it("registers the page shortcut with the TanStack manager options", async () => {
    mockGetLocalConfig.mockResolvedValue({
      translate: {
        page: {
          shortcut: "Mod+E",
        },
      },
    })

    const manager = createManager(false)
    const cleanup = await bindTranslationShortcutKey(manager)

    expect(mockRegister).toHaveBeenCalledWith(
      "Mod+E",
      expect.any(Function),
      expect.objectContaining({
        ignoreInputs: true,
        preventDefault: true,
        stopPropagation: true,
      }),
    )

    cleanup()
    expect(mockUnregister).toHaveBeenCalled()
  })

  it("rebinds the page shortcut when local config changes", async () => {
    mockGetLocalConfig.mockResolvedValue({
      translate: {
        page: {
          shortcut: "Mod+E",
        },
      },
    })

    let watchConfigChange: ((config: Config) => void) | undefined
    mockStorageWatch.mockImplementation((_key: string, callback: (config: Config) => void) => {
      watchConfigChange = callback
      return mockUnwatchConfig
    })

    const cleanup = await bindTranslationShortcutKey(createManager(false))

    expect(mockRegister).toHaveBeenCalledTimes(1)
    expect(mockRegister).toHaveBeenLastCalledWith(
      "Mod+E",
      expect.any(Function),
      expect.objectContaining({
        preventDefault: true,
        stopPropagation: true,
      }),
    )

    watchConfigChange?.({
      translate: {
        page: {
          shortcut: "Alt+A",
        },
      },
    } as Config)

    expect(mockUnregister).toHaveBeenCalledTimes(1)
    expect(mockRegister).toHaveBeenCalledTimes(2)
    expect(mockRegister).toHaveBeenLastCalledWith(
      "Alt+A",
      expect.any(Function),
      expect.objectContaining({
        preventDefault: true,
        stopPropagation: true,
      }),
    )

    cleanup()
    expect(mockUnwatchConfig).toHaveBeenCalledTimes(1)
    expect(mockUnregister).toHaveBeenCalledTimes(2)
  })

  it("toggles page translation through the registered callback", async () => {
    mockGetLocalConfig.mockResolvedValue({
      translate: {
        page: {
          shortcut: "Mod+E",
        },
      },
    })

    const inactiveManager = createManager(false)
    await bindTranslationShortcutKey(inactiveManager)
    const startCallback = mockRegister.mock.calls[0]?.[1]
    startCallback?.({} as KeyboardEvent, { hotkey: "Mod+E" })
    expect(inactiveManager.start).toHaveBeenCalledTimes(1)

    vi.clearAllMocks()
    mockRegister.mockReturnValue({
      unregister: mockUnregister,
    })
    mockGetLocalConfig.mockResolvedValue({
      translate: {
        page: {
          shortcut: "Mod+E",
        },
      },
    })

    const activeManager = createManager(true)
    await bindTranslationShortcutKey(activeManager)
    const stopCallback = mockRegister.mock.calls[0]?.[1]
    stopCallback?.({} as KeyboardEvent, { hotkey: "Mod+E" })
    expect(activeManager.stop).toHaveBeenCalledTimes(1)
  })

  it("skips registration when the shortcut is empty", async () => {
    mockGetLocalConfig.mockResolvedValue({
      translate: {
        page: {
          shortcut: "",
        },
      },
    })

    const cleanup = await bindTranslationShortcutKey(createManager(false))

    expect(mockRegister).not.toHaveBeenCalled()
    cleanup()
    expect(mockUnregister).not.toHaveBeenCalled()
  })
})
