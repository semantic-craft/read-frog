export interface FrameInfoForSiteControl {
  frameId: number
  parentFrameId: number
  url?: string
}

const SITE_CONTROL_URL_RE = /^(?:https?|file):/i

function isSiteControlUrl(url: string | undefined): url is string {
  if (!url) {
    return false
  }

  return SITE_CONTROL_URL_RE.test(url)
}

export function resolveSiteControlUrl(
  frameId: number,
  frameUrl: string | undefined,
  frames: FrameInfoForSiteControl[],
): string | undefined {
  if (isSiteControlUrl(frameUrl)) {
    return frameUrl
  }

  const framesById = new Map(frames.map(frame => [frame.frameId, frame]))
  let currentFrame = framesById.get(frameId)

  while (currentFrame) {
    if (isSiteControlUrl(currentFrame.url)) {
      return currentFrame.url
    }

    if (currentFrame.parentFrameId < 0 || currentFrame.parentFrameId === currentFrame.frameId) {
      break
    }

    currentFrame = framesById.get(currentFrame.parentFrameId)
  }

  const topFrame = framesById.get(0)
  if (isSiteControlUrl(topFrame?.url)) {
    return topFrame.url
  }

  return frameUrl
}
