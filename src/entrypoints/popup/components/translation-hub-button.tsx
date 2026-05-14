import { browser, i18n } from "#imports"
import { Icon } from "@iconify/react"
import { Button } from "@/components/ui/base-ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/base-ui/tooltip"

export function TranslationHubButton() {
  const handleClick = async () => {
    await openTranslationHub()
  }

  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon" onClick={handleClick} />}>
        <Icon icon="tabler:language-hiragana" />
      </TooltipTrigger>
      <TooltipContent className="max-w-[200px] text-wrap">
        {i18n.t("popup.hub.tooltip")}
      </TooltipContent>
    </Tooltip>
  )
}

export function TranslationHubFooterButton() {
  return (
    <button
      type="button"
      className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 hover:bg-neutral-300 dark:hover:bg-neutral-700"
      onClick={() => {
        void openTranslationHub()
      }}
    >
      <Icon icon="tabler:language-hiragana" className="size-4" strokeWidth={1.6} />
      <span className="text-[13px] font-medium">{i18n.t("popup.more.translationHub")}</span>
    </button>
  )
}

async function openTranslationHub() {
  await browser.tabs.create({
    url: browser.runtime.getURL("/translation-hub.html"),
  })
}
