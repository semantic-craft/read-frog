import type { LangCodeISO6393 } from '@read-frog/definitions'
import type { Config } from '@/types/config/config'
import { getFinalSourceCode } from '@/utils/config/languages'

/**
 * 精确匹配域名模式
 * 支持完全匹配和子域名匹配，但不匹配包含该模式的其他域名
 * @param url - 要检查的 URL
 * @param pattern - 域名模式（如 "x.com"）
 * @returns 是否匹配
 */
export function matchDomainPattern(url: string, pattern: string): boolean {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    const patternLower = pattern.toLowerCase().trim()

    // 完全匹配
    if (hostname === patternLower) {
      return true
    }

    // 子域名匹配：hostname 以 "." + pattern 结尾
    // 例如：pattern = "x.com"，匹配 "www.x.com"、"sub.x.com"
    // 但不匹配 "ax.com"、"bbx.com"
    if (hostname.endsWith(`.${patternLower}`)) {
      return true
    }

    return false
  }
  catch {
    // 如果 URL 解析失败，回退到简单的字符串匹配（但使用更严格的规则）
    const urlLower = url.toLowerCase()
    const patternLower = pattern.toLowerCase().trim()

    // 只匹配完整的域名边界，避免误匹配
    // 使用正则表达式确保匹配的是完整的域名，而不是子字符串
    // 正则表达式说明：
    // - (^|\\.) : 匹配字符串开头或点号（表示域名边界，如 "www." 中的点）
    // - ${patternLower.replace(...)} : 转义后的模式（如 "x\\.com"）
    // - (/|$) : 匹配斜杠或字符串结尾
    // 示例：pattern = "x.com" 时，正则变为 /(^|\.)x\.com(\/|$)/i
    //   - 匹配: "x.com", "www.x.com", "x.com/path", "https://x.com"
    //   - 不匹配: "ax.com", "bbx.com", "x.com.example.com"
    const regex = new RegExp(`(^|\\.)${patternLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(/|$)`, 'i')
    return regex.test(urlLower)
  }
}

export async function shouldEnableAutoTranslation(url: string, detectedCodeOrUnd: LangCodeISO6393 | 'und', config: Config): Promise<boolean> {
  const autoTranslatePatterns = config?.translate.page.autoTranslatePatterns
  const autoTranslateLanguages = config?.translate.page.autoTranslateLanguages
  const { sourceCode } = config?.language || {}

  const doesMatchPattern = autoTranslatePatterns?.some(pattern =>
    url.toLowerCase().includes(pattern.toLowerCase()),
  ) ?? false

  let doesMatchLanguage = false
  if (detectedCodeOrUnd !== 'und') {
    doesMatchLanguage = autoTranslateLanguages?.includes(getFinalSourceCode(sourceCode, detectedCodeOrUnd))
  }

  return doesMatchPattern || doesMatchLanguage
}
