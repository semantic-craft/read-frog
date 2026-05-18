// @vitest-environment jsdom
import { createFormHook } from "@tanstack/react-form"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { fieldContext, formContext } from "../form-context"
import { InputFieldAutoSave } from "../input-field-auto-save"

const { useAppForm } = createFormHook({
  fieldComponents: {
    InputFieldAutoSave,
  },
  formComponents: {},
  fieldContext,
  formContext,
})

function InputFieldAutoSaveHarness({ onSubmit }: { onSubmit: (value: string | undefined) => void }) {
  const form = useAppForm({
    defaultValues: {
      name: "",
    },
    onSubmit: async ({ value }) => {
      onSubmit(value.name)
    },
  })

  return (
    <form.AppForm>
      <form.AppField name="name">
        {field => <field.InputFieldAutoSave formForSubmit={form} label="Name" />}
      </form.AppField>
    </form.AppForm>
  )
}

describe("inputFieldAutoSave", () => {
  it("submits ordinary input changes immediately", async () => {
    const handleSubmit = vi.fn()
    render(<InputFieldAutoSaveHarness onSubmit={handleSubmit} />)

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Read Frog" } })

    expect(screen.getByRole("textbox")).toHaveValue("Read Frog")
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1)
      expect(handleSubmit).toHaveBeenLastCalledWith("Read Frog")
    })
  })

  it("waits until IME composition ends before autosaving", async () => {
    const handleSubmit = vi.fn()
    render(<InputFieldAutoSaveHarness onSubmit={handleSubmit} />)
    const input = screen.getByRole("textbox")

    fireEvent.compositionStart(input)
    fireEvent.change(input, { target: { value: "ni" } })

    await act(async () => {
      await Promise.resolve()
    })

    expect(input).toHaveValue("ni")
    expect(handleSubmit).not.toHaveBeenCalled()

    fireEvent.compositionEnd(input, { target: { value: "你" } })

    expect(input).toHaveValue("你")
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1)
      expect(handleSubmit).toHaveBeenLastCalledWith("你")
    })
  })
})
