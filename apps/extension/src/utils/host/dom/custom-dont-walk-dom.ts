import { DEFAULT_DONT_WALK_INTO_ELEMENT_PATH_MAP } from '@/utils/constants/translate'

class CustomDontWalkElementManager {
  private dontWalkIntoPathMap: Record<string, string[]> = {}
  private dontWalkIntoElementMap: Record<string, Set<Element>> = {}
  private hasDontWalkIntoElementHostSet: Set<string> = new Set()

  loadDontWalkRulesAndElements() {
    if (!window)
      return
    this.loadHasDontWalkIntoElementHost()
    this.loadDontWalkIntoElementMap()
  }

  private loadHasDontWalkIntoElementHost() {
    // TODO: values should taken from globalConfig in future
    this.dontWalkIntoPathMap = DEFAULT_DONT_WALK_INTO_ELEMENT_PATH_MAP
    this.hasDontWalkIntoElementHostSet = new Set(Object.keys(this.dontWalkIntoPathMap))
  }

  private loadDontWalkIntoElementMap() {
    const dontTranslatePathEntries = Object.entries(this.dontWalkIntoPathMap).map(([host, paths]) => {
      const dontWalkElements = new Set(paths.flatMap((path) => {
        const nodeList = window.document.querySelectorAll(path)
        return Array.from(nodeList)
      }))
      return [host, dontWalkElements]
    })

    this.dontWalkIntoElementMap = Object.fromEntries(dontTranslatePathEntries)
  }

  private hasDontWalkIntoElementInHost() {
    if (!window)
      return false

    // TODO: support regExp
    return this.hasDontWalkIntoElementHostSet.has(window.location.host)
  }

  private getDontWalkIntoElementList() {
    if (!window)
      return new Set([])
    // TODO: use regExp to match
    const host = window.location.host

    return this.dontWalkIntoElementMap[host] ?? new Set([])
  }

  isDontWalkIntoElement(element: Element) {
    if (!this.hasDontWalkIntoElementInHost())
      return false

    const dontWalkIntoDomList = this.getDontWalkIntoElementList()
    return dontWalkIntoDomList.has(element)
  }
}

export const customDontWalkElementManager = new CustomDontWalkElementManager()
