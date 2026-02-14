import { generateText } from 'ai'
import { isLLMTranslateProviderConfig } from '@/types/config/provider'
import { getProviderConfigById } from '@/utils/config/helpers'
import { db } from '@/utils/db/dexie/db'
import { Sha256Hex } from '@/utils/hash'
import { logger } from '@/utils/logger'
import { getSubtitlesSegmentationPrompt } from '@/utils/prompts/subtitles-segmentation'
import { getTranslateModelById } from '@/utils/providers/model'
import { getProviderOptionsWithOverride } from '@/utils/providers/options'
import { cleanLineProtocolResponse } from '@/utils/subtitles/processor/ai-segmentation/protocol'
import { ensureInitializedConfig } from './config'

interface AiSegmentSubtitlesData {
  jsonContent: string
  providerId: string
}

const AI_SEGMENTATION_CACHE_SCHEMA_VERSION = 'seg-line-v1'

/**
 * Run AI segmentation on JSON subtitle content
 */
export async function runAiSegmentSubtitles(data: AiSegmentSubtitlesData): Promise<string> {
  const { jsonContent, providerId } = data

  if (!jsonContent) {
    throw new Error('jsonContent is required for AI segmentation')
  }

  const config = await ensureInitializedConfig()
  if (!config) {
    throw new Error('Config not found')
  }

  const providerConfig = getProviderConfigById(config.providersConfig, providerId)
  if (!providerConfig) {
    throw new Error(`Provider config not found for id: ${providerId}`)
  }

  if (!isLLMTranslateProviderConfig(providerConfig)) {
    throw new Error('AI segmentation requires an LLM translate provider')
  }

  // Check cache
  const jsonContentHash = Sha256Hex(jsonContent)
  const cacheKey = Sha256Hex(
    jsonContentHash,
    JSON.stringify(providerConfig),
    AI_SEGMENTATION_CACHE_SCHEMA_VERSION,
  )
  const cached = await db.aiSegmentationCache.get(cacheKey)
  if (cached) {
    logger.info('[Background] AI subtitle segmentation cache hit')
    return cached.result
  }

  const { models: { translate }, provider, providerOptions: userProviderOptions, temperature } = providerConfig
  const translateModel = translate.isCustomModel ? translate.customModel : translate.model
  const providerOptions = getProviderOptionsWithOverride(translateModel ?? '', provider, userProviderOptions)
  const model = await getTranslateModelById(providerId)

  const { systemPrompt, prompt } = getSubtitlesSegmentationPrompt(jsonContent)

  try {
    const { text: segmentedOutput } = await generateText({
      model,
      system: systemPrompt,
      prompt,
      temperature,
      providerOptions,
      maxRetries: 0,
    })

    const result = cleanLineProtocolResponse(segmentedOutput)

    // Write to cache
    await db.aiSegmentationCache.put({
      key: cacheKey,
      result,
      createdAt: new Date(),
    })

    logger.info('[Background] AI subtitle segmentation completed')
    return result
  }
  catch (error) {
    logger.error('[Background] AI subtitle segmentation failed:', error)
    throw error
  }
}
