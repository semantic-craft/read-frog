import type { Config } from '@/types/config/config'
import type { LLMTranslateProviderNames, ReadProviderNames } from '@/types/config/provider'
import { storage } from '#imports'
import { createDeepSeek } from '@ai-sdk/deepseek'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createProviderRegistry } from 'ai'
import { getLLMProvidersConfig, getProviderConfigByName } from './config/helpers'
import { CONFIG_STORAGE_KEY, DEFAULT_PROVIDER_CONFIG } from './constants/config'

export async function getProviderRegistry() {
  const config = await storage.getItem<Config>(`local:${CONFIG_STORAGE_KEY}`)

  return createProviderRegistry({
    openai: createOpenAI({
      baseURL: config?.providersConfig?.openai?.baseURL ?? DEFAULT_PROVIDER_CONFIG.openai.baseURL,
      apiKey: config?.providersConfig?.openai.apiKey,
    }),
    deepseek: createDeepSeek({
      baseURL: config?.providersConfig?.deepseek.baseURL ?? DEFAULT_PROVIDER_CONFIG.deepseek.baseURL,
      apiKey: config?.providersConfig?.deepseek.apiKey,
    }),
    gemini: createGoogleGenerativeAI({
      baseURL: config?.providersConfig?.gemini.baseURL ?? DEFAULT_PROVIDER_CONFIG.gemini.baseURL,
      apiKey: config?.providersConfig?.gemini.apiKey,
    }),
  })
}

export async function getTranslateModel(providerName: string) {
  const config = await storage.getItem<Config>(`local:${CONFIG_STORAGE_KEY}`)
  if (!config) {
    throw new Error('Config not found')
  }
  const LLMProvidersConfig = getLLMProvidersConfig(config.providersConfig)
  const providerConfig = getProviderConfigByName(LLMProvidersConfig, providerName)
  if (!providerConfig) {
    throw new Error(`Provider ${providerName} not found`)
  }
  const registry = createProviderRegistry({
    [providerConfig.provider]: createOpenAI({
      baseURL: providerConfig.baseURL,
      apiKey: providerConfig.apiKey,
    }),
  })
  const modelString = providerConfig.models.translate?.isCustomModel ? providerConfig.models.translate.customModel : providerConfig.models.translate?.model
  return registry.languageModel(`${providerName}:${modelString}`)
}

export async function getReadModel(provider: ReadProviderNames, model: string) {
  const registry = await getProviderRegistry()
  return registry.languageModel(`${provider}:${model}`)
}
