import type { LLMProviderConfig } from "@/types/config/provider"
import { beforeEach, describe, expect, it, vi } from "vitest"

const getModelByConfigMock = vi.fn()
const generateTextMock = vi.fn()

vi.mock("@/utils/providers/model", () => ({
  getModelByConfig: getModelByConfigMock,
}))

vi.mock("ai", () => ({
  generateText: generateTextMock,
}))

const providerConfig: LLMProviderConfig = {
  id: "minimax-default",
  name: "MiniMax",
  enabled: true,
  provider: "minimax",
  apiKey: "test-key",
  baseURL: "https://api.minimaxi.com/anthropic/v1",
  model: {
    model: "MiniMax-M2.7",
    isCustomModel: false,
    customModel: null,
  },
}

describe("aiTranslate", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("builds the model from the current provider config", async () => {
    getModelByConfigMock.mockResolvedValue("mock-model")
    generateTextMock.mockResolvedValue({ text: "你好" })

    const { aiTranslate } = await import("../ai")
    const promptResolver = vi.fn().mockResolvedValue({
      systemPrompt: "system prompt",
      prompt: "translate this",
    })

    const result = await aiTranslate("Hi", "Chinese", providerConfig, promptResolver)

    expect(getModelByConfigMock).toHaveBeenCalledWith(providerConfig)
    expect(promptResolver).toHaveBeenCalledWith("Chinese", "Hi", undefined)
    expect(generateTextMock).toHaveBeenCalledWith(expect.objectContaining({
      model: "mock-model",
      system: "system prompt",
      prompt: "translate this",
      maxRetries: 0,
    }))
    expect(result).toBe("你好")
  })
})
