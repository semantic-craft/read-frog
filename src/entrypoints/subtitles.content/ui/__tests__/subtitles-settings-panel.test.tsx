// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { atom, Provider } from "jotai"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { DEFAULT_CONFIG } from "@/utils/constants/config"
import { ShadowWrapperContext } from "@/utils/react-shadow-host/create-shadow-host"
import {
  subtitlesSettingsPanelOpenAtom,
  subtitlesSettingsPanelViewAtom,
  subtitlesStore,
  subtitlesVisibleAtom,
} from "../../atoms"
import { SubtitlesSettingsPanel } from "../subtitles-settings-panel"
import { SubtitlesTranslateButton } from "../subtitles-translate-button"
import { SubtitlesUIContext } from "../subtitles-ui-context"

const mockedAtoms = vi.hoisted(() => ({
  languageAtom: null as any,
  videoSubtitlesAtom: null as any,
}))

vi.mock("#imports", () => ({
  i18n: {
    t: (key: string) => key,
  },
}))

vi.mock("@/utils/atoms/config", async () => {
  const languageAtom = atom(DEFAULT_CONFIG.language)
  const videoSubtitlesAtom = atom(DEFAULT_CONFIG.videoSubtitles)

  mockedAtoms.languageAtom = languageAtom
  mockedAtoms.videoSubtitlesAtom = videoSubtitlesAtom

  return {
    configFieldsAtomMap: {
      language: languageAtom,
      videoSubtitles: videoSubtitlesAtom,
    },
  }
})

beforeAll(() => {
  class MutationObserverMock {
    observe() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }

  vi.stubGlobal("MutationObserver", MutationObserverMock)
})

function renderPanel() {
  return render(
    <Provider store={subtitlesStore}>
      <ShadowWrapperContext value={document.body}>
        <SubtitlesUIContext
          value={{
            toggleSubtitles: vi.fn(),
            downloadSourceSubtitles: vi.fn(),
            controlsConfig: undefined,
          }}
        >
          <SubtitlesTranslateButton />
          <SubtitlesSettingsPanel />
        </SubtitlesUIContext>
      </ShadowWrapperContext>
    </Provider>,
  )
}

async function openStylePanel() {
  fireEvent.click(screen.getByLabelText("Subtitle Translation Panel"))
  const styleAction = await screen.findByRole("button", {
    name: "options.videoSubtitles.style.title",
  })
  fireEvent.click(styleAction)

  await waitFor(() => {
    expect(document.querySelector("[data-slot='subtitles-style-panel']")).toBeVisible()
  })
}

describe("subtitles settings panel", () => {
  beforeEach(() => {
    subtitlesStore.set(subtitlesSettingsPanelOpenAtom, false)
    subtitlesStore.set(subtitlesSettingsPanelViewAtom, "main")
    subtitlesStore.set(subtitlesVisibleAtom, true)
    subtitlesStore.set(mockedAtoms.languageAtom, DEFAULT_CONFIG.language)
    subtitlesStore.set(mockedAtoms.videoSubtitlesAtom, DEFAULT_CONFIG.videoSubtitles)
  })

  it("opens the style panel from the main menu without rendering the preview", () => {
    renderPanel()

    return openStylePanel().then(() => {
      expect(document.querySelector("[data-slot='subtitles-style-panel']")).toBeVisible()
      expect(document.querySelector("[data-slot='scroll-area']")).toHaveClass("flex-1")
      expect(screen.getByText("options.videoSubtitles.style.generalSettings")).toBeInTheDocument()
      expect(screen.queryByText("options.videoSubtitles.style.preview")).not.toBeInTheDocument()
    })
  })

  it("returns to the main menu after closing from the style panel header", async () => {
    renderPanel()

    await openStylePanel()
    fireEvent.click(screen.getByLabelText("Back to subtitles menu"))

    await waitFor(() => {
      expect(document.querySelector("[data-slot='subtitles-style-panel']")).not.toBeVisible()
    })
    expect(screen.getByRole("button", {
      name: "options.videoSubtitles.style.title",
    })).toBeInTheDocument()
  })

  it("renders panel-style select popups with the dark surface classes", async () => {
    renderPanel()

    await openStylePanel()

    const displayModeTrigger = screen.getByRole("combobox", {
      name: "options.videoSubtitles.style.displayMode.title",
    })

    fireEvent.pointerDown(displayModeTrigger)
    fireEvent.click(displayModeTrigger)

    await waitFor(() => {
      expect(document.querySelector("[data-slot='select-content'][data-variant='panel']")).toBeInTheDocument()
    })

    const popup = document.querySelector("[data-slot='select-content'][data-variant='panel']")

    expect(popup).toHaveClass("border-white/10")
    expect(popup).toHaveClass("text-white")
  })

  it("keeps the style panel open when selecting a panel dropdown option", async () => {
    renderPanel()

    await openStylePanel()

    const displayModeTrigger = screen.getByRole("combobox", {
      name: "options.videoSubtitles.style.displayMode.title",
    })

    fireEvent.pointerDown(displayModeTrigger)
    fireEvent.click(displayModeTrigger)

    const translationOnlyOption = await screen.findByRole("option", {
      name: "options.videoSubtitles.style.displayMode.translationOnly",
    })

    fireEvent.pointerEnter(translationOnlyOption)
    fireEvent.mouseMove(translationOnlyOption)
    fireEvent.pointerDown(translationOnlyOption)
    fireEvent.mouseUp(translationOnlyOption)
    fireEvent.click(translationOnlyOption)

    await waitFor(() => {
      const videoSubtitles = subtitlesStore.get(mockedAtoms.videoSubtitlesAtom) as typeof DEFAULT_CONFIG.videoSubtitles
      expect(videoSubtitles.style.displayMode).toBe("translationOnly")
    })

    expect(screen.getByLabelText("Back to subtitles menu")).toBeInTheDocument()
    expect(screen.getByText("options.videoSubtitles.style.generalSettings")).toBeInTheDocument()
  })

  it("closes the style panel when clicking the main trigger while keeping the main menu closed", async () => {
    renderPanel()

    await openStylePanel()
    const trigger = screen.getByLabelText("Subtitle Translation Panel")
    fireEvent.pointerDown(trigger)
    fireEvent.click(trigger)

    await waitFor(() => {
      expect(document.querySelector("[data-slot='subtitles-style-panel']")).not.toBeVisible()
    })

    expect(screen.queryByRole("button", {
      name: "options.videoSubtitles.style.title",
    })).not.toBeInTheDocument()
    expect(subtitlesStore.get(subtitlesSettingsPanelOpenAtom)).toBe(false)
  })
})
