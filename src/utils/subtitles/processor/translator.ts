import type { LangCodeISO6393 } from "@read-frog/definitions"
import type { SubtitlesFragment } from "../types"
import type { Config } from "@/types/config/config"
import type { ProviderConfig } from "@/types/config/provider"
import type { SubtitlePromptContext } from "@/types/content"
import { i18n } from "#imports"
import { LANG_CODE_TO_EN_NAME } from "@read-frog/definitions"
import { APICallError } from "ai"
import { isLLMProviderConfig } from "@/types/config/provider"
import { getProviderConfigById } from "@/utils/config/helpers"
import { getLocalConfig } from "@/utils/config/storage"
import { DEFAULT_CONFIG } from "@/utils/constants/config"
import { DEFAULT_PROVIDER_CONFIG } from "@/utils/constants/providers"
import { resolveLanguageCodeFromLocale } from "@/utils/content/page-language"
import { cleanText } from "@/utils/content/utils"
import { Sha256Hex } from "@/utils/hash"
import { prepareTranslationText } from "@/utils/host/translate/text-preparation"
import { normalizePromptContextValue } from "@/utils/host/translate/translate-text"
import { sendMessage } from "@/utils/message"
import { getSubtitlesTranslatePrompt } from "@/utils/prompts/subtitles"

function toFriendlyErrorMessage(error: unknown): string {
  if (error instanceof APICallError) {
    switch (error.statusCode) {
      case 429:
        return i18n.t("subtitles.errors.aiRateLimited")
      case 401:
      case 403:
        return i18n.t("subtitles.errors.aiAuthFailed")
      case 500:
      case 502:
      case 503:
        return i18n.t("subtitles.errors.aiServiceUnavailable")
    }
  }

  const message = error instanceof Error ? error.message : String(error)

  if (message.includes("No Response") || message.includes("Empty response")) {
    return i18n.t("subtitles.errors.aiNoResponse")
  }

  return message
}

export interface SubtitlesVideoContext {
  videoTitle: string
  subtitlesTextContent: string
  summary?: string | null
}

interface SubtitleLanguageConfig {
  sourceCode: Config["language"]["sourceCode"]
  targetCode: Config["language"]["targetCode"]
  level: Config["language"]["level"]
}

interface SubtitleBuildResult {
  fragments: SubtitlesFragment[]
  hadRequests: boolean
  allRejected: boolean
}

interface SubtitleTranslationValuesResult {
  values: Map<number, string>
  hadRequests: boolean
  allRejected: boolean
}

export function buildSubtitlesSummaryContextHash(
  videoContext: Pick<SubtitlesVideoContext, "subtitlesTextContent">,
  providerConfig?: ProviderConfig,
): string | undefined {
  const preparedText = cleanText(videoContext.subtitlesTextContent)
  if (!preparedText) {
    return undefined
  }

  const textHash = Sha256Hex(preparedText)
  return Sha256Hex(textHash, providerConfig ? JSON.stringify(providerConfig) : "")
}

function normalizeSubtitlePromptContext(videoContext: SubtitlesVideoContext): SubtitlePromptContext {
  return {
    videoTitle: normalizePromptContextValue(videoContext.videoTitle),
    videoSummary: normalizePromptContextValue(videoContext.summary),
  }
}

async function buildSubtitleHashComponents(
  text: string,
  providerConfig: ProviderConfig,
  partialLangConfig: { sourceCode: SubtitleLanguageConfig["sourceCode"], targetCode: SubtitleLanguageConfig["targetCode"] },
  enableAIContentAware: boolean,
  subtitlePromptContext: SubtitlePromptContext,
  subtitlesTextContent: string,
  actualSourceCode?: LangCodeISO6393 | null,
): Promise<string[]> {
  const preparedText = prepareTranslationText(text)
  const normalizedSubtitlesTextContent = normalizePromptContextValue(subtitlesTextContent)
  const hashComponents = [
    preparedText,
    JSON.stringify(providerConfig),
    partialLangConfig.sourceCode,
    partialLangConfig.targetCode,
  ]

  if (actualSourceCode) {
    hashComponents.push(`actualSourceCode:${actualSourceCode}`)
  }

  if (!isLLMProviderConfig(providerConfig)) {
    return hashComponents
  }

  const targetLangName = LANG_CODE_TO_EN_NAME[partialLangConfig.targetCode]
  const { systemPrompt, prompt } = await getSubtitlesTranslatePrompt(targetLangName, preparedText, {
    isBatch: true,
    context: enableAIContentAware ? subtitlePromptContext : undefined,
  })
  hashComponents.push(systemPrompt, prompt)
  hashComponents.push(enableAIContentAware ? "enableAIContentAware=true" : "enableAIContentAware=false")

  if (enableAIContentAware) {
    if (subtitlePromptContext.videoTitle) {
      hashComponents.push(`videoTitle:${subtitlePromptContext.videoTitle}`)
    }
    if (normalizedSubtitlesTextContent) {
      hashComponents.push(`subtitlesTextContent:${normalizedSubtitlesTextContent.slice(0, 1000)}`)
    }
    if (subtitlePromptContext.videoSummary) {
      hashComponents.push(`videoSummary:${subtitlePromptContext.videoSummary}`)
    }
  }

  return hashComponents
}

async function translateSingleSubtitle(
  text: string,
  langConfig: SubtitleLanguageConfig,
  providerConfig: ProviderConfig,
  actualSourceCode: LangCodeISO6393 | null,
  enableAIContentAware: boolean,
  videoContext: SubtitlesVideoContext,
): Promise<string> {
  const subtitlePromptContext = normalizeSubtitlePromptContext(videoContext)
  const hashComponents = await buildSubtitleHashComponents(
    text,
    providerConfig,
    { sourceCode: langConfig.sourceCode, targetCode: langConfig.targetCode },
    enableAIContentAware,
    subtitlePromptContext,
    videoContext.subtitlesTextContent,
    actualSourceCode,
  )

  if (enableAIContentAware) {
    const summary = subtitlePromptContext.videoSummary
    hashComponents.push(summary ? "subtitleSummary=ready" : "subtitleSummary=missing")
  }

  return await sendMessage("enqueueSubtitlesTranslateRequest", {
    text,
    langConfig,
    providerConfig,
    scheduleAt: Date.now(),
    hash: Sha256Hex(...hashComponents),
    videoTitle: enableAIContentAware ? subtitlePromptContext.videoTitle : undefined,
    summary: enableAIContentAware ? subtitlePromptContext.videoSummary : undefined,
  })
}

function getSubtitleLanguageConfig(config: Config): SubtitleLanguageConfig {
  return {
    sourceCode: config.language.sourceCode,
    targetCode: config.language.targetCode,
    level: config.language.level,
  }
}

function resolveActualSubtitleSourceCode(
  sourceLanguageHint?: string,
): LangCodeISO6393 | null {
  return resolveLanguageCodeFromLocale(sourceLanguageHint)
}

function shouldSkipSubtitleTranslation(
  targetCode: SubtitleLanguageConfig["targetCode"] | undefined,
  actualSourceCode: LangCodeISO6393 | null,
): boolean {
  return !targetCode || targetCode === actualSourceCode
}

function buildRuntimeLanguageConfig(
  targetCode: SubtitleLanguageConfig["targetCode"],
  level: SubtitleLanguageConfig["level"],
  actualSourceCode: LangCodeISO6393 | null,
): SubtitleLanguageConfig {
  return {
    sourceCode: actualSourceCode ?? "auto",
    targetCode,
    level,
  }
}

function getDirectSubtitleProviderConfig(): ProviderConfig {
  return DEFAULT_PROVIDER_CONFIG["microsoft-translate"]
}

async function buildSubtitleTranslationValues(
  fragments: SubtitlesFragment[],
  providerConfig: ProviderConfig,
  langConfig: SubtitleLanguageConfig,
  actualSourceCode: LangCodeISO6393 | null,
  enableAIContentAware: boolean,
  videoContext: SubtitlesVideoContext,
): Promise<SubtitleTranslationValuesResult> {
  if (fragments.length === 0) {
    return {
      values: new Map(),
      hadRequests: false,
      allRejected: false,
    }
  }

  const translationPromises = fragments.map(fragment =>
    translateSingleSubtitle(
      fragment.text,
      langConfig,
      providerConfig,
      actualSourceCode,
      enableAIContentAware,
      videoContext,
    ),
  )

  const results = await Promise.allSettled(translationPromises)
  const values = new Map<number, string>()

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      values.set(fragments[index].start, result.value)
    }
  })

  return {
    values,
    hadRequests: true,
    allRejected: results.length > 0 && results.every((result): result is PromiseRejectedResult => result.status === "rejected"),
  }
}

function applySubtitleTexts(
  fragments: SubtitlesFragment[],
  values: Map<number, string>,
): SubtitlesFragment[] {
  return fragments.map(fragment => ({
    ...fragment,
    text: values.get(fragment.start) ?? fragment.text,
  }))
}

function applySubtitleTranslations(
  fragments: SubtitlesFragment[],
  values: Map<number, string>,
): SubtitlesFragment[] {
  return fragments.map(fragment => ({
    ...fragment,
    translation: values.get(fragment.start) ?? "",
  }))
}

export async function buildDirectSubtitleTranslations(
  fragments: SubtitlesFragment[],
  trackSourceLanguage: string | undefined,
  targetLanguage: SubtitleLanguageConfig["targetCode"] | undefined,
  videoContext: SubtitlesVideoContext,
): Promise<SubtitleTranslationValuesResult> {
  const actualSourceCode = resolveActualSubtitleSourceCode(trackSourceLanguage)
  if (!targetLanguage || shouldSkipSubtitleTranslation(targetLanguage, actualSourceCode)) {
    return {
      values: new Map(),
      hadRequests: false,
      allRejected: false,
    }
  }

  const config = await getLocalConfig()
  const level = config?.language.level ?? DEFAULT_CONFIG.language.level
  const enableAIContentAware = false
  const providerConfig = getDirectSubtitleProviderConfig()
  const runtimeLangConfig = buildRuntimeLanguageConfig(targetLanguage, level, actualSourceCode)

  return await buildSubtitleTranslationValues(
    fragments,
    providerConfig,
    runtimeLangConfig,
    actualSourceCode,
    enableAIContentAware,
    videoContext,
  )
}

export async function buildMainSubtitles(
  fragments: SubtitlesFragment[],
  trackSourceLanguage: string | undefined,
  videoContext: SubtitlesVideoContext,
  mainSubtitleLanguage?: SubtitleLanguageConfig["targetCode"],
): Promise<SubtitleBuildResult> {
  const actualSourceCode = resolveActualSubtitleSourceCode(trackSourceLanguage)
  if (shouldSkipSubtitleTranslation(mainSubtitleLanguage, actualSourceCode)) {
    return {
      fragments,
      hadRequests: false,
      allRejected: false,
    }
  }

  const { values, hadRequests, allRejected } = await buildDirectSubtitleTranslations(
    fragments,
    trackSourceLanguage,
    mainSubtitleLanguage,
    videoContext,
  )

  return {
    hadRequests,
    allRejected,
    fragments: applySubtitleTexts(fragments, values),
  }
}

export async function buildTranslationSubtitles(
  fragments: SubtitlesFragment[],
  trackSourceLanguage: string | undefined,
  videoContext: SubtitlesVideoContext,
): Promise<SubtitleBuildResult> {
  const config = await getLocalConfig()
  if (!config) {
    return {
      fragments: applySubtitleTranslations(fragments, new Map()),
      hadRequests: false,
      allRejected: false,
    }
  }

  const providerConfig = getProviderConfigById(config.providersConfig, config.videoSubtitles.providerId)
  if (!providerConfig) {
    return {
      fragments: applySubtitleTranslations(fragments, new Map()),
      hadRequests: false,
      allRejected: false,
    }
  }

  const subtitleLangConfig = getSubtitleLanguageConfig(config)
  const actualSourceCode = resolveActualSubtitleSourceCode(trackSourceLanguage)
  const runtimeLangConfig = buildRuntimeLanguageConfig(
    subtitleLangConfig.targetCode,
    subtitleLangConfig.level,
    actualSourceCode,
  )
  const enableAIContentAware = !!config.translate.enableAIContentAware
  const { values, hadRequests, allRejected } = await buildSubtitleTranslationValues(
    fragments,
    providerConfig,
    runtimeLangConfig,
    actualSourceCode,
    enableAIContentAware,
    videoContext,
  )

  return {
    hadRequests,
    allRejected,
    fragments: applySubtitleTranslations(fragments, values),
  }
}

export async function fetchSubtitlesSummary(
  videoContext: SubtitlesVideoContext,
): Promise<string | null> {
  const config = await getLocalConfig()
  if (!config?.translate.enableAIContentAware) {
    return null
  }

  const providerConfig = getProviderConfigById(config.providersConfig, config.videoSubtitles.providerId)

  if (!providerConfig || !isLLMProviderConfig(providerConfig)) {
    return null
  }

  if (!videoContext.videoTitle || !videoContext.subtitlesTextContent) {
    return null
  }

  return await sendMessage("getSubtitlesSummary", {
    videoTitle: videoContext.videoTitle,
    subtitlesContext: videoContext.subtitlesTextContent,
    providerConfig,
  })
}

export async function translateSubtitles(
  fragments: SubtitlesFragment[],
  videoContext: SubtitlesVideoContext,
  sourceLanguageHint?: string,
  directSubtitleTargetLanguage?: SubtitleLanguageConfig["targetCode"],
): Promise<SubtitlesFragment[]> {
  const [directResult, translationResult] = await Promise.all([
    buildDirectSubtitleTranslations(fragments, sourceLanguageHint, directSubtitleTargetLanguage, videoContext),
    buildTranslationSubtitles(fragments, sourceLanguageHint, videoContext),
  ])

  if (directResult.hadRequests && translationResult.hadRequests
    && directResult.allRejected && translationResult.allRejected && fragments.length) {
    throw new Error(toFriendlyErrorMessage(new Error("Empty response")))
  }

  const mainFragments = applySubtitleTexts(fragments, directResult.values)
  const translationByStart = new Map(
    translationResult.fragments.map(fragment => [fragment.start, fragment.translation ?? ""]),
  )

  return mainFragments.map(fragment => ({
    ...fragment,
    translation: translationByStart.get(fragment.start) ?? "",
  }))
}
