import type { APIProviderConfig } from '@/types/config/provider'
import { i18n } from '#imports'
import { Checkbox } from '@repo/ui/components/checkbox'
import { useStore } from '@tanstack/react-form'
import { useSetAtom } from 'jotai'
import { toast } from 'sonner'
import { FieldWithLabel } from '@/entrypoints/options/components/field-with-label'
import { isReadProviderConfig } from '@/types/config/provider'
import { providerConfigAtom, updateLLMProviderConfig } from '@/utils/atoms/provider'
import { withForm } from './form'

export const ReadModelSelector = withForm({
  ...{ defaultValues: {} as APIProviderConfig },
  render: function Render({ form }) {
    const providerConfig = useStore(form.store, state => state.values)
    const setProviderConfig = useSetAtom(providerConfigAtom(providerConfig.id))
    if (!isReadProviderConfig(providerConfig))
      return <></>
    const { isCustomModel, customModel } = providerConfig.models.read

    return (
      <FieldWithLabel
        label="Read Model"
        id="readModel"
      >
        {
          isCustomModel
            ? (
                <form.AppField name="models.read.customModel">
                  {field => <field.InputField formForSubmit={form} label="Custom Model" value={customModel ?? ''} />}
                </form.AppField>
              )
            : null
        }
        <div className="mt-0.5 flex items-center space-x-2">
          <form.Field name="models.read">
            { field => (
              <>
                <Checkbox
                  id="isCustomModel-read"
                  checked={field.state.value.isCustomModel}
                  onCheckedChange={(checked) => {
                    try {
                      if (checked === false) {
                        void setProviderConfig(
                          updateLLMProviderConfig(providerConfig, {
                            models: {
                              read: {
                                customModel: null,
                                isCustomModel: false,
                              },
                            },
                          }),
                        )
                      }
                      else {
                        void setProviderConfig(
                          updateLLMProviderConfig(providerConfig, {
                            models: {
                              read: {
                                customModel: field.state.value.model,
                                isCustomModel: true,
                              },
                            },
                          }),
                        )
                      }
                    }
                    catch (error) {
                      toast.error(error instanceof Error ? error.message : 'Failed to update configuration')
                    }
                  }}
                />
                <label
                  htmlFor="isCustomModel-read"
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {i18n.t('options.general.readConfig.model.enterCustomModel')}
                </label>
              </>
            )}
          </form.Field>
        </div>
      </FieldWithLabel>
    )
  },
})
