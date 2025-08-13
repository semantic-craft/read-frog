/**
 * Notion bypass utilities for safely setting read-frog attributes
 * without triggering Notion's DOM lock mechanism
 */

/**
 * Check if we're on a Notion domain
 */
export function isNotionDomain(): boolean {
  const hostname = window.location.hostname.toLowerCase()
  return hostname.includes('notion.so')
    || hostname.includes('notion.site')
    || hostname.includes('notion.com')
}

/**
 * Check if bypass utilities are available
 */
function isBypassAvailable(): boolean {
  return typeof (window as any).__readFrogBypass === 'object'
}

/**
 * Safely set a read-frog attribute on an element
 * Uses bypass API on Notion domains, regular setAttribute elsewhere
 */
export function safeSetAttribute(element: Element, name: string, value: string): void {
  const shouldUseBypass = isNotionDomain() && isBypassAvailable() && name.includes('read-frog')
  if (shouldUseBypass) {
    const bypass = (window as any).__readFrogBypass
    bypass.setReadFrogAttribute(element, name, value)
  }
  else {
    element.setAttribute(name, value)
  }
}

/**
 * Safely get a read-frog attribute from an element
 */
export function safeGetAttribute(element: Element, name: string): string | null {
  const shouldUseBypass = isNotionDomain() && isBypassAvailable() && name.includes('read-frog')
  if (shouldUseBypass) {
    const bypass = (window as any).__readFrogBypass
    return bypass.getReadFrogAttribute(element, name) || null
  }
  else {
    return element.getAttribute(name)
  }
}

/**
 * Safely check if element has a read-frog attribute
 */
export function safeHasAttribute(element: Element, name: string): boolean {
  const shouldUseBypass = isNotionDomain() && isBypassAvailable() && name.includes('read-frog')
  if (shouldUseBypass) {
    const bypass = (window as any).__readFrogBypass
    return bypass.hasReadFrogAttribute(element, name)
  }
  else {
    return element.hasAttribute(name)
  }
}

/**
 * Safely remove a read-frog attribute from an element
 */
export function safeRemoveAttribute(element: Element, name: string): void {
  const shouldUseBypass = isNotionDomain() && isBypassAvailable() && name.includes('read-frog')
  if (shouldUseBypass) {
    // Remove the internal property
    const internalName = `__read_frog_${name.replace('data-read-frog-', '')}`
    delete (element as any)[internalName]
  }
  else {
    element.removeAttribute(name)
  }
}

/**
 * Wait for bypass utilities to be available (with timeout)
 */
export function waitForBypass(timeout: number = 1000): Promise<boolean> {
  return new Promise((resolve) => {
    if (!isNotionDomain()) {
      resolve(true) // Not on Notion, no bypass needed
      return
    }

    if (isBypassAvailable()) {
      resolve(true)
      return
    }

    let attempts = 0
    const maxAttempts = timeout / 50

    const checkInterval = setInterval(() => {
      attempts++
      if (isBypassAvailable()) {
        clearInterval(checkInterval)
        resolve(true)
      }
      else if (attempts >= maxAttempts) {
        clearInterval(checkInterval)
        console.warn('[Read Frog] Bypass utilities not available, falling back to regular DOM API')
        resolve(false)
      }
    }, 50)
  })
}
