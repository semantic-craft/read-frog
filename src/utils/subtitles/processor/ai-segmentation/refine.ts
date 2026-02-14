import type { SubtitlesFragment } from '../../types'
import type { SegmentationUnit } from './protocol'
import { isStrongSentenceBoundary, measureTextLengthUnits, normalizeSpaces } from '@/utils/subtitles/utils'

const MERGE_MAX_LENGTH_UNITS = 5
const MERGE_MAX_DURATION_MS = 900
const MERGE_MAX_GAP_MS = 280

const SPLIT_MIN_TOTAL_UNITS = 20
const SPLIT_MIN_SIDE_UNITS = 4
const SPLIT_MIN_SCORE = 1

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
  sourceLanguage: string,
): boolean {
  if (isStrongSentenceBoundary(previous.text)) {
    return false
  }

  if (measureTextLengthUnits(previous.text, sourceLanguage) > MERGE_MAX_LENGTH_UNITS) {
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
  sourceLanguage: string,
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

    if (shouldMergeAdjacentUnits(previous, unit, source, sourceLanguage)) {
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
  sourceLanguage: string,
): { score: number, leftText: string, rightText: string } | null {
  const leftText = composeTextFromSourceRange(source, unit.from, splitIndex - 1)
  const rightText = composeTextFromSourceRange(source, splitIndex, unit.to)

  if (!leftText || !rightText) {
    return null
  }

  const leftLength = measureTextLengthUnits(leftText, sourceLanguage)
  const rightLength = measureTextLengthUnits(rightText, sourceLanguage)

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

  if (isStrongSentenceBoundary(leftText)) {
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
  sourceLanguage: string,
): SegmentationUnit[] {
  // Intentional single-pass split: choose one strongest boundary per long unit.
  // If still too long, we prefer keeping semantic continuity instead of recursive splitting.
  const splitUnits: SegmentationUnit[] = []

  for (const unit of units) {
    if (unit.from === unit.to || measureTextLengthUnits(unit.text, sourceLanguage) <= SPLIT_MIN_TOTAL_UNITS) {
      splitUnits.push({ ...unit })
      continue
    }

    let bestScore = Number.NEGATIVE_INFINITY
    let bestSplitIndex: number | null = null
    let bestLeftText = ''
    let bestRightText = ''

    for (let splitIndex = unit.from + 1; splitIndex <= unit.to; splitIndex++) {
      const candidate = evaluateSplitScore(source, unit, splitIndex, sourceLanguage)
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
  sourceLanguage: string,
): SegmentationUnit[] {
  const mergedUnits = mergeOverFragmentedUnits(units, source, sourceLanguage)
  return splitLongUnitsBySignals(mergedUnits, source, sourceLanguage)
}

export function buildFragmentsFromUnits(
  units: SegmentationUnit[],
  source: SubtitlesFragment[],
): SubtitlesFragment[] {
  return units.map((unit) => {
    const startFragment = source[unit.from]
    const endFragment = source[unit.to]
    if (!startFragment || !endFragment) {
      throw new Error(`Segmentation unit index out of bounds: ${unit.from}-${unit.to}`)
    }

    return {
      text: unit.text,
      start: startFragment.start,
      end: Math.max(endFragment.end, startFragment.start),
    }
  })
}
