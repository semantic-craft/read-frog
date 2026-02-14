import type { SubtitlesFragment } from '../types'
import { describe, expect, it } from 'vitest'
import { enforceCueGuards } from '../processor/ai-segmentation/guards'
import {
  cleanLineProtocolResponse,
  parseLineProtocolToUnits,
  validateSegmentationUnits,
} from '../processor/ai-segmentation/protocol'
import { buildFragmentsFromUnits, refineSegmentationUnits } from '../processor/ai-segmentation/refine'
import { measureTextLengthUnits } from '../utils'

describe('ai segmentation line protocol', () => {
  it('parses valid protocol lines and ignores non-protocol lines', () => {
    const raw = `Result:\n0-1 | Hello world.\n2-3 | This works.\nDone.`

    const result = parseLineProtocolToUnits(raw)

    expect(result).toEqual([
      { from: 0, to: 1, text: 'Hello world.' },
      { from: 2, to: 3, text: 'This works.' },
    ])
  })

  it('parses numbered lines with extra spaces around delimiter', () => {
    const raw = `1. 0-1 |   Hola mundo.   \n2) 2-3|Bonjour le monde\nxxx`

    const result = parseLineProtocolToUnits(raw)

    expect(result).toEqual([
      { from: 0, to: 1, text: 'Hola mundo.' },
      { from: 2, to: 3, text: 'Bonjour le monde' },
    ])
  })

  it('cleans line protocol response from markdown fences and think tags', () => {
    const raw = `\n\`\`\`text\n<think>internal</think>\n0-1 | Hello\n2-2 | world\n\`\`\`\n`

    const result = cleanLineProtocolResponse(raw)

    expect(result).toBe('0-1 | Hello\n2-2 | world')
  })

  it('throws when line protocol has no valid units', () => {
    expect(() => parseLineProtocolToUnits('Result: none')).toThrow(
      'AI segmentation returned invalid line protocol',
    )
  })

  it('measures text length by explicit source language', () => {
    expect(measureTextLengthUnits('hello world', 'en')).toBe(2)
    expect(measureTextLengthUnits('hello world', 'zh')).toBe(10)
    expect(measureTextLengthUnits('你好 世界', 'zh')).toBe(4)
  })

  it('validates complete contiguous coverage', () => {
    const units = [
      { from: 0, to: 1, text: 'First.' },
      { from: 2, to: 4, text: 'Second.' },
    ]

    expect(() => validateSegmentationUnits(units, 5)).not.toThrow()
  })

  it('throws when coverage has gaps', () => {
    const units = [
      { from: 0, to: 1, text: 'First.' },
      { from: 3, to: 4, text: 'Second.' },
    ]

    expect(() => validateSegmentationUnits(units, 5)).toThrow()
  })

  it('throws when units overlap', () => {
    const units = [
      { from: 0, to: 2, text: 'First.' },
      { from: 2, to: 4, text: 'Second.' },
    ]

    expect(() => validateSegmentationUnits(units, 5)).toThrow('Segmentation overlap')
  })

  it('throws when range is invalid or out of bounds', () => {
    expect(() => validateSegmentationUnits([{ from: 2, to: 1, text: 'bad' }], 3)).toThrow(
      'Invalid segmentation range',
    )
    expect(() => validateSegmentationUnits([{ from: 0, to: 3, text: 'bad' }], 3)).toThrow(
      'Segmentation range out of bounds',
    )
  })

  it('rebuilds cue timeline from source indexes', () => {
    const source: SubtitlesFragment[] = [
      { text: 'hello', start: 1000, end: 1200 },
      { text: 'world', start: 1200, end: 1600 },
      { text: 'this', start: 1600, end: 1900 },
      { text: 'works', start: 1900, end: 2400 },
    ]
    const units = [
      { from: 0, to: 1, text: 'Hello world.' },
      { from: 2, to: 3, text: 'This works.' },
    ]

    const result = buildFragmentsFromUnits(units, source)

    expect(result).toEqual([
      { text: 'Hello world.', start: 1000, end: 1600 },
      { text: 'This works.', start: 1600, end: 2400 },
    ])
  })

  it('throws when rebuilding timeline with out-of-range indexes', () => {
    const source: SubtitlesFragment[] = [
      { text: 'hello', start: 1000, end: 1200 },
    ]
    const units = [
      { from: 0, to: 1, text: 'Hello world.' },
    ]

    expect(() => buildFragmentsFromUnits(units, source)).toThrow('Segmentation unit index out of bounds')
  })

  it('merges short adjacent cues without strong boundary regardless of language', () => {
    const source: SubtitlesFragment[] = [
      { text: '你好', start: 0, end: 220 },
      { text: '世界', start: 220, end: 460 },
      { text: '欢迎你', start: 460, end: 900 },
    ]

    const units = [
      { from: 0, to: 0, text: '你好' },
      { from: 1, to: 2, text: '世界 欢迎你' },
    ]

    const refined = refineSegmentationUnits(units, source, 'zh')

    expect(refined).toEqual([
      { from: 0, to: 2, text: '你好 世界 欢迎你' },
    ])
  })

  it('splits long multilingual unit by pause and boundary signals', () => {
    const source: SubtitlesFragment[] = [
      { text: '这是一个非常非常长的句子片段', start: 0, end: 500 },
      { text: '我们继续补充更多内容以便测试', start: 500, end: 1000 },
      { text: '。', start: 1000, end: 1100 },
      { text: '这是一段新的说明', start: 1600, end: 2100 },
      { text: '继续补充一下', start: 2100, end: 2500 },
    ]

    const units = [
      {
        from: 0,
        to: 4,
        text: '这是一个非常非常长的句子片段我们继续补充更多内容以便测试。这是一段新的说明继续补充一下',
      },
    ]

    const refined = refineSegmentationUnits(units, source, 'zh')

    expect(refined).toEqual([
      { from: 0, to: 2, text: '这是一个非常非常长的句子片段 我们继续补充更多内容以便测试 。' },
      { from: 3, to: 4, text: '这是一段新的说明 继续补充一下' },
    ])
  })

  it('keeps long unit when no safe split boundary exists', () => {
    const source: SubtitlesFragment[] = [
      { text: 'これはかなり長い説明文です', start: 0, end: 500 },
      { text: 'そのまま続いています', start: 500, end: 1000 },
      { text: 'さらに続いています', start: 1000, end: 1500 },
      { text: 'まだ続いています', start: 1500, end: 2000 },
    ]

    const units = [
      {
        from: 0,
        to: 3,
        text: 'これはかなり長い説明文ですそのまま続いていますさらに続いていますまだ続いています',
      },
    ]

    const refined = refineSegmentationUnits(units, source, 'ja')

    expect(refined).toEqual(units)
  })

  it('does not split when only tiny gap exists and no boundary punctuation', () => {
    const source: SubtitlesFragment[] = [
      { text: 'sentence part one', start: 0, end: 500 },
      { text: 'sentence part two', start: 520, end: 1000 },
      { text: 'sentence part three', start: 1040, end: 1500 },
      { text: 'sentence part four', start: 1560, end: 2000 },
    ]

    const units = [
      {
        from: 0,
        to: 3,
        text: 'sentence part one sentence part two sentence part three sentence part four',
      },
    ]

    const refined = refineSegmentationUnits(units, source, 'en')

    expect(refined).toEqual(units)
  })

  it('merges tiny adjacent cues without strong boundary', () => {
    const cues: SubtitlesFragment[] = [
      { text: 'well', start: 1000, end: 1200 },
      { text: 'this is better.', start: 1200, end: 2200 },
    ]

    const result = enforceCueGuards(cues, 'en')

    expect(result).toEqual([
      { text: 'well this is better.', start: 1000, end: 2200 },
    ])
  })

  it('keeps tiny cue when it already has strong boundary punctuation', () => {
    const cues: SubtitlesFragment[] = [
      { text: 'Okay.', start: 1000, end: 1200 },
      { text: 'next thought', start: 1200, end: 2200 },
    ]

    const result = enforceCueGuards(cues, 'en')

    expect(result).toEqual(cues)
  })

  it('does not treat comma as strong boundary for cue merge guards', () => {
    const cues: SubtitlesFragment[] = [
      { text: 'well,', start: 1000, end: 1200 },
      { text: 'this is better', start: 1200, end: 2200 },
    ]

    const result = enforceCueGuards(cues, 'en')

    expect(result).toEqual([
      { text: 'well, this is better', start: 1000, end: 2200 },
    ])
  })

  it('does not treat colon as strong boundary for cue merge guards', () => {
    const cues: SubtitlesFragment[] = [
      { text: 'note:', start: 1000, end: 1200 },
      { text: 'this continues', start: 1200, end: 2200 },
    ]

    const result = enforceCueGuards(cues, 'en')

    expect(result).toEqual([
      { text: 'note: this continues', start: 1000, end: 2200 },
    ])
  })
})
