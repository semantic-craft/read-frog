import { useQuery } from '@tanstack/react-query'
import { ConfigCard } from '@/entrypoints/options/components/config-card'
import { getAllBackupsWithMetadata } from '@/utils/backup/storage'
import { CONFIG_SCHEMA_VERSION_STORAGE_KEY, CONFIG_STORAGE_KEY } from '@/utils/constants/config'
import { BackupConfigItem } from './components/backup-config-item'

export function ConfigBackup() {
  const { data: backupsWithMetadata, isPending } = useQuery({
    queryKey: ['config-backups'],
    queryFn: () => getAllBackupsWithMetadata(),
  })

  return (
    <ConfigCard
      title="Config Backup"
      description="Automatic backups are created every hour. You can restore previous configurations here. (Maximum 5 backups)"
    >
      <div className="space-y-4">
        {isPending && (
          <div className="text-center text-muted-foreground py-8">
            Loading backups...
          </div>
        )}

        {backupsWithMetadata && backupsWithMetadata?.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No backups available yet. Backups are created automatically every hour.
          </div>
        )}

        {backupsWithMetadata && backupsWithMetadata?.length > 0 && (
          <>
            {backupsWithMetadata.map(backupWithMetadata => (
              <BackupConfigItem
                key={backupWithMetadata.id}
                backupId={backupWithMetadata.id}
                backupMetadata={backupWithMetadata.metadata}
                backup={{
                  [CONFIG_SCHEMA_VERSION_STORAGE_KEY]: backupWithMetadata[CONFIG_SCHEMA_VERSION_STORAGE_KEY],
                  [CONFIG_STORAGE_KEY]: backupWithMetadata[CONFIG_STORAGE_KEY],
                }}
              />
            ))}
          </>
        )}
      </div>
    </ConfigCard>
  )
}
