import type { VersionTestData } from "./types"
import { testSeries as v069TestSeries } from "./v069"

export const testSeries = Object.fromEntries(
  Object.entries(v069TestSeries).map(([seriesId, seriesData]) => [
    seriesId,
    {
      ...seriesData,
      config: {
        ...seriesData.config,
        videoSubtitles: {
          ...seriesData.config.videoSubtitles,
          sourceCode: "auto",
        },
      },
    },
  ]),
) as VersionTestData["testSeries"]
