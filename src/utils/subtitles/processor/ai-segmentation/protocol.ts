import type { SubtitlesFragment } from '../../types'

const RANGE_PATTERN = /^(\d+)\s*-\s*(\d+)$/
const LIST_PREFIX_PATTERN = /^\d+[.)]\s*/

export interface SegmentationUnit {
  from: number
  to: number
  text: string
}

export function cleanFragmentsForAi(fragments: SubtitlesFragment[]): SubtitlesFragment[] {
  return fragments
    .map(fragment => ({
      ...fragment,
      text: fragment.text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(),
    }))
    .filter(fragment => fragment.text.length > 0)
}

export function formatFragmentsToJson(fragments: SubtitlesFragment[]): string {
  return JSON.stringify(fragments.map((fragment, index) => ({
    i: index,
    s: fragment.start,
    e: fragment.end,
    t: fragment.text,
  })))
}

export function parseLineProtocolToUnits(raw: string): SegmentationUnit[] {
  const units: SegmentationUnit[] = []

  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) {
      continue
    }

    const pipeIndex = trimmed.indexOf('|')
    if (pipeIndex < 0) {
      continue
    }

    const leftPart = trimmed.slice(0, pipeIndex).trim().replace(LIST_PREFIX_PATTERN, '')
    const text = trimmed.slice(pipeIndex + 1).trim()
    if (!text) {
      continue
    }

    const rangeMatch = leftPart.match(RANGE_PATTERN)
    if (!rangeMatch) {
      continue
    }

    const from = Number.parseInt(rangeMatch[1], 10)
    const to = Number.parseInt(rangeMatch[2], 10)

    if (!Number.isNaN(from) && !Number.isNaN(to)) {
      units.push({ from, to, text })
    }
  }

  if (units.length === 0) {
    throw new Error('AI segmentation returned invalid line protocol')
  }

  return units
}

export function validateSegmentationUnits(
  units: SegmentationUnit[],
  sourceLength: number,
): void {
  if (sourceLength === 0) {
    throw new Error('Cannot validate segmentation units with empty source')
  }

  let expectedFrom = 0

  for (const unit of units) {
    if (unit.from > unit.to) {
      throw new Error(`Invalid segmentation range: ${unit.from}-${unit.to}`)
    }

    if (unit.from < 0 || unit.to >= sourceLength) {
      throw new Error(`Segmentation range out of bounds: ${unit.from}-${unit.to}`)
    }

    if (unit.from !== expectedFrom) {
      throw new Error(`Segmentation coverage mismatch at index ${expectedFrom}`)
    }

    expectedFrom = unit.to + 1
  }

  if (expectedFrom !== sourceLength) {
    throw new Error(`Segmentation does not cover all fragments: stopped at ${expectedFrom - 1}`)
  }
}
