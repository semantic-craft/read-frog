import type { ArticleContent } from '@/types/content'
import { getConfigFromStorage } from '@/utils/config/config'
import { DEFAULT_CONFIG } from '../constants/config'
import { DEFAULT_BATCH_TRANSLATE_PROMPT, DEFAULT_TRANSLATE_PROMPT, getTokenCellText, INPUT, TARGET_LANG } from '../constants/prompt'

export interface TranslatePromptOptions {
  isBatch?: boolean
  content?: ArticleContent
}

export async function getTranslatePrompt(
  targetLang: string,
  input: string,
  options?: TranslatePromptOptions,
) {
  const config = await getConfigFromStorage() ?? DEFAULT_CONFIG
  const customPromptsConfig = config.translate.customPromptsConfig
  const { patterns = [], promptId } = customPromptsConfig

  // If no custom prompt selected, use default constant
  let prompt: string
  if (!promptId) {
    prompt = DEFAULT_TRANSLATE_PROMPT
  }
  else {
    // Find custom prompt, fallback to default
    const customPrompt = patterns.find(pattern => pattern.id === promptId)
    prompt = customPrompt?.prompt ?? DEFAULT_TRANSLATE_PROMPT
  }

  if (options?.isBatch) {
    prompt = `
${prompt}

${DEFAULT_BATCH_TRANSLATE_PROMPT}
`
  }

  // Inject article context if provided (after translation rules, before input)
  if (options?.content) {
    const { title, summary } = options.content
    let articleContext = `
## Article Context
This text is from an article titled "${title}".
`
    if (summary) {
      articleContext += `Summary: ${summary}\n`
    }
    articleContext += `
Use this context to improve translation accuracy for domain-specific terms and maintain consistency with the article's topic.

`
    // Insert before "Translate to" line
    prompt = prompt.replace(
      `Translate to ${getTokenCellText(TARGET_LANG)}:`,
      `${articleContext}Translate to ${getTokenCellText(TARGET_LANG)}:`,
    )
  }

  return prompt
    .replaceAll(getTokenCellText(TARGET_LANG), targetLang)
    .replaceAll(getTokenCellText(INPUT), input)
}
