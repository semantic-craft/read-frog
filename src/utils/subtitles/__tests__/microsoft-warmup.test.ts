import type { SubtitlesFragment } from "../types"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { sendMessage } from "@/utils/message"
import { microsoftWarmup } from "../warmup/microsoft-warmup"

vi.mock("@/utils/message", () => ({
  sendMessage: vi.fn(),
}))

vi.mock("@/utils/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}))

const mockSendMessage = vi.mocked(sendMessage)

function makeFragment(text: string, start: number, end?: number): SubtitlesFragment {
  return { text, start, end: end ?? start + 1000 }
}

describe("microsoftWarmup", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("does nothing for empty input", async () => {
    const onChunk = vi.fn()
    await microsoftWarmup([], "eng", "cmn", "openai", onChunk)
    expect(onChunk).not.toHaveBeenCalled()
    expect(mockSendMessage).not.toHaveBeenCalled()
  })

  it("skips when provider is non-API (microsoft-translate)", async () => {
    const onChunk = vi.fn()
    await microsoftWarmup([makeFragment("Hello", 0)], "eng", "cmn", "microsoft-translate", onChunk)
    expect(onChunk).not.toHaveBeenCalled()
    expect(mockSendMessage).not.toHaveBeenCalled()
  })

  it("skips when provider is non-API (google-translate)", async () => {
    const onChunk = vi.fn()
    await microsoftWarmup([makeFragment("Hello", 0)], "eng", "cmn", "google-translate", onChunk)
    expect(onChunk).not.toHaveBeenCalled()
    expect(mockSendMessage).not.toHaveBeenCalled()
  })

  it("translates a single chunk and calls back", async () => {
    mockSendMessage.mockResolvedValueOnce(["你好", "世界"] as never)
    const onChunk = vi.fn()

    const fragments = [makeFragment("Hello", 0), makeFragment("World", 1000)]
    await microsoftWarmup(fragments, "eng", "cmn", "openai", onChunk)

    expect(onChunk).toHaveBeenCalledTimes(1)
    expect(onChunk).toHaveBeenCalledWith([
      { text: "Hello", start: 0, end: 1000, translation: "你好", isWarmup: true },
      { text: "World", start: 1000, end: 2000, translation: "世界", isWarmup: true },
    ])
    expect(mockSendMessage).toHaveBeenCalledWith("microsoftBatchTranslate", {
      texts: ["Hello", "World"],
      fromLang: "en",
      toLang: "zh",
    })
  })

  it("resolves auto source language", async () => {
    mockSendMessage.mockResolvedValueOnce(["你好"] as never)
    const onChunk = vi.fn()

    await microsoftWarmup([makeFragment("Hello", 0)], "auto", "cmn", "openai", onChunk)

    expect(mockSendMessage).toHaveBeenCalledWith("microsoftBatchTranslate", {
      texts: ["Hello"],
      fromLang: "auto",
      toLang: "zh",
    })
  })

  it("calls back per chunk sequentially", async () => {
    const fragments = Array.from({ length: 150 }, (_, i) =>
      makeFragment(`Text ${i}`, i * 1000),
    )

    mockSendMessage
      .mockResolvedValueOnce(Array.from({ length: 100 }, (_, i) => `翻译 ${i}`) as never)
      .mockResolvedValueOnce(Array.from({ length: 50 }, (_, i) => `翻译 ${100 + i}`) as never)

    const onChunk = vi.fn()
    await microsoftWarmup(fragments, "eng", "cmn", "openai", onChunk)

    expect(onChunk).toHaveBeenCalledTimes(2)
    expect(onChunk.mock.calls[0][0]).toHaveLength(100)
    expect(onChunk.mock.calls[0][0][0].translation).toBe("翻译 0")
    expect(onChunk.mock.calls[1][0]).toHaveLength(50)
    expect(onChunk.mock.calls[1][0][0].translation).toBe("翻译 100")
  })

  it("skips failed chunks and continues", async () => {
    const fragments = Array.from({ length: 150 }, (_, i) =>
      makeFragment(`Text ${i}`, i * 1000),
    )

    mockSendMessage
      .mockRejectedValueOnce(new Error("Network error") as never)
      .mockResolvedValueOnce(Array.from({ length: 50 }, (_, i) => `翻译 ${100 + i}`) as never)

    const onChunk = vi.fn()
    await microsoftWarmup(fragments, "eng", "cmn", "openai", onChunk)

    expect(onChunk).toHaveBeenCalledTimes(1)
    expect(onChunk.mock.calls[0][0]).toHaveLength(50)
    expect(onChunk.mock.calls[0][0][0].translation).toBe("翻译 100")
  })

  it("does not mutate input fragments", async () => {
    mockSendMessage.mockResolvedValueOnce(["你好"] as never)
    const original: SubtitlesFragment = { text: "Hello", start: 0, end: 1000 }
    const onChunk = vi.fn()

    await microsoftWarmup([original], "eng", "cmn", "openai", onChunk)

    expect(original.translation).toBeUndefined()
    expect(onChunk.mock.calls[0][0][0].translation).toBe("你好")
  })

  it("splits by character count", async () => {
    const longText = "a".repeat(30_000)
    const fragments = [
      makeFragment(longText, 0),
      makeFragment(longText, 1000),
    ]

    mockSendMessage
      .mockResolvedValueOnce(["翻译1"] as never)
      .mockResolvedValueOnce(["翻译2"] as never)

    const onChunk = vi.fn()
    await microsoftWarmup(fragments, "eng", "cmn", "openai", onChunk)

    expect(onChunk).toHaveBeenCalledTimes(2)
    expect(mockSendMessage).toHaveBeenCalledTimes(2)
  })
})
