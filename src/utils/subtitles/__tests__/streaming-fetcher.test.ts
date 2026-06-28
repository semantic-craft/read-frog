// @vitest-environment jsdom
import type { StreamingSiteAdapter, StreamingTrack } from "../fetchers/streaming/streaming-fetcher"
import { afterEach, describe, expect, it, vi } from "vitest"
import * as configStorage from "@/utils/config/storage"
import * as backgroundFetchClient from "@/utils/content-script/background-fetch-client"
import { parseSubtitleText } from "../fetchers/streaming/cue-parser"
import { parseDashMpdTextTracks } from "../fetchers/streaming/dash-mpd"
import { hboMaxSiteAdapter } from "../fetchers/streaming/hbo-max"
import { StreamingSubtitlesFetcher } from "../fetchers/streaming/streaming-fetcher"

const EN_VTT = `WEBVTT

00:00:00.000 --> 00:00:01.000
Hello
`

const ZH_VTT = `WEBVTT

00:00:00.000 --> 00:00:01.000
你好
`

const DASH_MPD = `<?xml version="1.0" encoding="UTF-8"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011">
  <Period>
    <AdaptationSet id="41" lang="en-US" contentType="text">
      <Label>English</Label>
      <Role schemeIdUri="urn:mpeg:dash:role:2011" value="subtitle"/>
      <Representation mimeType="text/vtt" id="t41" bandwidth="35">
        <SegmentTemplate timescale="1000" startNumber="3" media="t/ff8956/t41/$Number$.vtt">
          <SegmentTimeline>
            <S t="0" d="1000" r="1"/>
            <S d="1000"/>
          </SegmentTimeline>
        </SegmentTemplate>
      </Representation>
    </AdaptationSet>
  </Period>
</MPD>`

function setLocation(pathname: string) {
  Object.defineProperty(window, "location", {
    value: { href: `https://stream.example${pathname}`, hostname: "stream.example", origin: "https://stream.example", pathname },
    writable: true,
  })
}

// Fake WebVTT site exercising the same source/target fetch + parse path HBO Max uses.
function webVttSite(tracks: StreamingTrack[]): StreamingSiteAdapter {
  return {
    id: "fake-webvtt",
    matches: () => true,
    discoverTracks: async () => tracks,
    fetchTrack: async (track: StreamingTrack) => parseSubtitleText(track.id === "zh" ? ZH_VTT : EN_VTT),
  }
}

function mockSubtitleFetch(byUrl: (url: string) => string) {
  vi.spyOn(backgroundFetchClient, "backgroundFetch").mockImplementation(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url
    return { ok: true, text: async () => byUrl(url) } as Response
  })
}

afterEach(() => {
  hboMaxSiteAdapter.cleanup?.()
  vi.restoreAllMocks()
})

describe("streamingSubtitlesFetcher", () => {
  it("aligns official source + target tracks into bilingual fragments", async () => {
    setLocation("/watch/1")
    vi.spyOn(configStorage, "getLocalConfig").mockResolvedValue({ language: { targetCode: "cmn-Hant" } } as any)
    const fetcher = new StreamingSubtitlesFetcher(webVttSite([
      { id: "en", language: "en", label: "English" },
      { id: "zh", language: "zh-Hant", label: "中文（繁體）" },
    ]))

    await expect(fetcher.fetch()).resolves.toEqual([
      { text: "Hello", translation: "你好", start: 0, end: 1000 },
    ])
    expect(fetcher.isPreSegmented()).toBe(true)
  })
})

describe("hbo max DASH + WebVTT path", () => {
  it("expands segmented WebVTT tracks from a DASH manifest", () => {
    expect(parseDashMpdTextTracks(DASH_MPD, "https://cdn.example/video/dash.mpd?token=1")).toEqual([
      {
        id: "https://cdn.example/video/dash.mpd?token=1#41:t41",
        url: "https://cdn.example/video/t/ff8956/t41/3.vtt",
        urls: [
          "https://cdn.example/video/t/ff8956/t41/3.vtt",
          "https://cdn.example/video/t/ff8956/t41/4.vtt",
          "https://cdn.example/video/t/ff8956/t41/5.vtt",
        ],
        segmentStartMs: [0, 1000, 2000],
        language: "en-US",
        label: "English",
        kind: "subtitle",
      },
    ])
  })

  it("parses each WebVTT segment and applies its DASH start offset", async () => {
    mockSubtitleFetch(url => url.endsWith("1.vtt") ? EN_VTT : ZH_VTT)
    await expect(hboMaxSiteAdapter.fetchTrack({
      urls: ["https://cdn.example/1.vtt", "https://cdn.example/2.vtt"],
      segmentStartMs: [10_000, 20_000],
    })).resolves.toEqual([
      { text: "Hello", start: 10_000, end: 11_000 },
      { text: "你好", start: 20_000, end: 21_000 },
    ])
  })
})
