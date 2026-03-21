import { i18n } from "#imports"
import { RiTranslate } from "@remixicon/react"
import { useCallback, useState } from "react"
import { SelectionPopover } from "@/components/ui/selection-popover"
import { SelectionToolbarTooltip } from "../../components/selection-tooltip"
import { useSelectionTranslationPopover } from "./provider"

export function TranslateButton() {
  const { prepareToolbarOpen } = useSelectionTranslationPopover()
  const triggerLabel = i18n.t("action.translation")
  const [tooltipOpen, setTooltipOpen] = useState(false)

  const handleClick = useCallback(() => {
    setTooltipOpen(false)
    prepareToolbarOpen()
  }, [prepareToolbarOpen])

  return (
    <SelectionToolbarTooltip
      content={triggerLabel}
      open={tooltipOpen}
      onOpenChange={setTooltipOpen}
      render={<SelectionPopover.Trigger aria-label={triggerLabel} onClick={handleClick} />}
    >
      <RiTranslate className="size-4.5" />
    </SelectionToolbarTooltip>
  )
}
