import { DEFAULT_DONT_WALK_INTO_ELEMENT_SELECTOR_MAP } from '@/utils/constants/translate'

class CustomDontWalkElementManager {
  private dontWalkIntoElementSelectorMap: Record<string, string[]> = {}
  private hasDontWalkIntoElementHostSet: Set<string> = new Set()

  loadDontWalkRulesAndElements() {
    if (!window)
      return
    this.loadHasDontWalkIntoElementHost()
  }

  private loadHasDontWalkIntoElementHost() {
    // TODO: values should taken from globalConfig in future
    this.dontWalkIntoElementSelectorMap = DEFAULT_DONT_WALK_INTO_ELEMENT_SELECTOR_MAP
    this.hasDontWalkIntoElementHostSet = new Set(Object.keys(this.dontWalkIntoElementSelectorMap))
  }

  private hasDontWalkIntoElementInHost() {
    if (!window)
      return false

    // TODO: support regExp
    return this.hasDontWalkIntoElementHostSet.has(window.location.host)
  }

  private getDontWalkIntoElementSelector() {
    if (!window)
      return ''

    // TODO: use regExp to match
    const host = window.location.host

    const dontWalkSelectorList = this.dontWalkIntoElementSelectorMap[host] ?? []

    // TODO: need to validate the selector
    return dontWalkSelectorList.filter(Boolean).join(',')
  }

  isDontWalkIntoElement(element: Element) {
    if (!this.hasDontWalkIntoElementInHost())
      return false

    const dontWalkIntoSelector = this.getDontWalkIntoElementSelector()
    return element.matches(dontWalkIntoSelector)
  }
}

export const customDontWalkElementManager = new CustomDontWalkElementManager()
