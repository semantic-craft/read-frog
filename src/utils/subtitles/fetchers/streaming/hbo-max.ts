import type { StreamingSiteAdapter, StreamingTrack } from "./streaming-fetcher"
import type { SubtitlesFragment } from "@/utils/subtitles/types"
import { parseSubtitleText } from "./cue-parser"
import { parseDashMpdTextTracks } from "./dash-mpd"
import { clearTrackStore, resolveTrackText, resolveTrackTexts, waitForNetworkTracks } from "./track-store"

// HBO Max / Max adapter on the shared streaming framework. The MAIN-world
// interceptor captures HBO's own subtitles as WebVTT requests or as a DASH
// manifest; this adapter just turns those into fragments via the shared parsers.

const VTT_URL = /\.vtt(?:[?#]|$)/i
const MPD_URL = /\.mpd(?:[?#]|$)/i

async function tracksFromDashManifests(captured: StreamingTrack[]): Promise<StreamingTrack[]> {
  const manifests = captured.filter(track => track.kind === "dash-manifest" || MPD_URL.test(track.url ?? ""))
  const parsed = await Promise.all(manifests.map(async (track) => {
    try {
      return track.url ? parseDashMpdTextTracks(await resolveTrackText(track), track.url) : []
    }
    catch {
      return []
    }
  }))
  return parsed.flat()
}

// HBO WebVTT segments are sometimes relative (start near 0) and sometimes already
// absolute; only shift by the DASH segment offset when the cue looks relative.
function parseSegment(text: string, offsetMs: number): SubtitlesFragment[] {
  const fragments = parseSubtitleText(text)
  if (!offsetMs || !fragments.length || fragments[0].start + 5_000 >= offsetMs)
    return fragments
  return parseSubtitleText(text, offsetMs)
}

export const hboMaxSiteAdapter: StreamingSiteAdapter = {
  id: "hbo-max",
  matches: url => /(?:^|\.)(?:max|hbomax)\.com$/i.test(url.hostname),
  discoverTracks: async () => {
    const captured = await waitForNetworkTracks()
    const segmented = captured.filter(track => track.urls?.length && VTT_URL.test(track.url ?? ""))
    if (segmented.length)
      return segmented
    const fromDash = await tracksFromDashManifests(captured)
    if (fromDash.length)
      return fromDash
    return captured.filter(track => VTT_URL.test(track.url ?? ""))
  },
  fetchTrack: async (track: StreamingTrack) => {
    if (track.segmentStartMs?.length) {
      const texts = await resolveTrackTexts(track)
      return texts.flatMap((text, index) => parseSegment(text, track.segmentStartMs?.[index] ?? 0))
    }
    return parseSubtitleText(await resolveTrackText(track))
  },
  cleanup: () => clearTrackStore(),
}
