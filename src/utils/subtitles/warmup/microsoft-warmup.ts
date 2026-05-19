import type { LangCodeISO6393 } from "@read-frog/definitions"
import type { SubtitlesFragment } from "../types"
import { ISO6393_TO_6391 } from "@read-frog/definitions"
import { isNonAPIProvider } from "@/types/config/provider"
import { logger } from "@/utils/logger"
import { sendMessage } from "@/utils/message"

const MS_BATCH_MAX_ELEMENTS = 100
const MS_BATCH_MAX_CHARACTERS = 50_000

export function chunkFragments(fragments: SubtitlesFragment[]): SubtitlesFragment[][] {
  const chunks: SubtitlesFragment[][] = []
  let currentChunk: SubtitlesFragment[] = []
  let currentCharCount = 0

  for (const fragment of fragments) {
    const textLength = fragment.text.length

    if (currentChunk.length > 0
      && (currentChunk.length >= MS_BATCH_MAX_ELEMENTS
        || currentCharCount + textLength > MS_BATCH_MAX_CHARACTERS)) {
      chunks.push(currentChunk)
      currentChunk = []
      currentCharCount = 0
    }

    currentChunk.push(fragment)
    currentCharCount += textLength
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk)
  }

  return chunks
}

function resolveTranslateLangs(sourceCode: LangCodeISO6393 | "auto", targetCode: LangCodeISO6393) {
  const sourceLang = sourceCode === "auto" ? "auto" : (ISO6393_TO_6391[sourceCode] ?? "auto")
  const targetLang = ISO6393_TO_6391[targetCode]
  return { sourceLang, targetLang }
}

export async function microsoftWarmup(
  fragments: SubtitlesFragment[],
  sourceCode: LangCodeISO6393 | "auto",
  targetCode: LangCodeISO6393,
  provider: string,
  onChunkTranslated: (translated: SubtitlesFragment[]) => void,
): Promise<void> {
  if (fragments.length === 0 || isNonAPIProvider(provider)) {
    return
  }

  const { sourceLang, targetLang } = resolveTranslateLangs(sourceCode, targetCode)
  if (!targetLang) {
    return
  }

  const chunks = chunkFragments(fragments)

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    try {
      const translations = await sendMessage("microsoftBatchTranslate", {
        texts: chunk.map(f => f.text),
        fromLang: sourceLang,
        toLang: targetLang,
      })
      const translated = chunk.map((f, j) => ({
        ...f,
        translation: translations[j],
        isWarmup: true,
      }))
      onChunkTranslated(translated)
    }
    catch (error) {
      logger.warn(`Microsoft warmup chunk ${i} failed:`, error)
    }
  }
}
