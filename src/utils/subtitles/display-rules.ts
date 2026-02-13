import type { SubtitlesDisplayMode } from '@/types/config/subtitles'
import type { StateData, SubtitlesFragment } from '@/utils/subtitles/types'

export interface SubtitleDisplayDecision {
  hasRenderableSubtitle: boolean
  showStateMessage: boolean
}

function hasText(value: string | undefined): boolean {
  return !!value?.trim()
}

export function hasRenderableSubtitleByMode(
  subtitle: SubtitlesFragment | null,
  displayMode: SubtitlesDisplayMode,
): boolean {
  if (!subtitle) {
    return false
  }

  if (displayMode === 'translationOnly') {
    return hasText(subtitle.translation)
  }

  if (displayMode === 'originalOnly') {
    return hasText(subtitle.text)
  }

  return hasText(subtitle.text) || hasText(subtitle.translation)
}

export function deriveSubtitleDisplayDecision(
  stateData: StateData | null,
  subtitle: SubtitlesFragment | null,
  displayMode: SubtitlesDisplayMode,
): SubtitleDisplayDecision {
  const hasRenderableSubtitle = hasRenderableSubtitleByMode(subtitle, displayMode)

  if (!stateData || stateData.state === 'idle') {
    return {
      hasRenderableSubtitle,
      showStateMessage: false,
    }
  }

  if (stateData.state === 'error') {
    return {
      hasRenderableSubtitle,
      showStateMessage: true,
    }
  }

  return {
    hasRenderableSubtitle,
    showStateMessage: !hasRenderableSubtitle,
  }
}
