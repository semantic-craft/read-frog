import { describe, expect, it } from "vitest"
import { migrate } from "../../migration-scripts/v069-to-v070"

describe("v069-to-v070 migration", () => {
  it("adds videoSubtitles.sourceCode with a default auto value", () => {
    const migrated = migrate({
      videoSubtitles: {
        enabled: true,
        autoStart: false,
        providerId: "google-translate-default",
      },
    })

    expect(migrated.videoSubtitles.sourceCode).toBe("auto")
  })

  it("preserves an existing videoSubtitles.sourceCode value", () => {
    const migrated = migrate({
      videoSubtitles: {
        enabled: true,
        autoStart: false,
        providerId: "google-translate-default",
        sourceCode: "eng",
      },
    })

    expect(migrated.videoSubtitles.sourceCode).toBe("eng")
  })
})
