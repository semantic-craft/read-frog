// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react"
import { atom } from "jotai"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ANALYTICS_FEATURE, ANALYTICS_SURFACE } from "@/types/analytics"
import { SelectionToolbar } from "../index"

const mockState = vi.hoisted(() => ({
  contextMenuConfig: {
    enabled: true,
  },
  openSelectionHandler: undefined as undefined | ((message: {
    data: {
      selectedText: string
      analyticsContext?: {
        feature: string
        surface: string
        startedAt: number
      }
    }
  }) => void),
  selectionToolbarConfig: {
    enabled: true,
    disabledSelectionToolbarPatterns: [],
    opacity: 100,
    features: {
      translate: { enabled: true, providerId: "microsoft-translate-default" },
      speak: { enabled: false },
      vocabularyInsight: { enabled: false, providerId: "openai-default" },
    },
    customActions: [],
  },
  translateButtonMock: vi.fn(),
}))

vi.mock("@/utils/atoms/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/utils/atoms/config")>()
  return {
    ...actual,
    configFieldsAtomMap: {
      ...actual.configFieldsAtomMap,
      contextMenu: atom(() => mockState.contextMenuConfig),
      selectionToolbar: atom(() => mockState.selectionToolbarConfig),
    },
  }
})

vi.mock("@/utils/message", () => ({
  onMessage: (type: string, handler: typeof mockState.openSelectionHandler) => {
    if (type === "openSelectionToolbarTranslate") {
      mockState.openSelectionHandler = handler
    }
    return vi.fn()
  },
}))

vi.mock("../translate-button", () => ({
  TranslateButton: (props: {
    renderTrigger?: boolean
    openRequest?: {
      nonce: number
      analyticsContext?: {
        surface?: string
      }
    }
  }) => {
    mockState.translateButtonMock(props)

    return (
      <div
        data-open-request={String(props.openRequest?.nonce ?? 0)}
        data-surface={props.openRequest?.analyticsContext?.surface ?? ""}
        data-testid={props.renderTrigger === false ? "translate-button-bridge" : "translate-button-trigger"}
      />
    )
  },
}))

vi.mock("../ai-button", () => ({
  AiButton: () => null,
}))

vi.mock("../speak-button", () => ({
  SpeakButton: () => null,
}))

vi.mock("../custom-action-button", () => ({
  SelectionToolbarCustomActionButtons: () => null,
}))

vi.mock("../close-button", () => ({
  CloseButton: () => null,
  DropEvent: "read-frog:selection-toolbar-dropdown-open",
}))

function mockCurrentSelection(text: string | null) {
  if (!text) {
    window.getSelection = vi.fn(() => ({
      anchorNode: null,
      focusNode: null,
      rangeCount: 0,
      containsNode: vi.fn(() => false),
      getRangeAt: () => {
        throw new Error("No range available")
      },
      toString: () => "",
    })) as unknown as typeof window.getSelection
    return
  }

  const selectionHost = document.createElement("p")
  selectionHost.textContent = text
  document.body.appendChild(selectionHost)
  const textNode = selectionHost.firstChild

  if (!textNode) {
    throw new Error("Expected selection text node")
  }

  window.getSelection = vi.fn(() => ({
    anchorNode: textNode,
    focusNode: textNode,
    rangeCount: 1,
    containsNode: vi.fn(() => true),
    getRangeAt: () => ({
      startContainer: textNode,
      startOffset: 0,
      endContainer: textNode,
      endOffset: text.length,
    }),
    toString: () => text,
  })) as unknown as typeof window.getSelection
}

describe("selection toolbar context-menu translate bridge", () => {
  beforeEach(() => {
    mockState.contextMenuConfig = {
      enabled: true,
    }
    mockState.openSelectionHandler = undefined
    mockState.selectionToolbarConfig = {
      enabled: true,
      disabledSelectionToolbarPatterns: [],
      opacity: 100,
      features: {
        translate: { enabled: true, providerId: "microsoft-translate-default" },
        speak: { enabled: false },
        vocabularyInsight: { enabled: false, providerId: "openai-default" },
      },
      customActions: [],
    }
    mockState.translateButtonMock.mockClear()
  })

  afterEach(() => {
    cleanup()
    document.body.innerHTML = ""
    vi.clearAllMocks()
  })

  it("forwards a context-menu translate request to the visible translate button", async () => {
    mockCurrentSelection("Selected text")
    render(<SelectionToolbar />)

    await act(async () => {
      mockState.openSelectionHandler?.({
        data: {
          selectedText: "Selected text",
          analyticsContext: {
            feature: ANALYTICS_FEATURE.SELECTION_TRANSLATION,
            surface: ANALYTICS_SURFACE.CONTEXT_MENU,
            startedAt: 123,
          },
        },
      })
    })

    expect(screen.getByTestId("translate-button-trigger")).toHaveAttribute("data-open-request", "1")
    expect(screen.getByTestId("translate-button-trigger")).toHaveAttribute("data-surface", ANALYTICS_SURFACE.CONTEXT_MENU)
    expect(screen.queryByTestId("translate-button-bridge")).toBeNull()
  })

  it("reuses the cached context-menu selection when the live selection is cleared before the handler runs", async () => {
    mockCurrentSelection("Selected text")
    render(<SelectionToolbar />)

    await act(async () => {
      document.dispatchEvent(new Event("contextmenu"))
    })

    mockCurrentSelection(null)

    await act(async () => {
      mockState.openSelectionHandler?.({
        data: {
          selectedText: "Selected text",
          analyticsContext: {
            feature: ANALYTICS_FEATURE.SELECTION_TRANSLATION,
            surface: ANALYTICS_SURFACE.CONTEXT_MENU,
            startedAt: 456,
          },
        },
      })
    })

    expect(screen.getByTestId("translate-button-trigger")).toHaveAttribute("data-open-request", "1")
    expect(screen.getByTestId("translate-button-trigger")).toHaveAttribute("data-surface", ANALYTICS_SURFACE.CONTEXT_MENU)
  })
})
