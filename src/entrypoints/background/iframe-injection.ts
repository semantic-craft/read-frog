import { browser } from "#imports"
import { getLocalConfig } from "@/utils/config/storage"
import { logger } from "@/utils/logger"
import { isSiteEnabled, SITE_CONTROL_URL_WINDOW_KEY } from "@/utils/site-control"
import { resolveSiteControlUrl } from "./iframe-injection-utils"

const pendingDocumentKeys = new Set<string>()
const injectedDocumentKeys = new Set<string>()

function getDocumentInjectionKey(details: { tabId: number, frameId: number, documentId?: string }) {
  // Gracefully skip document-level deduplication when Chromium does not expose documentId.
  if (!details.documentId) {
    return null
  }

  return `${details.tabId}:${details.frameId}:${details.documentId}`
}

function clearTabDocumentKeys(tabId: number) {
  for (const key of pendingDocumentKeys) {
    if (key.startsWith(`${tabId}:`)) {
      pendingDocumentKeys.delete(key)
    }
  }

  for (const key of injectedDocumentKeys) {
    if (key.startsWith(`${tabId}:`)) {
      injectedDocumentKeys.delete(key)
    }
  }
}

function getParentFrameIdHint(details: object): number | undefined {
  if ("parentFrameId" in details && typeof details.parentFrameId === "number") {
    return details.parentFrameId
  }

  return undefined
}

function setInjectedSiteControlUrl(propertyName: string, siteControlUrl: string) {
  ;(globalThis as Record<string, unknown>)[propertyName] = siteControlUrl
}

export function setupIframeInjection() {
  browser.tabs.onRemoved.addListener(clearTabDocumentKeys)
  browser.webNavigation.onBeforeNavigate.addListener((details) => {
    if (details.frameId === 0) {
      clearTabDocumentKeys(details.tabId)
    }
  })

  // Listen for iframe loads and inject content scripts programmatically
  // This catches iframes that Chrome's manifest-based all_frames: true misses
  // (e.g., dynamically created iframes, sandboxed iframes like edX)
  browser.webNavigation.onCompleted.addListener(async (details) => {
    // Skip main frame (frameId === 0), only handle iframes
    if (details.frameId === 0)
      return

    const documentKey = getDocumentInjectionKey(details)
    if (documentKey) {
      if (pendingDocumentKeys.has(documentKey) || injectedDocumentKeys.has(documentKey)) {
        return
      }

      pendingDocumentKeys.add(documentKey)
    }

    try {
      let siteControlUrl: string | undefined

      try {
        const config = await getLocalConfig()
        const frames = await browser.webNavigation.getAllFrames({ tabId: details.tabId }) ?? []
        siteControlUrl = resolveSiteControlUrl(
          details.frameId,
          details.url,
          frames,
          getParentFrameIdHint(details),
        )

        if (!siteControlUrl || !isSiteEnabled(siteControlUrl, config)) {
          return
        }
      }
      catch (error) {
        logger.error("[Background][IframeInjection] Failed to resolve iframe injection prerequisites", error)
        return
      }

      try {
        await browser.scripting.executeScript({
          target: { tabId: details.tabId, frameIds: [details.frameId] },
          func: setInjectedSiteControlUrl,
          args: [SITE_CONTROL_URL_WINDOW_KEY, siteControlUrl],
        })

        // Inject host.content script into the iframe
        await browser.scripting.executeScript({
          target: { tabId: details.tabId, frameIds: [details.frameId] },
          files: ["/content-scripts/host.js"],
        })

        // Inject selection.content script into the iframe
        await browser.scripting.executeScript({
          target: { tabId: details.tabId, frameIds: [details.frameId] },
          files: ["/content-scripts/selection.js"],
        })

        if (documentKey) {
          injectedDocumentKeys.add(documentKey)
        }
      }
      catch (error) {
        logger.warn("[Background][IframeInjection] Failed to inject iframe content scripts", error)
      }
    }
    finally {
      if (documentKey) {
        pendingDocumentKeys.delete(documentKey)
      }
    }
  })
}
