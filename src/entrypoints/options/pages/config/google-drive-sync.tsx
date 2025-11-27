import type { Config } from '@/types/config/config'
import { i18n } from '#imports'
import { Icon } from '@iconify/react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/shadcn/button'
import { resolveConflictWithMerge, syncConfig, SyncConflictError } from '@/utils/google-drive/sync'
import { logger } from '@/utils/logger'
import { ConfigCard } from '../../components/config-card'
import { GoogleDriveConflictDialog } from './google-drive-conflict-dialog'

export function GoogleDriveSyncCard() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false)
  const [conflictData, setConflictData] = useState<{
    localConfig: Config
    remoteConfig: Config
  } | null>(null)

  const handleSync = async () => {
    setIsSyncing(true)

    try {
      await syncConfig()
      toast.success(i18n.t('options.config.sync.googleDrive.syncSuccess'))
    }
    catch (error) {
      if (error instanceof SyncConflictError) {
        setConflictData({
          localConfig: error.localConfig,
          remoteConfig: error.remoteConfig,
        })
        setConflictDialogOpen(true)
        return
      }
      logger.error('Google Drive sync error from UI', error)
      toast.error(i18n.t('options.config.sync.googleDrive.syncError'))
    }
    finally {
      setIsSyncing(false)
    }
  }

  const handleConflictResolve = async (mergedConfig: Config) => {
    setConflictDialogOpen(false)
    setIsSyncing(true)
    try {
      await resolveConflictWithMerge(mergedConfig)
      toast.success(i18n.t('options.config.sync.googleDrive.syncSuccess'))
    }
    catch (error) {
      logger.error('Failed to resolve conflict', error)
      toast.error(i18n.t('options.config.sync.googleDrive.conflictResolveError'))
    }
    finally {
      setIsSyncing(false)
      setConflictData(null)
    }
  }

  return (
    <>
      <ConfigCard
        title={i18n.t('options.config.sync.googleDrive.title')}
        description={i18n.t('options.config.sync.googleDrive.description')}
      >
        <div className="w-full flex justify-end">
          <Button
            onClick={handleSync}
            disabled={isSyncing}
          >
            <Icon icon="logos:google-drive" className="size-4" />
            {isSyncing
              ? i18n.t('options.config.sync.googleDrive.syncing')
              : i18n.t('options.config.sync.googleDrive.sync')}
          </Button>
        </div>
      </ConfigCard>

      {conflictData && (
        <GoogleDriveConflictDialog
          open={conflictDialogOpen}
          localConfig={conflictData.localConfig}
          remoteConfig={conflictData.remoteConfig}
          onResolve={handleConflictResolve}
          onCancel={() => {
            setConflictDialogOpen(false)
            setConflictData(null)
          }}
        />
      )}
    </>
  )
}
