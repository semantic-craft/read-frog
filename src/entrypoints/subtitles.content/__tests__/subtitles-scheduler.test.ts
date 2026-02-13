import { afterEach, describe, expect, it, vi } from 'vitest'
import { currentSubtitleAtom, subtitlesStateAtom, subtitlesStore } from '../atoms'
import { SubtitlesScheduler } from '../subtitles-scheduler'

function createVideoElement(initialTime = 0) {
  const listeners = new Map<string, Set<() => void>>()

  const videoElement = {
    currentTime: initialTime,
    addEventListener: vi.fn((event: string, callback: () => void) => {
      const callbacks = listeners.get(event) ?? new Set<() => void>()
      callbacks.add(callback)
      listeners.set(event, callbacks)
    }),
    removeEventListener: vi.fn((event: string, callback: () => void) => {
      listeners.get(event)?.delete(callback)
    }),
  } as unknown as HTMLVideoElement

  const emit = (event: string) => {
    listeners.get(event)?.forEach(callback => callback())
  }

  return { videoElement, emit }
}

describe('subtitles scheduler', () => {
  afterEach(() => {
    vi.useRealTimers()
    subtitlesStore.set(currentSubtitleAtom, null)
    subtitlesStore.set(subtitlesStateAtom, null)
  })

  it('auto-hides error state after a delay', () => {
    vi.useFakeTimers()

    const { videoElement } = createVideoElement()

    const scheduler = new SubtitlesScheduler({ videoElement })
    scheduler.setState('error', { message: 'boom' })

    expect(subtitlesStore.get(subtitlesStateAtom)?.state).toBe('error')

    vi.advanceTimersByTime(5_000)
    expect(subtitlesStore.get(subtitlesStateAtom)).toBeNull()
  })

  it('prefers later subtitle when timeline overlaps', () => {
    const { videoElement, emit } = createVideoElement(2.2)
    const scheduler = new SubtitlesScheduler({ videoElement })

    scheduler.start()
    scheduler.supplementSubtitles([
      { text: 'previous sentence', start: 1000, end: 2600, translation: '上一句' },
      { text: 'next sentence', start: 2000, end: 3200, translation: '下一句' },
    ])

    emit('timeupdate')

    expect(subtitlesStore.get(currentSubtitleAtom)?.text).toBe('next sentence')
  })

  it('keeps normal subtitle switching when no overlap exists', () => {
    const { videoElement, emit } = createVideoElement(1.5)
    const scheduler = new SubtitlesScheduler({ videoElement })

    scheduler.start()
    scheduler.supplementSubtitles([
      { text: 'first', start: 1000, end: 2000, translation: '第一句' },
      { text: 'second', start: 2000, end: 3000, translation: '第二句' },
    ])

    emit('timeupdate')
    expect(subtitlesStore.get(currentSubtitleAtom)?.text).toBe('first')

    videoElement.currentTime = 2.2
    emit('timeupdate')
    expect(subtitlesStore.get(currentSubtitleAtom)?.text).toBe('second')
  })
})
