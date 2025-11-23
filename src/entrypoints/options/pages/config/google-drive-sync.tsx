import { i18n } from '#imports'
import { Icon } from '@iconify/react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/shadcn/button'
import { syncConfig } from '@/utils/google-drive/sync'
import { logger } from '@/utils/logger'
import { ConfigCard } from '../../components/config-card'

export function GoogleDriveSyncCard() {
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    setIsSyncing(true)

    try {
      await syncConfig()
      toast.success(i18n.t('options.config.sync.googleDrive.syncSuccess'))
    }
    catch (error) {
      logger.error('Google Drive sync error from UI', error)
      toast.error(i18n.t('options.config.sync.googleDrive.syncError'))
    }
    finally {
      setIsSyncing(false)
    }
  }

  return (
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
  )
}
