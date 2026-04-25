import type { WebPageContext } from "@/types/content"
import { logger } from "@/utils/logger"
import { truncateWebPageContent } from "./webpage-content"

export interface CachedWebPageContext extends WebPageContext {
  url: string
  webContent: string
}

let cachedWebPageContext: CachedWebPageContext | null = null

async function extractWebpageContent(): Promise<string> {
  try {
    const { default: Defuddle, createMarkdownContent } = await import("defuddle/full")
    const result = new Defuddle(document, {
      separateMarkdown: true,
      url: window.location.href,
      useAsync: false,
    }).parse()

    if (result.contentMarkdown)
      return result.contentMarkdown
    if (result.content)
      return createMarkdownContent(result.content, window.location.href)
  }
  catch (error) {
    logger.warn("Defuddle parsing failed, falling back to body text:", error)
  }
  return document.body?.textContent || ""
}

export async function getOrCreateWebPageContext(): Promise<CachedWebPageContext | null> {
  if (typeof window === "undefined" || typeof document === "undefined")
    return null

  const currentUrl = window.location.href
  if (cachedWebPageContext?.url === currentUrl) {
    return cachedWebPageContext
  }

  cachedWebPageContext = {
    url: currentUrl,
    webTitle: document.title || "",
    webContent: truncateWebPageContent(await extractWebpageContent()),
  }
  return cachedWebPageContext
}
