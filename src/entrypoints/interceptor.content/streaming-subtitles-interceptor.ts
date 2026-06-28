import {
  STREAMING_ENSURE_NATIVE_SUBTITLES_TYPE,
  STREAMING_SUBTITLE_CAPTURED_TYPE,
  STREAMING_SUBTITLE_TRACKS_TYPE,
} from "@/utils/constants/subtitles"
import { parseDashMpdTextTracks } from "@/utils/subtitles/fetchers/streaming/dash-mpd"

// MAIN-world interceptor: watches a streaming site's own network traffic for its
// official subtitle tracks and forwards them to the content script (track-store).
// Two capture strategies, one per site family:
//   - Netflix: subtitle download URLs live in manifest JSON under `timedtexttracks`.
//   - HBO Max / Max: subtitles are fetched as .vtt files or listed in a DASH .mpd.
// Adding a site = teach `inspect()` how to recognise its subtitle responses.

interface InterceptedTrack {
  id?: string
  url?: string
  urls?: string[]
  segmentStartMs?: number[]
  language?: string
  label?: string
  kind?: string
  pagePath?: string
}

declare global {
  interface Window {
    __READ_FROG_STREAMING_SUBTITLES_INTERCEPTOR__?: boolean
  }
}

const NETFLIX_HOST = /(?:^|\.)netflix\.com$/i
const WEBVTT_HOST = /(?:^|\.)(?:max|hbomax)\.com$/i
const VTT_URL = /\.vtt(?:[?#]|$)/i
const MPD_URL = /\.mpd(?:[?#]|$)/i
const JSON_URL = /manifest|pathevaluator|metadata|timedtext|\.json/i

const nativeParse = JSON.parse.bind(JSON)
const tracksByUrl = new Map<string, InterceptedTrack>()
const replayedUrls = new Set<string>()

function pagePath(): string {
  return window.location.pathname
}
function isNetflix(): boolean {
  return NETFLIX_HOST.test(window.location.hostname)
}
function isWebVttSite(): boolean {
  return WEBVTT_HOST.test(window.location.hostname)
}

function normalizeUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value)
    return null
  try {
    return new URL(value, window.location.href).href
  }
  catch {
    return null
  }
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined
}

// Netflix manifests list subtitle tracks under `timedtexttracks`; each track's
// download URLs live in `ttDownloadables.<profile>.downloadUrls.*`. Media (audio /
// video) URLs sit elsewhere, so reading only ttDownloadables ignores them.
export function collectStreamingSubtitleTracks(json: unknown): InterceptedTrack[] {
  const tracks: InterceptedTrack[] = []
  const seen = new WeakSet<object>()
  const visit = (node: unknown) => {
    if (!node || typeof node !== "object" || seen.has(node))
      return
    seen.add(node)
    const record = node as Record<string, unknown>
    if (Array.isArray(record.timedtexttracks)) {
      for (const track of record.timedtexttracks as Record<string, unknown>[]) {
        for (const url of ttDownloadableUrls(track))
          tracks.push({ url, language: str(track.language), label: str(track.languageDescription), kind: str(track.trackType) })
      }
    }
    Object.values(record).forEach(visit)
  }
  visit(json)
  return [...new Map(tracks.map(track => [track.url, track])).values()]
}

function ttDownloadableUrls(track: Record<string, unknown>): string[] {
  const downloadables = track.ttDownloadables
  if (!downloadables || typeof downloadables !== "object")
    return []
  const urls: string[] = []
  for (const profile of Object.values(downloadables)) {
    const downloadUrls = (profile as Record<string, unknown>)?.downloadUrls
    if (downloadUrls && typeof downloadUrls === "object") {
      for (const url of Object.values(downloadUrls)) {
        const normalized = normalizeUrl(url)
        if (normalized)
          urls.push(normalized)
      }
    }
  }
  return urls
}

function postTracks(tracks: InterceptedTrack[]) {
  const unique = [...new Map(tracks.map(track => [track.id ?? track.url ?? track.urls?.join("\n") ?? "", track])).values()]
  if (unique.length)
    window.postMessage({ type: STREAMING_SUBTITLE_TRACKS_TYPE, tracks: unique }, window.location.origin)
}

function publishTracks(tracks: InterceptedTrack[]) {
  const scoped = tracks.map(track => ({ ...track, pagePath: pagePath() }))
  for (const track of scoped) {
    if (track.url)
      tracksByUrl.set(track.url, track)
    track.urls?.forEach(url => tracksByUrl.set(url, track))
  }
  postTracks(scoped)
}

function publishFromJson(text: string | null) {
  if (!text || !/timedtext|ttDownloadables/i.test(text))
    return
  try {
    publishTracks(collectStreamingSubtitleTracks(nativeParse(text)))
  }
  catch {
    // Ignore unrelated or partial page JSON.
  }
}

function guessLanguage(url: string): string | undefined {
  try {
    const parsed = new URL(url)
    return parsed.searchParams.get("lang") ?? parsed.pathname.match(/[/_-]([a-z]{2}(?:-[a-z]{2,4})?)\.vtt/i)?.[1] ?? undefined
  }
  catch {
    return undefined
  }
}

function captureText(url: string, text: string | null) {
  const track = tracksByUrl.get(url)
  if (!text || !track || track.pagePath !== pagePath())
    return
  window.postMessage({ type: STREAMING_SUBTITLE_CAPTURED_TYPE, url, text, pagePath: track.pagePath }, window.location.origin)
}

// Netflix's manifest may have been fetched before this script injected (extension
// reload / late inject). Replay recent JSON resources so their tracks reappear.
function replayKnownResources() {
  const entries = typeof performance?.getEntriesByType === "function" ? performance.getEntriesByType("resource") : []
  entries
    .map(entry => normalizeUrl(entry.name))
    .filter((url): url is string => !!url && !replayedUrls.has(url) && JSON_URL.test(url))
    .slice(-20)
    .forEach((url) => {
      replayedUrls.add(url)
      void window.fetch(url, { credentials: "include" }).catch(() => {})
    })
}

async function inspect(rawUrl: string | null, text: string | null, contentType: string | null) {
  const url = normalizeUrl(rawUrl)
  if (!url)
    return
  if (isWebVttSite() && MPD_URL.test(url)) {
    publishTracks([{ id: `${url}#manifest`, url, kind: "dash-manifest" }])
    if (text)
      publishTracks(parseDashMpdTextTracks(text, url))
  }
  if (isWebVttSite() && VTT_URL.test(url))
    publishTracks([{ url, language: guessLanguage(url), kind: "subtitles" }])
  captureText(url, text)
  if (/\bjson\b/i.test(contentType ?? "") || JSON_URL.test(url))
    publishFromJson(text)
}

export function injectStreamingSubtitlesInterceptor() {
  if (window.__READ_FROG_STREAMING_SUBTITLES_INTERCEPTOR__ || !(isNetflix() || isWebVttSite()))
    return
  window.__READ_FROG_STREAMING_SUBTITLES_INTERCEPTOR__ = true

  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin || event.data?.type !== STREAMING_ENSURE_NATIVE_SUBTITLES_TYPE)
      return
    const tracks = [...tracksByUrl.values()].filter(track => track.pagePath === pagePath())
    postTracks(tracks)
    if (!tracks.length)
      replayKnownResources()
  })

  // Netflix parses manifests through JSON.parse; HBO fetches .vtt/.mpd over fetch/XHR.
  const originalParse = JSON.parse
  JSON.parse = function (text, reviver) {
    const result = originalParse.call(this, text, reviver)
    if (typeof text === "string")
      publishFromJson(text)
    return result
  }

  const originalFetch = window.fetch
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const response = await originalFetch.call(this, input, init)
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url
    void response.clone().text().then(text => inspect(url, text, response.headers.get("content-type"))).catch(() => {})
    return response
  }

  const originalOpen = XMLHttpRequest.prototype.open
  XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...args: any[]) {
    ;(this as any).__readFrogUrl = url.toString()
    return originalOpen.apply(this, [method, url, ...args] as any)
  }
  const originalSend = XMLHttpRequest.prototype.send
  XMLHttpRequest.prototype.send = function (...args: any[]) {
    this.addEventListener("load", function () {
      const url = this.responseURL || (this as any).__readFrogUrl
      const text = this.responseType === "" || this.responseType === "text" ? this.responseText : null
      void inspect(url, text, this.getResponseHeader("content-type"))
    })
    return originalSend.apply(this, args as any)
  }
}
