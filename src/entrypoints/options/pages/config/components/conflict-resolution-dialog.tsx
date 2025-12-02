import type { Config } from '@/types/config/config'
import type { FieldConflict } from '@/utils/google-drive/conflict-merge'
import { i18n } from '#imports'
import { Icon } from '@iconify/react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/shadcn/alert-dialog'
import { applyResolutions, detectConflicts } from '@/utils/google-drive/conflict-merge'
import { syncMergedConfig } from '@/utils/google-drive/sync'
import { logger } from '@/utils/logger'
import { JsonTreeView } from './json-tree-view'

interface ConflictResolutionDialogProps {
  open: boolean
  base: Config
  local: Config
  remote: Config
  onResolved: () => void
  onCancel: () => void
}

export function ConflictResolutionDialog({
  open,
  base,
  local,
  remote,
  onResolved,
  onCancel,
}: ConflictResolutionDialogProps) {
  const [resolutions, setResolutions] = useState<Record<string, 'local' | 'remote'>>({})
  const [isSyncing, setIsSyncing] = useState(false)

  const diffResult = useMemo(() => {
    return detectConflicts(base, local, remote)
  }, [base, local, remote])

  // Build merged config with current resolutions
  const mergedConfig = useMemo(() => {
    return applyResolutions(diffResult, resolutions)
  }, [diffResult, resolutions])

  // Create conflict map for quick lookup
  const conflictMap = useMemo(() => {
    const map = new Map<string, FieldConflict>()
    diffResult.conflicts.forEach((conflict) => {
      map.set(conflict.path.join('.'), conflict)
    })
    return map
  }, [diffResult.conflicts])

  const resolvedCount = Object.keys(resolutions).length
  const allResolved = resolvedCount === diffResult.conflicts.length

  const handleSelectLocal = (pathKey: string) => {
    setResolutions(prev => ({ ...prev, [pathKey]: 'local' }))
  }

  const handleSelectRemote = (pathKey: string) => {
    setResolutions(prev => ({ ...prev, [pathKey]: 'remote' }))
  }

  const handleReset = (pathKey: string) => {
    setResolutions((prev) => {
      const newResolutions = { ...prev }
      delete newResolutions[pathKey]
      return newResolutions
    })
  }

  const handleConfirm = async () => {
    if (!allResolved) {
      toast.error(i18n.t('options.config.sync.googleDrive.conflict.allResolutionsRequired'))
      return
    }

    setIsSyncing(true)

    try {
      await syncMergedConfig(mergedConfig)
      toast.success(i18n.t('options.config.sync.googleDrive.conflict.mergeSuccess'))
      onResolved()
    }
    catch (error) {
      logger.error('Failed to sync merged config', error)
      toast.error(i18n.t('options.config.sync.googleDrive.conflict.mergeFailed'))
    }
    finally {
      setIsSyncing(false)
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !isSyncing) {
          onCancel()
        }
      }}
    >
      <AlertDialogContent className="max-h-[90vh] flex flex-col" style={{ maxWidth: '960px' }}>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Icon icon="mdi:alert" className="size-5 text-yellow-500" />
            {i18n.t('options.config.sync.googleDrive.conflict.title')}
          </AlertDialogTitle>
          <AlertDialogDescription className="flex items-center justify-between">
            <span>{i18n.t('options.config.sync.googleDrive.conflict.description')}</span>
            <span className="text-xs">
              {i18n.t('options.config.sync.googleDrive.conflict.progress' as any, [resolvedCount, diffResult.conflicts.length])}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex-1 overflow-scroll">
          <MergedConfigView
            mergedConfig={mergedConfig}
            conflictMap={conflictMap}
            resolutions={resolutions}
            onSelectLocal={handleSelectLocal}
            onSelectRemote={handleSelectRemote}
            onReset={handleReset}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSyncing}>
            {i18n.t('options.config.sync.googleDrive.conflict.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={!allResolved || isSyncing}
            onClick={(e) => {
              e.preventDefault()
              void handleConfirm()
            }}
          >
            {isSyncing
              ? i18n.t('options.config.sync.googleDrive.conflict.merging')
              : i18n.t('options.config.sync.googleDrive.conflict.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface MergedConfigViewProps {
  mergedConfig: Config
  conflictMap: Map<string, FieldConflict>
  resolutions: Record<string, 'local' | 'remote'>
  onSelectLocal: (pathKey: string) => void
  onSelectRemote: (pathKey: string) => void
  onReset: (pathKey: string) => void
}

function MergedConfigView({
  mergedConfig,
  conflictMap,
  resolutions,
  onSelectLocal,
  onSelectRemote,
  onReset,
}: MergedConfigViewProps) {
  return (
    <div className="h-full rounded-lg overflow-hidden flex flex-col bg-slate-100 dark:bg-slate-900">
      {/* Header */}
      <div className="px-4 py-2 flex items-center gap-4 text-xs border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-slate-700 dark:text-slate-300">{i18n.t('options.config.sync.googleDrive.conflict.title')}</span>
        </div>
        <div className="flex items-center gap-4 ml-auto text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>{i18n.t('options.config.sync.googleDrive.conflict.localValue')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>{i18n.t('options.config.sync.googleDrive.conflict.remoteValue')}</span>
          </div>
        </div>
      </div>

      {/* JSON Tree Content */}
      <div className="flex-1 overflow-auto">
        <JsonTreeView
          data={mergedConfig}
          conflictMap={conflictMap}
          resolutions={resolutions}
          onSelectLocal={onSelectLocal}
          onSelectRemote={onSelectRemote}
          onReset={onReset}
        />
      </div>
    </div>
  )
}
