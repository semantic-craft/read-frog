// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getContext } from '../../utils'

// 辅助函数：创建选中文本的 Range
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
    // 创建测试用的 DOM 元素
    testElement = document.createElement('div')
    document.body.appendChild(testElement)
  })

  afterEach(() => {
    // 清理 DOM
    document.body.removeChild(testElement)
  })

  describe('基本功能测试', () => {
    it('应该正确提取选中文本前后的上下文', () => {
      testElement.innerHTML = '这是第一句话。这是选中的文本。这是第三句话。'

      const range = createRangeForText(testElement, '这是选中的文本')
      const result = getContext(range)

      expect(result.selection).toBe('这是选中的文本')
      expect(result.before).toBe('这是第一句话。')
      expect(result.after).toBe('。这是第三句话。')
    })

    it('应该处理英文句子的边界', () => {
      testElement.innerHTML = 'This is the first sentence. This is selected text. This is the third sentence.'

      const range = createRangeForText(testElement, 'This is selected text')
      const result = getContext(range)

      expect(result.selection).toBe('This is selected text')
      expect(result.before).toBe('')
      expect(result.after).toBe('. This is the third sentence.')
    })

    it('应该处理混合中英文内容', () => {
      testElement.innerHTML = 'Hello world! 你好世界。This is a test? 这是一个测试！'

      const range = createRangeForText(testElement, '你好世界')
      const result = getContext(range)

      expect(result.selection).toBe('你好世界')
      expect(result.before).toBe('')
      expect(result.after).toBe('。This is a test? 这是一个测试！')
    })
  })

  describe('边界情况测试', () => {
    it('应该处理选中文本在段落开头的情况', () => {
      testElement.innerHTML = '选中的文本在开头。这是后面的内容。'

      const range = createRangeForText(testElement, '选中的文本在开头')
      const result = getContext(range)

      expect(result.selection).toBe('选中的文本在开头')
      expect(result.before).toBe('')
      expect(result.after).toBe('。这是后面的内容。')
    })

    it('应该处理选中文本在段落结尾的情况', () => {
      testElement.innerHTML = '这是前面的内容。选中的文本在结尾'

      const range = createRangeForText(testElement, '选中的文本在结尾')
      const result = getContext(range)

      expect(result.selection).toBe('选中的文本在结尾')
      expect(result.before).toBe('这是前面的内容。')
      expect(result.after).toBe('')
    })

    it('应该处理选中整个段落的情况', () => {
      testElement.innerHTML = '这是整个段落的内容。'

      const range = createRangeForText(testElement, '这是整个段落的内容')
      const result = getContext(range)

      expect(result.selection).toBe('这是整个段落的内容')
      expect(result.before).toBe('')
      expect(result.after).toBe('。')
    })

    it('应该处理没有句子边界的情况', () => {
      testElement.innerHTML = '这是一段没有标点符号的文本内容'

      const range = createRangeForText(testElement, '段没有标点符号')
      const result = getContext(range)

      expect(result.selection).toBe('段没有标点符号')
      expect(result.before).toBe('这是一')
      expect(result.after).toBe('的文本内容')
    })
  })

  describe('复杂场景测试', () => {
    it('应该处理多个连续标点符号', () => {
      testElement.innerHTML = '第一句...第二句!!!第三句???第四句。'

      const range = createRangeForText(testElement, '第二句')
      const result = getContext(range)

      expect(result.selection).toBe('第二句')
      expect(result.before).toBe('第一句...')
      expect(result.after).toBe('!!!第三句???第四句。')
    })

    it('应该处理嵌套元素的情况', () => {
      testElement.innerHTML = '外层文本<strong>内层文本</strong>更多文本。'

      const range = createRangeForText(testElement, '层文本')
      const result = getContext(range)

      expect(result.selection).toBe('层文本')
      expect(result.before).toBe('外')
      expect(result.after).toBe('内层文本更多文本。')
    })

    it('应该处理空白字符', () => {
      testElement.innerHTML = '  前面有空格。  中间有空格  。后面有空格。  '

      const range = createRangeForText(testElement, '中间有空格')
      const result = getContext(range)

      expect(result.selection).toBe('中间有空格')
      expect(result.before).toBe('')
      expect(result.after).toBe('。')
    })
  })

  describe('错误处理测试', () => {
    it('应该处理空的选中内容', () => {
      testElement.innerHTML = '这是一段文本。'

      const range = document.createRange()
      const textNode = testElement.firstChild!
      range.setStart(textNode, 0)
      range.setEnd(textNode, 0)

      const result = getContext(range)

      expect(result.selection).toBe('')
      expect(result.before).toBe('')
      expect(result.after).toBe('这是一段文本。')
    })

    it('应该处理找不到选中文本的情况', () => {
      testElement.innerHTML = '这是一段文本。'

      // 创建一个不存在的选中内容
      const range = document.createRange()
      const textNode = testElement.firstChild!
      range.setStart(textNode, 0)
      range.setEnd(textNode, 5)

      // 手动修改 toString 方法来模拟找不到的情况
      const originalToString = range.toString
      range.toString = () => '不存在的文本'

      const result = getContext(range)

      expect(result.selection).toBe('不存在的文本')
      expect(result.before).toBe('')
      expect(result.after).toBe('')

      // 恢复原始方法
      range.toString = originalToString
    })

    it('应该处理没有父元素的情况', () => {
      // 创建一个没有父元素的文本节点
      const textNode = document.createTextNode('测试文本')
      const range = document.createRange()
      range.setStart(textNode, 0)
      range.setEnd(textNode, 2)

      const result = getContext(range)

      // 当文本节点没有父元素时，函数返回空结果
      expect(result.selection).toBe('')
      expect(result.before).toBe('')
      expect(result.after).toBe('')
    })
  })

  describe('性能测试', () => {
    it('应该能处理长文本', () => {
      // 创建一个很长的文本
      const longText = `${'这是第一句话。'.repeat(1000)}选中的文本。${'这是最后一句话。'.repeat(1000)}`
      testElement.innerHTML = longText

      const range = createRangeForText(testElement, '选中的文本')
      const result = getContext(range)

      expect(result.selection).toBe('选中的文本')
      expect(result.before).toContain('这是第一句话。')
      expect(result.after).toContain('这是最后一句话。')
    })
  })

  describe('特殊字符测试', () => {
    it('应该处理包含特殊标点符号的文本', () => {
      testElement.innerHTML = '第一句！第二句？第三句。第四句...'

      const range = createRangeForText(testElement, '第二句')
      const result = getContext(range)

      expect(result.selection).toBe('第二句')
      expect(result.before).toBe('第一句！')
      expect(result.after).toBe('？第三句。第四句...')
    })

    it('应该处理包含换行符的文本', () => {
      testElement.innerHTML = '第一句。\n第二句。\n第三句。'

      const range = createRangeForText(testElement, '第二句')
      const result = getContext(range)

      expect(result.selection).toBe('第二句')
      expect(result.before).toBe('')
      expect(result.after).toBe('。\n第三句。')
    })
  })
})
