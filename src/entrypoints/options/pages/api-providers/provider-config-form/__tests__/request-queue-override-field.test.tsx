// @vitest-environment jsdom
import type { ReactNode } from "react"
import type { APIProviderConfig } from "@/types/config/provider"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { useEffect, useState } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { formOpts, useAppForm } from "../form"
import { RequestQueueOverrideField } from "../request-queue-override-field"

vi.mock("#imports", () => ({
  i18n: {
    t: (key: string) => key,
  },
}))

vi.mock("@/components/help-tooltip", () => ({
  HelpTooltip: ({ children }: { children: ReactNode }) => <span>{children}</span>,
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
}

function RequestQueueOverrideFieldHarness({
  initialConfig,
}: {
  initialConfig: APIProviderConfig
}) {
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
      <RequestQueueOverrideField form={form} />
      <output aria-label="persisted-request-queue-config">{JSON.stringify(providerConfig.requestQueueConfig ?? null)}</output>
    </>
  )
}

describe("requestQueueOverrideField", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it("persists a partial provider override without forcing other values", async () => {
    render(<RequestQueueOverrideFieldHarness initialConfig={baseProviderConfig} />)

    fireEvent.change(screen.getByRole("spinbutton", { name: /options.translation.requestQueueConfig.rate.title/ }), {
      target: { value: "1" },
    })

    await act(async () => {
      vi.advanceTimersByTime(500)
      await Promise.resolve()
    })

    expect(screen.getByLabelText("persisted-request-queue-config")).toHaveTextContent("{\"rate\":1}")
  })

  it("removes the override when every provider-specific value is cleared", async () => {
    render(
      <RequestQueueOverrideFieldHarness
        initialConfig={{
          ...baseProviderConfig,
          requestQueueConfig: {
            rate: 1,
            capacity: 2,
          },
        }}
      />,
    )

    fireEvent.change(screen.getByRole("spinbutton", { name: /options.translation.requestQueueConfig.rate.title/ }), {
      target: { value: "" },
    })
    fireEvent.change(screen.getByRole("spinbutton", { name: /options.translation.requestQueueConfig.capacity.title/ }), {
      target: { value: "" },
    })

    await act(async () => {
      vi.advanceTimersByTime(500)
      await Promise.resolve()
    })

    expect(screen.getByLabelText("persisted-request-queue-config")).toHaveTextContent("null")
  })
})
