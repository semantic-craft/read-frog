// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { CustomActionContent } from "../custom-action-button/custom-action-content"
import { TranslationContent } from "../translate-button/translation-content"

vi.mock("../../components/copy-button", () => ({
  CopyButton: () => <button type="button">Copy</button>,
}))

vi.mock("../../components/speak-button", () => ({
  SpeakButton: ({ text }: { text: string | undefined }) => (
    <button
      type="button"
      data-testid={text === "translated text" ? "translation-result-speak-button" : "selection-source-speak-button"}
    >
      Speak
    </button>
  ),
}))

vi.mock("../custom-action-button/field-speak-button", () => ({
  FieldSpeakButton: () => (
    <button type="button" data-testid="custom-action-field-speak-button">
      Field speak
    </button>
  ),
}))

describe("selection toolbar Firefox TTS gating", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it("renders translation popup speak buttons on supported browsers", () => {
    vi.stubEnv("BROWSER", "chrome")

    render(
      <TranslationContent
        selectionContent="selected text"
        translatedText="translated text"
        isTranslating={false}
        thinking={null}
      />,
    )

    expect(screen.getByTestId("selection-source-speak-button")).toBeInTheDocument()
    expect(screen.getByTestId("translation-result-speak-button")).toBeInTheDocument()
  })

  it("hides translation popup speak buttons on Firefox", () => {
    vi.stubEnv("BROWSER", "firefox")

    render(
      <TranslationContent
        selectionContent="selected text"
        translatedText="translated text"
        isTranslating={false}
        thinking={null}
      />,
    )

    expect(screen.queryByTestId("selection-source-speak-button")).not.toBeInTheDocument()
    expect(screen.queryByTestId("translation-result-speak-button")).not.toBeInTheDocument()
  })

  it("renders custom action popup speak buttons on supported browsers", () => {
    vi.stubEnv("BROWSER", "chrome")

    render(
      <CustomActionContent
        isRunning={false}
        outputSchema={[
          {
            id: "dictionary-term",
            name: "Term",
            type: "string",
            description: "",
            speaking: true,
          },
        ]}
        selectionContent="selected text"
        value={{ Term: "definition text" }}
        thinking={null}
      />,
    )

    expect(screen.getByTestId("selection-source-speak-button")).toBeInTheDocument()
    expect(screen.getByTestId("custom-action-field-speak-button")).toBeInTheDocument()
  })

  it("hides custom action popup speak buttons on Firefox", () => {
    vi.stubEnv("BROWSER", "firefox")

    render(
      <CustomActionContent
        isRunning={false}
        outputSchema={[
          {
            id: "dictionary-term",
            name: "Term",
            type: "string",
            description: "",
            speaking: true,
          },
        ]}
        selectionContent="selected text"
        value={{ Term: "definition text" }}
        thinking={null}
      />,
    )

    expect(screen.queryByTestId("selection-source-speak-button")).not.toBeInTheDocument()
    expect(screen.queryByTestId("custom-action-field-speak-button")).not.toBeInTheDocument()
  })
})
