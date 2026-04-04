// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest"

const mockParse = vi.fn()
const mockRemoveDummyNodes = vi.fn()
const mockWarn = vi.fn()

vi.mock("@mozilla/readability", () => ({
  Readability: vi.fn().mockImplementation(() => ({
    parse: mockParse,
  })),
}))

vi.mock("@/utils/content/utils", () => ({
  removeDummyNodes: mockRemoveDummyNodes,
}))

vi.mock("@/utils/logger", () => ({
  logger: {
    warn: mockWarn,
  },
}))

async function loadModule() {
  vi.resetModules()
  return await import("../article-context")
}

describe("getOrFetchArticleData", () => {
  beforeEach(() => {
    mockParse.mockReset()
    mockRemoveDummyNodes.mockReset()
    mockWarn.mockReset()

    mockParse.mockReturnValue({ textContent: "Readable article body" })
    mockRemoveDummyNodes.mockResolvedValue(undefined)

    document.title = "Original Title"
    document.body.innerHTML = "<main>Article body</main>"
    window.history.replaceState({}, "", "/article")
  })

  it("keeps the original title stable for AI-aware context on the same URL", async () => {
    const { getOrFetchArticleData } = await loadModule()

    const first = await getOrFetchArticleData(true)

    document.title = "Translated Browser Title"
    const second = await getOrFetchArticleData(true)

    expect(first?.title).toBe("Original Title")
    expect(first?.textContent).toBeTruthy()
    expect(second).toEqual({
      title: "Original Title",
      textContent: first?.textContent,
    })
  })

  it("still returns the live title when AI content aware is disabled", async () => {
    const { getOrFetchArticleData } = await loadModule()

    const first = await getOrFetchArticleData(false)
    document.title = "Updated Live Title"
    const second = await getOrFetchArticleData(false)

    expect(first).toEqual({ title: "Original Title" })
    expect(second).toEqual({ title: "Updated Live Title" })
    expect(mockParse).not.toHaveBeenCalled()
    expect(mockRemoveDummyNodes).not.toHaveBeenCalled()
  })

  it("refreshes the cached title and text content after the URL changes", async () => {
    const { getOrFetchArticleData } = await loadModule()

    const first = await getOrFetchArticleData(true)

    document.title = "Next Article Title"
    document.body.innerHTML = "<main>Next article body</main>"
    mockParse.mockReturnValueOnce({ textContent: "Next readable article body" })
    window.history.replaceState({}, "", "/article-2")

    const second = await getOrFetchArticleData(true)

    expect(first?.title).toBe("Original Title")
    expect(first?.textContent).toBeTruthy()
    expect(second?.title).toBe("Next Article Title")
    expect(second?.textContent).toBeTruthy()
    expect(second?.textContent).not.toBe(first?.textContent)
  })
})
