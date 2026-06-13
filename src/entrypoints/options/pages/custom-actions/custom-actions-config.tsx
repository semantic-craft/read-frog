import { i18n } from "#imports"
import { Badge } from "@/components/ui/base-ui/badge"
import { ConfigCard } from "../../components/config-card"
import { EntityEditorLayout } from "../../components/entity-editor-layout"
import { CustomActionConfigForm } from "./action-config-form"
import { CustomActionCardList } from "./components/action-card-list"
import { FeaturedActionCollections } from "./components/featured-collections"
import { MyPublishedButton } from "./components/my-published-button"

export function CustomActionsConfig() {
  return (
    <ConfigCard
      id="custom-actions"
      title={(
        <div className="flex w-full items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2">
            {i18n.t("options.floatingButtonAndToolbar.selectionToolbar.customActions.title")}
            <Badge variant="secondary" className="text-xs font-medium">Public Beta</Badge>
          </span>
          <MyPublishedButton />
        </div>
      )}
      description={i18n.t("options.floatingButtonAndToolbar.selectionToolbar.customActions.description")}
      className="lg:flex-col"
    >
      <div className="flex flex-col gap-4">
        <FeaturedActionCollections />
        <EntityEditorLayout list={<CustomActionCardList />} editor={<CustomActionConfigForm />} />
      </div>
    </ConfigCard>
  )
}
