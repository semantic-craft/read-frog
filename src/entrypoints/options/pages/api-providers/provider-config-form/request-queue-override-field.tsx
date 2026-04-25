import type { APIProviderConfig } from "@/types/config/provider"
import type { RequestQueueConfig } from "@/types/config/translate"
import { i18n } from "#imports"
import { useStore } from "@tanstack/react-form"
import { useEffect, useEffectEvent, useState } from "react"
import { toast } from "sonner"
import { HelpTooltip } from "@/components/help-tooltip"
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/base-ui/field"
import { Input } from "@/components/ui/base-ui/input"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { isLLMProviderConfig } from "@/types/config/provider"
import { requestQueueConfigSchema } from "@/types/config/translate"
import { compactObject } from "@/types/utils"
import { MIN_TRANSLATE_CAPACITY, MIN_TRANSLATE_RATE } from "@/utils/constants/translate"
import { withForm } from "./form"

type RequestQueueKey = keyof RequestQueueConfig

type LocalRequestQueueValues = Record<RequestQueueKey, string>

const propertyInfo = {
  capacity: {
    label: i18n.t("options.translation.requestQueueConfig.capacity.title"),
    description: i18n.t("options.translation.requestQueueConfig.capacity.description"),
    min: MIN_TRANSLATE_CAPACITY,
  },
  rate: {
    label: i18n.t("options.translation.requestQueueConfig.rate.title"),
    description: i18n.t("options.translation.requestQueueConfig.rate.description"),
    min: MIN_TRANSLATE_RATE,
  },
} satisfies Record<RequestQueueKey, { label: string, description: string, min: number }>

function toLocalValues(requestQueueConfig?: Partial<RequestQueueConfig>): LocalRequestQueueValues {
  return {
    capacity: requestQueueConfig?.capacity?.toString() ?? "",
    rate: requestQueueConfig?.rate?.toString() ?? "",
  }
}

function areSameRequestQueueConfig(
  left?: Partial<RequestQueueConfig>,
  right?: Partial<RequestQueueConfig>,
): boolean {
  return left?.capacity === right?.capacity && left?.rate === right?.rate
}

function parseRequestQueueOverride(localValues: LocalRequestQueueValues) {
  const parsed = compactObject({
    capacity: localValues.capacity === "" ? undefined : Number(localValues.capacity),
    rate: localValues.rate === "" ? undefined : Number(localValues.rate),
  }) as Partial<RequestQueueConfig>

  const parseResult = requestQueueConfigSchema.partial().safeParse(parsed)
  if (!parseResult.success) {
    return { success: false as const, error: parseResult.error.issues[0]?.message ?? "Invalid request queue config" }
  }

  return {
    success: true as const,
    value: Object.keys(parsed).length > 0 ? parsed : undefined,
  }
}

export const RequestQueueOverrideField = withForm({
  ...{ defaultValues: {} as APIProviderConfig },
  render: function Render({ form }) {
    const providerConfig = useStore(form.store, state => state.values)
    const isLLMProvider = isLLMProviderConfig(providerConfig)
    const [localValues, setLocalValues] = useState(() => toLocalValues(providerConfig.requestQueueConfig))

    const syncLocalValues = useEffectEvent(() => {
      // eslint-disable-next-line react/set-state-in-effect
      setLocalValues(toLocalValues(providerConfig.requestQueueConfig))
    })

    useEffect(() => {
      syncLocalValues()
    }, [providerConfig.id, providerConfig.requestQueueConfig?.capacity, providerConfig.requestQueueConfig?.rate])

    const debouncedValues = useDebouncedValue(localValues, 500)

    useEffect(() => {
      const parseResult = parseRequestQueueOverride(debouncedValues)
      if (!parseResult.success) {
        const hasValue = Object.values(debouncedValues).some(value => value !== "")
        if (hasValue) {
          toast.error(parseResult.error)
        }
        return
      }

      if (areSameRequestQueueConfig(providerConfig.requestQueueConfig, parseResult.value)) {
        return
      }

      form.setFieldValue("requestQueueConfig", parseResult.value)
      void form.handleSubmit()
    }, [debouncedValues, form, providerConfig.requestQueueConfig])

    if (!isLLMProvider) {
      return null
    }

    return (
      <FieldGroup>
        <div className="flex items-center gap-1.5">
          <span>{i18n.t("options.apiProviders.form.requestQueueConfigOverride")}</span>
          <HelpTooltip>{i18n.t("options.apiProviders.form.requestQueueConfigOverrideHint")}</HelpTooltip>
        </div>
        {(Object.keys(propertyInfo) as RequestQueueKey[]).map((property) => {
          const info = propertyInfo[property]
          const inputId = `provider-request-queue-${property}-${providerConfig.id}`

          return (
            <Field key={property} orientation="responsive">
              <FieldContent className="self-center">
                <FieldLabel htmlFor={inputId}>
                  {info.label}
                  <HelpTooltip>{info.description}</HelpTooltip>
                </FieldLabel>
              </FieldContent>
              <Input
                id={inputId}
                className="w-40 shrink-0"
                type="number"
                min={info.min}
                value={localValues[property]}
                onChange={event => setLocalValues(prev => ({
                  ...prev,
                  [property]: event.target.value,
                }))}
              />
            </Field>
          )
        })}
      </FieldGroup>
    )
  },
})
