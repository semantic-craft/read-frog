import type { PlatformConfig } from "@/entrypoints/subtitles.content/platforms"
import { hboMaxSiteAdapter } from "@/utils/subtitles/fetchers/streaming/hbo-max"
import { StreamingSubtitlesFetcher } from "@/utils/subtitles/fetchers/streaming/streaming-fetcher"
import { UniversalVideoAdapter } from "../universal-adapter"
import { createNetflixSubtitlesAdapter, getNetflixConfig } from "./netflix"

const URL_CHANGE_EVENT = "extension:URLChange"

export interface StreamingSite {
  id: string
  matches: (url: URL) => boolean
  create: () => { config: PlatformConfig, adapter: UniversalVideoAdapter }
}

// HBO Max plays inside an SPA like Netflix, so it reuses the same URLChange
// navigation events and floating-button UI. Native-caption selectors are
// best-effort and may need adjustment against the real site.
function streamingConfig(nativeSubtitles: string): PlatformConfig {
  return {
    selectors: {
      video: "video",
      playerContainer: "body",
      nativeSubtitles,
    },
    events: {
      navigateStart: URL_CHANGE_EVENT,
      navigateFinish: URL_CHANGE_EVENT,
    },
    // Only player pages (those with a <video>) carry a video id; browse pages return
    // null so they don't trigger a navigation reset that drops the next title.
    getVideoId: () => document.querySelector("video") ? window.location.pathname : null,
  }
}

const STREAMING_SITES: StreamingSite[] = [
  {
    id: "netflix",
    matches: url => /(?:^|\.)netflix\.com$/i.test(url.hostname),
    create: () => {
      const config = getNetflixConfig()
      return { config, adapter: createNetflixSubtitlesAdapter(config) }
    },
  },
  {
    id: hboMaxSiteAdapter.id,
    matches: hboMaxSiteAdapter.matches,
    create: () => {
      const config = streamingConfig("[data-testid='subtitle-text'], .subtitle, .subtitles, [class*='CaptionWindow-Fuse-Web-Play'], [class*='TextCue-Fuse-Web-Play']")
      return { config, adapter: new UniversalVideoAdapter({ config, subtitlesFetcher: new StreamingSubtitlesFetcher(hboMaxSiteAdapter) }) }
    },
  },
]

export function findStreamingSite(url: URL): StreamingSite | null {
  return STREAMING_SITES.find(site => site.matches(url)) ?? null
}

export function isStreamingHost(url: URL): boolean {
  return findStreamingSite(url) !== null
}
