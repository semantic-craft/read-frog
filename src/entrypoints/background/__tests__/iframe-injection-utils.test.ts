import { describe, expect, it } from "vitest"
import { resolveSiteControlUrl } from "../iframe-injection-utils"

describe("resolveSiteControlUrl", () => {
  it("keeps regular page URLs unchanged", () => {
    expect(resolveSiteControlUrl(2, "https://example.com/app", [])).toBe(
      "https://example.com/app",
    )
  })

  it("falls back to the parent page URL for about:blank frames", () => {
    const frames = [
      { frameId: 0, parentFrameId: -1, url: "https://example.com/app" },
      { frameId: 7, parentFrameId: 0, url: "about:blank" },
    ]

    expect(resolveSiteControlUrl(7, "about:blank", frames)).toBe("https://example.com/app")
  })

  it("walks up the frame tree until it finds a real site URL", () => {
    const frames = [
      { frameId: 0, parentFrameId: -1, url: "https://example.com/app" },
      { frameId: 2, parentFrameId: 0, url: "about:blank" },
      { frameId: 5, parentFrameId: 2, url: "about:srcdoc" },
    ]

    expect(resolveSiteControlUrl(5, "about:srcdoc", frames)).toBe("https://example.com/app")
  })

  it("falls back to the top frame when the current frame is missing from the snapshot", () => {
    const frames = [
      { frameId: 0, parentFrameId: -1, url: "https://example.com/app" },
    ]

    expect(resolveSiteControlUrl(42, "about:blank", frames)).toBe("https://example.com/app")
  })
})
