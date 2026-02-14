import type { SubtitlesFragment } from '../../types'
import type { SegmentationUnit } from './protocol'
import { SENTENCE_END_PATTERN } from '@/utils/constants/subtitles'

const CJK_CHAR_PATTERN = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u
const LATIN_CHAR_PATTERN = /[A-Z]/i

const MERGE_MAX_LENGTH_UNITS = 5
const MERGE_MAX_DURATION_MS = 900
const MERGE_MAX_GAP_MS = 280

const SPLIT_MIN_TOTAL_UNITS = 20
const SPLIT_MIN_SIDE_UNITS = 4
const SPLIT_MIN_SCORE = 1

function normalizeSpaces(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function hasStrongBoundary(text: string): boolean {
  return SENTENCE_END_PATTERN.test(text.trim())
}

function shouldUseWordLikeMeasure(text: string): boolean {
  const trimmed = text.trim()

  if (!/\s/.test(trimmed)) {
    return false
  }

  if (!LATIN_CHAR_PATTERN.test(trimmed)) {
    return false
  }

  if (CJK_CHAR_PATTERN.test(trimmed)) {
    return false
  }

  return true
}

function measureTextLengthUnits(text: string): number {
  const normalized = normalizeSpaces(text)
  if (!normalized) {
    return 0
  }

  if (shouldUseWordLikeMeasure(normalized)) {
    return normalized.split(/\s+/).filter(Boolean).length
  }

  return Array.from(normalized.replace(/\s+/g, '')).length
}

function composeTextFromSourceRange(
  source: SubtitlesFragment[],
  from: number,
  to: number,
): string {
  if (from > to) {
    return ''
  }

  const parts: string[] = []
  for (let index = from; index <= to; index++) {
    const fragmentText = source[index]?.text
    if (fragmentText) {
      parts.push(fragmentText)
    }
  }

  return normalizeSpaces(parts.join(' '))
}

function getBoundaryGapMs(source: SubtitlesFragment[], splitIndex: number): number {
  const previous = source[splitIndex - 1]
  const current = source[splitIndex]

  if (!previous || !current) {
    return 0
  }

  return Math.max(0, current.start - previous.end)
}

function getCueDurationMs(source: SubtitlesFragment[], from: number, to: number): number {
  const start = source[from]?.start ?? 0
  const end = source[to]?.end ?? start
  return Math.max(0, end - start)
}

function shouldMergeAdjacentUnits(
  previous: SegmentationUnit,
  current: SegmentationUnit,
  source: SubtitlesFragment[],
): boolean {
  if (hasStrongBoundary(previous.text)) {
    return false
  }

  if (measureTextLengthUnits(previous.text) > MERGE_MAX_LENGTH_UNITS) {
    return false
  }

  if (getCueDurationMs(source, previous.from, previous.to) > MERGE_MAX_DURATION_MS) {
    return false
  }

  return getBoundaryGapMs(source, current.from) <= MERGE_MAX_GAP_MS
}

function mergeOverFragmentedUnits(
  units: SegmentationUnit[],
  source: SubtitlesFragment[],
): SegmentationUnit[] {
  if (units.length <= 1) {
    return units.map(unit => ({ ...unit }))
  }

  const merged: SegmentationUnit[] = []

  for (const unit of units) {
    const previous = merged[merged.length - 1]

    if (!previous) {
      merged.push({ ...unit })
      continue
    }

    if (shouldMergeAdjacentUnits(previous, unit, source)) {
      previous.to = unit.to
      previous.text = normalizeSpaces(`${previous.text} ${unit.text}`)
      continue
    }

    merged.push({ ...unit })
  }

  return merged
}

function evaluateSplitScore(
  source: SubtitlesFragment[],
  unit: SegmentationUnit,
  splitIndex: number,
): { score: number, leftText: string, rightText: string } | null {
  const leftText = composeTextFromSourceRange(source, unit.from, splitIndex - 1)
  const rightText = composeTextFromSourceRange(source, splitIndex, unit.to)

  if (!leftText || !rightText) {
    return null
  }

  const leftLength = measureTextLengthUnits(leftText)
  const rightLength = measureTextLengthUnits(rightText)

  if (leftLength < SPLIT_MIN_SIDE_UNITS || rightLength < SPLIT_MIN_SIDE_UNITS) {
    return null
  }

  const gap = getBoundaryGapMs(source, splitIndex)
  let score = 0

  if (gap >= 250) {
    score += 2
  }
  else if (gap >= 120) {
    score += 1
  }
  else if (gap < 60) {
    score -= 1
  }

  if (hasStrongBoundary(leftText)) {
    score += 2
  }

  if (Math.abs(leftLength - rightLength) > 8) {
    score -= 1
  }

  return { score, leftText, rightText }
}

function splitLongUnitsBySignals(
  units: SegmentationUnit[],
  source: SubtitlesFragment[],
): SegmentationUnit[] {
  const splitUnits: SegmentationUnit[] = []

  for (const unit of units) {
    if (unit.from === unit.to || measureTextLengthUnits(unit.text) <= SPLIT_MIN_TOTAL_UNITS) {
      splitUnits.push({ ...unit })
      continue
    }

    let bestScore = Number.NEGATIVE_INFINITY
    let bestSplitIndex: number | null = null
    let bestLeftText = ''
    let bestRightText = ''

    for (let splitIndex = unit.from + 1; splitIndex <= unit.to; splitIndex++) {
      const candidate = evaluateSplitScore(source, unit, splitIndex)
      if (!candidate) {
        continue
      }

      if (candidate.score > bestScore) {
        bestScore = candidate.score
        bestSplitIndex = splitIndex
        bestLeftText = candidate.leftText
        bestRightText = candidate.rightText
      }
    }

    if (bestSplitIndex === null || bestScore < SPLIT_MIN_SCORE) {
      splitUnits.push({ ...unit })
      continue
    }

    splitUnits.push({
      from: unit.from,
      to: bestSplitIndex - 1,
      text: bestLeftText,
    })
    splitUnits.push({
      from: bestSplitIndex,
      to: unit.to,
      text: bestRightText,
    })
  }

  return splitUnits
}

export function refineSegmentationUnits(
  units: SegmentationUnit[],
  source: SubtitlesFragment[],
): SegmentationUnit[] {
  const mergedUnits = mergeOverFragmentedUnits(units, source)
  return splitLongUnitsBySignals(mergedUnits, source)
}

export function buildFragmentsFromUnits(
  units: SegmentationUnit[],
  source: SubtitlesFragment[],
): SubtitlesFragment[] {
  return units.map((unit) => {
    const startFragment = source[unit.from]
    const endFragment = source[unit.to]

    return {
      text: unit.text,
      start: startFragment.start,
      end: Math.max(endFragment.end, startFragment.start),
    }
  })
}
