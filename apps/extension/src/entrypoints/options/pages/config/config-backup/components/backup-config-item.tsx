import type { ConfigBackup, ConfigBackupMetadata } from '@/types/backup'
import { Icon } from '@iconify/react/dist/iconify.js'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@repo/ui/components/alert-dialog'
import { Button } from '@repo/ui/components/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/components/dropdown-menu'
import { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemTitle } from '@repo/ui/components/item'
import { Spinner } from '@repo/ui/components/spinner'
import { useMutation } from '@tanstack/react-query'
import { useAtomValue, useSetAtom } from 'jotai'
import { useState } from 'react'
import { toast } from 'sonner'
import { useExportConfig } from '@/hooks/use-export-config'
import { configAtom, writeConfigAtom } from '@/utils/atoms/config'
import { addBackup, isSameAsLatestBackup, removeBackup } from '@/utils/backup/storage'
import { migrateConfig } from '@/utils/config/migration'
import { EXTENSION_VERSION } from '@/utils/constants/app'
import { CONFIG_SCHEMA_VERSION, CONFIG_SCHEMA_VERSION_STORAGE_KEY, CONFIG_STORAGE_KEY } from '@/utils/constants/config'
import { queryClient } from '@/utils/trpc/client'
import { ViewConfig } from '../../components/view-config'

interface BackupConfigItemProps {
  backupId: string
  backupMetadata: ConfigBackupMetadata
  backup: ConfigBackup
}

export function BackupConfigItem({ backupId, backupMetadata, backup }: BackupConfigItemProps) {
  const currentConfig = useAtomValue(configAtom)
  const setConfig = useSetAtom(writeConfigAtom)

  const { mutate: restoreBackup, isPending: isRestoring } = useMutation({
    mutationFn: async (backup: ConfigBackup) => {
      const migratedBackup = await migrateConfig(backup[CONFIG_STORAGE_KEY], backup[CONFIG_SCHEMA_VERSION_STORAGE_KEY])

      if (await isSameAsLatestBackup(currentConfig, CONFIG_SCHEMA_VERSION)) {
        await addBackup(currentConfig, EXTENSION_VERSION)
      }
      await setConfig(migratedBackup)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['config-backups'] })
      toast.success('Config restored successfully')
    },
  })

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <Item variant="muted">
      <ItemContent>
        <ItemTitle>{formatDate(backupMetadata.createdAt)}</ItemTitle>
        <ItemDescription className="text-xs flex flex-wrap items-center gap-x-4">
          <span>
            Extension version:
            {backupMetadata.extensionVersion}
          </span>
          <span>
            Schema version:
            {backup[CONFIG_SCHEMA_VERSION_STORAGE_KEY]}
          </span>
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={isRestoring}>
              {isRestoring ? <Spinner /> : <Icon icon="tabler:restore" />}
              Restore
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restore config backup?</AlertDialogTitle>
              <AlertDialogDescription>
                Your current config will be automatically backed up if it is different from the latest backup. The oldest backup may be removed if the number of backups exceeds the limit.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => restoreBackup(backup)} disabled={isRestoring}>
                Restore
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <MoreOptions backupId={backupId} backup={backup} />
      </ItemActions>
      <ItemFooter><ViewConfig config={backup.config} size="sm" /></ItemFooter>
    </Item>
  )
}

function MoreOptions({ backupId, backup }: { backupId: string, backup: ConfigBackup }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { mutate: deleteBackup, isPending: isDeleting } = useMutation({
    mutationFn: async (backupId: string) => {
      await removeBackup(backupId)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['config-backups'] })
    },
  })

  const { mutate: exportConfig, isPending: isExporting } = useExportConfig({
    config: backup[CONFIG_STORAGE_KEY],
    schemaVersion: backup[CONFIG_SCHEMA_VERSION_STORAGE_KEY],
  })

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon-sm" disabled={isExporting || isDeleting}>
            <Icon icon="tabler:dots" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40" align="end">
          <DropdownMenuItem onSelect={() => exportConfig(false)} disabled={isExporting}>
            <Icon icon="tabler:file-export" />
            Export
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setShowDeleteDialog(true)}>
            <Icon icon="tabler:trash" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete backup?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this backup? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => deleteBackup(backupId)} disabled={isDeleting}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
