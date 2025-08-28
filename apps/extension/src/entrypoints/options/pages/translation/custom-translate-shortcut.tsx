import { i18n } from '#imports'
import { useAtom } from 'jotai'
import { ShortcutKeySelector } from '@/components/shortcut-key-selector'
import { configFields } from '@/utils/atoms/config'
import { DEFAULT_TRANSLATE_SHORTCUT_KEY } from '@/utils/constants/translate'
import { ConfigCard } from '../../components/config-card'

export function CustomTranslateShortcut() {
  const [translateConfig, setTranslateConfig] = useAtom(configFields.translate)
  const shortcutKey = translateConfig.customShortcutKey ?? DEFAULT_TRANSLATE_SHORTCUT_KEY

  const updateShortcutKey = (shortcutKey: string[]) => {
    setTranslateConfig({
      ...translateConfig,
      customShortcutKey: shortcutKey,
    })
  }

  return (
    <ConfigCard title={i18n.t('options.translation.customTranslateShortcutKey.title')} description={i18n.t('options.translation.customTranslateShortcutKey.description')}>
      <ShortcutKeySelector shortcutKey={shortcutKey} onChange={updateShortcutKey} />
    </ConfigCard>
  )
}
