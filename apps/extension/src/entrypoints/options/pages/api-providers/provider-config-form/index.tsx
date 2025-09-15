import type { APIProviderConfig } from '@/types/config/provider'
import { Input } from '@repo/ui/components/input'
import { useForm } from '@tanstack/react-form'
import { useAtom, useAtomValue } from 'jotai'
import { useEffect } from 'react'
import { apiProviderConfigItemSchema, isAPIProviderConfig } from '@/types/config/provider'
import { providerConfigAtom } from '@/utils/atoms/provider'
import { FieldWithLabel } from '../../../components/field-with-label'
import { selectedProviderIdAtom } from '../atoms'

export function ProviderConfigForm() {
  const selectedProviderId = useAtomValue(selectedProviderIdAtom)
  const [selectedProviderConfig, setSelectedProviderConfig] = useAtom(providerConfigAtom(selectedProviderId ?? ''))

  const form = useForm({
    // defaultValues: selectedProviderConfig && isAPIProviderConfig(selectedProviderConfig) ? selectedProviderConfig : undefined,
    validators: {
      onChange: apiProviderConfigItemSchema,
    },
    onSubmit: async ({ value }: { value: APIProviderConfig }) => {
      setSelectedProviderConfig(value)
    },
  })

  // Reset form when selectedProviderId changes
  useEffect(() => {
    if (selectedProviderConfig && isAPIProviderConfig(selectedProviderConfig)) {
      form.reset(selectedProviderConfig)
    }
  }, [selectedProviderId, selectedProviderConfig, form])

  if (!selectedProviderConfig || !isAPIProviderConfig(selectedProviderConfig)) {
    return null
  }

  return (
    <form
      className="flex-1 bg-card rounded-xl p-4 border flex flex-col gap-4"
      // onSubmit={(e) => {
      //   e.preventDefault()
      //   e.stopPropagation()
      //   void form.handleSubmit()
      // }}
    >
      <form.Field name="name">
        {field => (
          <FieldWithLabel
            label="Name"
            id={field.name}
          >
            <Input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => {
                field.handleChange(e.target.value)
                form.handleSubmit()
              }}
              aria-invalid={!field.state.meta.isValid}
              aria-describedby={!field.state.meta.isValid ? `${field.name}-error` : undefined}
            />
            {!field.state.meta.isValid && (
              <em id={`${field.name}-error`} className="text-sm text-destructive mt-1">
                {field.state.meta.errors.map(error => error?.message).join(', ')}
              </em>
            )}
          </FieldWithLabel>
        )}
      </form.Field>

      {/* <form.Field name="description">
          {field => (
            <FieldWithLabel
              label="Description"
              id={field.name}
              className={field.state.meta.errors.length > 0 ? 'has-error' : ''}
            >
              <Input
                id={field.name}
                value={field.state.value ?? ''}
                onBlur={field.handleBlur}
                onChange={(e) => {
                  field.handleChange(e.target.value)
                  handleAutoSave()
                }}
                placeholder="Optional description for this provider"
                aria-invalid={field.state.meta.errors.length > 0}
                aria-describedby={field.state.meta.errors.length > 0 ? `${field.name}-error` : undefined}
              />
              {field.state.meta.errors.length > 0 && (
                <p id={`${field.name}-error`} className="text-sm text-destructive mt-1">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </FieldWithLabel>
          )}
        </form.Field> */}

      {/* <APIKeyField /> */}
    </form>
  )
}
