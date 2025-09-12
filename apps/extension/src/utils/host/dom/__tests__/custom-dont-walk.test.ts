// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { isCustomDontWalkIntoElement, isDontWalkIntoAndDontTranslateAsChildElement } from '../filter'

function setHost(host: string) {
  // jsdom exposes location as read-only; override via defineProperty
  Object.defineProperty(window, 'location', {
    value: new URL(`https://${host}/some/path`),
    writable: true,
  })
}

describe('isCustomDontWalkIntoElement', () => {
  it('loads rules and identifies elements on configured host', () => {
    setHost('chatgpt.com')

    const proseMirror = document.createElement('div')
    proseMirror.classList.add('ProseMirror')
    document.body.appendChild(proseMirror)

    expect(isCustomDontWalkIntoElement(proseMirror)).toBe(true)
    // integration via filter.ts
    expect(isDontWalkIntoAndDontTranslateAsChildElement(proseMirror as unknown as HTMLElement)).toBe(true)
  })

  it('does not match on non-configured host', () => {
    setHost('example.com')

    const el = document.createElement('div')
    document.body.appendChild(el)

    expect(isCustomDontWalkIntoElement(el)).toBe(false)
    expect(isDontWalkIntoAndDontTranslateAsChildElement(el as unknown as HTMLElement)).toBe(false)
  })

  it('only matches configured element when multiple nodes present on reddit', () => {
    setHost('chatgpt.com')

    const proseMirror = document.createElement('div')
    proseMirror.classList.add('ProseMirror')

    const other = document.createElement('div')

    document.body.appendChild(proseMirror)
    document.body.appendChild(other)

    expect(isCustomDontWalkIntoElement(proseMirror)).toBe(true)
    expect(isCustomDontWalkIntoElement(other)).toBe(false)
    expect(isDontWalkIntoAndDontTranslateAsChildElement(proseMirror as unknown as HTMLElement)).toBe(true)
    expect(isDontWalkIntoAndDontTranslateAsChildElement(other as unknown as HTMLElement)).toBe(false)
  })
})
