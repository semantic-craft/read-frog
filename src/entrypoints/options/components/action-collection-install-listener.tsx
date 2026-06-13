import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router"
import { ActionCollectionDetailDialog } from "../pages/custom-actions/components/ai-feature-store"

const INSTALL_PARAM = "installActionCollection"

export function ActionCollectionInstallListener() {
  const { search } = useLocation()
  const navigate = useNavigate()
  const [collectionId, setCollectionId] = useState<number | null>(() => {
    const raw = new URLSearchParams(search).get(INSTALL_PARAM)
    const parsed = raw == null ? Number.NaN : Number(raw)
    return Number.isInteger(parsed) ? parsed : null
  })

  useEffect(() => {
    const params = new URLSearchParams(search)
    if (params.has(INSTALL_PARAM)) {
      params.delete(INSTALL_PARAM)
      void navigate({ search: params.toString() }, { replace: true })
    }
  }, [search, navigate])

  return (
    <ActionCollectionDetailDialog
      open={collectionId != null}
      collectionId={collectionId}
      onOpenChange={(open) => {
        if (!open) {
          setCollectionId(null)
        }
      }}
      onInstalled={() => setCollectionId(null)}
    />
  )
}
