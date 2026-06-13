import type { ActionCollectionCreateInput } from "@read-frog/api-contract"
import type { SelectionToolbarCustomAction } from "@/types/config/selection-toolbar"
import { useQueryClient } from "@tanstack/react-query"
import { createContext, use, useState } from "react"
import { toast } from "sonner"
import { i18n } from "#imports"
import { Button } from "@/components/ui/base-ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/base-ui/dialog"
import { Label } from "@/components/ui/base-ui/label"
import { Textarea } from "@/components/ui/base-ui/textarea"
import { env } from "@/env"
import { usePublishActionCollection } from "@/orpc/action-collection"
import { authClient } from "@/utils/auth/auth-client"
import { localizeOrpcError } from "@/utils/orpc/localize-error"
import { buildActionCollectionShareUrl } from "../install-action-collection"

const AC_T_PREFIX = "options.floatingButtonAndToolbar.selectionToolbar.customActions.actionCollection"

function openLoginPage() {
  window.open(`${env.WXT_WEBSITE_URL}/log-in`, "_blank", "noopener,noreferrer")
}

function buildPublishInput(action: SelectionToolbarCustomAction, description?: string) {
  return {
    name: action.name,
    description: description?.trim() || action.prompt.trim() || action.systemPrompt.trim() || action.name,
    icon: action.icon,
    systemPrompt: action.systemPrompt,
    prompt: action.prompt,
    outputSchema: action.outputSchema,
  }
}

interface PublishContextValue {
  isPending: boolean
  description: string
  setDescription: (value: string) => void
  publishDialogOpen: boolean
  setPublishDialogOpen: (open: boolean) => void
  submit: () => void
  publishedId: number | null
  setPublishedId: (id: number | null) => void
}

const PublishContext = createContext<PublishContextValue | null>(null)

function usePublish() {
  const value = use(PublishContext)
  if (!value) {
    throw new Error("usePublish must be used within PublishActionButton")
  }
  return value
}

export function PublishActionButton({ action }: { action: SelectionToolbarCustomAction }) {
  const queryClient = useQueryClient()
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [description, setDescription] = useState("")
  const [publishedId, setPublishedId] = useState<number | null>(null)
  const createMutation = usePublishActionCollection()
  const isPending = createMutation.isPending

  function handlePublishClick() {
    if (!session?.user) {
      openLoginPage()
      return
    }
    setDescription("")
    setPublishDialogOpen(true)
  }

  function submit() {
    createMutation.mutate(buildPublishInput(action, description) as ActionCollectionCreateInput, {
      onSuccess: (result) => {
        setPublishDialogOpen(false)
        setDescription("")
        toast.success(i18n.t(`${AC_T_PREFIX}.published`), {
          description: i18n.t(`${AC_T_PREFIX}.publishedDescription`),
        })
        void queryClient.invalidateQueries({ queryKey: ["action-collections", "published-by-me"] })
        setPublishedId(result.collectionId)
      },
      onError: error => toast.error(localizeOrpcError(error)),
    })
  }

  return (
    <PublishContext
      value={{
        isPending,
        description,
        setDescription,
        publishDialogOpen,
        setPublishDialogOpen,
        submit,
        publishedId,
        setPublishedId,
      }}
    >
      <Button
        type="button"
        variant="outline"
        onClick={handlePublishClick}
        disabled={isPending || isSessionPending}
      >
        {isPending ? i18n.t(`${AC_T_PREFIX}.publishing`) : i18n.t(`${AC_T_PREFIX}.publishButton`)}
      </Button>

      <PublishDialog />
      <PublishedJumpDialog />
    </PublishContext>
  )
}

function PublishDialog() {
  const { isPending, description, setDescription, publishDialogOpen, setPublishDialogOpen, submit } = usePublish()

  return (
    <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{i18n.t(`${AC_T_PREFIX}.publishButton`)}</DialogTitle>
          <DialogDescription>{i18n.t(`${AC_T_PREFIX}.publishDialogDescription`)}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="publish-description-input">{i18n.t(`${AC_T_PREFIX}.descriptionInput`)}</Label>
            <Textarea
              id="publish-description-input"
              className="min-h-24"
              placeholder={i18n.t(`${AC_T_PREFIX}.descriptionInputPlaceholder`)}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            {i18n.t(`${AC_T_PREFIX}.cancel`)}
          </DialogClose>
          <Button type="button" onClick={submit} disabled={isPending}>
            {isPending ? i18n.t(`${AC_T_PREFIX}.publishing`) : i18n.t(`${AC_T_PREFIX}.publishButton`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PublishedJumpDialog() {
  const { publishedId, setPublishedId } = usePublish()

  return (
    <Dialog
      open={publishedId != null}
      onOpenChange={(open) => {
        if (!open) {
          setPublishedId(null)
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{i18n.t(`${AC_T_PREFIX}.publishedJumpTitle`)}</DialogTitle>
          <DialogDescription>{i18n.t(`${AC_T_PREFIX}.publishedJumpDescription`)}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            {i18n.t(`${AC_T_PREFIX}.publishedJumpCancel`)}
          </DialogClose>
          <Button
            type="button"
            onClick={() => {
              if (publishedId != null) {
                window.open(buildActionCollectionShareUrl(publishedId), "_blank", "noopener,noreferrer")
              }
              setPublishedId(null)
            }}
          >
            {i18n.t(`${AC_T_PREFIX}.publishedJumpConfirm`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
