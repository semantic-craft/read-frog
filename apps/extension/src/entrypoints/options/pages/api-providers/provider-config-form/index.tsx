import { Input } from '@repo/ui/components/input'
import { useAtom, useAtomValue } from 'jotai'
import ValidatedInput from '@/components/ui/validated-input'
import { baseAPIProviderConfigSchema, isAPIProviderConfig } from '@/types/config/provider'
import { providerConfigAtom } from '@/utils/atoms/provider'
import { FieldWithLabel } from '../../../components/field-with-label'
import { selectedProviderIdAtom } from '../atoms'

export function ProviderConfigForm() {
  const selectedProviderId = useAtomValue(selectedProviderIdAtom)
  const [selectedProviderConfig, setSelectedProviderConfig] = useAtom(providerConfigAtom(selectedProviderId ?? ''))

  if (!selectedProviderConfig || !isAPIProviderConfig(selectedProviderConfig)) {
    return null
  }

  return (
    <div className="flex-1 bg-card rounded-xl p-4 border flex flex-col gap-4">
      <FieldWithLabel label="Name" id="name">
        <ValidatedInput
          schema={baseAPIProviderConfigSchema.shape.name}
          value={selectedProviderConfig.name}
          onChange={e => setSelectedProviderConfig({ ...selectedProviderConfig, name: e.target.value })}
        />
      </FieldWithLabel>
      <FieldWithLabel label="Description" id="description">
        <Input
          value={selectedProviderConfig.description}
          onChange={e => setSelectedProviderConfig({ ...selectedProviderConfig, description: e.target.value })}
        />
      </FieldWithLabel>
      {/* <APIKeyField /> */}
    </div>
  )
}
