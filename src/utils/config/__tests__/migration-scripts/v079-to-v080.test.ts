import { describe, expect, it } from "vitest"
import { migrate } from "../../migration-scripts/v079-to-v080"

describe("v079-to-v080 migration", () => {
  it("converts removed DeepSeek selector-backed models into custom model entries", () => {
    const migrated = migrate({
      providersConfig: [
        {
          id: "deepseek-default",
          provider: "deepseek",
          model: {
            model: "deepseek-v4-flash",
            isCustomModel: false,
            customModel: "stale-dormant-custom-value",
          },
        },
        {
          id: "deepseek-pro-default",
          provider: "deepseek",
          model: {
            model: "deepseek-v4-pro",
            isCustomModel: false,
            customModel: null,
          },
        },
        {
          id: "openai-default",
          provider: "openai",
          model: {
            model: "gpt-5.4-mini",
            isCustomModel: false,
            customModel: null,
          },
        },
      ],
    })

    expect(migrated.providersConfig[0].model).toEqual({
      model: "deepseek-chat",
      isCustomModel: true,
      customModel: "deepseek-v4-flash",
    })
    expect(migrated.providersConfig[1].model).toEqual({
      model: "deepseek-chat",
      isCustomModel: true,
      customModel: "deepseek-v4-pro",
    })
    expect(migrated.providersConfig[2].model).toEqual({
      model: "gpt-5.4-mini",
      isCustomModel: false,
      customModel: null,
    })
  })

  it("preserves active custom values and leaves retained DeepSeek models untouched", () => {
    const migrated = migrate({
      providersConfig: [
        {
          id: "deepseek-custom",
          provider: "deepseek",
          model: {
            model: "deepseek-v4-pro",
            isCustomModel: true,
            customModel: "deepseek-custom-alias",
          },
        },
        {
          id: "deepseek-blank-custom",
          provider: "deepseek",
          model: {
            model: "deepseek-v4-flash",
            isCustomModel: true,
            customModel: "   ",
          },
        },
        {
          id: "deepseek-chat-current",
          provider: "deepseek",
          model: {
            model: "deepseek-chat",
            isCustomModel: false,
            customModel: "unused-custom-alias",
          },
        },
      ],
    })

    expect(migrated.providersConfig[0].model).toEqual({
      model: "deepseek-chat",
      isCustomModel: true,
      customModel: "deepseek-custom-alias",
    })
    expect(migrated.providersConfig[1].model).toEqual({
      model: "deepseek-chat",
      isCustomModel: true,
      customModel: "deepseek-v4-flash",
    })
    expect(migrated.providersConfig[2].model).toEqual({
      model: "deepseek-chat",
      isCustomModel: false,
      customModel: "unused-custom-alias",
    })
  })
})
