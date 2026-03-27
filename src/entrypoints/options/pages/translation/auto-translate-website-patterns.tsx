import { i18n } from "#imports"
import { useAtom } from "jotai"
import { configFieldsAtomMap } from "@/utils/atoms/config"
import { normalizeDomainPattern } from "@/utils/url"
import { ConfigCard } from "../../components/config-card"
import { PatternsTable } from "../../components/patterns-table"

export function AutoTranslateWebsitePatterns() {
  const [translateConfig, setTranslateConfig] = useAtom(configFieldsAtomMap.translate)
  const { autoTranslatePatterns } = translateConfig.page

  const addPattern = (pattern: string) => {
    const normalizedPattern = normalizeDomainPattern(pattern)
    if (!normalizedPattern || autoTranslatePatterns.includes(normalizedPattern))
      return

    void setTranslateConfig({
      page: {
        ...translateConfig.page,
        autoTranslatePatterns: [...autoTranslatePatterns, normalizedPattern],
      },
    })
  }

  const removePattern = (pattern: string) => {
    void setTranslateConfig({
      page: {
        ...translateConfig.page,
        autoTranslatePatterns: autoTranslatePatterns.filter(p => p !== pattern),
      },
    })
  }

  return (
    <ConfigCard id="auto-translate-website" title={i18n.t("options.translation.autoTranslateWebsite.title")} description={i18n.t("options.translation.autoTranslateWebsite.description")}>
      <PatternsTable
        patterns={autoTranslatePatterns}
        onAddPattern={addPattern}
        onRemovePattern={removePattern}
        placeholderText={i18n.t("options.translation.autoTranslateWebsite.enterUrlPattern")}
        tableHeaderText={i18n.t("options.translation.autoTranslateWebsite.urlPattern")}
      />
    </ConfigCard>
  )
}
