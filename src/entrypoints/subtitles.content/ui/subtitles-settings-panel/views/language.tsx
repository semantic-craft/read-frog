import { i18n } from "#imports"
import { IconCheck } from "@tabler/icons-react"
import { useAtom } from "jotai"
import { getCommonSubtitleLanguageItems } from "@/components/language-combobox-options"
import { Button } from "@/components/ui/base-ui/button"
import { configFieldsAtomMap } from "@/utils/atoms/config"
import { cn } from "@/utils/styles/utils"
import { subtitlesStore } from "../../../atoms"

export function LanguageView() {
  const [config, setConfig] = useAtom(configFieldsAtomMap.videoSubtitles, { store: subtitlesStore })
  const languageItems = getCommonSubtitleLanguageItems()

  return (
    <div className="min-h-[calc(100cqh-6rem)] px-3 pb-4 pt-3">
      <p className="text-muted-foreground mb-2.5 px-0.5 text-[11px] leading-4.5">
        {i18n.t("options.videoSubtitles.language.sourceDescription")}
      </p>

      <div className="bg-muted/50 divide-border overflow-hidden rounded-xl border divide-y">
        {languageItems.map((item) => {
          const selected = config.sourceCode === item.value

          return (
            <Button
              key={item.value}
              type="button"
              variant="ghost"
              onClick={() => {
                if (selected) {
                  return
                }
                void setConfig({ sourceCode: item.value })
              }}
              className={cn(
                "h-14 w-full justify-start rounded-none px-3 text-left hover:bg-accent/40",
                selected && "bg-accent/60 text-popover-foreground hover:bg-accent/60",
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex size-5 shrink-0 items-center justify-center">
                  {selected ? <IconCheck className="size-4" /> : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] leading-5">
                    {item.label}
                  </div>
                </div>
              </div>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
