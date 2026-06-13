import type { ActionCollectionStoreListItem } from "@read-frog/api-contract"
import { Icon } from "@iconify/react"
import { i18n } from "#imports"
import { Skeleton } from "@/components/ui/base-ui/skeleton"
import { useActionCollectionPublicCollections } from "@/orpc/action-collection"
import { useActionCollectionDetailDialog } from "./action-collection-detail-dialog"

export function FeaturedActionCollections() {
  const { items, isLoading } = useActionCollectionPublicCollections({ limit: 6, sort: "all_time" })
  const { openDetail } = useActionCollectionDetailDialog()

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
              <Skeleton key={key} className="h-[76px] w-52 shrink-0 rounded-xl" />
            ))
          : items.map(item => (
              <FeaturedCard key={item.collectionId} item={item} onOpen={() => openDetail(item.collectionId)} />
            ))}
      </div>
    </div>
  )
}

function FeaturedCard({ item, onOpen }: { item: ActionCollectionStoreListItem, onOpen: () => void }) {
  return (
    <button
      type="button"
      className="group flex w-52 shrink-0 cursor-pointer flex-col gap-1 rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
      onClick={onOpen}
    >
      <div className="flex items-center gap-1.5">
        <Icon icon={item.icon ?? "tabler:sparkles"} className="size-4 shrink-0 text-foreground/80" />
        <span className="truncate text-sm font-semibold text-foreground">{item.name}</span>
      </div>
      <div className="truncate text-xs text-muted-foreground">{item.description}</div>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground/70">
        <span className="truncate text-muted-foreground">{item.author.displayName}</span>
        <span className="flex shrink-0 items-center gap-1">
          <Icon icon="tabler:download" className="size-3.5" />
          {item.installCount}
        </span>
      </div>
    </button>
  )
}
