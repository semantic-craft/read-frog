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

    const [draftValues, setDraftValues] = useState<Record<string, string>>(() => {
      if (!fieldDefs) {
        return {}
      }

      return Object.fromEntries(
        fieldDefs.map((def) => {
          const currentValue = providerConfig.connectionOptions?.[def.key]
          return [def.key, def.type === "json" ? toJsonInput(currentValue) : String(currentValue ?? "")]
        }),
      )
    })

    const syncDraftValues = useEffectEvent(() => {
      if (!fieldDefs) {
        // eslint-disable-next-line react/set-state-in-effect
        setDraftValues({})
        return
      }

      // eslint-disable-next-line react/set-state-in-effect
      setDraftValues(Object.fromEntries(
        fieldDefs.map((def) => {
          const currentValue = providerConfig.connectionOptions?.[def.key]
          return [def.key, def.type === "json" ? toJsonInput(currentValue) : String(currentValue ?? "")]
        }),
      ))
    })

    useEffect(() => {
      syncDraftValues()
    }, [providerConfig.id, fieldDefs])

    const debouncedDraftValues = useDebouncedValue(draftValues, 500)

    const parsedDraftValues = useMemo<Record<string, ParsedConnectionOptionValue> | null>(() => {
      if (!fieldDefs) {
        return null
      }

      return Object.fromEntries(fieldDefs.map((def) => {
        const rawValue = debouncedDraftValues[def.key] ?? ""
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
    }, [debouncedDraftValues, fieldDefs])

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

      const nextConnectionOptions = compactObject(
        Object.fromEntries(validParsedDraftValues.map(([key, result]) => [key, result.value])),
      )

      form.setFieldValue(
        "connectionOptions",
        Object.keys(nextConnectionOptions).length > 0 ? nextConnectionOptions : undefined,
      )
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
