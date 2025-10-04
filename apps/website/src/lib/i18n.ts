import type { I18nConfig } from 'fumadocs-core/i18n'

export const i18n = {
  defaultLanguage: 'en',
  languages: ['en', 'zh'],
  parser: 'dot',
} as const satisfies I18nConfig
