import { i18n } from '#imports'
import { PageLayout } from '../../components/page-layout'
import { ProvidersConfig } from './providers-config'

export function ApiProvidersPage() {
  // const providersConfig = useAtomValue(configFields.providersConfig)
  // const apiProvidersConfig = providersConfig.filter(providerConfig => isAPIProviderConfig(providerConfig))

  return (
    <PageLayout title={i18n.t('options.apiProviders.title')} innerClassName="[&>*]:border-b [&>*:last-child]:border-b-0">
      <ProvidersConfig />
      {/* {apiProvidersConfig.map(providerConfig => (
        <ProviderConfigCard key={providerConfig.name} providerConfig={providerConfig} />
      ))} */}
    </PageLayout>
  )
}
