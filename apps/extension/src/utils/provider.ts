import type { Config } from '@/types/config/config'
import type { ReadProviderNames } from '@/types/config/provider'
import { storage } from '#imports'
import { createDeepSeek } from '@ai-sdk/deepseek'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createProviderRegistry } from 'ai'
import { getLLMProvidersConfig, getProviderConfigByName } from './config/helpers'
import { CONFIG_STORAGE_KEY } from './constants/config'

interface ProviderFactoryMap {
  openai: typeof createOpenAI
  deepseek: typeof createDeepSeek
  gemini: typeof createGoogleGenerativeAI
}

const CREATE_AI_MAPPER: ProviderFactoryMap = {
  openai: createOpenAI,
  deepseek: createDeepSeek,
  gemini: createGoogleGenerativeAI,
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
    [providerConfig.provider]: CREATE_AI_MAPPER[providerConfig.provider]({
      baseURL: providerConfig.baseURL,
      apiKey: providerConfig.apiKey,
    }),
  })
  const modelString = providerConfig.models.translate.isCustomModel ? providerConfig.models.translate.customModel : providerConfig.models.translate.model
  return registry.languageModel(`${providerName}:${modelString}`)
}

export async function getReadModel(provider: ReadProviderNames, model: string) {
  const registry = await getProviderRegistry()
  return registry.languageModel(`${provider}:${model}`)
}
