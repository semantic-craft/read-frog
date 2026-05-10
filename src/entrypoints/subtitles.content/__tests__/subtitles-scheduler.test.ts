import { afterEach, describe, expect, it, vi } from "vitest"
import { currentSubtitleAtom, subtitlesStateAtom, subtitlesStore } from "../atoms"
import { SubtitlesScheduler } from "../subtitles-scheduler"

describe("subtitles scheduler", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("auto-hides error state after a delay", () => {
    vi.useFakeTimers()

    const videoElement = {
      currentTime: 0,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLVideoElement

    const scheduler = new SubtitlesScheduler({ videoElement })
    scheduler.setState("error", { message: "boom" })

    expect(subtitlesStore.get(subtitlesStateAtom)?.state).toBe("error")

    vi.advanceTimersByTime(5_000)
    expect(subtitlesStore.get(subtitlesStateAtom)).toBeNull()
  })

  it("merges subtitle patches without clearing an existing translation", () => {
    const videoElement = {
      currentTime: 0,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLVideoElement

    const scheduler = new SubtitlesScheduler({ videoElement })
    scheduler.start()

    scheduler.supplementSubtitles([
      { text: "hello", translation: "你好", start: 0, end: 1_000 },
    ])
    scheduler.supplementSubtitles([
      { text: "hello world", start: 0, end: 1_000 },
    ])

    expect(subtitlesStore.get(currentSubtitleAtom)).toEqual({
      text: "hello world",
      translation: "你好",
      start: 0,
      end: 1_000,
    })
  })
})
