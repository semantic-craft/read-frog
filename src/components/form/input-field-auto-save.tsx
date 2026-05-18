import { useStore } from "@tanstack/react-form"
import { useRef } from "react"
import { Field, FieldError, FieldLabel } from "@/components/ui/base-ui/field"
import { Input } from "@/components/ui/base-ui/input"
import { useFieldContext } from "./form-context"

export function InputFieldAutoSave(
  {
    formForSubmit,
    label,
    labelExtra,
    type,
    onChange,
    onCompositionEnd,
    onCompositionStart,
    ...props
  }:
  { formForSubmit: { handleSubmit: () => void }, label: React.ReactNode, labelExtra?: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>,
) {
  const field = useFieldContext<string | number | undefined>()
  const errors = useStore(field.store, state => state.meta.errors)
  const hasError = errors.length > 0
  const isComposingRef = useRef(false)

  const updateFieldValue = (value: string) => {
    if (type === "number") {
      if (value === "") {
        field.handleChange(undefined)
      }
      else {
        const num = Number(value)
        if (!Number.isNaN(num)) {
          field.handleChange(num)
        }
      }
    }
    else {
      field.handleChange(value)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFieldValue(e.target.value)
    onChange?.(e)

    if (isComposingRef.current)
      return

    void formForSubmit.handleSubmit()
  }

  const handleCompositionStart = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = true
    onCompositionStart?.(e)
  }

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false
    updateFieldValue(e.currentTarget.value)
    onCompositionEnd?.(e)
    void formForSubmit.handleSubmit()
  }

  return (
    <Field invalid={hasError}>
      <div className="flex items-end justify-between w-full">
        <FieldLabel nativeLabel={false} render={<div />}>
          {label}
        </FieldLabel>
        {labelExtra}
      </div>
      <Input
        id={field.name}
        type={type}
        value={field.state.value ?? ""}
        onBlur={field.handleBlur}
        onChange={handleChange}
        onCompositionEnd={handleCompositionEnd}
        onCompositionStart={handleCompositionStart}
        aria-invalid={hasError}
        {...props}
      />
      <FieldError match={hasError}>
        {errors.map(error => typeof error === "string" ? error : error?.message).join(", ")}
      </FieldError>
    </Field>
  )
}
