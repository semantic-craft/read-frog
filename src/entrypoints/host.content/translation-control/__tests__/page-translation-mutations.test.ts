// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest"
import { DEFAULT_CONFIG } from "@/utils/constants/config"
import { PageTranslationManager } from "../page-translation"

const {
  mockDeepQueryTopLevelSelector,
  mockGetDetectedCodeFromStorage,
  mockGetLocalConfig,
  mockHasNoWalkAncestor,
  mockIsDontWalkIntoAndDontTranslateAsChildElement,
  mockIsDontWalkIntoButTranslateAsChildElement,
  mockRemoveAllTranslatedWrapperNodes,
  mockSendMessage,
  mockTranslateTextForPageTitle,
  mockTranslateWalkedElement,
  mockValidateTranslationConfigAndToast,
  mockWalkAndLabelElement,
} = vi.hoisted(() => ({
  mockGetDetectedCodeFromStorage: vi.fn(),
  mockGetLocalConfig: vi.fn(),
  mockDeepQueryTopLevelSelector: vi.fn(),
  mockHasNoWalkAncestor: vi.fn(),
  mockIsDontWalkIntoAndDontTranslateAsChildElement: vi.fn(),
  mockIsDontWalkIntoButTranslateAsChildElement: vi.fn(),
  mockWalkAndLabelElement: vi.fn(),
  mockRemoveAllTranslatedWrapperNodes: vi.fn(),
  mockTranslateWalkedElement: vi.fn(),
  mockTranslateTextForPageTitle: vi.fn(),
  mockValidateTranslationConfigAndToast: vi.fn(),
  mockSendMessage: vi.fn(),
}))

vi.mock("@/utils/config/languages", () => ({
  getDetectedCodeFromStorage: mockGetDetectedCodeFromStorage,
}))

vi.mock("@/utils/config/storage", () => ({
  getLocalConfig: mockGetLocalConfig,
}))

vi.mock("@/utils/crypto-polyfill", () => ({
  getRandomUUID: () => "walk-id",
}))

vi.mock("@/utils/host/dom/filter", () => ({
  hasNoWalkAncestor: mockHasNoWalkAncestor,
  isDontWalkIntoAndDontTranslateAsChildElement: mockIsDontWalkIntoAndDontTranslateAsChildElement,
  isDontWalkIntoButTranslateAsChildElement: mockIsDontWalkIntoButTranslateAsChildElement,
  isHTMLElement: (node: unknown) => node instanceof HTMLElement,
}))

vi.mock("@/utils/host/dom/find", () => ({
  deepQueryTopLevelSelector: mockDeepQueryTopLevelSelector,
}))

vi.mock("@/utils/host/dom/traversal", () => ({
  walkAndLabelElement: mockWalkAndLabelElement,
}))

vi.mock("@/utils/host/translate/node-manipulation", () => ({
  removeAllTranslatedWrapperNodes: mockRemoveAllTranslatedWrapperNodes,
  translateWalkedElement: mockTranslateWalkedElement,
}))

vi.mock("@/utils/host/translate/translate-text", () => ({
  validateTranslationConfigAndToast: mockValidateTranslationConfigAndToast,
}))

vi.mock("@/utils/host/translate/translate-variants", () => ({
  translateTextForPageTitle: mockTranslateTextForPageTitle,
}))

vi.mock("@/utils/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}))

vi.mock("@/utils/message", () => ({
  sendMessage: mockSendMessage,
}))

const intersectionObservers: MockIntersectionObserver[] = []

class MockIntersectionObserver {
  observe = vi.fn((target: Element) => {
    this.targets.add(target)
  })
  unobserve = vi.fn((target: Element) => {
    this.targets.delete(target)
  })
  disconnect = vi.fn(() => {
    this.targets.clear()
  })
  private readonly targets = new Set<Element>()

  constructor(
    private readonly callback: IntersectionObserverCallback,
    _options?: IntersectionObserverInit,
  ) {
    intersectionObservers.push(this)
  }

  async triggerIntersect(target: Element): Promise<void> {
    await this.callback([{
      isIntersecting: true,
      target,
    } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }
}

async function flushDomUpdates(): Promise<void> {
  await Promise.resolve()
  await new Promise(resolve => setTimeout(resolve, 0))
  await Promise.resolve()
}

function deepQueryTopLevelSelectorImpl(
  root: Document | ShadowRoot | HTMLElement,
  selectorFn: (element: HTMLElement) => boolean,
): HTMLElement[] {
  if (root instanceof Document) {
    return root.body ? deepQueryTopLevelSelectorImpl(root.body, selectorFn) : []
  }

  const result: HTMLElement[] = []
  const children = root instanceof ShadowRoot ? [...root.children] : [...root.children]

  if (root instanceof HTMLElement && selectorFn(root)) {
    return [root]
  }

  if (root instanceof HTMLElement && root.shadowRoot) {
    result.push(...deepQueryTopLevelSelectorImpl(root.shadowRoot, selectorFn))
  }

  for (const child of children) {
    if (child instanceof HTMLElement) {
      result.push(...deepQueryTopLevelSelectorImpl(child, selectorFn))
    }
  }

  return result
}

function isBlockedByVisibilityState(element: HTMLElement): boolean {
  return element.hidden || element.getAttribute("aria-hidden") === "true"
}

function walkAndLabelVisibleParagraphs(element: HTMLElement, walkId: string) {
  if (isBlockedByVisibilityState(element)) {
    return {
      forceBlock: false,
      isInlineNode: false,
    }
  }

  element.setAttribute("data-read-frog-walked", walkId)

  for (const child of element.children) {
    if (child instanceof HTMLElement) {
      walkAndLabelVisibleParagraphs(child, walkId)
    }
  }

  if (element.tagName === "P" && element.textContent?.trim()) {
    element.setAttribute("data-read-frog-paragraph", "")
  }

  return {
    forceBlock: false,
    isInlineNode: false,
  }
}

describe("pageTranslationManager mutation rewalk", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    intersectionObservers.length = 0

    document.head.innerHTML = ""
    document.body.innerHTML = ""
    document.title = ""

    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver)

    mockGetDetectedCodeFromStorage.mockResolvedValue("eng")
    mockGetLocalConfig.mockResolvedValue(DEFAULT_CONFIG)
    mockHasNoWalkAncestor.mockReturnValue(false)
    mockIsDontWalkIntoButTranslateAsChildElement.mockReturnValue(false)
    mockIsDontWalkIntoAndDontTranslateAsChildElement.mockImplementation((element: HTMLElement) => {
      return isBlockedByVisibilityState(element)
    })
    mockDeepQueryTopLevelSelector.mockImplementation(deepQueryTopLevelSelectorImpl)
    mockWalkAndLabelElement.mockImplementation((element: HTMLElement, walkId: string) => {
      return walkAndLabelVisibleParagraphs(element, walkId)
    })
    mockTranslateTextForPageTitle.mockResolvedValue("")
    mockValidateTranslationConfigAndToast.mockReturnValue(true)
    mockSendMessage.mockResolvedValue(undefined)
  })

  it("observes and translates accordion content after removing hidden", async () => {
    document.body.innerHTML = `
      <section id="accordion" hidden>
        <p id="panel">Accordion body</p>
      </section>
    `

    const manager = new PageTranslationManager()
    await manager.start()
    await flushDomUpdates()

    const observer = intersectionObservers[0]
    const accordion = document.getElementById("accordion") as HTMLElement
    const panel = document.getElementById("panel") as HTMLElement

    expect(observer.observe).not.toHaveBeenCalled()

    accordion.removeAttribute("hidden")
    await flushDomUpdates()

    expect(observer.observe).toHaveBeenCalledWith(panel)

    await observer.triggerIntersect(panel)
    await flushDomUpdates()

    expect(mockTranslateWalkedElement).toHaveBeenCalledWith(panel, "walk-id", DEFAULT_CONFIG)

    manager.stop()
  })

  it("observes and translates accordion content after aria-hidden becomes false", async () => {
    document.body.innerHTML = `
      <section id="accordion" aria-hidden="true">
        <p id="panel">Accordion body</p>
      </section>
    `

    const manager = new PageTranslationManager()
    await manager.start()
    await flushDomUpdates()

    const observer = intersectionObservers[0]
    const accordion = document.getElementById("accordion") as HTMLElement
    const panel = document.getElementById("panel") as HTMLElement

    expect(observer.observe).not.toHaveBeenCalled()

    accordion.setAttribute("aria-hidden", "false")
    await flushDomUpdates()

    expect(observer.observe).toHaveBeenCalledWith(panel)

    await observer.triggerIntersect(panel)
    await flushDomUpdates()

    expect(mockTranslateWalkedElement).toHaveBeenCalledWith(panel, "walk-id", DEFAULT_CONFIG)

    manager.stop()
  })
})
