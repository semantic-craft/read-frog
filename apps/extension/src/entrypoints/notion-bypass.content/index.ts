import { defineContentScript } from '#imports'
import { logger } from '@/utils/logger'

export default defineContentScript({
  matches: [
    '*://*.notion.so/*',
    '*://*.notion.site/*',
    '*://*.notion.com/*',
  ],
  runAt: 'document_start',
  world: 'MAIN',
  allFrames: true,
  main() {
    // 超早期脚本注入 - 在 Notion 初始化前拦截 MutationObserver
    (function () {
      'use strict'

      logger.info('[Read Frog] Notion bypass script loaded at document_start')

      // 保存原始的 MutationObserver
      const OriginalMutationObserver = window.MutationObserver

      // 创建被过滤的 MutationObserver 构造函数
      function FilteredMutationObserver(callback: MutationCallback) {
        // 创建一个包装后的回调函数
        const wrappedCallback: MutationCallback = function (this: MutationObserver, mutations: MutationRecord[], observer: MutationObserver) {
          // 过滤掉与 read-frog 相关的变化
          const filteredMutations = mutations.filter((mutation) => {
            // 过滤属性变化
            if (mutation.type === 'attributes') {
              const attributeName = mutation.attributeName
              if (attributeName && attributeName.includes('read-frog')) {
                logger.info('[Read Frog] Blocked attribute mutation:', attributeName)
                return false
              }
            }

            // 过滤子节点变化（如果添加的节点包含 read-frog 类或属性）
            if (mutation.type === 'childList') {
              // 检查删除的节点中是否有翻译节点
              const removedReadFrogNodes = Array.from(mutation.removedNodes).some((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  const element = node as Element
                  if (element.className && element.className.includes('read-frog')) {
                    logger.warn('[Read Frog] Translation node was removed by Notion:', element.className)
                    return true
                  }
                }
                return false
              })

              const hasReadFrogNodes = Array.from(mutation.addedNodes).some((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  const element = node as Element
                  // 检查是否有 read-frog 相关的类名或属性
                  if (element.className && element.className.includes('read-frog')) {
                    logger.info('[Read Frog] Blocked childList mutation with read-frog class')
                    return true
                  }
                  // 检查属性
                  if (element.hasAttributes()) {
                    for (const attr of element.attributes) {
                      if (attr.name.includes('read-frog')) {
                        logger.info('[Read Frog] Blocked childList mutation with read-frog attribute:', attr.name)
                        return true
                      }
                    }
                  }
                }
                return false
              })

              if (hasReadFrogNodes || removedReadFrogNodes) {
                return false
              }
            }

            return true
          })

          // 只有当有非 read-frog 相关的变化时才调用原始回调
          if (filteredMutations.length > 0) {
            callback.call(this, filteredMutations, observer)
          }
        }

        // 使用包装后的回调创建原始 MutationObserver
        return new OriginalMutationObserver(wrappedCallback)
      }

      // 复制原始构造函数的属性和方法
      FilteredMutationObserver.prototype = OriginalMutationObserver.prototype
      Object.setPrototypeOf(FilteredMutationObserver, OriginalMutationObserver)

      // 替换全局的 MutationObserver
      ;(window as any).MutationObserver = FilteredMutationObserver

      // 同时替换可能的其他引用
      if (typeof globalThis !== 'undefined') {
        ;(globalThis as any).MutationObserver = FilteredMutationObserver
      }

      logger.info('[Read Frog] MutationObserver monkey patch applied successfully')

      // 额外的 DOM API 保护
      const originalSetAttribute = Element.prototype.setAttribute
      const originalRemoveAttribute = Element.prototype.removeAttribute

      Element.prototype.setAttribute = function (this: Element, name: string, value: string) {
        // 对于 read-frog 属性，使用更隐蔽的方式设置
        if (name.includes('read-frog')) {
          logger.info('[Read Frog] Silent setAttribute:', name, value)
          // 使用 Object.defineProperty 直接在元素上定义属性，绕过 setAttribute
          Object.defineProperty(this, `__read_frog_${name.replace('data-read-frog-', '')}`, {
            value,
            configurable: true,
            enumerable: false,
            writable: true,
          })
          return
        }
        return originalSetAttribute.call(this, name, value)
      }

      Element.prototype.removeAttribute = function (this: Element, name: string) {
        if (name.includes('read-frog')) {
          logger.info('[Read Frog] Silent removeAttribute:', name)
          delete (this as any)[`__read_frog_${name.replace('data-read-frog-', '')}`]
          return
        }
        return originalRemoveAttribute.call(this, name)
      }

      // 保护翻译节点不被删除
      const originalRemove = Element.prototype.remove
      const originalRemoveChild = Node.prototype.removeChild
      const originalReplaceChild = Node.prototype.replaceChild
      const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML')!
      const originalTextContent = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent')!

      // 检查元素或其后代是否包含翻译节点
      function hasTranslationNodes(element: Element): boolean {
        if (element.classList?.contains('read-frog-translated-content-wrapper')
          || element.classList?.contains('read-frog-translated-inline-content')
          || element.classList?.contains('read-frog-translated-block-content')) {
          return true
        }
        return Array.from(element.children || []).some(child => hasTranslationNodes(child))
      }

      Element.prototype.remove = function () {
        if (hasTranslationNodes(this)) {
          logger.warn('[Read Frog] Prevented removal of element containing translation nodes:', this.className)
          return
        }
        return originalRemove.call(this)
      }

      Node.prototype.removeChild = function<T extends Node>(child: T): T {
        if (child.nodeType === Node.ELEMENT_NODE && hasTranslationNodes(child as unknown as Element)) {
          logger.warn('[Read Frog] Prevented removeChild of element containing translation nodes:', (child as unknown as Element).className)
          return child
        }
        return originalRemoveChild.call(this, child) as T
      }

      Node.prototype.replaceChild = function<T extends Node>(newChild: Node, oldChild: T): T {
        if (oldChild.nodeType === Node.ELEMENT_NODE && hasTranslationNodes(oldChild as unknown as Element)) {
          logger.warn('[Read Frog] Prevented replaceChild of element containing translation nodes:', (oldChild as unknown as Element).className)
          return oldChild
        }
        return originalReplaceChild.call(this, newChild, oldChild) as T
      }

      // 保护 innerHTML 设置不清除翻译节点
      Object.defineProperty(Element.prototype, 'innerHTML', {
        get: originalInnerHTML.get,
        set(value: string) {
          const hasTranslations = hasTranslationNodes(this)
          if (hasTranslations) {
            logger.warn('[Read Frog] Prevented innerHTML change that would remove translation nodes')
            return
          }
          return originalInnerHTML.set!.call(this, value)
        },
        configurable: true,
      })

      // 保护 textContent 设置不清除翻译节点
      Object.defineProperty(Node.prototype, 'textContent', {
        get: originalTextContent.get,
        set(value: string | null) {
          if (this.nodeType === Node.ELEMENT_NODE && hasTranslationNodes(this as Element)) {
            logger.warn('[Read Frog] Prevented textContent change that would remove translation nodes')
            return
          }
          return originalTextContent.set!.call(this, value)
        },
        configurable: true,
      })

      // 导出一些实用函数供其他脚本使用
      ;(window as any).__readFrogBypass = {
        // 安全地设置 read-frog 属性
        setReadFrogAttribute(element: Element, name: string, value: string) {
          const internalName = `__read_frog_${name.replace('data-read-frog-', '')}`
          Object.defineProperty(element, internalName, {
            value,
            configurable: true,
            enumerable: false,
            writable: true,
          })
        },

        // 安全地获取 read-frog 属性
        getReadFrogAttribute(element: Element, name: string) {
          const internalName = `__read_frog_${name.replace('data-read-frog-', '')}`
          return (element as any)[internalName]
        },

        // 检查元素是否有特定的 read-frog 标记
        hasReadFrogAttribute(element: Element, name: string) {
          const internalName = `__read_frog_${name.replace('data-read-frog-', '')}`
          return internalName in element
        },

        // 保护翻译节点不被意外删除
        protectTranslationNodes() {
          const translationNodes = document.querySelectorAll('.read-frog-translated-content-wrapper')
          translationNodes.forEach((node) => {
            // 添加一个隐藏的保护标记
            ;(node as any).__read_frog_protected = true
          })
        },

        // 获取所有翻译节点（用于清理时使用）
        getAllTranslationNodes(): Element[] {
          return Array.from(document.querySelectorAll('.read-frog-translated-content-wrapper'))
        },
      }

      logger.info('[Read Frog] Bypass utilities exported to window.__readFrogBypass')
    })()
  },
})
