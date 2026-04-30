import { describe, expect, it } from "vitest"
import {
  calculateAnchorPosition,
  getControlsOffsetPercent,
  getMaxPositionPercent,
  getSubtitlePositionStyle,
} from "../use-vertical-drag"

function createRect({
  top,
  bottom,
  height,
}: {
  top: number
  bottom: number
  height: number
}): DOMRect {
  return {
    x: 0,
    y: top,
    top,
    right: 0,
    bottom,
    left: 0,
    width: 1000,
    height,
    toJSON: () => ({}),
  } as DOMRect
}

describe("useVerticalDrag helpers", () => {
  it("subtracts controls offset from bottom anchored baseline position", () => {
    const position = calculateAnchorPosition({
      videoRect: createRect({ top: 0, bottom: 1000, height: 1000 }),
      containerRect: createRect({ top: 850, bottom: 900, height: 50 }),
      controlsVisible: true,
      controlsHeight: 60,
    })

    expect(position).toEqual({
      anchor: "bottom",
      percent: 4,
    })
  })

  it("reserves controls height when clamping bottom anchored positions", () => {
    expect(getMaxPositionPercent({
      videoHeight: 1000,
      containerHeight: 100,
      controlsVisible: false,
      controlsHeight: 60,
      anchor: "bottom",
    })).toBe(90)

    expect(getMaxPositionPercent({
      videoHeight: 1000,
      containerHeight: 100,
      controlsVisible: true,
      controlsHeight: 60,
      anchor: "bottom",
    })).toBe(84)
  })

  it("only applies controls offset percent to bottom anchored rendering", () => {
    expect(getControlsOffsetPercent(true, 60, 1000, "bottom")).toBe(6)
    expect(getControlsOffsetPercent(true, 60, 1000, "top")).toBe(0)
    expect(getControlsOffsetPercent(false, 60, 1000, "bottom")).toBe(0)
  })

  it("keeps saved baseline position separate from controls shift in render style", () => {
    expect(getSubtitlePositionStyle(
      { anchor: "bottom", percent: 10 },
      true,
      60,
      1000,
    )).toEqual({
      bottom: "16%",
      top: "unset",
    })

    expect(getSubtitlePositionStyle(
      { anchor: "top", percent: 12 },
      true,
      60,
      1000,
    )).toEqual({
      bottom: "unset",
      top: "12%",
    })
  })
})
