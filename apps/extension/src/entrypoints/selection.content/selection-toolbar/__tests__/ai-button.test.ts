// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getContext } from '../../utils'

// Helper function: create Range for selected text
function createRangeForText(element: HTMLElement, selectedText: string): Range {
  const range = document.createRange()
  const textContent = element.textContent || ''
  const startIndex = textContent.indexOf(selectedText)

  if (startIndex === -1) {
    throw new Error(`Text "${selectedText}" not found in element`)
  }

  const endIndex = startIndex + selectedText.length
  const textNode = element.firstChild!

  range.setStart(textNode, startIndex)
  range.setEnd(textNode, endIndex)

  return range
}

describe('getContext', () => {
  let testElement: HTMLElement

  beforeEach(() => {
    // Create test DOM element
    testElement = document.createElement('div')
    document.body.appendChild(testElement)
  })

  afterEach(() => {
    // Clean up DOM
    document.body.removeChild(testElement)
  })

  describe('basic functionality tests', () => {
    it('should correctly extract context before and after selected text', () => {
      testElement.innerHTML = 'This is the first sentence. This is selected text. This is the third sentence.'

      const range = createRangeForText(testElement, 'This is selected text')
      const result = getContext(range)

      expect(result.selection).toBe('This is selected text')
      expect(result.before).toBe('')
      expect(result.after).toBe('. This is the third sentence.')
    })

    it('should handle English sentence boundaries', () => {
      testElement.innerHTML = 'This is the first sentence. This is selected text. This is the third sentence.'

      const range = createRangeForText(testElement, 'This is selected text')
      const result = getContext(range)

      expect(result.selection).toBe('This is selected text')
      expect(result.before).toBe('')
      expect(result.after).toBe('. This is the third sentence.')
    })

    it('should handle mixed Chinese and English content', () => {
      testElement.innerHTML = 'Hello world! 你好世界。This is a test? 这是一个测试！'

      const range = createRangeForText(testElement, '你好世界')
      const result = getContext(range)

      expect(result.selection).toBe('你好世界')
      expect(result.before).toBe('')
      expect(result.after).toBe('。This is a test? 这是一个测试！')
    })
  })

  describe('edge case tests', () => {
    it('should handle selected text at the beginning of paragraph', () => {
      testElement.innerHTML = 'Selected text at the beginning. This is the following content.'

      const range = createRangeForText(testElement, 'Selected text at the beginning')
      const result = getContext(range)

      expect(result.selection).toBe('Selected text at the beginning')
      expect(result.before).toBe('')
      expect(result.after).toBe('. This is the following content.')
    })

    it('should handle selected text at the end of paragraph', () => {
      testElement.innerHTML = 'This is the preceding content. Selected text at the end'

      const range = createRangeForText(testElement, 'Selected text at the end')
      const result = getContext(range)

      expect(result.selection).toBe('Selected text at the end')
      expect(result.before).toBe('')
      expect(result.after).toBe('')
    })

    it('should handle selecting the entire paragraph', () => {
      testElement.innerHTML = 'This is the entire paragraph content.'

      const range = createRangeForText(testElement, 'This is the entire paragraph content')
      const result = getContext(range)

      expect(result.selection).toBe('This is the entire paragraph content')
      expect(result.before).toBe('')
      expect(result.after).toBe('.')
    })

    it('should handle text without sentence boundaries', () => {
      testElement.innerHTML = 'This is a text content without punctuation marks'

      const range = createRangeForText(testElement, 'text content without')
      const result = getContext(range)

      expect(result.selection).toBe('text content without')
      expect(result.before).toBe('This is a')
      expect(result.after).toBe('punctuation marks')
    })
  })

  describe('complex scenario tests', () => {
    it('should handle multiple consecutive punctuation marks', () => {
      testElement.innerHTML = 'First sentence...Second sentence!!!Third sentence???Fourth sentence.'

      const range = createRangeForText(testElement, 'Second sentence')
      const result = getContext(range)

      expect(result.selection).toBe('Second sentence')
      expect(result.before).toBe('First sentence...')
      expect(result.after).toBe('!!!Third sentence???Fourth sentence.')
    })

    it('should handle nested elements', () => {
      testElement.innerHTML = 'Outer text<strong>Inner text</strong>More text.'

      const range = createRangeForText(testElement, 'text')
      const result = getContext(range)

      expect(result.selection).toBe('text')
      expect(result.before).toBe('Outer')
      expect(result.after).toBe('Inner textMore text.')
    })

    it('should handle whitespace characters', () => {
      testElement.innerHTML = '  Text with spaces before.  Text with spaces in middle  .Text with spaces after.  '

      const range = createRangeForText(testElement, 'Text with spaces in middle')
      const result = getContext(range)

      expect(result.selection).toBe('Text with spaces in middle')
      expect(result.before).toBe('')
      expect(result.after).toBe('.')
    })
  })

  describe('error handling tests', () => {
    it('should handle empty selected content', () => {
      testElement.innerHTML = 'This is a text.'

      const range = document.createRange()
      const textNode = testElement.firstChild!
      range.setStart(textNode, 0)
      range.setEnd(textNode, 0)

      const result = getContext(range)

      expect(result.selection).toBe('')
      expect(result.before).toBe('')
      expect(result.after).toBe('This is a text.')
    })

    it('should handle case when text node has no parent element', () => {
      // Create a text node without parent element
      const textNode = document.createTextNode('Test text')
      const range = document.createRange()
      range.setStart(textNode, 0)
      range.setEnd(textNode, 2)

      const result = getContext(range)

      // When text node has no parent element, function returns empty result
      expect(result.selection).toBe('')
      expect(result.before).toBe('')
      expect(result.after).toBe('')
    })
  })

  describe('performance tests', () => {
    it('should handle long text', () => {
      // Create a very long text
      const longText = `${'This is the first sentence. '.repeat(1000)}Selected text. ${'This is the last sentence. '.repeat(1000)}`
      testElement.innerHTML = longText

      const range = createRangeForText(testElement, 'Selected text')
      const result = getContext(range)

      expect(result.selection).toBe('Selected text')
      expect(result.before).toBe('')
      expect(result.after).toContain('This is the last sentence.')
    })
  })

  describe('special character tests', () => {
    it('should handle text with special punctuation marks', () => {
      testElement.innerHTML = 'First sentence! Second sentence? Third sentence. Fourth sentence...'

      const range = createRangeForText(testElement, 'Second sentence')
      const result = getContext(range)

      expect(result.selection).toBe('Second sentence')
      expect(result.before).toBe('')
      expect(result.after).toBe('? Third sentence. Fourth sentence...')
    })

    it('should handle text with line breaks', () => {
      testElement.innerHTML = 'First sentence.\nSecond sentence.\nThird sentence.'

      const range = createRangeForText(testElement, 'Second sentence')
      const result = getContext(range)

      expect(result.selection).toBe('Second sentence')
      expect(result.before).toBe('')
      expect(result.after).toBe('.\nThird sentence.')
    })
  })
})
