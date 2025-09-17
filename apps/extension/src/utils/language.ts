import type { LangCodeISO6393 } from '@repo/definitions'
import { franc } from 'franc-min'

export function detectLanguage(text: string): LangCodeISO6393 {
  const detected = franc(text)
  return detected === 'und' ? 'eng' : (detected as LangCodeISO6393)
}
