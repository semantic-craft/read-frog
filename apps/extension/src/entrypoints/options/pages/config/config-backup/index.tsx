import { Icon } from '@iconify/react/dist/iconify.js'
import { Button } from '@repo/ui/components/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@repo/ui/components/empty'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { toast } from 'sonner'
import { ConfigCard } from '@/entrypoints/options/components/config-card'
import { configAtom } from '@/utils/atoms/config'
import { addBackup, getAllBackupsWithMetadata } from '@/utils/backup/storage'
import { EXTENSION_VERSION } from '@/utils/constants/app'
import { MAX_BACKUPS_COUNT } from '@/utils/constants/backup'
import { CONFIG_SCHEMA_VERSION_STORAGE_KEY, CONFIG_STORAGE_KEY } from '@/utils/constants/config'
import { queryClient } from '@/utils/trpc/client'
import { BackupConfigItem } from './components/backup-config-item'

export function ConfigBackup() {
  const { data: backupsWithMetadata, isPending } = useQuery({
    queryKey: ['config-backups'],
    queryFn: () => getAllBackupsWithMetadata(),
  })

  return (
    <ConfigCard
      title="Config Backup"
      description={`Automatic backups are created every hour if the config is changed. You can restore previous configurations here. (Maximum ${MAX_BACKUPS_COUNT} backups)`}
    >
      <div className="space-y-4">
        {isPending && (
          <div className="text-center text-muted-foreground py-8">
            Loading backups...
          </div>
        )}

        {backupsWithMetadata && backupsWithMetadata?.length === 0 && (
          <EmptyState />
        )}
        {backupsWithMetadata && backupsWithMetadata?.length > 0 && (
          <>
            <Toolbar />
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

function Toolbar() {
  const currentConfig = useAtomValue(configAtom)
  const { mutate: backupConfig, isPending: isBackingUp } = useMutation({
    mutationFn: async () => {
      await addBackup(currentConfig, EXTENSION_VERSION)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['config-backups'] })
      toast.success('Backup created successfully')
    },
  })
  return (
    <div className="flex justify-end">
      <Button disabled={isBackingUp} onClick={() => backupConfig()}>
        <Icon icon="tabler:plus" />
        Backup now
      </Button>
    </div>
  )
}

function EmptyState() {
  const currentConfig = useAtomValue(configAtom)
  const { mutate: backupConfig, isPending: isBackingUp } = useMutation({
    mutationFn: async () => {
      await addBackup(currentConfig, EXTENSION_VERSION)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['config-backups'] })
      toast.success('Backup created successfully')
    },
  })
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon icon="tabler:file-off" />
        </EmptyMedia>
        <EmptyTitle>No backups available yet</EmptyTitle>
        <EmptyDescription>
          Backups are created automatically every hour if the config is changed.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm" disabled={isBackingUp} onClick={() => backupConfig()}>
          Backup now
        </Button>
      </EmptyContent>
    </Empty>
  )
}
