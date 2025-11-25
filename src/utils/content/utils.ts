import { getConfigFromStorage } from '../config/config'
import { DEFAULT_CONFIG } from '../constants/config'
import { isDontWalkIntoAndDontTranslateAsChildElement, isDontWalkIntoButTranslateAsChildElement, isHTMLElement } from '../host/dom/filter'

export async function removeDummyNodes(root: Document) {
  const elements = root.querySelectorAll('*')
  const config = await getConfigFromStorage() ?? DEFAULT_CONFIG
  elements.forEach((element) => {
    const isDontTranslate = isHTMLElement(element)
      && (isDontWalkIntoButTranslateAsChildElement(element) || isDontWalkIntoAndDontTranslateAsChildElement(element, config))
    if (isDontTranslate) {
      element.remove()
    }
  })
}
