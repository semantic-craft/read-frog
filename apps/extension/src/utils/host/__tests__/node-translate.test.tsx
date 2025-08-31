// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_CONFIG } from '@/utils/constants/config'
import { BLOCK_CONTENT_CLASS, CONTENT_WRAPPER_CLASS } from '@/utils/constants/dom-labels'
import { removeOrShowNodeTranslation } from '../translate/node-manipulation'

vi.mock('@/utils/host/translate/translate-text', () => ({
  translateText: vi.fn(() => Promise.resolve('translation')),
  validateTranslationConfig: vi.fn(() => true),
}))

vi.mock('@/utils/config/config', () => ({
  globalConfig: DEFAULT_CONFIG,
}))

const TEST_UUID = '12345678-1234-1234-1234-123456789012'

vi.spyOn(crypto, 'randomUUID').mockReturnValue(TEST_UUID)

describe('node translation', () => {
  const originalGetComputedStyle = window.getComputedStyle

  beforeAll(() => {
    window.getComputedStyle = vi.fn((element) => {
      const originalStyle = originalGetComputedStyle(element)
      if (originalStyle.float === '') {
        Object.defineProperty(originalStyle, 'float', {
          value: 'none',
          writable: true,
          enumerable: true,
          configurable: true,
        })
      }
      return originalStyle
    })
  })

  afterAll(() => {
    window.getComputedStyle = originalGetComputedStyle
  })
  describe('show translation', () => {
    it('should show the translation when point is over the original text', async () => {
      render(
        <div data-testid="test-node">
          原文
        </div>,
      )
      const node = screen.getByTestId('test-node')
      const originalElementFromPoint = document.elementFromPoint
      document.elementFromPoint = vi.fn(() => node)
      await act(async () => {
        await removeOrShowNodeTranslation({ x: 150, y: 125 }, 'bilingual')
      })

      expect(node).toMatchInlineSnapshot(`
        <div
          data-read-frog-block-node=""
          data-read-frog-paragraph=""
          data-read-frog-walked="12345678-1234-1234-1234-123456789012"
          data-testid="test-node"
        >
          原文
          <span
            class="notranslate read-frog-translated-content-wrapper"
            data-read-frog-translation-mode="bilingual"
          >
            <br />
            <span
              class="notranslate read-frog-translated-block-content"
              data-read-frog-custom-translation-style="default"
            >
              translation
            </span>
          </span>
        </div>
      `)

      document.elementFromPoint = originalElementFromPoint
    })
  })
  describe('hide translation', () => {
    it('should hide the translation when point is over the translation content node', async () => {
      render(
        <div data-testid="test-node">
          原文
        </div>,
      )
      const node = screen.getByTestId('test-node')

      const originalElementFromPoint = document.elementFromPoint
      document.elementFromPoint = vi.fn(() => node)
      await act(async () => {
        await removeOrShowNodeTranslation({ x: 150, y: 125 }, 'bilingual')
      })

      const translatedContent = node.querySelector(`.${BLOCK_CONTENT_CLASS}`)
      document.elementFromPoint = vi.fn(() => translatedContent as Element)
      await act(async () => {
        await removeOrShowNodeTranslation({ x: 150, y: 125 }, 'bilingual')
      })

      expect(node.querySelector(`.${CONTENT_WRAPPER_CLASS}`)).toBeFalsy()
      expect(node.textContent?.trim()).toBe('原文')

      document.elementFromPoint = originalElementFromPoint
    })
    it('should hide the translation when point is over the translation wrapper', async () => {
      render(
        <div data-testid="test-node">
          原文
        </div>,
      )
      const node = screen.getByTestId('test-node')
      const originalElementFromPoint = document.elementFromPoint
      document.elementFromPoint = vi.fn(() => node)
      await act(async () => {
        await removeOrShowNodeTranslation({ x: 150, y: 125 }, 'bilingual')
      })
      const wrapper = node.querySelector(`.${CONTENT_WRAPPER_CLASS}`)
      document.elementFromPoint = vi.fn(() => wrapper as Element)
      await act(async () => {
        await removeOrShowNodeTranslation({ x: 150, y: 125 }, 'bilingual')
      })

      expect(node.querySelector(`.${CONTENT_WRAPPER_CLASS}`)).toBeFalsy()
      expect(node.textContent?.trim()).toBe('原文')

      document.elementFromPoint = originalElementFromPoint
    })
  })
})
