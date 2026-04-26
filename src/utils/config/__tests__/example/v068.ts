import type { VersionTestData } from "./types"
import { testSeries as v067TestSeries } from "./v067"

export const testSeries = Object.fromEntries(
  Object.entries(v067TestSeries).map(([seriesId, seriesData]) => [
    seriesId,
    {
      ...seriesData,
      config: {
        ...seriesData.config,
        floatingButton: {
          ...seriesData.config.floatingButton,
          locked: false,
        },
      },
    },
  ]),
) as VersionTestData["testSeries"]
