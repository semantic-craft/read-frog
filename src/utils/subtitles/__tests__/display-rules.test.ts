import { describe, expect, it } from 'vitest'
import { deriveSubtitleDisplayDecision } from '../display-rules'

describe('subtitle display rules', () => {
  const subtitle = {
    text: 'hello world',
    translation: '你好世界',
    start: 0,
    end: 1000,
  }

  it('hides loading when a renderable subtitle exists in bilingual mode', () => {
    const decision = deriveSubtitleDisplayDecision(
      { state: 'loading' },
      subtitle,
      'bilingual',
    )

    expect(decision).toEqual({
      hasRenderableSubtitle: true,
      showStateMessage: false,
    })
  })

  it('shows loading in translationOnly mode when translation is not ready', () => {
    const decision = deriveSubtitleDisplayDecision(
      { state: 'loading' },
      {
        ...subtitle,
        translation: '',
      },
      'translationOnly',
    )

    expect(decision).toEqual({
      hasRenderableSubtitle: false,
      showStateMessage: true,
    })
  })

  it('keeps error visible even when subtitle exists', () => {
    const decision = deriveSubtitleDisplayDecision(
      { state: 'error', message: 'boom' },
      subtitle,
      'bilingual',
    )

    expect(decision).toEqual({
      hasRenderableSubtitle: true,
      showStateMessage: true,
    })
  })

  it('shows subtitle only when idle', () => {
    const decision = deriveSubtitleDisplayDecision(
      { state: 'idle' },
      subtitle,
      'bilingual',
    )

    expect(decision).toEqual({
      hasRenderableSubtitle: true,
      showStateMessage: false,
    })
  })
})
