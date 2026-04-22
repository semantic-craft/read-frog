import { i18n } from "#imports"
import { IconChevronLeft } from "@tabler/icons-react"
import { Button } from "@/components/ui/base-ui/button"

interface SubtitlesStylePanelHeaderProps {
  onBack: () => void
}

export function SubtitlesStylePanelHeader({ onBack }: SubtitlesStylePanelHeaderProps) {
  return (
    <div className="shrink-0 border-b border-white/8 px-4 pt-3 pb-3">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost-secondary"
          size="icon-sm"
          aria-label="Back to subtitles menu"
          onClick={onBack}
          className="rounded-full border border-white/10 bg-white/[0.03] text-white/82 hover:border-white/14 hover:bg-white/[0.08] hover:text-white"
        >
          <IconChevronLeft className="size-4" />
        </Button>

        <div className="min-w-0 truncate text-sm font-medium text-white/94">
          {i18n.t("options.videoSubtitles.style.title")}
        </div>
      </div>
    </div>
  )
}
