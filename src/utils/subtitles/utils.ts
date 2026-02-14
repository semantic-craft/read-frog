import { MAX_CHARS_CJK, MAX_WORDS, MAX_WORDS_EXTENDED, SENTENCE_END_PATTERN } from '@/utils/constants/subtitles'

export function isCJKLanguage(lang?: string): boolean {
  if (!lang)
    return false
  return ['zh', 'ja', 'ko', 'th', 'lo', 'km', 'my'].some(l => lang.startsWith(l))
}

export function getTextLength(text: string, isCJK: boolean): number {
  if (isCJK) {
    return text.length
  }
  return text.split(/\s+/).filter(Boolean).length
}

export function getMaxLength(isCJK: boolean, extended: boolean = false): number {
  if (isCJK) {
    return MAX_CHARS_CJK
  }
  return extended ? MAX_WORDS_EXTENDED : MAX_WORDS
}

export function normalizeSpaces(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

export function measureTextLengthUnits(text: string, language: string): number {
  const normalized = normalizeSpaces(text)
  if (!normalized) {
    return 0
  }

  if (isCJKLanguage(language)) {
    return Array.from(normalized.replace(/\s+/g, '')).length
  }

  return normalized.split(/\s+/).filter(Boolean).length
}

export function isStrongSentenceBoundary(text: string): boolean {
  return SENTENCE_END_PATTERN.test(text.trim())
}
