import { beforeEach, describe, expect, it, vi } from "vitest"
import { DEFAULT_CONFIG } from "@/utils/constants/config"

const {
  mockDetectLanguage,
  mockGetLocalConfig,
  mockGetOrCreateWebPageContext,
  mockShouldSkipByLanguage,
  mockTranslateTextCore,
} = vi.hoisted(() => ({
  mockDetectLanguage: vi.fn(),
  mockGetLocalConfig: vi.fn(),
  mockGetOrCreateWebPageContext: vi.fn(),
  mockShouldSkipByLanguage: vi.fn(),
  mockTranslateTextCore: vi.fn(),
}))

vi.mock("@/utils/config/storage", () => ({
  getLocalConfig: mockGetLocalConfig,
}))

vi.mock("@/utils/content/language", () => ({
  detectLanguage: mockDetectLanguage,
}))

vi.mock("@/utils/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}))

vi.mock("../webpage-context", () => ({
  getOrCreateWebPageContext: mockGetOrCreateWebPageContext,
}))

vi.mock("../translate-text", async () => {
  const actual = await vi.importActual<typeof import("../translate-text")>("../translate-text")
  return {
    ...actual,
    shouldSkipByLanguage: mockShouldSkipByLanguage,
    translateTextCore: mockTranslateTextCore,
  }
})

function createConfig(translateProviderId: string) {
  return {
    ...DEFAULT_CONFIG,
    translate: {
      ...DEFAULT_CONFIG.translate,
      providerId: translateProviderId,
      page: {
        ...DEFAULT_CONFIG.translate.page,
        skipLanguages: ["jpn"],
      },
    },
    languageDetection: {
      ...DEFAULT_CONFIG.languageDetection,
      mode: "llm" as const,
    },
  }
}

describe("translateTextForPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDetectLanguage.mockResolvedValue("eng")
    mockGetOrCreateWebPageContext.mockResolvedValue(null)
    mockShouldSkipByLanguage.mockResolvedValue(false)
    mockTranslateTextCore.mockResolvedValue("translated text")
  })

  it("disables LLM skip-language detection when the page translation provider is an LLM", async () => {
    mockGetLocalConfig.mockResolvedValue(createConfig("openai-default"))

    const { translateTextForPage } = await import("../translate-variants")
    const text = "This text is long enough."

    await translateTextForPage(text)

    expect(mockShouldSkipByLanguage).toHaveBeenCalledTimes(1)
    expect(mockShouldSkipByLanguage).toHaveBeenCalledWith(text, ["jpn"], false)
  })

  it("keeps LLM skip-language detection enabled for non-LLM page translation providers", async () => {
    mockGetLocalConfig.mockResolvedValue(createConfig("microsoft-translate-default"))

    const { translateTextForPage } = await import("../translate-variants")
    const text = "This text is long enough."

    await translateTextForPage(text)

    expect(mockShouldSkipByLanguage).toHaveBeenCalledTimes(1)
    expect(mockShouldSkipByLanguage).toHaveBeenCalledWith(text, ["jpn"], true)
  })
})
