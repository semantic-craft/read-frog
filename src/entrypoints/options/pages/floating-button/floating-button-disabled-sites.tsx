import { i18n } from "#imports"
import { useAtom } from "jotai"
import { configFieldsAtomMap } from "@/utils/atoms/config"
import { normalizeDomainPattern } from "@/utils/url"
import { ConfigCard } from "../../components/config-card"
import { PatternsTable } from "../../components/patterns-table"

export function FloatingButtonDisabledSites() {
  const [floatingButtonConfig, setFloatingButtonConfig] = useAtom(configFieldsAtomMap.floatingButton)
  const { disabledFloatingButtonPatterns = [] } = floatingButtonConfig

  const addPattern = (pattern: string) => {
    const normalizedPattern = normalizeDomainPattern(pattern)
    if (!normalizedPattern || disabledFloatingButtonPatterns.includes(normalizedPattern))
      return

    void setFloatingButtonConfig({
      ...floatingButtonConfig,
      disabledFloatingButtonPatterns: [...disabledFloatingButtonPatterns, normalizedPattern],
    })
  }

  const removePattern = (pattern: string) => {
    void setFloatingButtonConfig({
      ...floatingButtonConfig,
      disabledFloatingButtonPatterns: disabledFloatingButtonPatterns.filter(p => p !== pattern),
    })
  }

  return (
    <ConfigCard
      id="floating-button-disabled-sites"
      title={i18n.t("options.floatingButtonAndToolbar.floatingButton.disabledSites.title")}
      description={i18n.t("options.floatingButtonAndToolbar.floatingButton.disabledSites.description")}
    >
      <PatternsTable
        patterns={disabledFloatingButtonPatterns}
        onAddPattern={addPattern}
        onRemovePattern={removePattern}
        placeholderText={i18n.t("options.floatingButtonAndToolbar.floatingButton.disabledSites.enterUrlPattern")}
        tableHeaderText={i18n.t("options.floatingButtonAndToolbar.floatingButton.disabledSites.urlPattern")}
      />
    </ConfigCard>
  )
}
