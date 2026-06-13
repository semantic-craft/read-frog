import type { ActionCollectionDetail } from "@read-frog/api-contract"
import type { ReactNode } from "react"
import type { Config } from "@/types/config/config"
import { useQueryClient } from "@tanstack/react-query"
import { useAtomValue, useSetAtom } from "jotai"
import { createContext, use, useState } from "react"
import { toast } from "sonner"
import { match, P } from "ts-pattern"
import { i18n } from "#imports"
import { Badge } from "@/components/ui/base-ui/badge"
import { Button } from "@/components/ui/base-ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/base-ui/dialog"
import { Field, FieldLabel } from "@/components/ui/base-ui/field"
import { Skeleton } from "@/components/ui/base-ui/skeleton"
import { useActionCollectionDetail, useInstallActionCollection } from "@/orpc/action-collection"
import { configAtom } from "@/utils/atoms/config"
import { getEnabledLLMProvidersConfig } from "@/utils/config/helpers"
import { applyInstalledActionCollectionPayload, buildActionCollectionShareUrl } from "../install-action-collection"

const AC_T_PREFIX = "options.floatingButtonAndToolbar.selectionToolbar.customActions.actionCollection"
const CUSTOM_ACTION_FORM_T_PREFIX = "options.floatingButtonAndToolbar.selectionToolbar.customActions.form"

interface DetailDialogControl {
  openDetail: (collectionId: number) => void
}

const DetailDialogControlContext = createContext<DetailDialogControl | null>(null)

export function useActionCollectionDetailDialog() {
  const value = use(DetailDialogControlContext)
  if (!value) {
    throw new Error("useActionCollectionDetailDialog must be used within ActionCollectionProvider")
  }
  return value
}

interface DetailContentValue {
  detail: ActionCollectionDetail
  isInstalling: boolean
  install: () => void
  shareUrl: string
}

const DetailContentContext = createContext<DetailContentValue | null>(null)

function useDetailContent() {
  const value = use(DetailContentContext)
  if (!value) {
    throw new Error("useDetailContent must be used within the detail dialog")
  }
  return value
}

function hasInstallableProvider(config: Config) {
  return getEnabledLLMProvidersConfig(config.providersConfig).length > 0
}

function formatPublishedAt(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export function ActionCollectionProvider({ children }: { children: ReactNode }) {
  const config = useAtomValue(configAtom)
  const setConfig = useSetAtom(configAtom)
  const queryClient = useQueryClient()
  const [collectionId, setCollectionId] = useState<number | null>(null)
  const open = collectionId != null
  const { detail, isLoading } = useActionCollectionDetail(open ? collectionId : null)
  const installMutation = useInstallActionCollection()

  function handleInstallClick() {
    if (!hasInstallableProvider(config)) {
      toast.error(i18n.t(`${AC_T_PREFIX}.installBlockedNoProvider`))
      return
    }
    if (collectionId == null || installMutation.isPending) {
      return
    }
    installMutation.mutate({ id: collectionId }, {
      onSuccess: async (payload) => {
        const result = await applyInstalledActionCollectionPayload(payload)
        setConfig(result.nextConfig)
        toast.success(i18n.t(`${AC_T_PREFIX}.installed`), {
          description: i18n.t(`${AC_T_PREFIX}.installedDescription`, [result.action.name]),
        })
        void queryClient.invalidateQueries({ queryKey: ["action-collections", "featured"] })
        setCollectionId(null)
      },
    })
  }

  return (
    <DetailDialogControlContext value={{ openDetail: setCollectionId }}>
      {children}
      <Dialog open={open} onOpenChange={isOpen => !isOpen && setCollectionId(null)}>
        <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-2xl">
          {match({ detail, isLoading })
            .with({ detail: P.nonNullable }, ({ detail }) => (
              <DetailContentContext
                value={{
                  detail,
                  isInstalling: installMutation.isPending,
                  install: handleInstallClick,
                  shareUrl: buildActionCollectionShareUrl(detail.collectionId),
                }}
              >
                <ActionCollectionDetailContent />
              </DetailContentContext>
            ))
            .with({ isLoading: true }, () => <DetailDialogSkeleton />)
            .otherwise(() => null)}
        </DialogContent>
      </Dialog>
    </DetailDialogControlContext>
  )
}

function DetailDialogSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  )
}

function ActionCollectionDetailContent() {
  const { detail, isInstalling, install, shareUrl } = useDetailContent()

  return (
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
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0"
            onClick={() => window.open(shareUrl, "_blank", "noopener,noreferrer")}
          >
            {i18n.t(`${AC_T_PREFIX}.store.viewDetailPage`)}
          </Button>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t p-6 sm:flex-row sm:items-center sm:justify-end">
        <Button type="button" onClick={install} disabled={isInstalling}>
          {isInstalling ? i18n.t(`${AC_T_PREFIX}.installing`) : i18n.t(`${AC_T_PREFIX}.installButton`)}
        </Button>
      </div>
    </>
  )
}
