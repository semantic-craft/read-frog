import type { SubtitlesFragment } from '@/utils/subtitles/types'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { translateSubtitles } from '@/utils/subtitles/processor/translator'
import { TranslationCoordinator } from '../translation-coordinator'

vi.mock('@/utils/subtitles/processor/translator', () => ({
  translateSubtitles: vi.fn(),
}))

function createVideoElement(initialTimeSeconds: number) {
  const listeners = new Map<string, Set<() => void>>()

  const videoElement = {
    currentTime: initialTimeSeconds,
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

describe('translation coordinator loading behavior', () => {
  const fragments: SubtitlesFragment[] = [
    { text: 'first', start: 0, end: 1000 },
    { text: 'second', start: 2000, end: 3000 },
  ]

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('keeps idle during subtitle gap even when background translation continues', async () => {
    const { videoElement } = createVideoElement(1.5)
    const onStateChange = vi.fn()

    vi.mocked(translateSubtitles).mockImplementation(async batch => batch.map(f => ({
      ...f,
      translation: `t:${f.text}`,
    })))

    const coordinator = new TranslationCoordinator({
      getFragments: () => fragments,
      getVideoElement: () => videoElement,
      segmentationPipeline: null,
      onTranslated: vi.fn(),
      onStateChange,
    })

    coordinator.start()
    await Promise.resolve()

    const states = onStateChange.mock.calls.map(([state]) => state)
    expect(states).not.toContain('loading')
    expect(states).toContain('idle')
  })

  it('shows loading for untranslated active cue, then returns idle after translation', async () => {
    const { videoElement } = createVideoElement(2.2)
    const onStateChange = vi.fn()

    let resolveTranslation: (() => void) | undefined

    vi.mocked(translateSubtitles).mockImplementationOnce((batch) => {
      return new Promise((resolve) => {
        resolveTranslation = () => {
          resolve(batch.map(f => ({
            ...f,
            translation: `t:${f.text}`,
          })))
        }
      })
    })

    const coordinator = new TranslationCoordinator({
      getFragments: () => fragments,
      getVideoElement: () => videoElement,
      segmentationPipeline: null,
      onTranslated: vi.fn(),
      onStateChange,
    })

    coordinator.start()

    expect(onStateChange.mock.calls.map(([state]) => state)).toContain('loading')
    expect(resolveTranslation).toBeTypeOf('function')

    resolveTranslation?.()
    await vi.waitFor(() => {
      expect(onStateChange.mock.calls.map(([state]) => state)).toContain('idle')
    })
  })

  it('switches to idle when seeking into a gap during ongoing translation', () => {
    const { videoElement, emit } = createVideoElement(2.2)
    const onStateChange = vi.fn()

    vi.mocked(translateSubtitles).mockImplementationOnce((batch) => {
      return new Promise(() => {
        void batch
      })
    })

    const coordinator = new TranslationCoordinator({
      getFragments: () => fragments,
      getVideoElement: () => videoElement,
      segmentationPipeline: null,
      onTranslated: vi.fn(),
      onStateChange,
    })

    coordinator.start()
    expect(onStateChange.mock.calls.map(([state]) => state)).toContain('loading')

    videoElement.currentTime = 1.5
    emit('timeupdate')

    const states = onStateChange.mock.calls.map(([state]) => state)
    expect(states[states.length - 1]).toBe('idle')
  })
})
