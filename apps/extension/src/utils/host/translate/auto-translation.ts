import type { Config } from '@/types/config/config'
import { getDocumentInfo } from '@/utils/content'

export async function shouldEnableAutoTranslationByUrl(url: string, config: Config): Promise<boolean> {
  const autoTranslatePatterns = config?.translate.page.autoTranslatePatterns

  return autoTranslatePatterns?.some(pattern =>
    url.toLowerCase().includes(pattern.toLowerCase()),
  ) ?? false
}

export async function shouldEnableAutoTranslationByLanguage(config: Config): Promise<boolean> {
  const autoTranslateLanguages = config?.translate.page.autoTranslateLanguages
  const { detectedCode } = getDocumentInfo()

  return autoTranslateLanguages?.includes(detectedCode) ?? false
}

export async function shouldEnableAutoTranslation(url: string, config: Config): Promise<boolean> {
  const matchByUrl = await shouldEnableAutoTranslationByUrl(url, config)
  const matchByLanguage = await shouldEnableAutoTranslationByLanguage(config)

  return matchByUrl || matchByLanguage
}
