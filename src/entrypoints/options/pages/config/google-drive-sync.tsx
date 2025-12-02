import { i18n } from '#imports'
import { Icon } from '@iconify/react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/shadcn/button'
import { ConfigConflictError, getLastSyncTime, syncConfig } from '@/utils/google-drive/sync'
import { logger } from '@/utils/logger'
import { ConfigCard } from '../../components/config-card'
import { ConflictResolutionDialog } from './components/conflict-resolution-dialog'

export function GoogleDriveSyncCard() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [conflictData, setConflictData] = useState<ConfigConflictError | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null)

  useEffect(() => {
    const loadLastSyncTime = async () => {
      const time = await getLastSyncTime()
      setLastSyncTime(time)
    }
    void loadLastSyncTime()
  }, [])

  const handleSync = async () => {
    setIsSyncing(true)

    try {
      await syncConfig()
      const time = await getLastSyncTime()
      setLastSyncTime(time)
      toast.success(i18n.t('options.config.sync.googleDrive.syncSuccess'))
    }
    catch (error) {
      if (error instanceof ConfigConflictError) {
        logger.info('Conflict detected, opening resolution dialog')
        setConflictData(error)
      }
      else {
        logger.error('Google Drive sync error from UI', error)
        toast.error(i18n.t('options.config.sync.googleDrive.syncError'))
      }
    }
    finally {
      setIsSyncing(false)
    }
  }

  const handleConflictClose = async () => {
    setConflictData(null)
    // Reload sync time after conflict resolution
    const time = await getLastSyncTime()
    setLastSyncTime(time)
  }

  const formatLastSyncTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString()
  }

  const description = lastSyncTime
    ? `${i18n.t('options.config.sync.googleDrive.description')} (${i18n.t('options.config.sync.googleDrive.lastSyncTime')}: ${formatLastSyncTime(lastSyncTime)})`
    : i18n.t('options.config.sync.googleDrive.description')

  return (
    <>
      <ConfigCard
        title={i18n.t('options.config.sync.googleDrive.title')}
        description={description}
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
        <ConflictResolutionDialog
          open={true}
          base={conflictData.base}
          local={conflictData.local}
          remote={conflictData.remote}
          onClose={handleConflictClose}
        />
      )}
    </>
  )
}
