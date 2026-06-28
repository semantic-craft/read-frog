import type { StreamingTrack } from "./streaming-fetcher"

// Minimal DASH MPD parsing for HBO Max: turn the subtitle AdaptationSets of a
// manifest into segmented WebVTT tracks (one entry per text Representation, with
// every segment URL + its start time). Covers the common SegmentTemplate +
// SegmentTimeline + $Number$ shape; richer DASH features aren't needed here.

const MAX_SEGMENTS = 500

function child(element: Element, name: string): Element | null {
  return [...element.children].find(node => node.localName === name) ?? null
}

function isTextRepresentation(set: Element, rep: Element): boolean {
  const types = `${set.getAttribute("contentType") ?? ""} ${set.getAttribute("mimeType") ?? ""} ${rep.getAttribute("mimeType") ?? ""}`
  return /\btext\b|vtt|ttml/i.test(types)
}

function expandSegments(template: Element, rep: Element, manifestUrl: string): { url: string, startMs: number }[] {
  const media = template.getAttribute("media")
  const timeline = child(template, "SegmentTimeline")
  if (!media || !timeline)
    return []

  const repId = rep.getAttribute("id") ?? ""
  const timescale = Number(template.getAttribute("timescale")) || 1
  let number = Number(template.getAttribute("startNumber")) || 1
  let time = 0
  const segments: { url: string, startMs: number }[] = []

  for (const segment of [...timeline.children].filter(node => node.localName === "S")) {
    const explicitTime = segment.getAttribute("t")
    if (explicitTime !== null)
      time = Number(explicitTime)
    const duration = Number(segment.getAttribute("d")) || 0
    const repeat = Number(segment.getAttribute("r")) || 0
    for (let i = 0; i <= repeat && segments.length < MAX_SEGMENTS; i++) {
      const url = media.replace(/\$RepresentationID\$/g, repId).replace(/\$Number\$/g, String(number))
      segments.push({ url: new URL(url, manifestUrl).href, startMs: (time / timescale) * 1000 })
      number += 1
      time += duration
    }
  }
  return segments
}

export function parseDashMpdTextTracks(manifestText: string, manifestUrl: string): StreamingTrack[] {
  const doc = new DOMParser().parseFromString(manifestText, "application/xml")
  if (doc.querySelector("parsererror"))
    return []

  return [...doc.querySelectorAll("AdaptationSet")].flatMap((set): StreamingTrack[] => {
    const language = set.getAttribute("lang") ?? undefined
    const label = child(set, "Label")?.textContent?.trim() || language
    const kind = child(set, "Role")?.getAttribute("value") ?? "subtitles"

    return [...set.children].filter(node => node.localName === "Representation").flatMap((rep): StreamingTrack[] => {
      const template = child(rep, "SegmentTemplate") ?? child(set, "SegmentTemplate")
      if (!template || !isTextRepresentation(set, rep))
        return []
      const segments = expandSegments(template, rep, manifestUrl)
      if (!segments.length)
        return []
      const urls = segments.map(segment => segment.url)
      return [{
        id: `${manifestUrl}#${set.getAttribute("id") ?? "text"}:${rep.getAttribute("id") ?? urls[0]}`,
        url: urls[0],
        urls,
        segmentStartMs: segments.map(segment => segment.startMs),
        language,
        label,
        kind,
      }]
    })
  })
}
