// @vitest-environment jsdom
import type { TranslationMode } from '@/types/config/translate'
import { act, render, screen } from '@testing-library/react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CONFIG } from '@/utils/constants/config'
import {
  BLOCK_ATTRIBUTE,
  BLOCK_CONTENT_CLASS,
  CONTENT_WRAPPER_CLASS,
  INLINE_ATTRIBUTE,
  INLINE_CONTENT_CLASS,
  NOTRANSLATE_CLASS,
  PARAGRAPH_ATTRIBUTE,
  TRANSLATION_MODE_ATTRIBUTE,
} from '@/utils/constants/dom-labels'
import { walkAndLabelElement } from '@/utils/host/dom/traversal'
import { translateWalkedElement } from '@/utils/host/translate/node-manipulation'
import { translateText } from '@/utils/host/translate/translate-text'

const MOCK_ORIGINAL_TEXT = '原文'
const MOCK_TRANSLATION = 'translation'

vi.mock('@/utils/host/translate/translate-text', () => ({
  translateText: vi.fn(() => Promise.resolve(MOCK_TRANSLATION)),
  validateTranslationConfig: vi.fn(() => true),
}))

vi.mock('@/utils/config/config', () => ({
  globalConfig: DEFAULT_CONFIG,
}))

// Helper functions for assertions
function expectTranslationWrapper(node: Element, mode: TranslationMode) {
  const wrapper = node.querySelector(`.${CONTENT_WRAPPER_CLASS}`)
  expect(wrapper).toBeTruthy()
  expect(wrapper).toHaveAttribute(TRANSLATION_MODE_ATTRIBUTE, mode)
  expect(wrapper).toHaveClass(NOTRANSLATE_CLASS)
  return wrapper
}

function expectTranslatedContent(wrapper: Element | null, contentClass: string, text: string = MOCK_TRANSLATION) {
  const content = wrapper?.querySelector(`.${contentClass}`)
  expect(content).toBeTruthy()
  expect(content).toHaveTextContent(text)
  expect(content).toHaveClass(NOTRANSLATE_CLASS)
  return content
}

function expectNodeLabels(node: Element, attributes: string[]) {
  attributes.forEach((attr) => {
    expect(node).toHaveAttribute(attr)
  })
}

describe('translate', () => {
  // Setup and teardown for getComputedStyle mock
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

  // Helper functions
  async function removeOrShowPageTranslation(translationMode: TranslationMode, toggle: boolean = false) {
    const id = crypto.randomUUID()

    walkAndLabelElement(document.body, id)
    await act(async () => {
      await translateWalkedElement(document.body, id, translationMode, toggle)
    })
  }

  describe('translateText stub', () => {
    it('translateText should be mocked', async () => {
      expect(await translateText('任何文字')).toBe(MOCK_TRANSLATION)
    })
  })

  describe('block node with single child node', () => {
    describe('text node', () => {
      it('bilingual mode: should insert block wrapper into block node', async () => {
        render(
          <div data-testid="test-node">
            {MOCK_ORIGINAL_TEXT}
          </div>,
        )
        const node = screen.getByTestId('test-node')
        await removeOrShowPageTranslation('bilingual', true)

        expectNodeLabels(node, [BLOCK_ATTRIBUTE, PARAGRAPH_ATTRIBUTE])
        const wrapper = expectTranslationWrapper(node, 'bilingual')
        expect(wrapper).toBe(node.childNodes[1])
        expectTranslatedContent(wrapper, BLOCK_CONTENT_CLASS)

        await removeOrShowPageTranslation('bilingual', true)
        expect(node.querySelector(`.${CONTENT_WRAPPER_CLASS}`)).toBeFalsy()
        expect(node.textContent).toBe(MOCK_ORIGINAL_TEXT)
      })
      it('translation only mode: should insert wrapper into block node', async () => {
        render(
          <div data-testid="test-node">
            {MOCK_ORIGINAL_TEXT}
          </div>,
        )
        const node = screen.getByTestId('test-node')
        await removeOrShowPageTranslation('translationOnly', true)

        expectNodeLabels(node, [BLOCK_ATTRIBUTE, PARAGRAPH_ATTRIBUTE])
        const wrapper = expectTranslationWrapper(node, 'translationOnly')
        expect(wrapper).toBe(node.childNodes[0])

        await removeOrShowPageTranslation('translationOnly', true)
        expect(node.querySelector(`.${CONTENT_WRAPPER_CLASS}`)).toBeFalsy()
        expect(node.textContent).toBe(MOCK_ORIGINAL_TEXT)
      })
    })
    describe('inline HTML node', () => {
      it('bilingual mode: should insert wrapper into inline node', async () => {
        render(
          <div data-testid="test-node">
            <div style={{ display: 'inline' }}>
              原文
            </div>
          </div>,
        )
        const node = screen.getByTestId('test-node')
        await removeOrShowPageTranslation('bilingual', true)

        expectNodeLabels(node, [BLOCK_ATTRIBUTE, PARAGRAPH_ATTRIBUTE])
        expectNodeLabels(node.children[0], [INLINE_ATTRIBUTE, PARAGRAPH_ATTRIBUTE])
        const wrapper = expectTranslationWrapper(node, 'bilingual')
        expect(wrapper).toBe(node.childNodes[0].childNodes[1])
        expectTranslatedContent(wrapper, INLINE_CONTENT_CLASS)

        await removeOrShowPageTranslation('bilingual', true)
        expect(node.querySelector(`.${CONTENT_WRAPPER_CLASS}`)).toBeFalsy()
        expect(node.textContent).toBe(MOCK_ORIGINAL_TEXT)
      })
      it('translation only mode: should insert wrapper into inline node', async () => {
        render(
          <div data-testid="test-node">
            <span style={{ display: 'inline' }}>
              原文
            </span>
          </div>,
        )
        const node = screen.getByTestId('test-node')
        await removeOrShowPageTranslation('translationOnly', true)

        expectNodeLabels(node, [BLOCK_ATTRIBUTE, PARAGRAPH_ATTRIBUTE])
        expectNodeLabels(node.children[0], [INLINE_ATTRIBUTE, PARAGRAPH_ATTRIBUTE])
        const wrapper = expectTranslationWrapper(node, 'translationOnly')
        expect(wrapper).toBe(node.childNodes[0].childNodes[0])

        await removeOrShowPageTranslation('translationOnly', true)
        expect(node.querySelector(`.${CONTENT_WRAPPER_CLASS}`)).toBeFalsy()
        expect(node.textContent).toBe(MOCK_ORIGINAL_TEXT)
      })
    })
    describe('block node', () => {
      it('bilingual mode: should insert wrapper into block node', async () => {
        render(
          <div data-testid="test-node">
            <div>原文</div>
          </div>,
        )
        const node = screen.getByTestId('test-node')
        await removeOrShowPageTranslation('bilingual', true)

        expectNodeLabels(node, [BLOCK_ATTRIBUTE])
        expectNodeLabels(node.children[0], [BLOCK_ATTRIBUTE, PARAGRAPH_ATTRIBUTE])
        const wrapper = expectTranslationWrapper(node, 'bilingual')
        expect(wrapper).toBe(node.childNodes[0].childNodes[1])
        expectTranslatedContent(wrapper, BLOCK_CONTENT_CLASS)

        await removeOrShowPageTranslation('bilingual', true)
        expect(node.querySelector(`.${CONTENT_WRAPPER_CLASS}`)).toBeFalsy()
        expect(node.textContent).toBe(MOCK_ORIGINAL_TEXT)
      })
      it('translation only mode: should insert wrapper into block node', async () => {
        render(
          <div data-testid="test-node">
            <div>原文</div>
          </div>,
        )
        const node = screen.getByTestId('test-node')
        await removeOrShowPageTranslation('translationOnly', true)

        expectNodeLabels(node, [BLOCK_ATTRIBUTE])
        expectNodeLabels(node.children[0], [BLOCK_ATTRIBUTE, PARAGRAPH_ATTRIBUTE])
        const wrapper = expectTranslationWrapper(node, 'translationOnly')
        expect(wrapper).toBe(node.childNodes[0].childNodes[0])

        await removeOrShowPageTranslation('translationOnly', true)
        expect(node.querySelector(`.${CONTENT_WRAPPER_CLASS}`)).toBeFalsy()
        expect(node.textContent).toBe(MOCK_ORIGINAL_TEXT)
      })
    })
    describe('block node -> block node -> inline node', () => {
      it('bilingual mode: should insert wrapper into inline node', async () => {
        render(
          <div data-testid="test-node">
            <div><span style={{ display: 'inline' }}>原文</span></div>
          </div>,
        )
        const node = screen.getByTestId('test-node')
        await removeOrShowPageTranslation('bilingual', true)

        expectNodeLabels(node, [BLOCK_ATTRIBUTE])
        expectNodeLabels(node.children[0], [BLOCK_ATTRIBUTE, PARAGRAPH_ATTRIBUTE])
        expectNodeLabels(node.children[0].children[0], [INLINE_ATTRIBUTE, PARAGRAPH_ATTRIBUTE])
        const wrapper = expectTranslationWrapper(node, 'bilingual')
        expect(wrapper).toBe(node.childNodes[0].childNodes[0].childNodes[1])
        expectTranslatedContent(wrapper, INLINE_CONTENT_CLASS)

        await removeOrShowPageTranslation('bilingual', true)
        expect(node.querySelector(`.${CONTENT_WRAPPER_CLASS}`)).toBeFalsy()
        expect(node.textContent).toBe(MOCK_ORIGINAL_TEXT)
      })
      it('translation only mode: should insert wrapper into block node', async () => {
        render(
          <div data-testid="test-node">
            <div><span style={{ display: 'inline' }}>原文</span></div>
          </div>,
        )
        const node = screen.getByTestId('test-node')
        await removeOrShowPageTranslation('translationOnly', true)

        expectNodeLabels(node, [BLOCK_ATTRIBUTE])
        expectNodeLabels(node.children[0], [BLOCK_ATTRIBUTE, PARAGRAPH_ATTRIBUTE])
        expectNodeLabels(node.children[0].children[0], [INLINE_ATTRIBUTE, PARAGRAPH_ATTRIBUTE])
        const wrapper = expectTranslationWrapper(node, 'translationOnly')
        expect(wrapper).toBe(node.childNodes[0].childNodes[0].childNodes[0])

        await removeOrShowPageTranslation('translationOnly', true)
        expect(node.querySelector(`.${CONTENT_WRAPPER_CLASS}`)).toBeFalsy()
        expect(node.textContent).toBe(MOCK_ORIGINAL_TEXT)
      })
    })
    describe('block node -> shallow inline node (block node) -> block node', () => {
      it('bilingual mode: should insert wrapper into deepest block node', async () => {
        render(
          <div data-testid="test-node">
            <div style={{ display: 'inline' }}><div>原文</div></div>
          </div>,
        )
        const node = screen.getByTestId('test-node')
        await removeOrShowPageTranslation('bilingual', true)

        expectNodeLabels(node, [BLOCK_ATTRIBUTE])
        expectNodeLabels(node.children[0], [BLOCK_ATTRIBUTE])
        expectNodeLabels(node.children[0].children[0], [BLOCK_ATTRIBUTE, PARAGRAPH_ATTRIBUTE])
        const wrapper = expectTranslationWrapper(node, 'bilingual')
        expect(wrapper).toBe(node.childNodes[0].childNodes[0].childNodes[1])
        expectTranslatedContent(wrapper, BLOCK_CONTENT_CLASS)

        await removeOrShowPageTranslation('bilingual', true)
        expect(node.querySelector(`.${CONTENT_WRAPPER_CLASS}`)).toBeFalsy()
        expect(node.textContent).toBe(MOCK_ORIGINAL_TEXT)
      })
      it('translation only mode: should insert wrapper into deepest block node', async () => {
        render(
          <div data-testid="test-node">
            <div style={{ display: 'inline' }}><div>原文</div></div>
          </div>,
        )
        const node = screen.getByTestId('test-node')
        await removeOrShowPageTranslation('translationOnly', true)

        expectNodeLabels(node, [BLOCK_ATTRIBUTE])
        expectNodeLabels(node.children[0], [BLOCK_ATTRIBUTE])
        expectNodeLabels(node.children[0].children[0], [BLOCK_ATTRIBUTE, PARAGRAPH_ATTRIBUTE])
        const wrapper = expectTranslationWrapper(node, 'translationOnly')
        expect(wrapper).toBe(node.childNodes[0].childNodes[0].childNodes[0])

        await removeOrShowPageTranslation('translationOnly', true)
        expect(node.querySelector(`.${CONTENT_WRAPPER_CLASS}`)).toBeFalsy()
        expect(node.textContent).toBe(MOCK_ORIGINAL_TEXT)
      })
    })
    describe('block node -> shallow inline node -> inline node', () => {
      it('bilingual mode: should insert wrapper into inline node', async () => {
        render(
          <div data-testid="test-node">
            <div style={{ display: 'inline' }}><span style={{ display: 'inline' }}>原文</span></div>
          </div>,
        )
        const node = screen.getByTestId('test-node')
        await removeOrShowPageTranslation('bilingual', true)

        expectNodeLabels(node, [BLOCK_ATTRIBUTE])
        expectNodeLabels(node.children[0], [INLINE_ATTRIBUTE, PARAGRAPH_ATTRIBUTE])
        expectNodeLabels(node.children[0].children[0], [INLINE_ATTRIBUTE, PARAGRAPH_ATTRIBUTE])
        const wrapper = expectTranslationWrapper(node, 'bilingual')
        expect(wrapper).toBe(node.childNodes[0].childNodes[0].childNodes[1])
        expectTranslatedContent(wrapper, INLINE_CONTENT_CLASS)

        await removeOrShowPageTranslation('bilingual', true)
        expect(node.querySelector(`.${CONTENT_WRAPPER_CLASS}`)).toBeFalsy()
        expect(node.textContent).toBe(MOCK_ORIGINAL_TEXT)
      })
      it('translation only mode: should insert wrapper into inline node', async () => {
        render(
          <div data-testid="test-node">
            <div style={{ display: 'inline' }}><span style={{ display: 'inline' }}>原文</span></div>
          </div>,
        )
        const node = screen.getByTestId('test-node')
        await removeOrShowPageTranslation('translationOnly', true)

        expectNodeLabels(node, [BLOCK_ATTRIBUTE])
        expectNodeLabels(node.children[0], [INLINE_ATTRIBUTE, PARAGRAPH_ATTRIBUTE])
        expectNodeLabels(node.children[0].children[0], [INLINE_ATTRIBUTE, PARAGRAPH_ATTRIBUTE])
        const wrapper = expectTranslationWrapper(node, 'translationOnly')
        expect(wrapper).toBe(node.childNodes[0].childNodes[0].childNodes[0])

        await removeOrShowPageTranslation('translationOnly', true)
        expect(node.querySelector(`.${CONTENT_WRAPPER_CLASS}`)).toBeFalsy()
        expect(node.textContent).toBe(MOCK_ORIGINAL_TEXT)
      })
    })
    describe('block node -> shallow inline node (inline node) -> inline node + inline node', () => {
      it('bilingual mode: should insert wrapper into inline node', async () => {
        render(
          <div data-testid="test-node">
            <div style={{ display: 'inline' }}>
              <span style={{ display: 'inline' }}>原文</span>
              原文
            </div>
          </div>,
        )
        const node = screen.getByTestId('test-node')
        await removeOrShowPageTranslation('bilingual', true)

        expectNodeLabels(node, [BLOCK_ATTRIBUTE])
        expectNodeLabels(node.children[0], [INLINE_ATTRIBUTE, PARAGRAPH_ATTRIBUTE])
        expectNodeLabels(node.children[0].children[0], [INLINE_ATTRIBUTE, PARAGRAPH_ATTRIBUTE])
        const wrapper = expectTranslationWrapper(node, 'bilingual')
        expect(wrapper).toBe(node.childNodes[0].childNodes[2])
        expectTranslatedContent(wrapper, INLINE_CONTENT_CLASS)

        await removeOrShowPageTranslation('bilingual', true)
        expect(node.querySelector(`.${CONTENT_WRAPPER_CLASS}`)).toBeFalsy()
        expect(node.textContent).toBe(`${MOCK_ORIGINAL_TEXT}${MOCK_ORIGINAL_TEXT}`)
      })
      it('translation only mode: should insert wrapper into inline node', async () => {
        render(
          <div data-testid="test-node">
            <div style={{ display: 'inline' }}>
              <span style={{ display: 'inline' }}>原文</span>
              原文
            </div>
          </div>,
        )
        const node = screen.getByTestId('test-node')
        await removeOrShowPageTranslation('translationOnly', true)

        expectNodeLabels(node, [BLOCK_ATTRIBUTE])
        expectNodeLabels(node.children[0], [INLINE_ATTRIBUTE, PARAGRAPH_ATTRIBUTE])
        const wrapper = expectTranslationWrapper(node, 'translationOnly')
        expect(wrapper).toBe(node.childNodes[0].childNodes[0])

        await removeOrShowPageTranslation('translationOnly', true)

        expect(node.querySelector(`.${CONTENT_WRAPPER_CLASS}`)).toBeFalsy()
        expect(node.textContent).toBe(`${MOCK_ORIGINAL_TEXT}${MOCK_ORIGINAL_TEXT}`)
      })
    })
    describe('block node -> shallow inline node (block node) -> single inline node + block node', () => {
      it('bilingual mode: should insert wrapper into inline node', async () => {
        render(
          <div data-testid="test-node">
            <div style={{ display: 'inline' }}>
              <span style={{ display: 'inline' }}>原文</span>
              <div>原文</div>
            </div>
          </div>,
        )
        const node = screen.getByTestId('test-node')
        await removeOrShowPageTranslation('bilingual', true)

        expectNodeLabels(node, [BLOCK_ATTRIBUTE])
        expectNodeLabels(node.children[0], [BLOCK_ATTRIBUTE, PARAGRAPH_ATTRIBUTE])
        expectNodeLabels(node.children[0].children[0], [INLINE_ATTRIBUTE, PARAGRAPH_ATTRIBUTE])
        const wrapper1 = expectTranslationWrapper(node.children[0].children[0], 'bilingual')
        expect(wrapper1).toBe(node.childNodes[0].childNodes[0].childNodes[1])
        expectTranslatedContent(wrapper1, INLINE_CONTENT_CLASS)
        expectNodeLabels(node.children[0].children[1], [BLOCK_ATTRIBUTE, PARAGRAPH_ATTRIBUTE])
        const wrapper2 = expectTranslationWrapper(node.children[0].children[1], 'bilingual')
        expect(wrapper2).toBe(node.childNodes[0].childNodes[1].childNodes[1])
        expectTranslatedContent(wrapper2, BLOCK_CONTENT_CLASS)

        await removeOrShowPageTranslation('bilingual', true)
        expect(node.querySelector(`.${CONTENT_WRAPPER_CLASS}`)).toBeFalsy()
        expect(node.textContent).toBe(`${MOCK_ORIGINAL_TEXT}${MOCK_ORIGINAL_TEXT}`)
      })
      it('translation only mode: should insert wrapper into inline node', async () => {
        render(
          <div data-testid="test-node">
            <div style={{ display: 'inline' }}>
              <span style={{ display: 'inline' }}>原文</span>
              <div>原文</div>
            </div>
          </div>,
        )
        const node = screen.getByTestId('test-node')
        await removeOrShowPageTranslation('translationOnly', true)

        expectNodeLabels(node, [BLOCK_ATTRIBUTE])
        expectNodeLabels(node.children[0], [BLOCK_ATTRIBUTE, PARAGRAPH_ATTRIBUTE])
        expectNodeLabels(node.children[0].children[0], [INLINE_ATTRIBUTE, PARAGRAPH_ATTRIBUTE])
        const wrapper1 = expectTranslationWrapper(node.children[0].children[0], 'translationOnly')
        expect(wrapper1).toBe(node.childNodes[0].childNodes[0].childNodes[0])
        const wrapper2 = expectTranslationWrapper(node.children[0].children[1], 'translationOnly')
        expect(wrapper2).toBe(node.childNodes[0].childNodes[1].childNodes[0])

        await removeOrShowPageTranslation('translationOnly', true)
        expect(node.querySelector(`.${CONTENT_WRAPPER_CLASS}`)).toBeFalsy()
      })
    })
    describe('block node -> shallow inline node (block node) -> inline nodes + block node', () => {
      it('bilingual mode: should insert wrapper into the end of the inline nodes', async () => {
        render(
          <div data-testid="test-node">
            <div style={{ display: 'inline' }}>
              <span style={{ display: 'inline' }}>原文</span>
              <span style={{ display: 'inline' }}>原文</span>
              <div>原文</div>
            </div>
          </div>,
        )
        const node = screen.getByTestId('test-node')
        await removeOrShowPageTranslation('bilingual', true)

        expectNodeLabels(node, [BLOCK_ATTRIBUTE])
        expectNodeLabels(node.children[0], [BLOCK_ATTRIBUTE, PARAGRAPH_ATTRIBUTE])
        expectNodeLabels(node.children[0].children[0], [INLINE_ATTRIBUTE, PARAGRAPH_ATTRIBUTE])
        expectNodeLabels(node.children[0].children[1], [INLINE_ATTRIBUTE, PARAGRAPH_ATTRIBUTE])
        const wrapper1 = expectTranslationWrapper(node.children[0], 'bilingual')
        expect(wrapper1).toBe(node.childNodes[0].childNodes[2])
        const wrapper2 = expectTranslationWrapper(node.children[0].children[3], 'bilingual')
        expect(wrapper2).toBe(node.childNodes[0].childNodes[3].childNodes[1])

        await removeOrShowPageTranslation('bilingual', true)
        expect(node.querySelector(`.${CONTENT_WRAPPER_CLASS}`)).toBeFalsy()
      })
      it('translation only mode: should insert wrapper into the end of the inline nodes', async () => {
        render(
          <div data-testid="test-node">
            <div style={{ display: 'inline' }}>
              <span style={{ display: 'inline' }}>原文</span>
              <span style={{ display: 'inline' }}>原文</span>
              <div>原文</div>
            </div>
          </div>,
        )
        const node = screen.getByTestId('test-node')
        await removeOrShowPageTranslation('translationOnly', true)

        expectNodeLabels(node, [BLOCK_ATTRIBUTE])
        expectNodeLabels(node.children[0], [BLOCK_ATTRIBUTE, PARAGRAPH_ATTRIBUTE])
        const wrapper1 = expectTranslationWrapper(node.children[0], 'translationOnly')
        expect(wrapper1).toBe(node.childNodes[0].childNodes[0])
        const wrapper2 = expectTranslationWrapper(node.children[0].children[1], 'translationOnly')
        expect(wrapper2).toBe(node.childNodes[0].childNodes[1].childNodes[0])

        await removeOrShowPageTranslation('translationOnly', true)
        expect(node.querySelector(`.${CONTENT_WRAPPER_CLASS}`)).toBeFalsy()
      })
    })
  })

  describe('block node with multiple child nodes', () => {
    describe('all inline HTML nodes', () => {
    })
    describe('text node and inline HTML nodes', () => {
    })
    describe('inline nodes + block node + inline nodes', () => {
    })
    describe('floating inline HTML nodes', () => {
    })
  })
})

// it('should insert wrapper after text node', async () => {
//   render(
//     <div data-testid="test-node">
//       原文
//       <div>123</div>
//     </div>,
//   )
//   const node = screen.getByTestId('test-node')
//   const textNode = node.firstChild as Text
//   await act(async () => {
//     await translateNodesBilingualMode([textNode], false)
//   })
//   expect(node.childNodes[1]).toHaveClass(CONTENT_WRAPPER_CLASS)
//   expect(node.childNodes[1].childNodes[1]).toHaveClass(INLINE_CONTENT_CLASS)
// })

// describe('toggle translateWalkedElement', () => {
//   it('should show then hide the block node translation', async () => {
//     render(
//       <div
//         data-testid="test-node"
//       >
//         原文
//       </div>,
//     )
//     const node = screen.getByTestId('test-node')
//     await hideOrShowPageTranslation(true)

//     console.log(printNodeStructure(node))

//     expect(node.childNodes[1]).toHaveClass(CONTENT_WRAPPER_CLASS)
//     expect(node.childNodes[1].childNodes[1]).toHaveClass(BLOCK_CONTENT_CLASS)

//     await hideOrShowPageTranslation(true)

//     console.log(printNodeStructure(node))

//     expect(node.childNodes.length).toBe(1)
//   })
//   it('should show then hide the inline html node translation', async () => {
//     render(
//       <div
//         data-testid="test-node"
//         style={{ display: 'inline' }}
//       >
//         123
//       </div>,
//     )
//     const node = screen.getByTestId('test-node')
//     await hideOrShowPageTranslation(true)

//     expect(node.childNodes[1]).toHaveClass(CONTENT_WRAPPER_CLASS)
//     expect(node.childNodes[1].childNodes[1]).toHaveClass(INLINE_CONTENT_CLASS)

//     await hideOrShowPageTranslation(true)

//     expect(node.childNodes.length).toBe(1)
//   })
//   it('should show then hide the inline text node translation', async () => {
//     render(
//       <div
//         data-testid="test-node"
//       >
//         1
//         <div style={{ display: 'block' }}>2</div>
//       </div>,
//     )
//     const node = screen.getByTestId('test-node')
//     await hideOrShowPageTranslation(true)
//     expect(node.childNodes[1]).toHaveClass(CONTENT_WRAPPER_CLASS)
//     expect(node.childNodes[1].childNodes[1]).toHaveClass(INLINE_CONTENT_CLASS)

//     await hideOrShowPageTranslation(true)
//     expect(node.childNodes.length).toBe(2)
//   })
//   it('should show then hide the consecutive inline text node translation', async () => {
//     render(
//       <div
//         data-testid="test-node"
//       >
//         1
//         <span style={{ display: 'inline' }}>2</span>
//         <div style={{ display: 'block' }}>3</div>
//       </div>,
//     )

//     const node = screen.getByTestId('test-node')
//     await hideOrShowPageTranslation(true)

//     expect(node.childNodes[2]).toHaveClass(CONTENT_WRAPPER_CLASS)
//     expect(node.childNodes[2].childNodes[1]).toHaveClass(INLINE_CONTENT_CLASS)

//     await hideOrShowPageTranslation(true)
//     expect(node.childNodes.length).toBe(3)
//   })
// })

// describe('translatePage', () => {
//   it('should translate simple div node', async () => {
//     render(<div data-testid="test-node">原文</div>)
//     screen.getByTestId('test-node')

//     await hideOrShowPageTranslation()
//     const node = screen.getByTestId('test-node')
//     expect(node.childNodes[1]).toHaveClass(CONTENT_WRAPPER_CLASS)
//     expect(node.childNodes[1].childNodes[1]).toHaveClass(BLOCK_CONTENT_CLASS)
//   })

//   it('should handle inline elements separated by br tags correctly', async () => {
//     render(
//       <div data-testid="test-node">
//         <span style={{ display: 'inline' }}>First inline text</span>
//         <span style={{ display: 'inline' }}>Second inline text</span>
//         <br />
//         <span style={{ display: 'inline' }}>Third inline text</span>
//         <span style={{ display: 'inline' }}>Fourth inline text</span>
//         <br />
//         <span style={{ display: 'inline' }}>Fifth inline text</span>
//       </div>,
//     )

//     const node = screen.getByTestId('test-node')
//     await hideOrShowPageTranslation()

//     // Should have multiple translation wrappers due to br tags breaking inline sequences
//     const wrappers = node.querySelectorAll(`.${CONTENT_WRAPPER_CLASS}`)
//     expect(wrappers.length).toBeGreaterThan(1)

//     // Each wrapper should contain inline content
//     wrappers.forEach((wrapper) => {
//       expect(wrapper.childNodes[1]).toHaveClass(INLINE_CONTENT_CLASS)
//     })
//   })

//   it('should not treat outer div as paragraph when it contains empty inline nodes and block nodes', async () => {
//     render(
//       <div data-testid="test-node">
//         <span style={{ display: 'inline' }}></span>
//         <span style={{ display: 'inline' }}>   </span>
//         <div data-testid="inner-block">Block content</div>
//         <div data-testid="another-block">Another block</div>
//       </div>,
//     )

//     const node = screen.getByTestId('test-node')
//     await hideOrShowPageTranslation()

//     // The outer div should not have translation wrapper directly attached to it
//     const hasTranslationWrapper = Array.from(node.childNodes).some(child =>
//       child instanceof HTMLElement && child.classList.contains(CONTENT_WRAPPER_CLASS),
//     )
//     expect(hasTranslationWrapper).toBe(false)

//     // Only the inner block divs should have translation
//     const innerBlock = screen.getByTestId('inner-block')
//     const anotherBlock = screen.getByTestId('another-block')

//     expect(innerBlock.childNodes[1]).toHaveClass(CONTENT_WRAPPER_CLASS)
//     expect(innerBlock.childNodes[1].childNodes[1]).toHaveClass(BLOCK_CONTENT_CLASS)

//     expect(anotherBlock.childNodes[1]).toHaveClass(CONTENT_WRAPPER_CLASS)
//     expect(anotherBlock.childNodes[1].childNodes[1]).toHaveClass(BLOCK_CONTENT_CLASS)
//   })

//   it('should translate floating element as inline node', async () => {
//     render(
//       <div data-testid="test-node">
//         <span style={{ float: 'left' }}>Floating text</span>
//         <span style={{ display: 'inline' }}>Normal text</span>
//       </div>,
//     )

//     const node = screen.getByTestId('test-node')
//     await hideOrShowPageTranslation()

//     console.log(printNodeStructure(node))

//     // The floating span should be treated as inline, and translation wrapper should be at the end of parent
//     expect(node.lastChild).toHaveClass(CONTENT_WRAPPER_CLASS)
//     expect(node.lastChild?.childNodes[1]).toHaveClass(BLOCK_CONTENT_CLASS)
//   })

//   it('should insert inline translation and block translation correctly in a node with inline and block node inside', async () => {
//     render(
//       <div data-testid="test-node">
//         <span style={{ display: 'inline' }}>1</span>
//         <div style={{ display: 'block' }}>2</div>
//         <div style={{ display: 'inline-block' }}>3</div>
//         4
//         <span style={{ display: 'block' }}>5</span>
//         6
//         <br />
//         7
//       </div>,
//     )
//     const node = screen.getByTestId('test-node')
//     await hideOrShowPageTranslation()

//     const firstSpanChild = node.firstChild
//     expect(firstSpanChild).toHaveAttribute('data-read-frog-paragraph')
//     expect(firstSpanChild?.childNodes[1]).toHaveClass(CONTENT_WRAPPER_CLASS)
//     expect(firstSpanChild?.childNodes[1].childNodes[1]).toHaveClass(
//       INLINE_CONTENT_CLASS,
//     )

//     const secondDivChild = node.childNodes[1]
//     expect(secondDivChild).toHaveAttribute('data-read-frog-paragraph')
//     expect(secondDivChild?.childNodes[1]).toHaveClass(CONTENT_WRAPPER_CLASS)
//     expect(secondDivChild?.childNodes[1].childNodes[1]).toHaveClass(
//       BLOCK_CONTENT_CLASS,
//     )

//     const thirdChild = node.childNodes[2]
//     expect(thirdChild).toHaveAttribute('data-read-frog-paragraph')
//     expect(thirdChild.childNodes.length).toBe(1)

//     const sixthInlineTranslationChild = node.childNodes[4]
//     expect(sixthInlineTranslationChild).toHaveClass(CONTENT_WRAPPER_CLASS)
//     expect(sixthInlineTranslationChild?.childNodes[1]).toHaveClass(
//       INLINE_CONTENT_CLASS,
//     )

//     const lastInlineTranslationChild = node.lastChild
//     expect(lastInlineTranslationChild).toHaveClass(CONTENT_WRAPPER_CLASS)
//     expect(lastInlineTranslationChild?.childNodes[1]).toHaveClass(
//       INLINE_CONTENT_CLASS,
//     )
//   })
//   it('should translate the deepest inline node', async () => {
//     render(
//       <div data-testid="test-node">
//         <span style={{ display: 'inline' }}>
//           <span style={{ display: 'inline' }}>1</span>
//         </span>
//       </div>,
//     )

//     const node = screen.getByTestId('test-node')
//     await hideOrShowPageTranslation()

//     const targetNode = node.firstChild?.firstChild
//     expect(targetNode?.childNodes[1]).toHaveClass(CONTENT_WRAPPER_CLASS)
//     expect(targetNode?.childNodes[1].childNodes[1]).toHaveClass(
//       INLINE_CONTENT_CLASS,
//     )
//   })
//   it('should translate the deepest block node', async () => {
//     render(
//       <div data-testid="test-node">
//         <div>
//           <div>1</div>
//         </div>
//       </div>,
//     )
//     const node = screen.getByTestId('test-node')
//     await hideOrShowPageTranslation()
//     const targetNode = node.firstChild?.firstChild
//     expect(targetNode?.childNodes[1]).toHaveClass(CONTENT_WRAPPER_CLASS)
//     expect(targetNode?.childNodes[1].childNodes[1]).toHaveClass(
//       BLOCK_CONTENT_CLASS,
//     )
//   })
//   it('should translate the middle node', async () => {
//     render(
//       <div data-testid="test-node">
//         <span style={{ display: 'inline' }}>
//           <div className="test" style={{ display: 'inline' }}>
//             1
//           </div>
//           2
//         </span>
//       </div>,
//     )
//     const node = screen.getByTestId('test-node')
//     await hideOrShowPageTranslation()
//     const targetNode = node.firstChild
//     expect(targetNode?.lastChild).toHaveClass(CONTENT_WRAPPER_CLASS)
//     expect(targetNode?.lastChild?.lastChild).toHaveClass(INLINE_CONTENT_CLASS)
//   })
// })

// describe('hideOrShowNodeTranslation', () => {
//   it('should show translation when hotkey is pressed over original text', async () => {
//     const originalElement = document.createElement('div')
//     originalElement.textContent = 'Original text'
//     originalElement.style.position = 'absolute'
//     originalElement.style.left = '100px'
//     originalElement.style.top = '100px'
//     originalElement.style.width = '200px'
//     originalElement.style.height = '50px'
//     document.body.appendChild(originalElement)

//     // Mock getBoundingClientRect
//     originalElement.getBoundingClientRect = vi.fn(() => ({
//       left: 100,
//       top: 100,
//       right: 300,
//       bottom: 150,
//       width: 200,
//       height: 50,
//     } as DOMRect))

//     // Mock elementFromPoint
//     document.elementFromPoint = vi.fn(() => originalElement)

//     await act(async () => {
//       await removeOrShowNodeTranslation({ x: 150, y: 125 }, 'bilingual')
//     })

//     // Should find translation wrapper
//     const wrapper = document.querySelector(`.${CONTENT_WRAPPER_CLASS}`)
//     expect(wrapper).toBeTruthy()
//   })

//   it('should hide translation when hotkey is pressed over translated content', async () => {
//     const originalElement = document.createElement('div')
//     originalElement.textContent = 'Original text'
//     document.body.appendChild(originalElement)

//     // Create translated content structure
//     const wrapper = document.createElement('span')
//     wrapper.className = `${NOTRANSLATE_CLASS} ${CONTENT_WRAPPER_CLASS}`

//     const translatedContent = document.createElement('span')
//     translatedContent.className = `${NOTRANSLATE_CLASS} ${BLOCK_CONTENT_CLASS}`
//     translatedContent.textContent = 'Translated text'
//     translatedContent.style.position = 'absolute'
//     translatedContent.style.left = '100px'
//     translatedContent.style.top = '100px'
//     translatedContent.style.width = '200px'
//     translatedContent.style.height = '50px'

//     wrapper.appendChild(translatedContent)
//     originalElement.appendChild(wrapper)

//     // Mock getBoundingClientRect for translated content
//     translatedContent.getBoundingClientRect = vi.fn(() => ({
//       left: 100,
//       top: 100,
//       right: 300,
//       bottom: 150,
//       width: 200,
//       height: 50,
//     } as DOMRect))

//     // Mock elementFromPoint to return translated content
//     document.elementFromPoint = vi.fn(() => translatedContent)

//     await act(async () => {
//       await removeOrShowNodeTranslation({ x: 150, y: 125 }, 'bilingual')
//     })

//     // Wrapper should be removed
//     expect(document.querySelector(`.${CONTENT_WRAPPER_CLASS}`)).toBeFalsy()
//   })
// })
