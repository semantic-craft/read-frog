// 句子边界匹配符号
const sentenceBoundary = /[.!?。？！]/g

/**
 * 查找给定索引前最近的句子边界
 */
function findBeforeBoundary(text: string, index: number): number {
  let boundary = 0
  let match: RegExpExecArray | null

  // 重置正则表达式的状态
  sentenceBoundary.lastIndex = 0

  // eslint-disable-next-line no-cond-assign
  while ((match = sentenceBoundary.exec(text)) !== null) {
    if (match.index < index) {
      boundary = match.index + 1
    }
    else {
      break
    }
  }

  return boundary
}

/**
 * 查找给定索引后最近的句子边界
 */
function findAfterBoundary(text: string, index: number): number {
  sentenceBoundary.lastIndex = index
  const match = sentenceBoundary.exec(text)
  return match ? match.index + 1 : text.length
}

/**
 * 获取选中文本的上下文句子
 */
export function getContext(selectionRange: Range) {
  const container = selectionRange.commonAncestorContainer
  const root = container.nodeType === Node.TEXT_NODE
    ? container.parentElement
    : (container as Element | null)

  if (!root) {
    return { before: '', selection: '', after: '' }
  }

  const fullText = root.textContent ?? ''
  const selection = selectionRange.toString()
  const startIndex = fullText.indexOf(selection)

  if (startIndex === -1) {
    return { before: '', selection, after: '' }
  }

  const endIndex = startIndex + selection.length

  const beforeBoundary = findBeforeBoundary(fullText, startIndex)
  const afterBoundary = findAfterBoundary(fullText, endIndex)

  const beforeStart = beforeBoundary === startIndex ? 0 : beforeBoundary
  const before = fullText.slice(beforeStart, startIndex).trim()

  const afterEnd = afterBoundary === endIndex + 1 ? fullText.length : afterBoundary
  const after = fullText.slice(endIndex, afterEnd).trim()

  return { before, selection, after }
}

interface HighlightData {
  type: 'highlight'
  context: {
    before: string
    selection: string
    after: string
  }
}

/**
 * 创建高亮数据
 */
export function createHighlightData(selectionRange: Range): HighlightData {
  return {
    type: 'highlight',
    context: getContext(selectionRange),
  }
}
