/**
 * Migration script from v079 to v080
 * - Converts DeepSeek model ids removed from the AI SDK provider docs into custom model entries.
 * - Preserves the effective deprecated id or active custom alias in `customModel`.
 * - Switches the selector-backed `model` field to `deepseek-chat` so schema validation still passes.
 *
 * IMPORTANT: All values are hardcoded inline. Migration scripts are frozen
 * snapshots — never import constants or helpers that may change.
 */

const DEPRECATED_PROVIDER_MODEL_FALLBACKS: Record<string, Record<string, string>> = {
  deepseek: {
    "deepseek-v4-flash": "deepseek-chat",
    "deepseek-v4-pro": "deepseek-chat",
  },
}

function getNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null
}

function getMigratedCustomModel(modelConfig: { customModel?: unknown, isCustomModel?: unknown }, previousModel: string): string {
  if (modelConfig.isCustomModel === true) {
    return getNonEmptyString(modelConfig.customModel) ?? previousModel
  }

  return previousModel
}

function migrateProviderConfig(providerConfig: any): any {
  if (!providerConfig || typeof providerConfig !== "object") {
    return providerConfig
  }

  const provider = providerConfig.provider
  const modelConfig = providerConfig.model
  if (typeof provider !== "string" || !modelConfig || typeof modelConfig !== "object") {
    return providerConfig
  }

  const previousModel = modelConfig.model
  if (typeof previousModel !== "string") {
    return providerConfig
  }

  const fallbackModel = DEPRECATED_PROVIDER_MODEL_FALLBACKS[provider]?.[previousModel]
  if (!fallbackModel) {
    return providerConfig
  }

  return {
    ...providerConfig,
    model: {
      ...modelConfig,
      model: fallbackModel,
      isCustomModel: true,
      customModel: getMigratedCustomModel(modelConfig, previousModel),
    },
  }
}

export function migrate(oldConfig: any): any {
  if (!oldConfig || typeof oldConfig !== "object" || !Array.isArray(oldConfig.providersConfig)) {
    return oldConfig
  }

  return {
    ...oldConfig,
    providersConfig: oldConfig.providersConfig.map(migrateProviderConfig),
  }
}
