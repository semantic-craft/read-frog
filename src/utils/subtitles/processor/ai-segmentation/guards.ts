import type { SubtitlesFragment } from '../../types'
import { SENTENCE_END_PATTERN } from '@/utils/constants/subtitles'

const MIN_READABLE_DURATION_MS = 800
const TINY_CUE_GAP_MS = 300
const TINY_TEXT_LENGTH_UNITS = 6

function normalizeSpaces(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function hasStrongBoundary(text: string): boolean {
  return SENTENCE_END_PATTERN.test(text.trim())
}

function isTinyCueText(text: string): boolean {
  const normalized = normalizeSpaces(text)
  if (!normalized) {
    return true
  }

  if (/\s/.test(normalized)) {
    return normalized.split(/\s+/).filter(Boolean).length <= TINY_TEXT_LENGTH_UNITS
  }

  return Array.from(normalized).length <= TINY_TEXT_LENGTH_UNITS
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

function mergeTinyCues(fragments: SubtitlesFragment[]): SubtitlesFragment[] {
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
    const isPreviousTiny = isTinyCueText(previous.text)
    const hasBoundary = hasStrongBoundary(previous.text)
    const shouldMerge = isShortDuration && isSmallGap && isPreviousTiny && !hasBoundary

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
): SubtitlesFragment[] {
  return normalizeTimeline(mergeTinyCues(normalizeTimeline(fragments)))
}
