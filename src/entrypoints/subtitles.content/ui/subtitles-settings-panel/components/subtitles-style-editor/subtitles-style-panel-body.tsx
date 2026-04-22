import { ScrollArea } from "@/components/ui/base-ui/scroll-area"
import { SubtitlesStyleEditor } from "./subtitles-style-editor"

export function SubtitlesStylePanelBody() {
  return (
    <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]]:overscroll-contain">
      <div className="px-3 py-3.5 sm:px-4">
        <SubtitlesStyleEditor variant="panel" />
      </div>
    </ScrollArea>
  )
}
