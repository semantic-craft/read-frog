import { storage } from "#imports"
import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  anthropicLanguageModelMock,
  openAICompatibleLanguageModelMock,
  createAnthropicMock,
  createOpenAICompatibleMock,
} = vi.hoisted(() => {
  const anthropicLanguageModelMock = vi.fn()
  const openAICompatibleLanguageModelMock = vi.fn()
  const createAnthropicMock = vi.fn(() => ({
    languageModel: anthropicLanguageModelMock,
  }))
  const createOpenAICompatibleMock = vi.fn(() => ({
    languageModel: openAICompatibleLanguageModelMock,
  }))

  return {
    anthropicLanguageModelMock,
    openAICompatibleLanguageModelMock,
    createAnthropicMock,
    createOpenAICompatibleMock,
  }
})

vi.mock("@ai-sdk/anthropic", () => ({
  createAnthropic: createAnthropicMock,
}))

vi.mock("@ai-sdk/openai-compatible", () => ({
  createOpenAICompatible: createOpenAICompatibleMock,
}))

describe("getModelById", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    anthropicLanguageModelMock.mockReturnValue("anthropic-model")
    openAICompatibleLanguageModelMock.mockReturnValue("custom-model")
    ;(storage.getItem as unknown as ReturnType<typeof vi.fn>) = vi.fn()
  })

  it("merges user headers from connectionOptions and lets them override built-in headers", async () => {
    ;(storage.getItem as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      providersConfig: [
        {
          id: "anthropic-default",
          name: "Anthropic",
          enabled: true,
          provider: "anthropic",
          apiKey: "test-key",
          model: {
            model: "claude-haiku-4-5",
            isCustomModel: false,
            customModel: null,
          },
          connectionOptions: {
            headers: {
              "anthropic-dangerous-direct-browser-access": "false",
              "X-Trace-Id": "trace-123",
            },
          },
        },
      ],
    })

    const { getModelById } = await import("../model")
    const result = await getModelById("anthropic-default")

    expect(result).toBe("anthropic-model")
    expect(createAnthropicMock).toHaveBeenCalledWith(expect.objectContaining({
      apiKey: "test-key",
      headers: {
        "anthropic-dangerous-direct-browser-access": "false",
        "X-Trace-Id": "trace-123",
      },
    }))
    expect(anthropicLanguageModelMock).toHaveBeenCalledWith("claude-haiku-4-5")
  })

  it("passes custom headers for OpenAI-compatible providers", async () => {
    ;(storage.getItem as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      providersConfig: [
        {
          id: "custom-openai",
          name: "Custom Provider",
          enabled: true,
          provider: "openai-compatible",
          apiKey: "custom-key",
          baseURL: "http://127.0.0.1:1234/v1",
          model: {
            model: "use-custom-model",
            isCustomModel: true,
            customModel: "huihui-hy-mt1.5-1.8b-abliterated",
          },
          connectionOptions: {
            headers: {
              "HTTP-Referer": "https://example.com",
              "X-Title": "Read Frog",
            },
          },
        },
      ],
    })

    const { getModelById } = await import("../model")
    const result = await getModelById("custom-openai")

    expect(result).toBe("custom-model")
    expect(createOpenAICompatibleMock).toHaveBeenCalledWith(expect.objectContaining({
      name: "openai-compatible",
      baseURL: "http://127.0.0.1:1234/v1",
      apiKey: "custom-key",
      headers: {
        "HTTP-Referer": "https://example.com",
        "X-Title": "Read Frog",
      },
    }))
    expect(openAICompatibleLanguageModelMock).toHaveBeenCalledWith("huihui-hy-mt1.5-1.8b-abliterated")
  })
})
