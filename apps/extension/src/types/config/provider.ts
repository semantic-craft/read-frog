import { z } from 'zod'
/* ──────────────────────────────
  Single source of truth
  ────────────────────────────── */
export const READ_PROVIDER_MODELS = {
  openai: ['gpt-5-mini', 'gpt-4.1-mini', 'gpt-4o-mini', 'gpt-5', 'gpt-4.1', 'gpt-4o'],
  deepseek: ['deepseek-chat'],
  gemini: ['gemini-2.5-pro', 'gemini-2.5-flash'],
} as const
export const TRANSLATE_PROVIDER_MODELS = {
  openai: ['gpt-5-mini', 'gpt-4.1-mini', 'gpt-4o-mini', 'gpt-5-nano', 'gpt-4.1-nano', 'gpt-5', 'gpt-4.1', 'gpt-4o'],
  deepseek: ['deepseek-chat'],
  gemini: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'],
} as const
export const NON_API_TRANSLATE_PROVIDERS = ['google', 'microsoft'] as const
export const PURE_TRANSLATE_PROVIDERS = ['google', 'microsoft', 'deeplx'] as const

export const THINKING_MODELS = ['gemini-2.5-pro', 'gemini-1.5-pro'] as const

/* ──────────────────────────────
  Derived provider names
  ────────────────────────────── */

// read provider names
export const READ_PROVIDER_NAMES = ['openai', 'deepseek', 'gemini'] as const satisfies Readonly<
  (keyof typeof READ_PROVIDER_MODELS)[]
>
export type ReadProviderNames = typeof READ_PROVIDER_NAMES[number]
export function isReadProvider(provider: ReadProviderNames): provider is ReadProviderNames {
  return READ_PROVIDER_NAMES.includes(provider as ReadProviderNames)
}
// translate provider names
export const TRANSLATE_PROVIDER_NAMES = ['google', 'microsoft', 'deeplx', 'openai', 'deepseek', 'gemini'] as const satisfies Readonly<
  (keyof typeof TRANSLATE_PROVIDER_MODELS | typeof PURE_TRANSLATE_PROVIDERS[number])[]
>
export type TranslateProviderNames = typeof TRANSLATE_PROVIDER_NAMES[number]
export function isTranslateProvider(provider: TranslateProviderNames): provider is TranslateProviderNames {
  return TRANSLATE_PROVIDER_NAMES.includes(provider as TranslateProviderNames)
}
// translate provider names that support LLM
export const LLM_TRANSLATE_PROVIDER_NAMES = ['openai', 'deepseek', 'gemini'] as const satisfies Readonly<
  (keyof typeof TRANSLATE_PROVIDER_MODELS)[]
>
export type LLMTranslateProviderNames = typeof LLM_TRANSLATE_PROVIDER_NAMES[number]
export function isLLMTranslateProvider(provider: TranslateProviderNames): provider is LLMTranslateProviderNames {
  return LLM_TRANSLATE_PROVIDER_NAMES.includes(provider as LLMTranslateProviderNames)
}

// all provider names
export const ALL_PROVIDER_NAMES = ['openai', 'deepseek', 'google', 'microsoft', 'deeplx', 'gemini'] as const satisfies Readonly<
  (typeof READ_PROVIDER_NAMES[number] | typeof TRANSLATE_PROVIDER_NAMES[number])[]
>
export type AllProviderNames = typeof ALL_PROVIDER_NAMES[number]

// need to be set api key for LLM
export const API_PROVIDER_NAMES = ['openai', 'deepseek', 'gemini', 'deeplx'] as const satisfies Readonly<
  (keyof typeof READ_PROVIDER_MODELS | keyof typeof TRANSLATE_PROVIDER_MODELS | 'deeplx')[]
>
export type APIProviderNames = typeof API_PROVIDER_NAMES[number]
export function isAPIProvider(provider: TranslateProviderNames): provider is APIProviderNames {
  return API_PROVIDER_NAMES.includes(provider as APIProviderNames)
}

export function isPureTranslateProvider(provider: TranslateProviderNames): provider is typeof PURE_TRANSLATE_PROVIDERS[number] {
  return PURE_TRANSLATE_PROVIDERS.includes(provider as typeof PURE_TRANSLATE_PROVIDERS[number])
}

/* ──────────────────────────────
  Providers config schema
  ────────────────────────────── */

function getReadModelSchema<T extends Exclude<APIProviderNames, 'deeplx'>>(provider: T) {
  if (isReadProvider(provider)) {
    return z.object({
      model: z.enum(READ_PROVIDER_MODELS[provider]),
      isCustomModel: z.boolean(),
      customModel: z.string().optional(),
    })
  }
  return z.undefined()
}

function getTranslateModelSchema<T extends Exclude<APIProviderNames, 'deeplx'>>(provider: T) {
  if (isTranslateProvider(provider)) {
    return z.object({
      model: z.enum(TRANSLATE_PROVIDER_MODELS[provider]),
      isCustomModel: z.boolean(),
      customModel: z.string().optional(),
    })
  }
  return z.undefined()
}

// Helper function to create provider-specific models schema
function createProviderModelsSchema<T extends Exclude<APIProviderNames, 'deeplx'>>(provider: T) {
  return z.object({
    read: getReadModelSchema(provider),
    translate: getTranslateModelSchema(provider),
  })
}

// Base schema without models
const baseProviderConfigSchema = z.object({
  name: z.string().nonempty(),
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
})

// Discriminated union with dynamic models constraint
const providerConfigItemSchema = z.discriminatedUnion('provider', [
  baseProviderConfigSchema.extend({
    provider: z.literal('openai'),
    models: createProviderModelsSchema<'openai'>('openai'),
  }),
  baseProviderConfigSchema.extend({
    provider: z.literal('deepseek'),
    models: createProviderModelsSchema<'deepseek'>('deepseek'),
  }),
  baseProviderConfigSchema.extend({
    provider: z.literal('gemini'),
    models: createProviderModelsSchema<'gemini'>('gemini'),
  }),
  baseProviderConfigSchema.extend({
    provider: z.literal('deeplx'),
  }),
])

export const providersConfigSchema = z.array(providerConfigItemSchema).superRefine(
  (providers, ctx) => {
    const nameSet = new Set<string>()
    providers.forEach((provider, index) => {
      if (nameSet.has(provider.name)) {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate provider name "${provider.name}"`,
          path: [index, 'name'],
        })
      }
      nameSet.add(provider.name)
    })
  },
)
export type ProvidersConfig = z.infer<typeof providersConfigSchema>
export type ProviderConfig = ProvidersConfig[number]
export type LLMProviderConfig = Extract<ProviderConfig, { provider: LLMTranslateProviderNames }>

/* ──────────────────────────────
  read or translate config helpers
  ────────────────────────────── */

type ModelTuple = readonly [string, ...string[]] // 至少一个元素才能给 z.enum
function providerConfigSchema<T extends ModelTuple>(models: T) {
  return z.object({
    model: z.enum(models),
    isCustomModel: z.boolean(),
    customModel: z.string().optional(),
  })
}

type SchemaShape<M extends Record<string, ModelTuple>> = {
  [K in keyof M]: ReturnType<typeof providerConfigSchema<M[K]>>;
}

function buildModelSchema<M extends Record<string, ModelTuple>>(models: M) {
  return z.object(
    // 用 reduce 而不用 Object.fromEntries ➙ 保留键名/类型
    (Object.keys(models) as (keyof M)[]).reduce((acc, key) => {
      acc[key] = providerConfigSchema(models[key])
      return acc
    }, {} as SchemaShape<M>),
  )
}

/* ──────────────────────────────
  read config
  ────────────────────────────── */

export const readModelsSchema = buildModelSchema(READ_PROVIDER_MODELS)
export type ReadModels = z.infer<typeof readModelsSchema>

/* ──────────────────────────────
  translate config
  ────────────────────────────── */

export const translateLLMModelsSchema = buildModelSchema(TRANSLATE_PROVIDER_MODELS)
export type TranslateLLMModels = z.infer<typeof translateLLMModelsSchema>
