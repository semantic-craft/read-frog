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
import { Button } from '@/components/shadcn/button'
import { applyResolutions, detectConflicts } from '@/utils/google-drive/conflict-merge'
import { syncMergedConfig } from '@/utils/google-drive/sync'
import { logger } from '@/utils/logger'

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
          path={[]}
          level={0}
        />
      </div>
    </div>
  )
}

interface JsonTreeViewProps {
  data: any
  conflictMap: Map<string, FieldConflict>
  resolutions: Record<string, 'local' | 'remote'>
  onSelectLocal: (pathKey: string) => void
  onSelectRemote: (pathKey: string) => void
  onReset: (pathKey: string) => void
  path: string[]
  level: number
}

function JsonTreeView({
  data,
  conflictMap,
  resolutions,
  onSelectLocal,
  onSelectRemote,
  onReset,
  path,
  level,
}: JsonTreeViewProps) {
  // 计算初始折叠状态：只展开包含冲突的路径
  const initialCollapsed = useMemo(() => {
    const collapsed: Record<string, boolean> = {}
    const conflictPaths = new Set(conflictMap.keys())

    // 遍历所有可能的路径，如果路径不包含冲突则折叠
    const checkPath = (obj: any, currentPath: string[]) => {
      if (obj === null || typeof obj !== 'object')
        return
      const entries = Array.isArray(obj) ? obj.map((v, i) => [String(i), v]) : Object.entries(obj)
      for (const [key, value] of entries) {
        const pathKey = [...currentPath, key].join('.')
        const hasConflict = Array.from(conflictPaths).some(cp =>
          cp === pathKey || cp.startsWith(`${pathKey}.`),
        )
        if (!hasConflict && value !== null && typeof value === 'object') {
          collapsed[pathKey] = true
        }
        checkPath(value, [...currentPath, key])
      }
    }
    checkPath(data, path)
    return collapsed
  }, [data, conflictMap, path])

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(initialCollapsed)

  const indent = level * 16

  if (data === null || data === undefined) {
    return (
      <div className="font-mono text-sm text-slate-600 dark:text-slate-400" style={{ paddingLeft: indent }}>
        {String(data)}
      </div>
    )
  }

  if (typeof data !== 'object') {
    return (
      <div className="font-mono text-sm text-slate-700 dark:text-slate-300" style={{ paddingLeft: indent }}>
        {typeof data === 'string' ? `"${data}"` : String(data)}
      </div>
    )
  }

  const isArray = Array.isArray(data)
  const entries = isArray ? data.map((v, i) => [String(i), v]) : Object.entries(data)

  return (
    <div className="font-mono text-sm">
      {entries.map(([key, value]) => {
        const currentPath = [...path, key]
        const pathKey = currentPath.join('.')
        const conflict = conflictMap.get(pathKey)
        const resolution = resolutions[pathKey]
        const isCollapsed = collapsed[pathKey]
        const hasChildren = value !== null && typeof value === 'object'
        const childCount = hasChildren ? (Array.isArray(value) ? value.length : Object.keys(value).length) : 0

        // Check if any child has conflict
        const hasConflictInChildren = hasChildren && Array.from(conflictMap.keys()).some(k => k.startsWith(`${pathKey}.`))

        if (conflict) {
          return (
            <ConflictField
              key={pathKey}
              fieldKey={key}
              conflict={conflict}
              resolution={resolution}
              onSelectLocal={() => onSelectLocal(pathKey)}
              onSelectRemote={() => onSelectRemote(pathKey)}
              onReset={() => onReset(pathKey)}
              level={level}
              isArray={isArray}
            />
          )
        }

        return (
          <div key={pathKey}>
            <div
              className="flex items-center hover:bg-slate-100/50 dark:hover:bg-slate-800/50 py-0.5"
              style={{ paddingLeft: indent }}
            >
              {hasChildren && (
                <button
                  type="button"
                  onClick={() => setCollapsed(prev => ({ ...prev, [pathKey]: !isCollapsed }))}
                  className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mr-1"
                >
                  <Icon icon={isCollapsed ? 'mdi:chevron-right' : 'mdi:chevron-down'} className="size-3" />
                </button>
              )}
              {!hasChildren && <div className="w-5" />}

              {!isArray && (
                <span className="text-blue-600 dark:text-blue-400">
                  "
                  {key}
                  "
                </span>
              )}
              {!isArray && <span className="text-slate-500 dark:text-slate-500 mx-1">:</span>}

              {hasChildren
                ? (
                    <span className="text-slate-500 dark:text-slate-500">
                      {isCollapsed
                        ? (
                            <>
                              {Array.isArray(value) ? '[' : '{'}
                              <span className="text-slate-400 dark:text-slate-600 mx-1">
                                {childCount}
                                {' '}
                                {childCount === 1 ? 'item' : 'items'}
                              </span>
                              {Array.isArray(value) ? ']' : '}'}
                              {hasConflictInChildren && (
                                <span className="ml-2 text-orange-500 dark:text-orange-400 text-xs">⚠ 包含冲突</span>
                              )}
                            </>
                          )
                        : (Array.isArray(value) ? '[' : '{')}
                    </span>
                  )
                : (
                    <span className="text-slate-700 dark:text-slate-300">
                      {typeof value === 'string' ? `"${value}"` : String(value)}
                      <span className="text-slate-400 dark:text-slate-600">,</span>
                    </span>
                  )}
            </div>

            {hasChildren && !isCollapsed && (
              <>
                <JsonTreeView
                  data={value}
                  conflictMap={conflictMap}
                  resolutions={resolutions}
                  onSelectLocal={onSelectLocal}
                  onSelectRemote={onSelectRemote}
                  onReset={onReset}
                  path={currentPath}
                  level={level + 1}
                />
                <div className="text-slate-500 dark:text-slate-500" style={{ paddingLeft: indent }}>
                  {Array.isArray(value) ? ']' : '}'}
                  <span className="text-slate-400 dark:text-slate-600">,</span>
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface ConflictFieldProps {
  fieldKey: string
  conflict: FieldConflict
  resolution?: 'local' | 'remote'
  onSelectLocal: () => void
  onSelectRemote: () => void
  onReset: () => void
  level: number
  isArray: boolean
}

function ConflictField({
  fieldKey,
  conflict,
  resolution,
  onSelectLocal,
  onSelectRemote,
  onReset,
  level,
  isArray,
}: ConflictFieldProps) {
  const indent = level * 16

  const formatValue = (value: unknown): string => {
    if (value === null)
      return 'null'
    if (value === undefined)
      return 'undefined'
    if (typeof value === 'string')
      return `"${value}"`
    if (typeof value === 'object')
      return JSON.stringify(value, null, 2)
    return String(value)
  }

  const bgColor = resolution === 'local'
    ? 'bg-green-100/50 dark:bg-green-900/30'
    : resolution === 'remote'
      ? 'bg-blue-100/50 dark:bg-blue-900/30'
      : 'bg-orange-100/50 dark:bg-orange-900/30'

  const borderColor = resolution === 'local'
    ? 'border-l-4 border-l-green-500'
    : resolution === 'remote'
      ? 'border-l-4 border-l-blue-500'
      : 'border-l-4 border-l-orange-500'

  return (
    <div className={`${bgColor} ${borderColor} my-1`}>
      {/* Conflict indicator */}
      <div className="flex items-center py-1" style={{ paddingLeft: indent }}>
        <Icon icon="mdi:alert" className="size-4 text-orange-500 dark:text-orange-400 shrink-0 mr-2" />
        <span className="text-orange-600 dark:text-orange-300 text-xs font-semibold">[冲突 - 请选择]</span>

        {/* Reset button */}
        {resolution && (
          <div className="flex py-1" style={{ paddingLeft: indent + 20 }}>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              onClick={onReset}
            >
              <Icon icon="mdi:undo" className="size-3 mr-1" />
              撤销选择
            </Button>
          </div>
        )}
      </div>

      {/* Local option */}
      <div
        className={`flex items-center cursor-pointer hover:bg-green-200/50 dark:hover:bg-green-900/50 py-1 ${resolution === 'local' ? 'bg-green-200/60 dark:bg-green-900/40' : ''}`}
        style={{ paddingLeft: indent + 20 }}
        onClick={onSelectLocal}
      >
        <span className="text-green-600 dark:text-green-400 text-xs px-2 py-0.5 bg-green-200/60 dark:bg-green-900/50 rounded mr-2 shrink-0">本地最新</span>
        {!isArray && (
          <span className="text-green-600 dark:text-green-400">
            "
            {fieldKey}
            "
          </span>
        )}
        {!isArray && <span className="text-slate-500 dark:text-slate-500 mx-1">:</span>}
        <span className="text-slate-700 dark:text-slate-300">{formatValue(conflict.localValue)}</span>
        {resolution === 'local' && (
          <Icon icon="mdi:check-circle" className="size-4 text-green-600 dark:text-green-400 ml-2" />
        )}
      </div>

      {/* Remote option */}
      <div
        className={`flex items-center cursor-pointer hover:bg-blue-200/50 dark:hover:bg-blue-900/50 py-1 ${resolution === 'remote' ? 'bg-blue-200/60 dark:bg-blue-900/40' : ''}`}
        style={{ paddingLeft: indent + 20 }}
        onClick={onSelectRemote}
      >
        <span className="text-blue-600 dark:text-blue-400 text-xs px-2 py-0.5 bg-blue-200/60 dark:bg-blue-900/50 rounded mr-2 shrink-0">远端最新</span>
        {!isArray && (
          <span className="text-blue-600 dark:text-blue-400">
            "
            {fieldKey}
            "
          </span>
        )}
        {!isArray && <span className="text-slate-500 dark:text-slate-500 mx-1">:</span>}
        <span className="text-slate-700 dark:text-slate-300">{formatValue(conflict.remoteValue)}</span>
        {resolution === 'remote' && (
          <Icon icon="mdi:check-circle" className="size-4 text-blue-600 dark:text-blue-400 ml-2" />
        )}
      </div>

    </div>
  )
}
