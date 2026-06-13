import { Icon } from "@iconify/react"
import { useState } from "react"
import { i18n } from "#imports"
import { Skeleton } from "@/components/ui/base-ui/skeleton"
import { useActionCollectionPublicCollections } from "@/orpc/action-collection"
import { ActionCollectionDetailDialog } from "./ai-feature-store"

export function FeaturedActionCollections() {
  const { items, isLoading } = useActionCollectionPublicCollections({ limit: 6, sort: "all_time" })
  const [detailId, setDetailId] = useState<number | null>(null)

  if (!isLoading && items.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-muted-foreground">
        {i18n.t("options.floatingButtonAndToolbar.selectionToolbar.customActions.actionCollection.featured")}
      </span>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {isLoading
          ? Array.from({ length: 4 }, (_, index) => `featured-skeleton-${index + 1}`).map(key => (
              <Skeleton key={key} className="h-2 w-64 shrink-0 rounded-xl" />
            ))
          : items.map(item => (
              <button
                key={item.collectionId}
                type="button"
                className="group relative flex w-64 shrink-0 cursor-pointer items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
                onClick={() => setDetailId(item.collectionId)}
              >
                <span className="absolute right-3 top-3 flex items-center gap-1 text-xs text-muted-foreground">
                  <Icon icon="tabler:download" className="size-3.5" />
                  {item.installCount}
                </span>
                <div className="flex size-10 shrink-0 items-center justify-center">
                  <Icon icon={item.icon ?? "tabler:sparkles"} className="size-6 text-foreground/80" />
                </div>
                <div className="min-w-0 flex-1 pr-8">
                  <div className="truncate text-sm font-semibold text-foreground">{item.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{item.description}</div>
                  <div className="truncate text-xs text-muted-foreground">{item.author.displayName}</div>
                </div>
              </button>
            ))}
      </div>
      <ActionCollectionDetailDialog
        open={detailId != null}
        collectionId={detailId}
        onOpenChange={(open) => {
          if (!open) {
            setDetailId(null)
          }
        }}
        onInstalled={() => setDetailId(null)}
      />
    </div>
  )
}
