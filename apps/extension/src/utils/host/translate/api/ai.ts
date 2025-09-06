import type { JSONValue } from 'ai'
import type { LLMProviderConfig } from '@/types/config/provider'
import { generateText } from 'ai'
import { THINKING_MODELS } from '@/types/config/provider'
import { getTranslateModel } from '@/utils/provider'

const DEFAULT_THINKING_BUDGET = 128

export async function aiTranslate(providerConfig: LLMProviderConfig, prompt: string) {
  const { name, models: { translate } } = providerConfig
  const translateModel = translate.isCustomModel ? translate.customModel : translate.model
  const model = await getTranslateModel(name)

  const providerOptions: Record<string, Record<string, JSONValue>> = {
    google: {
      thinkingConfig: {
        thinkingBudget: THINKING_MODELS.includes(translateModel as (typeof THINKING_MODELS)[number]) ? DEFAULT_THINKING_BUDGET : 0,
      },
    },
  }

  const { text } = await generateText({
    model,
    prompt,
    providerOptions,
  })
  return text
}
