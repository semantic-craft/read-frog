import { DEFAULT_TRANSLATE_SHORTCUT_KEY } from '@/utils/constants/translate'

export function migrate(oldConfig: any): any {
  return {
    ...oldConfig,
    translate: {
      ...oldConfig.translate,
      customShortcutKey: DEFAULT_TRANSLATE_SHORTCUT_KEY,
    },
  }
}
