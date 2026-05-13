import { describe, expect, it } from "vitest"
import { detectLanguageWithSource } from "../language"

const TRADITIONAL_CHINESE_SAMPLE = "鳥哥的 Linux 私房菜提供基礎學習篇、伺服器架設篇與各種實務文件，適合想要學習繁體中文技術文章的使用者閱讀。"
const SIMPLIFIED_CHINESE_SAMPLE = "鸟哥的 Linux 私房菜提供基础学习篇、服务器架设篇与各种实务文件，适合想要学习简体中文技术文章的使用者阅读。"

describe("detectLanguageWithSource", () => {
  it("detects clear Traditional Chinese text as cmn-Hant instead of Simplified Mandarin", async () => {
    await expect(detectLanguageWithSource(TRADITIONAL_CHINESE_SAMPLE)).resolves.toEqual({
      code: "cmn-Hant",
      source: "franc",
    })
  })

  it("keeps clear Simplified Chinese text as cmn", async () => {
    await expect(detectLanguageWithSource(SIMPLIFIED_CHINESE_SAMPLE)).resolves.toEqual({
      code: "cmn",
      source: "franc",
    })
  })
})
