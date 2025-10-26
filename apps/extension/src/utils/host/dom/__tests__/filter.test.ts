import type { Config } from '@/types/config/config'

// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'

import { DEFAULT_CONFIG } from '@/utils/constants/config'
import {
  BLOCK_CONTENT_CLASS,
  INLINE_CONTENT_CLASS,
} from '@/utils/constants/dom-labels'
import { isDontWalkIntoAndDontTranslateAsChildElement, isTranslatedContentNode } from '../filter'

describe('isTranslatedContentNode', () => {
  it('should return true for block translated content', () => {
    const element = document.createElement('span')
    element.className = BLOCK_CONTENT_CLASS
    expect(isTranslatedContentNode(element)).toBe(true)
  })

  it('should return true for inline translated content', () => {
    const element = document.createElement('span')
    element.className = INLINE_CONTENT_CLASS
    expect(isTranslatedContentNode(element)).toBe(true)
  })

  it('should return false for non-translated content', () => {
    const element = document.createElement('div')
    element.className = 'some-other-class'
    expect(isTranslatedContentNode(element)).toBe(false)
  })

  it('should return false for text nodes', () => {
    const textNode = document.createTextNode('text')
    expect(isTranslatedContentNode(textNode)).toBe(false)
  })

  it('should return true for elements with both classes', () => {
    const element = document.createElement('span')
    element.className = `${BLOCK_CONTENT_CLASS} ${INLINE_CONTENT_CLASS}`
    expect(isTranslatedContentNode(element)).toBe(true)
  })
})

describe('isDontWalkIntoAndDontTranslateAsChildElement', () => {
  it('should ignore HEADER/FOOTER/NAV when range is "main"', () => {
    const config: Config = { ...DEFAULT_CONFIG, translate: { ...DEFAULT_CONFIG.translate, page: { range: 'main', autoTranslatePatterns: [], autoTranslateLanguages: [], shortcut: [] } } }
    const header = document.createElement('header')
    const footer = document.createElement('footer')
    const nav = document.createElement('nav')
    expect(isDontWalkIntoAndDontTranslateAsChildElement(header, config)).toBe(true)
    expect(isDontWalkIntoAndDontTranslateAsChildElement(footer, config)).toBe(true)
    expect(isDontWalkIntoAndDontTranslateAsChildElement(nav, config)).toBe(true)
  })

  it('should NOT ignore HEADER/FOOTER/NAV when range is "all"', () => {
    const config: Config = { ...DEFAULT_CONFIG, translate: { ...DEFAULT_CONFIG.translate, page: { range: 'all', autoTranslatePatterns: [], autoTranslateLanguages: [], shortcut: [] } } }
    const header = document.createElement('header')
    const footer = document.createElement('footer')
    const nav = document.createElement('nav')
    expect(isDontWalkIntoAndDontTranslateAsChildElement(header, config)).toBe(false)
    expect(isDontWalkIntoAndDontTranslateAsChildElement(footer, config)).toBe(false)
    expect(isDontWalkIntoAndDontTranslateAsChildElement(nav, config)).toBe(false)
  })
})
