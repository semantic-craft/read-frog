import type { SubtitlesFragment } from '@/utils/subtitles/types'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getLocalConfig } from '@/utils/config/storage'
import { aiSegmentBlock } from '@/utils/subtitles/processor/ai-segmentation'
import { optimizeSubtitles } from '@/utils/subtitles/processor/optimizer'
import { SegmentationPipeline } from '../segmentation-pipeline'

vi.mock('@/utils/config/storage', () => ({
  getLocalConfig: vi.fn(),
}))

vi.mock('@/utils/subtitles/processor/ai-segmentation', () => ({
  aiSegmentBlock: vi.fn(),
}))

vi.mock('@/utils/subtitles/processor/optimizer', () => ({
  optimizeSubtitles: vi.fn(),
}))

describe('segmentation pipeline timeline normalization', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('replaces overlapping old chunk cues by time range intersection', async () => {
    const rawFragments: SubtitlesFragment[] = [
      { text: 'part-1', start: 0, end: 1000 },
      { text: 'part-2', start: 70_000, end: 71_000 },
      { text: 'part-3', start: 71_000, end: 72_000 },
    ]

    vi.mocked(getLocalConfig).mockResolvedValue({} as never)
    vi.mocked(optimizeSubtitles).mockReturnValue([])

    vi.mocked(aiSegmentBlock).mockImplementation(async (chunk) => {
      if (chunk[0].start === 0) {
        return [{ text: 'old-long', start: 0, end: 70_500 }]
      }

      return [
        { text: 'next-1', start: 70_000, end: 71_000 },
        { text: 'next-2', start: 71_000, end: 72_000 },
      ]
    })

    const pipeline = new SegmentationPipeline({
      rawFragments,
      getVideoElement: () => ({ currentTime: 0 } as HTMLVideoElement),
      getSourceLanguage: () => 'en',
    })

    pipeline.start()

    await vi.waitFor(() => {
      expect(vi.mocked(aiSegmentBlock)).toHaveBeenCalledTimes(2)
    })

    expect(pipeline.processedFragments).toEqual([
      { text: 'next-1', start: 70_000, end: 71_000 },
      { text: 'next-2', start: 71_000, end: 72_000 },
    ])
  })

  it('normalizes overlap in fallback optimized result', async () => {
    const rawFragments: SubtitlesFragment[] = [
      { text: 'piece-1', start: 0, end: 1000 },
      { text: 'piece-2', start: 1000, end: 2000 },
    ]

    vi.mocked(getLocalConfig).mockResolvedValue({} as never)
    vi.mocked(aiSegmentBlock).mockRejectedValue(new Error('failed'))
    vi.mocked(optimizeSubtitles).mockReturnValue([
      { text: 'fallback-1', start: 0, end: 1500 },
      { text: 'fallback-2', start: 1000, end: 2000 },
    ])

    const pipeline = new SegmentationPipeline({
      rawFragments,
      getVideoElement: () => ({ currentTime: 0 } as HTMLVideoElement),
      getSourceLanguage: () => 'en',
    })

    pipeline.start()

    await vi.waitFor(() => {
      expect(vi.mocked(optimizeSubtitles)).toHaveBeenCalledTimes(1)
    })

    expect(pipeline.processedFragments).toEqual([
      { text: 'fallback-1', start: 0, end: 1000 },
      { text: 'fallback-2', start: 1000, end: 2000 },
    ])
  })
})
