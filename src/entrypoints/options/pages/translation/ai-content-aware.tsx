import { i18n } from '#imports'
import { deepmerge } from 'deepmerge-ts'
import { useAtom } from 'jotai'
import { useMemo } from 'react'
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/shadcn/field'
import { Switch } from '@/components/shadcn/switch'
import { isLLMTranslateProviderConfig } from '@/types/config/provider'
import { configFieldsAtomMap } from '@/utils/atoms/config'
import { getProviderConfigById } from '@/utils/config/helpers'
import { ConfigCard } from '../../components/config-card'

export function AIContentAware() {
  const [translateConfig, setTranslateConfig] = useAtom(configFieldsAtomMap.translate)
  const [providersConfig] = useAtom(configFieldsAtomMap.providersConfig)

  const hasLLMProvider = useMemo(() => {
    const providerConfig = getProviderConfigById(providersConfig, translateConfig.providerId)
    return providerConfig ? isLLMTranslateProviderConfig(providerConfig) : false
  }, [providersConfig, translateConfig.providerId])

  return (
    <ConfigCard
      title={i18n.t('options.translation.aiContentAware.title')}
      description={i18n.t('options.translation.aiContentAware.description')}
    >
      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel htmlFor="ai-content-aware-toggle">
            {i18n.t('options.translation.aiContentAware.enable')}
          </FieldLabel>
          <FieldDescription>
            <div className="space-y-1">
              <div>{i18n.t('options.translation.aiContentAware.enableDescription')}</div>
              <div className="flex items-center gap-1.5">
                <div className={`size-2 rounded-full ${hasLLMProvider ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-xs">
                  {hasLLMProvider
                    ? i18n.t('options.translation.aiContentAware.llmProviderConfigured')
                    : i18n.t('options.translation.aiContentAware.llmProviderNotConfigured')}
                </span>
              </div>
            </div>
          </FieldDescription>
        </FieldContent>
        <Switch
          id="ai-content-aware-toggle"
          checked={translateConfig.enableAIContentAware}
          onCheckedChange={(checked) => {
            void setTranslateConfig(
              deepmerge(translateConfig, {
                enableAIContentAware: checked,
              }),
            )
          }}
        />
      </Field>
    </ConfigCard>
  )
}
