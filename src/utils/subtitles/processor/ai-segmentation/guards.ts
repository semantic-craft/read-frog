import type { SubtitlesFragment } from '../../types'
import {
  isStrongSentenceBoundary,
  measureTextLengthUnits,
  normalizeSpaces,
} from '@/utils/subtitles/utils'

const MIN_READABLE_DURATION_MS = 800
const TINY_CUE_GAP_MS = 300
const TINY_TEXT_LENGTH_UNITS = 8
const STRONG_BOUNDARY_KEEP_GAP_MS = 180

function isTinyCueText(text: string, sourceLanguage: string): boolean {
  return measureTextLengthUnits(text, sourceLanguage) <= TINY_TEXT_LENGTH_UNITS
}

function normalizeTimeline(fragments: SubtitlesFragment[]): SubtitlesFragment[] {
  if (fragments.length === 0) {
    return fragments
  }

  const normalized = fragments.map(fragment => ({ ...fragment }))

  for (let index = 1; index < normalized.length; index++) {
    const previous = normalized[index - 1]
    const current = normalized[index]

    if (previous.end > current.start) {
      previous.end = current.start
    }

    if (previous.end < previous.start) {
      previous.end = previous.start
    }

    if (current.end < current.start) {
      current.end = current.start
    }
  }

  return normalized
}

function mergeTinyCues(fragments: SubtitlesFragment[], sourceLanguage: string): SubtitlesFragment[] {
  if (fragments.length <= 1) {
    return fragments
  }

  const merged: SubtitlesFragment[] = []

  for (const fragment of fragments) {
    const previous = merged[merged.length - 1]

    if (!previous) {
      merged.push({ ...fragment })
      continue
    }

    const prevDuration = previous.end - previous.start
    const gap = fragment.start - previous.end
    const isShortDuration = prevDuration < MIN_READABLE_DURATION_MS
    const isSmallGap = gap <= TINY_CUE_GAP_MS
    const isPreviousTiny = isTinyCueText(previous.text, sourceLanguage)
    const hasBoundary = isStrongSentenceBoundary(previous.text)
    const shouldKeepBoundary = hasBoundary && gap >= STRONG_BOUNDARY_KEEP_GAP_MS
    const shouldMerge = isShortDuration && isSmallGap && isPreviousTiny && !shouldKeepBoundary

    if (shouldMerge) {
      previous.text = normalizeSpaces(`${previous.text} ${fragment.text}`)
      previous.end = Math.max(previous.end, fragment.end)
      continue
    }

    merged.push({ ...fragment })
  }

  return merged
}

export function enforceCueGuards(
  fragments: SubtitlesFragment[],
  sourceLanguage: string,
): SubtitlesFragment[] {
  // First pass fixes malformed timeline from model output/input.
  // Second pass fixes possible overlaps introduced while merging tiny cues.
  return normalizeTimeline(mergeTinyCues(normalizeTimeline(fragments), sourceLanguage))
}
