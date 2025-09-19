// 句子边界匹配符号
const sentenceBoundary = /[.!?。？！]/g

/**
 * 计算指定节点在根节点中的文本偏移量
 */
function getTextOffset(root: Element, node: Node, offset: number): number {
  let textOffset = 0
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    null,
  )

  let currentNode: Node | null = walker.nextNode()
  while (currentNode) {
    if (currentNode === node) {
      return textOffset + offset
    }
    textOffset += currentNode.textContent?.length ?? 0
    currentNode = walker.nextNode()
  }

  return -1
}

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

  // Use Range's position information instead of indexOf to avoid wrong occurrence
  const startIndex = getTextOffset(root, selectionRange.startContainer, selectionRange.startOffset)
  const endIndex = getTextOffset(root, selectionRange.endContainer, selectionRange.endOffset)

  if (startIndex === -1 || endIndex === -1) {
    return { before: '', selection, after: '' }
  }

  const beforeBoundary = findBeforeBoundary(fullText, startIndex)
  const afterBoundary = findAfterBoundary(fullText, endIndex)

  const beforeStart = beforeBoundary === startIndex ? 0 : beforeBoundary
  const before = fullText.slice(beforeStart, startIndex).trim()

  const afterEnd = afterBoundary === endIndex + 1 ? fullText.length : afterBoundary
  const after = fullText.slice(endIndex, afterEnd).trim()

  return { before, selection, after }
}

export interface HighlightData {
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
