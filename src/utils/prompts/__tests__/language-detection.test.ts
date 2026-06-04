import { beforeEach, describe, expect, it, vi } from "vitest"
import { parseDetectedLanguageCode } from "../language-detection"

const validJson = JSON.stringify({ reason: "It is an English word.", code: "eng" })

describe("parseDetectedLanguageCode", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {})
  })

  it("parses a raw JSON response", () => {
    expect(parseDetectedLanguageCode(validJson)).toBe("eng")
  })

  it("strips ```json code fences before parsing", () => {
    expect(parseDetectedLanguageCode(`\`\`\`json\n${validJson}\n\`\`\``)).toBe("eng")
  })

  it("strips bare ``` code fences before parsing", () => {
    expect(parseDetectedLanguageCode(`\`\`\`\n${validJson}\n\`\`\``)).toBe("eng")
  })

  it("strips code fences with whitespace before the info string", () => {
    expect(parseDetectedLanguageCode(`\`\`\` json\n${validJson}\n\`\`\``)).toBe("eng")
  })

  it("returns und when the model reports an undetermined language", () => {
    expect(parseDetectedLanguageCode(JSON.stringify({ reason: "Unknown.", code: "und" }))).toBe("und")
  })

  it("returns null for non-JSON output", () => {
    expect(parseDetectedLanguageCode("The language is English.")).toBeNull()
  })

  it("returns null when code is not a supported language", () => {
    expect(parseDetectedLanguageCode(JSON.stringify({ reason: "?", code: "xx" }))).toBeNull()
  })
})
