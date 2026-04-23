import type { APIProviderConfig, LLMProviderTypes } from "@/types/config/provider"
import type { ConnectionOptionFieldDef } from "@/utils/constants/providers"
import { i18n } from "#imports"
import { useStore } from "@tanstack/react-form"
import { useEffect, useEffectEvent, useMemo, useState } from "react"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/base-ui/field"
import { Input } from "@/components/ui/base-ui/input"
import { JSONCodeEditor } from "@/components/ui/json-code-editor"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { isLLMProvider } from "@/types/config/provider"
import { compactObject } from "@/types/utils"
import { PROVIDER_CONNECTION_OPTIONS_FIELDS } from "@/utils/constants/providers"
import { withForm } from "./form"

function toJsonInput(value: unknown) {
  return value ? JSON.stringify(value, null, 2) : ""
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function getDraftValues(
  fieldDefs: ConnectionOptionFieldDef[] | null,
  connectionOptions: APIProviderConfig["connectionOptions"],
): Record<string, string> {
  if (!fieldDefs) {
    return {}
  }

  return Object.fromEntries(
    fieldDefs.map((def) => {
      const currentValue = connectionOptions?.[def.key]
      return [def.key, def.type === "json" ? toJsonInput(currentValue) : String(currentValue ?? "")]
    }),
  )
}

function sortObjectKeys(value: unknown): unknown {
  if (!isPlainObject(value)) {
    return value
  }

  return Object.fromEntries(
    Object.entries(value)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(([key, item]) => [key, sortObjectKeys(item)]),
  )
}

function toComparableConnectionOptions(value: APIProviderConfig["connectionOptions"]) {
  if (!value) {
    return "null"
  }

  return JSON.stringify(sortObjectKeys(compactObject(value)))
}

function parseJsonField(
  def: ConnectionOptionFieldDef,
  input: string,
): { valid: true, value: Record<string, unknown> | undefined } | { valid: false, error: string } {
  if (!input.trim()) {
    return { valid: true, value: undefined }
  }

  try {
    const parsed = JSON.parse(input)
    if (!isPlainObject(parsed)) {
      return { valid: false, error: i18n.t("options.apiProviders.form.invalidJson") }
    }

    if (def.key === "headers" && Object.values(parsed).some(value => typeof value !== "string")) {
      return { valid: false, error: i18n.t("options.apiProviders.form.invalidJson") }
    }

    return { valid: true, value: parsed }
  }
  catch {
    return { valid: false, error: i18n.t("options.apiProviders.form.invalidJson") }
  }
}

type ParsedConnectionOptionValue = { valid: true, value: Record<string, unknown> | string | undefined } | { valid: false, error: string }

export const ConnectionOptionsField = withForm({
  ...{ defaultValues: {} as APIProviderConfig },
  render: function Render({ form }) {
    const providerConfig = useStore(form.store, state => state.values)
    const providerType = providerConfig.provider

    const fieldDefs = useMemo(() => {
      if (!isLLMProvider(providerType))
        return null
      const defs = PROVIDER_CONNECTION_OPTIONS_FIELDS[providerType as LLMProviderTypes]
      return defs && defs.length > 0 ? defs : null
    }, [providerType])

    const [draftValues, setDraftValues] = useState<Record<string, string>>(() =>
      getDraftValues(fieldDefs, providerConfig.connectionOptions),
    )

    const syncDraftValues = useEffectEvent(() => {
      // eslint-disable-next-line react/set-state-in-effect
      setDraftValues(getDraftValues(fieldDefs, providerConfig.connectionOptions))
    })

    useEffect(() => {
      syncDraftValues()
    }, [providerConfig.id, fieldDefs])

    const debouncedDraftState = useDebouncedValue({
      providerId: providerConfig.id,
      values: draftValues,
    }, 500)

    const parsedDraftValues = useMemo<Record<string, ParsedConnectionOptionValue> | null>(() => {
      if (!fieldDefs || debouncedDraftState.providerId !== providerConfig.id) {
        return null
      }

      return Object.fromEntries(fieldDefs.map((def) => {
        const rawValue = debouncedDraftState.values[def.key] ?? ""
        if (def.type === "json") {
          return [def.key, parseJsonField(def, rawValue)]
        }

        return [
          def.key,
          {
            valid: true,
            value: rawValue.trim() ? rawValue : undefined,
          } satisfies ParsedConnectionOptionValue,
        ]
      }))
    }, [debouncedDraftState, fieldDefs, providerConfig.id])

    const getPreservedConnectionOptions = useEffectEvent(() => {
      if (!fieldDefs) {
        return {}
      }

      const renderedKeys = new Set(fieldDefs.map(def => def.key))
      return Object.fromEntries(
        Object.entries(providerConfig.connectionOptions ?? {}).filter(([key]) => !renderedKeys.has(key)),
      )
    })

    const getComparableConnectionOptions = useEffectEvent(() =>
      toComparableConnectionOptions(providerConfig.connectionOptions),
    )

    useEffect(() => {
      if (!parsedDraftValues) {
        return
      }

      const parseResults = Object.values(parsedDraftValues)
      if (parseResults.some(result => !result.valid)) {
        return
      }

      const validParsedDraftValues = Object.entries(parsedDraftValues).filter((
        entry,
      ): entry is [string, Extract<ParsedConnectionOptionValue, { valid: true }>] => entry[1].valid)

      const nextConnectionOptions = compactObject({
        ...getPreservedConnectionOptions(),
        ...Object.fromEntries(validParsedDraftValues.map(([key, result]) => [key, result.value])),
      })
      const nextValue = Object.keys(nextConnectionOptions).length > 0 ? nextConnectionOptions : undefined

      if (toComparableConnectionOptions(nextValue) === getComparableConnectionOptions()) {
        return
      }

      form.setFieldValue("connectionOptions", nextValue)
      void form.handleSubmit()
    }, [parsedDraftValues, form])

    if (!fieldDefs) {
      return null
    }

    const renderField = (def: ConnectionOptionFieldDef) => {
      const fieldId = `${def.key}-${providerConfig.id}`
      const fieldLabel = i18n.t(`options.apiProviders.form.connectionOptionLabels.${def.labelKey}` as Parameters<typeof i18n.t>[0])
      const parseResult = parsedDraftValues?.[def.key]
      const fieldError = parseResult && !parseResult.valid ? parseResult.error : null

      if (def.type === "json") {
        return (
          <Field key={fieldId}>
            <FieldLabel>{fieldLabel}</FieldLabel>
            <JSONCodeEditor
              aria-label={`connection-option-${def.key}`}
              value={draftValues[def.key] ?? ""}
              onChange={value => setDraftValues(prev => ({ ...prev, [def.key]: value }))}
              placeholder={def.placeholder}
              hasError={!!fieldError}
              height="150px"
            />
            {fieldError && (
              <div className="text-sm font-normal text-destructive">{fieldError}</div>
            )}
          </Field>
        )
      }

      return (
        <Field key={fieldId}>
          <FieldLabel htmlFor={fieldId}>{fieldLabel}</FieldLabel>
          <Input
            id={fieldId}
            type={def.type}
            value={draftValues[def.key] ?? ""}
            placeholder={def.placeholder}
            onChange={e => setDraftValues(prev => ({ ...prev, [def.key]: e.target.value }))}
          />
        </Field>
      )
    }

    return (
      <FieldGroup>
        {fieldDefs.map(renderField)}
      </FieldGroup>
    )
  },
})
