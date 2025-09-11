export const MIN_TRANSLATE_RATE = 1
export const MIN_TRANSLATE_CAPACITY = 1

export const DEFAULT_REQUEST_RATE = 8
export const DEFAULT_REQUEST_CAPACITY = 200

export const DEFAULT_AUTO_TRANSLATE_SHORTCUT_KEY = ['alt', 'q']

// TODO: Regular expression support will be needed in the future.
export const DEFAULT_DONT_WALK_INTO_ELEMENT_SELECTOR_MAP: Record<string, string[]> = {
  'www.reddit.com': [
    'body > shreddit-app > reddit-header-large',
  ],
  'chatgpt.com': [
    '.ProseMirror',
  ],
}
