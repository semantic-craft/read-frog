import { i18n } from '#imports'
import { Icon } from '@iconify/react'
import { Button } from '@read-frog/ui/components/button'
import { useState } from 'react'
import { toast } from 'sonner'
import { ConfigCard } from '../../components/config-card'

export function GoogleDriveSyncCard() {
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    setIsSyncing(true)

    try {
      // Placeholder for actual sync logic
      // TODO: Implement actual Google Drive sync when ready
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Temporary message
      toast.info('Google Drive sync feature is under development')
    }
    catch (error) {
      console.error('Google Drive sync error:', error)
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
