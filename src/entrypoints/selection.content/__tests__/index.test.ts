// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { SELECTION_CONTENT_HOST_Z_INDEX } from "../overlay-layers"

const getLocalConfigMock = vi.fn()
vi.mock("@/utils/config/storage", () => ({
  getLocalConfig: getLocalConfigMock,
}))

const getLocalThemeModeMock = vi.fn()
vi.mock("@/utils/theme", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/utils/theme")>()
  return {
    ...actual,
    getLocalThemeMode: getLocalThemeModeMock,
  }
})

const isSiteEnabledMock = vi.fn()
const getEffectiveSiteControlUrlMock = vi.fn()
const clearEffectiveSiteControlUrlMock = vi.fn()
vi.mock("@/utils/site-control", () => ({
  clearEffectiveSiteControlUrl: clearEffectiveSiteControlUrlMock,
  getEffectiveSiteControlUrl: getEffectiveSiteControlUrlMock,
  isSiteEnabled: isSiteEnabledMock,
}))

const ensureIconifyBackgroundFetchMock = vi.fn()
vi.mock("@/utils/iconify/setup-background-fetch", () => ({
  ensureIconifyBackgroundFetch: ensureIconifyBackgroundFetchMock,
}))

vi.mock("../app", () => ({
  default: () => null,
}))

describe("selection.content entrypoint", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    document.body.innerHTML = ""
    window.__READ_FROG_SELECTION_INJECTED__ = false
    getLocalConfigMock.mockResolvedValue({})
    getLocalThemeModeMock.mockResolvedValue("system")
    getEffectiveSiteControlUrlMock.mockReturnValue(window.location.href)
    isSiteEnabledMock.mockReturnValue(true)
  })

  it("mounts the WXT shadow host above page content with a max z-index", async () => {
    const entrypoint = (await import("../index")).default

    await entrypoint.main({
      onInvalidated: vi.fn(),
    } as any)
    await Promise.resolve()
    await Promise.resolve()

    const shadowHost = document.body.querySelector("read-frog-selection")

    expect(shadowHost).toBeTruthy()
    expect(shadowHost).toHaveStyle({ zIndex: String(SELECTION_CONTENT_HOST_Z_INDEX) })
  })
})
