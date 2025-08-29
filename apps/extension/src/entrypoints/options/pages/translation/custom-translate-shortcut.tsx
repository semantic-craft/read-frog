import { i18n } from '#imports'
<<<<<<< HEAD
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
      <ShortcutKeySelector value={shortcutKey} onChange={updateShortcutKey} />
=======
import { useState } from 'react'
import { ShortcutKeySelector } from '@/components/shortcut-key-selector'
import { ConfigCard } from '../../components/config-card'

const DEFAULT_TRANSLATE_SHORTCUT_KEY = new Set(['alt', 'Q'])

export function CustomTranslateShortcut() {
  const [shortcut, _] = useState(DEFAULT_TRANSLATE_SHORTCUT_KEY)

  return (
    <ConfigCard title={i18n.t('options.translation.customTranslateShortcutKey.title')} description={i18n.t('options.translation.customTranslateShortcutKey.description')}>
      <ShortcutKeySelector value={shortcut} />
>>>>>>> a70797e (feat: implement shortcut)
    </ConfigCard>
  )
}
