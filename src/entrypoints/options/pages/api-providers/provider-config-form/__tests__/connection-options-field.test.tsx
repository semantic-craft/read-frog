// @vitest-environment jsdom
import type { APIProviderConfig } from "@/types/config/provider"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { useEffect, useState } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AdvancedOptionsSection } from "../components/advanced-options-section"
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

const bedrockProviderConfig: APIProviderConfig = {
  id: "provider-2",
  name: "Bedrock",
  enabled: true,
  provider: "bedrock",
  model: {
    model: "us.meta.llama4-scout-17b-instruct-v1:0",
    isCustomModel: false,
    customModel: null,
  },
  connectionOptions: {
    region: "us-west-2",
  },
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

function ConnectionOptionsFieldSwitchHarness() {
  const [providerConfig, setProviderConfig] = useState(baseProviderConfig)
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
      <button type="button" onClick={() => setProviderConfig(bedrockProviderConfig)}>
        switch-provider
      </button>
      <ConnectionOptionsField form={form} />
      <output aria-label="persisted-provider-id">{providerConfig.id}</output>
      <output aria-label="persisted-connection-options">{JSON.stringify(providerConfig.connectionOptions ?? null)}</output>
    </>
  )
}

function ConnectionOptionsFieldInAdvancedOptionsHarness() {
  const [providerConfig, setProviderConfig] = useState(baseProviderConfig)
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
      <AdvancedOptionsSection>
        <ConnectionOptionsField form={form} />
      </AdvancedOptionsSection>
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

  it("preserves unrelated connectionOptions keys while saving edited fields", async () => {
    render(
      <ConnectionOptionsFieldHarness
        initialConfig={{
          ...baseProviderConfig,
          connectionOptions: {
            timeoutMs: 30000,
          },
        }}
      />,
    )

    fireEvent.change(screen.getByLabelText("connection-option-headers"), {
      target: {
        value: JSON.stringify({
          Authorization: "Bearer token",
        }),
      },
    })

    await act(async () => {
      vi.advanceTimersByTime(500)
      await Promise.resolve()
    })

    expect(screen.getByLabelText("persisted-connection-options")).toHaveTextContent(
      JSON.stringify({
        timeoutMs: 30000,
        headers: {
          Authorization: "Bearer token",
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

  it("keeps debounced connection-option autosave alive while advanced options is collapsed", async () => {
    render(<ConnectionOptionsFieldInAdvancedOptionsHarness />)

    const advancedTrigger = screen.getByText("options.apiProviders.form.advancedOptions")
    fireEvent.click(advancedTrigger)

    fireEvent.change(screen.getByLabelText("connection-option-headers"), {
      target: {
        value: JSON.stringify({
          "X-Title": "Read Frog",
        }),
      },
    })

    fireEvent.click(advancedTrigger)

    await act(async () => {
      vi.advanceTimersByTime(500)
      await Promise.resolve()
    })

    expect(screen.getByLabelText("persisted-connection-options")).toHaveTextContent(
      JSON.stringify({
        headers: {
          "X-Title": "Read Frog",
        },
      }),
    )
  })

  it("does not submit stale debounced headers when switching providers", async () => {
    render(<ConnectionOptionsFieldSwitchHarness />)

    fireEvent.change(screen.getByLabelText("connection-option-headers"), {
      target: {
        value: JSON.stringify({
          "X-Title": "Read Frog",
        }),
      },
    })

    fireEvent.click(screen.getByRole("button", { name: "switch-provider" }))

    await act(async () => {
      vi.advanceTimersByTime(500)
      await Promise.resolve()
    })

    expect(screen.getByLabelText("persisted-provider-id")).toHaveTextContent("provider-2")
    expect(screen.getByLabelText("persisted-connection-options")).toHaveTextContent(
      JSON.stringify({
        region: "us-west-2",
      }),
    )
  })
})
