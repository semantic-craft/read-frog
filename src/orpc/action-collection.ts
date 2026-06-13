import type { ActionCollectionSort } from "@read-frog/api-contract"
import { useMutation, useQuery } from "@tanstack/react-query"
import { orpc } from "@/utils/orpc/client"

export function useActionCollectionPublicCollections(input?: { limit?: number, sort?: ActionCollectionSort }) {
  const { data, isLoading } = useQuery({
    ...orpc.actionCollection.listPublicCollections.queryOptions({ input: input ?? {} }),
    staleTime: 30_000,
    meta: { errorDescription: "Failed to load the feature store" },
  })
  return { items: data?.items ?? [], isLoading }
}

export function useActionCollectionDetail(collectionId: number | null) {
  const { data, isLoading } = useQuery({
    ...orpc.actionCollection.getDetail.queryOptions({ input: { id: collectionId ?? 0 } }),
    enabled: collectionId != null,
    staleTime: 30_000,
    meta: { errorDescription: "Failed to load collection details" },
  })
  return { detail: data, isLoading }
}

export function usePublishActionCollection() {
  return useMutation({
    ...orpc.actionCollection.create.mutationOptions(),
    meta: { suppressToast: true },
  })
}

export function useInstallActionCollection() {
  return useMutation({
    ...orpc.actionCollection.install.mutationOptions(),
    meta: { errorDescription: "Failed to install collection" },
  })
}
