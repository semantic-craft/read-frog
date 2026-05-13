import { describe, expect, it } from "vitest"
import { parseDetectedLanguageCode } from "../language-detection"

describe("parseDetectedLanguageCode", () => {
  it("canonicalizes mixed-case language codes after normalization", () => {
    expect(parseDetectedLanguageCode("cmn-Hant")).toBe("cmn-Hant")
    expect(parseDetectedLanguageCode("cmn-hant")).toBe("cmn-Hant")
    expect(parseDetectedLanguageCode(" `cmn-Hant`, ")).toBe("cmn-Hant")
  })
})
