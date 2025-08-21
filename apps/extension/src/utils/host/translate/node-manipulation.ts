import type { APICallError } from 'ai'
import type { TranslationMode } from '@/types/config/translate'
import type { Point, TransNode } from '@/types/dom'
import React from 'react'
import textSmallCSS from '@/assets/tailwind/text-small.css?inline'
import themeCSS from '@/assets/tailwind/theme.css?inline'
import { TranslationError } from '@/components/tranlation/error'
import { Spinner } from '@/components/tranlation/spinner'
import { globalConfig } from '@/utils/config/config'
import { logger } from '@/utils/logger'
import { createReactShadowHost, removeReactShadowHost } from '@/utils/react-shadow-host/create-shadow-host'
import {
  BLOCK_CONTENT_CLASS,
  CONSECUTIVE_INLINE_END_ATTRIBUTE,
  CONTENT_WRAPPER_CLASS,
  INLINE_CONTENT_CLASS,
  NOTRANSLATE_CLASS,
  REACT_SHADOW_HOST_CLASS,
  TRANSLATION_ERROR_CONTAINER_CLASS,
} from '../../constants/dom-labels'
import { FORCE_INLINE_TRANSLATION_TAGS } from '../../constants/dom-tags'
import { isBlockTransNode, isHTMLElement, isInlineTransNode, isTextNode, isTranslatedContentNode, isTranslatedWrapperNode } from '../dom/filter'
import { deepQueryTopLevelSelector, findNearestAncestorBlockNodeAt, findTranslatedContentWrapper, unwrapDeepestOnlyHTMLChild } from '../dom/find'
import { getOwnerDocument } from '../dom/node'
import {
  extractTextContent,
  translateWalkedElement,
  walkAndLabelElement,
} from '../dom/traversal'
import { decorateTranslationNode } from './decorate-translation'
import { translateText, validateTranslationConfig } from './translate-text'

const translatingNodes = new Set<HTMLElement | Text>()

export async function hideOrShowNodeTranslation(point: Point) {
  if (!globalConfig) {
    return
  }

  const translationMode = globalConfig.translate.mode

  const node = findNearestAncestorBlockNodeAt(point)

  if (!node || !isHTMLElement(node))
    return

  // Check if the found node is translated content
  if (isTranslatedContentNode(node)) {
    const wrapper = findTranslatedContentWrapper(node)
    if (wrapper) {
      removeShadowHostInTranslatedWrapper(wrapper)
      wrapper.remove()
    }
    return
  }
  if (!validateTranslationConfig({
    providersConfig: globalConfig!.providersConfig,
    translate: globalConfig!.translate,
    language: globalConfig!.language,
  })) {
    return
  }

  const id = crypto.randomUUID()
  walkAndLabelElement(node, id)
  await translateWalkedElement(node, id, translationMode, true)
}

export function removeAllTranslatedWrapperNodes(
  root: Document | ShadowRoot = document,
) {
  const translatedNodes = deepQueryTopLevelSelector(root, isTranslatedWrapperNode)
  translatedNodes.forEach((node) => {
    removeShadowHostInTranslatedWrapper(node)
    node.remove()
  })
}

/**
 * Translate the node
 * @param nodes - The nodes to translate
 * @param translationMode - Bilingual or Translation Only
 * @param toggle - Whether to toggle the translation, if true, the translation will be removed if it already exists
 */
export async function translateNodes(nodes: TransNode[], translationMode: TranslationMode, toggle: boolean = false) {
  if (translationMode === 'bilingual') {
    await translateNodesWithBilingualMode(nodes, toggle)
  }
  else if (translationMode === 'translationOnly') {
    await translateNodesWithTranslationOnlyMode(nodes, toggle)
  }
}

async function translateNodesWithBilingualMode(nodes: TransNode[], toggle: boolean = false) {
  try {
    // prevent duplicate translation
    if (nodes.every(node => translatingNodes.has(node))) {
      return
    }
    nodes.forEach(node => translatingNodes.add(node))

    // TODO: try to add the original back if there is

    const lastNode = nodes[nodes.length - 1]
    const targetNode
      = nodes.length === 1 && isHTMLElement(lastNode) ? unwrapDeepestOnlyHTMLChild(lastNode) : lastNode

    const existedTranslatedWrapper = findExistedTranslatedWrapper(targetNode)
    if (existedTranslatedWrapper) {
      removeShadowHostInTranslatedWrapper(existedTranslatedWrapper)
      existedTranslatedWrapper.remove()
      if (toggle) {
        // TODO: will this run finally?
        return
      }
    }

    const textContent = nodes.map(node => extractTextContent(node)).join(' ')
    if (!textContent)
      // TODO: will this run finally?
      return

    const ownerDoc = getOwnerDocument(targetNode)
    const translatedWrapperNode = ownerDoc.createElement('span')
    translatedWrapperNode.className = `${NOTRANSLATE_CLASS} ${CONTENT_WRAPPER_CLASS}`
    const spinner = createSpinnerInside(translatedWrapperNode)

    if (isTextNode(targetNode) || nodes.length > 1) {
      targetNode.parentNode?.insertBefore(
        translatedWrapperNode,
        targetNode.nextSibling,
      )
    }
    else {
      targetNode.appendChild(translatedWrapperNode)
    }

    const translatedText = await getTranslatedTextAndRemoveSpinner(nodes, textContent, spinner, translatedWrapperNode)

    if (!translatedText)
      return

    insertTranslatedNodeIntoWrapper(
      translatedWrapperNode,
      targetNode,
      translatedText,
    )
  }
  finally {
    nodes.forEach(node => translatingNodes.delete(node))
  }
}

async function translateNodesWithTranslationOnlyMode(nodes: TransNode[], toggle: boolean = false) {
  try {
    if (nodes.every(node => translatingNodes.has(node))) {
      return
    }
    nodes.forEach(node => translatingNodes.add(node))

    // TODO: try to add the original back if there is

    // try to remove the bilingual if there is
    const lastNode = nodes[nodes.length - 1]
    const targetNode
      = nodes.length === 1 && isHTMLElement(lastNode) ? unwrapDeepestOnlyHTMLChild(lastNode) : lastNode

    const existedTranslatedWrapper = findExistedTranslatedWrapper(targetNode)
    if (existedTranslatedWrapper) {
      removeShadowHostInTranslatedWrapper(existedTranslatedWrapper)
      existedTranslatedWrapper.remove()
      if (toggle) {
        // TODO: will this run finally?
        return
      }
    }

    logger.log('node.innerHTML', isTextNode(nodes[0]) ? nodes[0] : nodes[0].innerHTML)
    // console.log('type', typeof (isTextNode(nodes[0]) ? nodes[0] : nodes[0].innerHTML))
    // console.log('node.LLMStandard', LLMStandardHTML(isTextNode(nodes[0]) ? nodes[0] : nodes[0]))
    // console.log('type', typeof (LLMStandardHTML(isTextNode(nodes[0]) ? nodes[0] : nodes[0])))
  }
  finally {
    nodes.forEach(node => translatingNodes.delete(node))
  }
}

export const inlineSet = new Set([
  'a',
  'b',
  'strong',
  'span',
  'em',
  'i',
  'u',
  'small',
  'sub',
  'sup',
  'font',
  'mark',
  'cite',
  'q',
  'abbr',
  'time',
  'ruby',
  'bdi',
  'bdo',
  'img',
  'br',
  'wbr',
  'svg',
])

export function LLMStandardHTML(node: any) {
  // 1. 初始化空字符串 text
  // 2. 遍历子节点
  // 3. 若为文本节点，拼接其文本内容
  // 4. 若为元素节点且在 inlineSet 中，拼接其 outerHTML
  // 5. 否则继续递归处理子节点
  let text = ''
  node.childNodes.forEach((child: any) => {
    if (child.nodeType === Node.TEXT_NODE) {
      text += child.nodeValue
    }
    else if (child.nodeType === Node.ELEMENT_NODE) {
      if (inlineSet.has(child.tagName.toLowerCase())) {
        text += child.outerHTML
      }
      else {
        text += LLMStandardHTML(child)
      }
    }
  })
  return text
}

function createSpinnerInside(translatedWrapperNode: HTMLElement) {
  const spinComponent = React.createElement(Spinner)
  const container = createReactShadowHost(
    spinComponent,
    {
      position: 'inline',
      inheritStyles: false,
      cssContent: [themeCSS, textSmallCSS],
      style: {
        verticalAlign: 'middle',
      },
    },
  )
  translatedWrapperNode.appendChild(container)
  return container
}

function findExistedTranslatedWrapper(node: TransNode): HTMLElement | null {
  if (isTextNode(node) || node.hasAttribute(CONSECUTIVE_INLINE_END_ATTRIBUTE)) {
    if (
      node.nextSibling && isHTMLElement(node.nextSibling)
      && node.nextSibling.classList.contains(CONTENT_WRAPPER_CLASS)
    ) {
      return node.nextSibling
    }
  }
  else if (isHTMLElement(node)) {
    return node.querySelector(`:scope > .${CONTENT_WRAPPER_CLASS}`)
  }
  return null
}

function insertTranslatedNodeIntoWrapper(
  translatedWrapperNode: HTMLElement,
  targetNode: TransNode,
  translatedText: string,
) {
  // Use the wrapper's owner document
  const ownerDoc = getOwnerDocument(translatedWrapperNode)
  const translatedNode = ownerDoc.createElement('span')
  const isForceInlineTranslationElement
    = isHTMLElement(targetNode)
      && FORCE_INLINE_TRANSLATION_TAGS.has(targetNode.tagName)

  if (isForceInlineTranslationElement || isInlineTransNode(targetNode)) {
    const spaceNode = ownerDoc.createElement('span')
    spaceNode.textContent = '  '
    translatedWrapperNode.appendChild(spaceNode)
    translatedNode.className = `${NOTRANSLATE_CLASS} ${INLINE_CONTENT_CLASS}`
  }
  else if (isBlockTransNode(targetNode)) {
    const brNode = ownerDoc.createElement('br')
    translatedWrapperNode.appendChild(brNode)
    translatedNode.className = `${NOTRANSLATE_CLASS} ${BLOCK_CONTENT_CLASS}`
  }
  else {
    // not inline or block, maybe notranslate
    return
  }

  translatedNode.textContent = translatedText
  decorateTranslationNode(translatedNode)
  translatedWrapperNode.appendChild(translatedNode)
}

async function getTranslatedTextAndRemoveSpinner(nodes: TransNode[], textContent: string, spinner: HTMLElement, translatedWrapperNode: HTMLElement) {
  let translatedText: string | undefined

  try {
    translatedText = await translateText(textContent)
  }
  catch (error) {
    removeReactShadowHost(spinner)

    const errorComponent = React.createElement(TranslationError, {
      nodes,
      error: error as APICallError,
    })

    const container = createReactShadowHost(
      errorComponent,
      {
        className: TRANSLATION_ERROR_CONTAINER_CLASS,
        position: 'inline',
        inheritStyles: false,
        cssContent: [themeCSS, textSmallCSS],
        style: {
          verticalAlign: 'middle',
        },
      },
    )

    translatedWrapperNode.appendChild(container)
  }
  finally {
    removeReactShadowHost(spinner)
  }

  return translatedText
}

function removeShadowHostInTranslatedWrapper(wrapper: HTMLElement) {
  const translationShadowHost = wrapper.querySelector(`.${REACT_SHADOW_HOST_CLASS}`)
  if (translationShadowHost && isHTMLElement(translationShadowHost)) {
    removeReactShadowHost(translationShadowHost)
  }
}
