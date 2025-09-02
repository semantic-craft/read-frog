import type { Config } from '@/types/config/config'
import type { LLMProviderConfig, ProviderConfig, ProvidersConfig } from '@/types/config/provider'
import { isLLMTranslateProvider } from '@/types/config/provider'

export function getProviderConfigByName<T extends ProviderConfig>(providersConfig: T[], providerName: string): T | undefined {
  return providersConfig.find(p => p.name === providerName)
}

export function getProviderConfigByKey<T extends ProviderConfig>(providersConfig: T[], providerKey: string): T | undefined {
  return providersConfig.find(p => p.provider === providerKey)
}

export function getLLMProvidersConfig(providersConfig: ProvidersConfig): LLMProviderConfig[] {
  return providersConfig.filter((p): p is LLMProviderConfig =>
    isLLMTranslateProvider(p.provider),
  )
}

export function getDeepLXProvidersConfig(providersConfig: ProvidersConfig) {
  return providersConfig.filter(p => p.provider === 'deeplx')
}

export function getProviderKeyByName(providersConfig: ProvidersConfig, providerName: string): string | undefined {
  const provider = getProviderConfigByName(providersConfig, providerName)
  return provider?.provider
}

export function getReadModelConfig(config: Config, providerName: string) {
  const provider = getProviderConfigByName(config.providersConfig, providerName)
  return provider && 'models' in provider ? provider.models?.read : undefined
}

export function getTranslateModelConfig(config: Config, providerName: string) {
  const provider = getProviderConfigByName(config.providersConfig, providerName)
  return provider && 'models' in provider ? provider.models?.translate : undefined
}

export function getProviderApiKey(providersConfig: ProvidersConfig, providerName: string): string | undefined {
  const provider = getProviderConfigByName(providersConfig, providerName)
  return provider?.apiKey
}

export function getProviderBaseURL(providersConfig: ProvidersConfig, providerName: string): string | undefined {
  const provider = getProviderConfigByName(providersConfig, providerName)
  return provider?.baseURL
}
