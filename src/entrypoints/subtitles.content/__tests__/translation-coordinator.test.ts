import { beforeEach, describe, expect, it, vi } from "vitest"

import { TranslationCoordinator } from "../translation-coordinator"

const {
  buildDirectSubtitleTranslationsMock,
  translateSubtitlesMock,
} = vi.hoisted(() => ({
  buildDirectSubtitleTranslationsMock: vi.fn(),
  translateSubtitlesMock: vi.fn(),
}))

vi.mock("@/utils/subtitles/processor/translator", () => ({
  buildDirectSubtitleTranslations: buildDirectSubtitleTranslationsMock,
  translateSubtitles: translateSubtitlesMock,
}))

describe("translation coordinator", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("warms future fragments without emitting translated subtitles", async () => {
    buildDirectSubtitleTranslationsMock.mockResolvedValue({
      values: new Map([[40_000, "warmed"]]),
      hadRequests: true,
      allRejected: false,
    })
    translateSubtitlesMock.mockResolvedValue([])

    const fragments = [
      { text: "near", start: 10_000, end: 12_000 },
      { text: "future", start: 40_000, end: 42_000 },
    ]
    const onTranslated = vi.fn()
    const coordinator = new TranslationCoordinator({
      getFragments: () => fragments,
      getVideoElement: () => null,
      getCurrentState: () => "idle",
      segmentationPipeline: null,
      onTranslated,
      onStateChange: vi.fn(),
    })

    coordinator.start(
      { videoTitle: "Video title", subtitlesTextContent: "nearfuture" },
      "fr",
      "eng",
    )

    await (coordinator as any).warmupNearby(0)

    expect(buildDirectSubtitleTranslationsMock).toHaveBeenCalledWith(
      [{ text: "future", start: 40_000, end: 42_000 }],
      "fr",
      "eng",
      { videoTitle: "Video title", subtitlesTextContent: "nearfuture" },
    )
    expect(onTranslated).not.toHaveBeenCalled()
    expect((coordinator as any).warmedStarts.has(40_000)).toBe(true)
    expect((coordinator as any).failedStarts.size).toBe(0)
  })

  it("tracks warmup failures separately from visible translation failures", async () => {
    buildDirectSubtitleTranslationsMock.mockRejectedValue(new Error("warmup failed"))
    translateSubtitlesMock.mockResolvedValue([])

    const coordinator = new TranslationCoordinator({
      getFragments: () => [{ text: "future", start: 40_000, end: 42_000 }],
      getVideoElement: () => null,
      getCurrentState: () => "idle",
      segmentationPipeline: null,
      onTranslated: vi.fn(),
      onStateChange: vi.fn(),
    })

    coordinator.start(
      { videoTitle: "Video title", subtitlesTextContent: "future" },
      "fr",
      "eng",
    )

    await (coordinator as any).warmupNearby(0)

    expect((coordinator as any).warmupFailedStarts.has(40_000)).toBe(true)
    expect((coordinator as any).failedStarts.size).toBe(0)
  })
})
