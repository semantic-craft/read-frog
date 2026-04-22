// @vitest-environment jsdom
import type { APIProviderConfig } from "@/types/config/provider"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { useEffect, useState } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ConnectionOptionsField } from "../connection-options-field"
import { formOpts, useAppForm } from "../form"

vi.mock("#imports", () => ({
  i18n: {
    t: (key: string) => key,
  },
}))

vi.mock("@/components/ui/json-code-editor", () => ({
  JSONCodeEditor: ({
    value,
    onChange,
    placeholder,
  }: {
    value?: string
    onChange?: (value: string) => void
    placeholder?: string
  }) => (
    <textarea
      aria-label="connection-option-headers"
      value={value}
      placeholder={placeholder}
      onChange={event => onChange?.(event.target.value)}
    />
  ),
}))

const baseProviderConfig: APIProviderConfig = {
  id: "provider-1",
  name: "OpenAI",
  enabled: true,
  provider: "openai",
  model: {
    model: "gpt-5-mini",
    isCustomModel: false,
    customModel: null,
  },
  connectionOptions: undefined,
}

function ConnectionOptionsFieldHarness({ initialConfig }: { initialConfig: APIProviderConfig }) {
  const [providerConfig, setProviderConfig] = useState(initialConfig)
  const form = useAppForm({
    ...formOpts,
    defaultValues: providerConfig,
    onSubmit: async ({ value }) => {
      setProviderConfig(value)
    },
  })

  useEffect(() => {
    form.reset(providerConfig)
  }, [providerConfig, form])

  return (
    <>
      <ConnectionOptionsField form={form} />
      <output aria-label="persisted-connection-options">{JSON.stringify(providerConfig.connectionOptions ?? null)}</output>
    </>
  )
}

describe("connectionOptionsField", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it("renders a headers JSON editor for supported LLM providers and saves valid JSON", async () => {
    render(<ConnectionOptionsFieldHarness initialConfig={baseProviderConfig} />)

    const editor = screen.getByLabelText("connection-option-headers")
    fireEvent.change(editor, {
      target: {
        value: JSON.stringify({
          "HTTP-Referer": "https://example.com",
          "X-Title": "Read Frog",
        }),
      },
    })

    await act(async () => {
      vi.advanceTimersByTime(500)
      await Promise.resolve()
    })

    expect(screen.getByLabelText("persisted-connection-options")).toHaveTextContent(
      JSON.stringify({
        headers: {
          "HTTP-Referer": "https://example.com",
          "X-Title": "Read Frog",
        },
      }),
    )
  })

  it("shows a validation error and does not save malformed headers JSON", async () => {
    render(<ConnectionOptionsFieldHarness initialConfig={baseProviderConfig} />)

    const editor = screen.getByLabelText("connection-option-headers")
    fireEvent.change(editor, { target: { value: "{" } })

    await act(async () => {
      vi.advanceTimersByTime(500)
      await Promise.resolve()
    })

    expect(screen.getByText("options.apiProviders.form.invalidJson")).toBeInTheDocument()
    expect(screen.getByLabelText("persisted-connection-options")).toHaveTextContent("null")
  })
})
