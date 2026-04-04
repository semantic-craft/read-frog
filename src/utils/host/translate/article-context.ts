import { Readability } from "@mozilla/readability"
import { removeDummyNodes } from "@/utils/content/utils"
import { logger } from "@/utils/logger"

let cachedArticleData: { url: string, title: string, textContent: string } | null = null

async function fetchPageTextContent(): Promise<string> {
  try {
    const documentClone = document.cloneNode(true) as Document
    await removeDummyNodes(documentClone)
    const article = new Readability(documentClone, { serializer: el => el }).parse()
    if (article?.textContent)
      return article.textContent
  }
  catch (error) {
    logger.warn("Readability parsing failed, falling back to body textContent:", error)
  }
  return document.body?.textContent || ""
}

export async function getOrFetchArticleData(
  enableAIContentAware: boolean,
): Promise<{ title: string, textContent?: string } | null> {
  if (typeof window === "undefined" || typeof document === "undefined")
    return null

  const title = document.title || ""
  if (!enableAIContentAware)
    return { title }

  const currentUrl = window.location.href
  if (cachedArticleData?.url === currentUrl) {
    // Keep article context stable for the lifetime of a page URL. During page translation,
    // document.title can be mutated to the translated title, and re-reading that live value
    // would drift the prompt/context and the AI-aware cache key for the same page.
    return {
      title: cachedArticleData.title,
      textContent: cachedArticleData.textContent,
    }
  }

  const textContent = await fetchPageTextContent()
  cachedArticleData = { url: currentUrl, title, textContent }

  return { title, textContent }
}
