import { i18n } from '#imports'
import { useAtomValue } from 'jotai'
import { configFields } from '@/utils/atoms/config'
import { PageLayout } from '../../components/page-layout'
import { ProviderConfigCard } from './provider-config-card'

export function ApiProvidersPage() {
  const providersConfig = useAtomValue(configFields.providersConfig)

  return (
    <PageLayout title={i18n.t('options.apiProviders.title')} innerClassName="[&>*]:border-b [&>*:last-child]:border-b-0">
      {providersConfig.map(providerConfig => (
        <ProviderConfigCard key={providerConfig.name} providerConfig={providerConfig} />
      ))}
    </PageLayout>
  )
}
