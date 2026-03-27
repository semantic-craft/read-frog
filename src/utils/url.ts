import { z } from "zod"

export function normalizeDomainPattern(pattern: string): string {
  const cleanedPattern = pattern.trim()
  if (!cleanedPattern) {
    return ""
  }

  const candidates = cleanedPattern.includes("://")
    ? [cleanedPattern]
    : [cleanedPattern, `https://${cleanedPattern}`]

  for (const candidate of candidates) {
    if (!z.url().safeParse(candidate).success) {
      continue
    }

    return new URL(candidate).hostname.toLowerCase()
  }

  return cleanedPattern.toLowerCase()
}

export function matchDomainPattern(url: string, pattern: string): boolean {
  if (!z.url().safeParse(url).success) {
    return false
  }

  const urlObj = new URL(url)
  const hostname = urlObj.hostname.toLowerCase()
  const patternLower = normalizeDomainPattern(pattern)

  if (hostname === patternLower) {
    return true
  }

  if (hostname.endsWith(`.${patternLower}`)) {
    return true
  }

  return false
}
