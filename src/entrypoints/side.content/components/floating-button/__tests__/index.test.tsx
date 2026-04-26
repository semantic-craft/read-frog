// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react"
import { atom } from "jotai"
import { beforeAll, describe, expect, it, vi } from "vitest"
import FloatingButton from ".."

vi.mock("#imports", () => ({
  browser: {
    runtime: {
      getURL: (path = "") => `chrome-extension://test-extension${path}`,
    },
  },
  i18n: {
    t: (key: string) => key,
  },
}))

vi.mock("@/utils/atoms/config", () => ({
  configFieldsAtomMap: {
    floatingButton: atom({
      enabled: true,
      position: 0.66,
      clickAction: "panel",
      disabledFloatingButtonPatterns: [],
      locked: false,
    }),
    sideContent: atom({ width: 360 }),
  },
}))

vi.mock("../../../atoms", () => ({
  enablePageTranslationAtom: atom({ enabled: false }),
  isDraggingButtonAtom: atom(false),
  isSideOpenAtom: atom(false),
}))

vi.mock("../../../index", () => ({
  shadowWrapper: document.body,
}))

vi.mock("../translate-button", () => ({
  default: ({ className }: { className?: string, expanded?: boolean }) => (
    <div data-testid="translate-button" className={className} />
  ),
}))

vi.mock("../components/hidden-button", () => ({
  default: ({ className, onClick }: { className?: string, onClick: () => void, expanded?: boolean }) => (
    <button type="button" data-testid="hidden-button" className={className} onClick={onClick} />
  ),
}))

vi.mock("@/utils/message", () => ({
  sendMessage: vi.fn(),
}))

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  vi.stubGlobal("ResizeObserver", ResizeObserverMock)
})

describe("floatingButton controls", () => {
  it("shows the close trigger only after entering the main floating button", () => {
    render(<FloatingButton />)

    const closeTrigger = screen.getByRole("button", { name: "Close floating button" })
    const mainButton = screen.getByRole("img").parentElement

    expect(closeTrigger).toHaveClass("-top-1")
    expect(closeTrigger).toHaveClass("left-0")
    expect(closeTrigger).toHaveClass("invisible")
    expect(closeTrigger).toHaveClass("pointer-events-none")
    expect(closeTrigger).toHaveClass("text-neutral-400")
    expect(closeTrigger).toHaveClass("hover:scale-110")
    expect(closeTrigger).toHaveClass("active:scale-90")
    expect(closeTrigger).toHaveClass("hover:text-neutral-600")
    expect(closeTrigger).toHaveClass("active:text-neutral-600")

    fireEvent.mouseEnter(mainButton!)

    expect(closeTrigger).toHaveClass("visible")
    expect(closeTrigger).toHaveClass("pointer-events-auto")
    expect(closeTrigger).toHaveClass("-left-6")
  })

  it("renders a lock trigger at the lower-left corner and keeps controls expanded after entering the main button", () => {
    render(<FloatingButton />)

    const lockTrigger = screen.getByRole("button", { name: "Lock floating button" })
    const mainButton = screen.getByRole("img").parentElement
    const floatingButtonContainer = mainButton?.parentElement?.parentElement

    expect(lockTrigger).toHaveClass("left-0")
    expect(lockTrigger).toHaveClass("-bottom-1")
    expect(lockTrigger).toHaveClass("invisible")
    expect(lockTrigger).toHaveClass("pointer-events-none")
    expect(lockTrigger).toHaveClass("text-neutral-400")
    expect(lockTrigger).toHaveClass("hover:scale-110")
    expect(lockTrigger).toHaveClass("active:scale-90")
    expect(lockTrigger).toHaveClass("hover:text-neutral-600")
    expect(lockTrigger).toHaveClass("active:text-neutral-600")
    expect(mainButton).toHaveClass("translate-x-6")

    fireEvent.mouseEnter(mainButton!)

    expect(lockTrigger).toHaveClass("visible")
    expect(lockTrigger).toHaveClass("pointer-events-auto")
    expect(lockTrigger).toHaveClass("-left-6")
    expect(mainButton).toHaveClass("translate-x-0")

    fireEvent.click(lockTrigger)

    const unlockTrigger = screen.getByRole("button", { name: "Unlock floating button" })

    expect(unlockTrigger).toHaveClass("text-neutral-400")
    expect(unlockTrigger).toHaveClass("-left-6")
    expect(mainButton).toHaveClass("translate-x-0")
    expect(mainButton).toHaveClass("opacity-100")
    expect(mainButton).not.toHaveClass("translate-x-6")

    fireEvent.mouseLeave(floatingButtonContainer!)

    expect(mainButton).toHaveClass("translate-x-0")
    expect(mainButton).toHaveClass("opacity-60")

    fireEvent.mouseEnter(mainButton!)

    expect(mainButton).toHaveClass("opacity-100")
  })

  it("forces the close trigger visible while the dropdown is open", () => {
    render(<FloatingButton />)

    const closeTrigger = screen.getByRole("button", { name: "Close floating button" })
    const mainButton = screen.getByRole("img").parentElement

    fireEvent.mouseEnter(mainButton!)
    fireEvent.click(closeTrigger)

    expect(closeTrigger).toHaveClass("visible")
    expect(closeTrigger).toHaveClass("pointer-events-auto")
    expect(screen.getByText("options.floatingButtonAndToolbar.floatingButton.closeMenu.disableForSite")).toBeInTheDocument()
  })
})
