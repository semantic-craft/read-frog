import type { ActionCollectionCreateInput } from "@read-frog/api-contract"
import type { QueryClient } from "@tanstack/react-query"
import type { Config } from "@/types/config/config"
import type { SelectionToolbarCustomAction } from "@/types/config/selection-toolbar"
import { useQueryClient } from "@tanstack/react-query"
import { useAtomValue, useSetAtom } from "jotai"
import { useState } from "react"
import { toast } from "sonner"
import { match, P } from "ts-pattern"
import { i18n } from "#imports"
import { Badge } from "@/components/ui/base-ui/badge"
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
import { Field, FieldLabel } from "@/components/ui/base-ui/field"
import { Label } from "@/components/ui/base-ui/label"
import { Skeleton } from "@/components/ui/base-ui/skeleton"
import { Textarea } from "@/components/ui/base-ui/textarea"
import { env } from "@/env"
import {
  useActionCollectionDetail,
  useInstallActionCollection,
  usePublishActionCollection,
} from "@/orpc/action-collection"
import { configAtom } from "@/utils/atoms/config"
import { authClient } from "@/utils/auth/auth-client"
import { getEnabledLLMProvidersConfig } from "@/utils/config/helpers"
import { localizeOrpcError } from "@/utils/orpc/localize-error"
import { applyInstalledActionCollectionPayload, buildActionCollectionShareUrl } from "../install-action-collection"

const AC_T_PREFIX = "options.floatingButtonAndToolbar.selectionToolbar.customActions.actionCollection"
const CUSTOM_ACTION_FORM_T_PREFIX = "options.floatingButtonAndToolbar.selectionToolbar.customActions.form"
function openLoginPage() {
  window.open(`${env.WXT_WEBSITE_URL}/log-in`, "_blank", "noopener,noreferrer")
}

function formatPublishedAt(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function hasInstallableProvider(config: Config) {
  return getEnabledLLMProvidersConfig(config.providersConfig).length > 0
}

function handleInstallSuccess({
  nextConfig,
  actionName,
  queryClient,
  setConfig,
}: {
  nextConfig: Config
  actionName: string
  queryClient: QueryClient
  setConfig: (nextConfig: Config) => void
}) {
  setConfig(nextConfig)
  toast.success(i18n.t(`${AC_T_PREFIX}.installed`), {
    description: i18n.t(`${AC_T_PREFIX}.installedDescription`, [actionName]),
  })
  void queryClient.invalidateQueries({ queryKey: ["action-collections", "featured"] })
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

export function ActionCollectionDetailDialog({
  open,
  onOpenChange,
  collectionId,
  onInstalled,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  collectionId: number | null
  onInstalled?: () => void
}) {
  const config = useAtomValue(configAtom)
  const setConfig = useSetAtom(configAtom)
  const queryClient = useQueryClient()
  const { detail, isLoading } = useActionCollectionDetail(open ? collectionId : null)
  const installMutation = useInstallActionCollection()

  const shareUrl = detail ? buildActionCollectionShareUrl(detail.collectionId) : null

  function handleInstallClick() {
    if (!hasInstallableProvider(config)) {
      toast.error(i18n.t(`${AC_T_PREFIX}.installBlockedNoProvider`))
      return
    }
    if (collectionId == null) {
      return
    }
    installMutation.mutate({ id: collectionId }, {
      onSuccess: async (payload) => {
        const result = await applyInstalledActionCollectionPayload(payload)
        handleInstallSuccess({
          nextConfig: result.nextConfig,
          actionName: result.action.name,
          queryClient,
          setConfig,
        })
        onInstalled?.()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-2xl">
        {match({ detail, isLoading })
          .with({ detail: P.nonNullable }, ({ detail }) => (
            <>
              <DialogHeader className="gap-3 border-b p-6 pr-12">
                <div className="min-w-0 space-y-1">
                  <DialogTitle className="text-xl">{detail.name}</DialogTitle>
                  <DialogDescription>{detail.description || "No description yet."}</DialogDescription>
                </div>
              </DialogHeader>

              <div className="flex-1 space-y-5 overflow-y-auto p-6">
                <Field>
                  <FieldLabel>{i18n.t(`${CUSTOM_ACTION_FORM_T_PREFIX}.systemPrompt`)}</FieldLabel>
                  <div className="rounded-xl border bg-muted/30 p-3 text-sm break-words whitespace-pre-wrap">
                    {detail.internalValues.systemPrompt || "—"}
                  </div>
                </Field>

                <Field>
                  <FieldLabel>{i18n.t(`${CUSTOM_ACTION_FORM_T_PREFIX}.prompt`)}</FieldLabel>
                  <div className="rounded-xl border bg-muted/30 p-3 text-sm break-words whitespace-pre-wrap">
                    {detail.internalValues.prompt || "—"}
                  </div>
                </Field>

                <Field>
                  <FieldLabel>{i18n.t(`${CUSTOM_ACTION_FORM_T_PREFIX}.outputSchema`)}</FieldLabel>
                  <div className="flex flex-col gap-2">
                    {detail.internalValues.outputSchema.map(outputField => (
                      <div key={outputField.id} className="flex items-center gap-2 rounded-lg border bg-card p-2">
                        <span className="shrink-0 text-sm font-medium">{outputField.name}</span>
                        <Badge variant="secondary" className="shrink-0">{i18n.t(`dataTypes.${outputField.type}`)}</Badge>
                        {outputField.speaking && <Badge variant="outline" className="shrink-0">Speak</Badge>}
                        <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                          {outputField.description || "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </Field>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-sm text-muted-foreground">
                  <span>{detail.author.displayName}</span>
                  <span>·</span>
                  <span>{formatPublishedAt(detail.publishedAt)}</span>
                  {shareUrl && (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => window.open(shareUrl, "_blank", "noopener,noreferrer")}
                    >
                      {i18n.t(`${AC_T_PREFIX}.store.viewDetailPage`)}
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t p-6 sm:flex-row sm:items-center sm:justify-end">
                <Button
                  type="button"
                  onClick={handleInstallClick}
                  disabled={installMutation.isPending}
                >
                  {installMutation.isPending ? i18n.t(`${AC_T_PREFIX}.installing`) : i18n.t(`${AC_T_PREFIX}.installButton`)}
                </Button>
              </div>
            </>
          ))
          .with({ isLoading: true }, () => (
            <div className="flex flex-1 flex-col gap-4 p-6">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ))
          .otherwise(() => null)}
      </DialogContent>
    </Dialog>
  )
}

export function PublishActionButton({ action }: { action: SelectionToolbarCustomAction }) {
  const queryClient = useQueryClient()
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [descriptionInput, setDescriptionInput] = useState("")
  const [publishedId, setPublishedId] = useState<number | null>(null)

  function onPublishSuccess(result: { collectionId: number }) {
    setPublishDialogOpen(false)
    setDescriptionInput("")
    toast.success(i18n.t(`${AC_T_PREFIX}.published`), {
      description: i18n.t(`${AC_T_PREFIX}.publishedDescription`),
    })
    void queryClient.invalidateQueries({ queryKey: ["action-collections", "published-by-me"] })
    setPublishedId(result.collectionId)
  }

  const createMutation = usePublishActionCollection()

  const isPending = createMutation.isPending

  function handlePublishClick() {
    if (!session?.user) {
      openLoginPage()
      return
    }

    setDescriptionInput("")
    setPublishDialogOpen(true)
  }

  function handlePublishSubmit() {
    createMutation.mutate(buildPublishInput(action, descriptionInput) as ActionCollectionCreateInput, {
      onSuccess: result => onPublishSuccess(result),
      onError: error => toast.error(localizeOrpcError(error)),
    })
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handlePublishClick}
        disabled={isPending || isSessionPending}
      >
        {isPending ? i18n.t(`${AC_T_PREFIX}.publishing`) : i18n.t(`${AC_T_PREFIX}.publishButton`)}
      </Button>

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
                value={descriptionInput}
                onChange={e => setDescriptionInput(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              {i18n.t(`${AC_T_PREFIX}.cancel`)}
            </DialogClose>
            <Button
              type="button"
              onClick={handlePublishSubmit}
              disabled={isPending}
            >
              {isPending ? i18n.t(`${AC_T_PREFIX}.publishing`) : i18n.t(`${AC_T_PREFIX}.publishButton`)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={publishedId != null}
        onOpenChange={(open) => {
          if (!open)
            setPublishedId(null)
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
    </>
  )
}
