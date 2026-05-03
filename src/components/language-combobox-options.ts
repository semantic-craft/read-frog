import type { LangCodeISO6393 } from "@read-frog/definitions"
import { i18n } from "#imports"
import {
  LANG_CODE_TO_LOCALE_NAME,
  langCodeISO6393Schema,
} from "@read-frog/definitions"
import { camelCase } from "case-anything"

export interface LanguageItem<T extends LangCodeISO6393 | "auto" = LangCodeISO6393 | "auto"> {
  value: T
  label: string
  name: string
}

const COMMON_SUBTITLE_LANGUAGE_CODES: LangCodeISO6393[] = [
  "eng",
  "cmn",
  "cmn-Hant",
  "jpn",
  "kor",
  "arb",
  "tur",
  "rus",
  "vie",
  "tha",
  "deu",
  "spa",
  "fra",
  "por",
  "ind",
  "hin",
]

export function getLanguageName(code: LangCodeISO6393) {
  return i18n.t(`languages.${camelCase(code)}` as Parameters<typeof i18n.t>[0])
}

export function getLanguageLabel(code: LangCodeISO6393) {
  return `${getLanguageName(code)} (${LANG_CODE_TO_LOCALE_NAME[code]})`
}

export function getLanguageValueLabel(value: LangCodeISO6393 | "auto") {
  return value === "auto" ? i18n.t("popup.autoLang") : getLanguageName(value)
}

export function getTargetLanguageItems(): LanguageItem<LangCodeISO6393>[] {
  return langCodeISO6393Schema.options.map(code => ({
    value: code,
    label: getLanguageLabel(code),
    name: getLanguageName(code),
  }))
}

export function getLanguageItems(detectedLangCode?: LangCodeISO6393): LanguageItem[] {
  return [
    {
      value: "auto",
      label: detectedLangCode ? getLanguageLabel(detectedLangCode) : i18n.t("popup.autoLang"),
      name: detectedLangCode ? getLanguageName(detectedLangCode) : i18n.t("popup.autoLang"),
    },
    ...getTargetLanguageItems(),
  ]
}

export function getCommonSubtitleLanguageItems(): LanguageItem[] {
  return [
    {
      value: "auto",
      label: i18n.t("popup.autoLang"),
      name: i18n.t("popup.autoLang"),
    },
    ...COMMON_SUBTITLE_LANGUAGE_CODES.map(code => ({
      value: code,
      label: getLanguageName(code),
      name: getLanguageName(code),
    })),
  ]
}

export function filterLanguage(item: LanguageItem, query: string): boolean {
  const searchLower = query.toLowerCase()
  return item.label.toLowerCase().includes(searchLower)
    || item.name.toLowerCase().includes(searchLower)
    || item.value.toLowerCase().includes(searchLower)
}
