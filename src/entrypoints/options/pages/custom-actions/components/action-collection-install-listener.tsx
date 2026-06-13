import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router"
import { z } from "zod"
import { INSTALL_ACTION_COLLECTION_PARAM } from "@/utils/constants/action-collection"
import { useActionCollectionDetailDialog } from "./action-collection-detail-dialog"

const collectionIdSchema = z.coerce.number().int().positive()

function parseInstallCollectionId(search: string): number | null {
  return collectionIdSchema.safeParse(new URLSearchParams(search).get(INSTALL_ACTION_COLLECTION_PARAM)).data ?? null
}

export function ActionCollectionInstallListener() {
  const { search } = useLocation()
  const navigate = useNavigate()
  const { openDetail } = useActionCollectionDetailDialog()

  useEffect(() => {
    const collectionId = parseInstallCollectionId(search)
    if (collectionId == null) {
      return
    }
    openDetail(collectionId)
    const params = new URLSearchParams(search)
    params.delete(INSTALL_ACTION_COLLECTION_PARAM)
    void navigate({ search: params.toString() }, { replace: true })
  }, [search, navigate, openDetail])

  return null
}
