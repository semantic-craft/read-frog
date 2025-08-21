import { i18n } from '#imports'
import { useState } from 'react'
import { ShortcutKeySelector } from '@/components/shortcut-key-selector'
import { ConfigCard } from '../../components/config-card'

const DEFAULT_TRANSLATE_SHORTCUT_KEY = new Set(['alt', 'Q'])

export function CustomTranslateShortcut() {
  const [shortcut, _] = useState(DEFAULT_TRANSLATE_SHORTCUT_KEY)

  return (
    <ConfigCard title={i18n.t('options.translation.customTranslateShortcutKey.title')} description={i18n.t('options.translation.customTranslateShortcutKey.description')}>
      <ShortcutKeySelector value={shortcut} />
    </ConfigCard>
  )
}
