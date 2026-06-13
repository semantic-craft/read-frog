import { Icon } from "@iconify/react"
import { i18n } from "#imports"
import { Button } from "@/components/ui/base-ui/button"
import { env } from "@/env"
import { authClient } from "@/utils/auth/auth-client"

export function MyPublishedButton() {
  const { data: session } = authClient.useSession()

  if (!session?.user) {
    return null
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => window.open(`${env.WXT_WEBSITE_URL}/my-collections`, "_blank", "noopener,noreferrer")}
    >
      <Icon icon="tabler:external-link" className="size-4" />
      {i18n.t("options.floatingButtonAndToolbar.selectionToolbar.customActions.actionCollection.viewMyPublished")}
    </Button>
  )
}
