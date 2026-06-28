import "@/utils/zod-config"
import { defineContentScript } from "#imports"
import { getLocalConfig } from "@/utils/config/storage"

declare global {
  interface Window {
    __READ_FROG_SUBTITLES_INJECTED__?: boolean
  }
}

const NETFLIX_WATCH_PATH_PATTERN = /^\/watch\//
const URL_CHANGE_EVENT = "extension:URLChange"
// Streaming SPAs that route through the unified adapter registry (see platforms/streaming.ts).
const STREAMING_HOST_PATTERN = /(?:^|\.)(?:netflix\.com|max\.com|hbomax\.com)$/i
// ponytail: bounded poll for a late-mounting <video> on non-Netflix players; raise if some site mounts slower.
const VIDEO_WAIT_MAX_ATTEMPTS = 20
const VIDEO_WAIT_INTERVAL_MS = 1000

function isNetflixPage(): boolean {
  return /(?:^|\.)netflix\.com$/i.test(window.location.hostname)
}

function isStreamingPage(): boolean {
  return STREAMING_HOST_PATTERN.test(window.location.hostname)
}

// Netflix exposes a reliable /watch/ path; other streaming SPAs vary, so gate on
// the presence of a <video> element instead.
function isPlaybackReady(): boolean {
  if (isNetflixPage())
    return NETFLIX_WATCH_PATH_PATTERN.test(window.location.pathname)
  return !!document.querySelector("video")
}

function watchStreamingUrlChanges(): () => void {
  let previousUrl = window.location.href
  // ponytail: SPA URL polling, replace with a shared history listener if latency matters.
  const intervalId = setInterval(() => {
    const currentUrl = window.location.href
    if (currentUrl === previousUrl)
      return
    const from = previousUrl
    previousUrl = currentUrl
    window.dispatchEvent(new CustomEvent(URL_CHANGE_EVENT, { detail: { from, to: currentUrl, reason: "interval" } }))
  }, 500)
  return () => clearInterval(intervalId)
}

export default defineContentScript({
  matches: [
    "*://*.youtube.com/*",
    "*://*.youtube-nocookie.com/*",
    "*://*.netflix.com/*",
    "*://*.max.com/*",
    "*://*.hbomax.com/*",
  ],
  allFrames: true,
  cssInjectionMode: "manifest",
  async main(ctx) {
    if (window.__READ_FROG_SUBTITLES_INJECTED__)
      return

    const config = await getLocalConfig()
    if (!config?.videoSubtitles?.enabled) {
      window.__READ_FROG_SUBTITLES_INJECTED__ = false
      return
    }

    const cleanupHandlers: Array<() => void> = []
    ctx.onInvalidated(() => {
      cleanupHandlers.forEach(cleanup => cleanup())
      window.__READ_FROG_SUBTITLES_INJECTED__ = false
    })

    const bootstrapRuntime = async () => {
      if (window.__READ_FROG_SUBTITLES_INJECTED__)
        return
      window.__READ_FROG_SUBTITLES_INJECTED__ = true
      const { bootstrapSubtitlesRuntime } = await import("./runtime")
      await bootstrapSubtitlesRuntime()
    }

    if (isStreamingPage()) {
      cleanupHandlers.push(watchStreamingUrlChanges())
      if (!isPlaybackReady()) {
        // Wait for the player. The navigation listener is never removed on a timeout,
        // so a slow title pick still bootstraps; only the optional <video> poll (for
        // non-Netflix sites whose player can mount without a URL change) is bounded.
        let pollId: ReturnType<typeof setInterval> | undefined
        const onReady = () => {
          window.removeEventListener(URL_CHANGE_EVENT, onNavigate)
          if (pollId)
            clearInterval(pollId)
          void bootstrapRuntime()
        }
        function onNavigate() {
          if (isPlaybackReady())
            onReady()
        }
        window.addEventListener(URL_CHANGE_EVENT, onNavigate)
        cleanupHandlers.push(() => window.removeEventListener(URL_CHANGE_EVENT, onNavigate))

        if (!isNetflixPage()) {
          let attempts = 0
          pollId = setInterval(() => {
            if (isPlaybackReady())
              onReady()
            else if (++attempts >= VIDEO_WAIT_MAX_ATTEMPTS && pollId)
              clearInterval(pollId)
          }, VIDEO_WAIT_INTERVAL_MS)
          const poll = pollId
          cleanupHandlers.push(() => clearInterval(poll))
        }

        window.__READ_FROG_SUBTITLES_INJECTED__ = false
        return
      }
    }

    await bootstrapRuntime()
  },
})
