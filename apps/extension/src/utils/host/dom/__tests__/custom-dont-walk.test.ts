// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { isCustomDontWalkIntoElement, isDontWalkIntoElement } from '../filter'

function setHost(host: string) {
  // jsdom exposes location as read-only; override via defineProperty
  Object.defineProperty(window, 'location', {
    value: new URL(`https://${host}/some/path`),
    writable: true,
  })
}

describe('isCustomDontWalkIntoElement', () => {
  it('loads rules and identifies elements on configured host', () => {
    setHost('www.reddit.com')

    // Build DOM matching default selector: 'body > shreddit-app > reddit-header-large'
    const shredditApp = document.createElement('shreddit-app')
    const header = document.createElement('reddit-header-large')
    shredditApp.appendChild(header)
    document.body.appendChild(shredditApp)

    expect(isCustomDontWalkIntoElement(header)).toBe(true)
    // integration via filter.ts
    expect(isDontWalkIntoElement(header as unknown as HTMLElement)).toBe(true)
  })

  it('does not match on non-configured host', () => {
    setHost('example.com')

    const el = document.createElement('div')
    document.body.appendChild(el)

    expect(isCustomDontWalkIntoElement(el)).toBe(false)
    expect(isDontWalkIntoElement(el as unknown as HTMLElement)).toBe(false)
  })

  it('only matches configured element when multiple nodes present on reddit', () => {
    setHost('www.reddit.com')

    const shredditApp = document.createElement('shreddit-app')
    const header = document.createElement('reddit-header-large')
    const other = document.createElement('div')
    shredditApp.appendChild(header)
    shredditApp.appendChild(other)
    document.body.appendChild(shredditApp)

    expect(isCustomDontWalkIntoElement(header)).toBe(true)
    expect(isCustomDontWalkIntoElement(other)).toBe(false)
    expect(isDontWalkIntoElement(header as unknown as HTMLElement)).toBe(true)
    expect(isDontWalkIntoElement(other as unknown as HTMLElement)).toBe(false)
  })
})
