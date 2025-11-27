import type { Config } from '@/types/config/config'
import type { ConfigDiff } from '@/utils/google-drive/conflict'
import { i18n } from '#imports'
import { Icon } from '@iconify/react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/shadcn/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/shadcn/dialog'
import { ScrollArea } from '@/components/shadcn/scroll-area'
import { cn } from '@/lib/utils'
import { detectConflicts, mergeConfigWithSelections } from '@/utils/google-drive/conflict'

interface DiffNodeProps {
  local: any
  remote: any
  path: string[]
  diffMap: Map<string, ConfigDiff>
  selections: Record<string, 'local' | 'remote'>
  onSelect: (path: string, side: 'local' | 'remote') => void
  level?: number
}

function formatValue(val: unknown): string {
  if (val === null)
    return 'null'
  if (val === undefined)
    return 'undefined'
  if (typeof val === 'string')
    return `"${val}"`
  if (typeof val === 'number' || typeof val === 'boolean')
    return String(val)

  // Format arrays and objects as JSON
  if (Array.isArray(val) || typeof val === 'object') {
    return JSON.stringify(val, null, 2)
  }

  return String(val)
}

function DiffNode({ local, remote, path, diffMap, selections, onSelect, level = 0 }: DiffNodeProps) {
  const pathStr = path.join('.')
  const diff = diffMap.get(pathStr)
  const isConflict = !!diff

  const hasConflictChildren = useMemo(() => {
    if (isConflict)
      return false
    const prefix = pathStr ? `${pathStr}.` : ''
    for (const key of diffMap.keys()) {
      if (key.startsWith(prefix))
        return true
    }
    return false
  }, [diffMap, pathStr, isConflict])

  if (!isConflict && !hasConflictChildren && path.length > 0) {
    return null
  }

  const indent = level * 16

  if (isConflict) {
    const selection = selections[pathStr]
    const fieldName = path[path.length - 1]

    return (
      <div className="border-b border-border/40">
        {/* Field name header */}
        <div className="px-4 py-2 bg-muted/30 border-b border-border/20" style={{ paddingLeft: indent + 16 }}>
          <span className="text-sm font-mono font-medium text-muted-foreground">{fieldName}</span>
        </div>

        {/* Diff comparison */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2 p-2">
          {/* Left side: Local (to be removed) */}
          <div
            className={cn(
              'p-3 rounded border-l-4 transition-all',
              selection === 'local'
                ? 'bg-red-50 dark:bg-red-950/20 border-l-red-600'
                : 'bg-red-50/50 dark:bg-red-950/10 border-l-red-300 opacity-60',
            )}
          >
            <div className="text-xs font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-1">
              <Icon icon="lucide:minus-circle" className="size-3" />
              Local (Current)
            </div>
            <pre className="text-xs font-mono whitespace-pre-wrap wrap-break-word text-foreground/90">
              {formatValue(local)}
            </pre>
          </div>

          {/* Middle: Action buttons */}
          <div className="flex flex-col gap-2 justify-center items-center py-3 min-w-[140px]">
            <Button
              size="sm"
              variant={selection === 'local' ? 'default' : 'outline'}
              onClick={() => onSelect(pathStr, 'local')}
              className="text-xs px-3 h-8 w-full"
            >
              {selection === 'local' && <Icon icon="lucide:check" className="size-3 mr-1" />}
              Keep Local
            </Button>
            <Button
              size="sm"
              variant={selection === 'remote' ? 'default' : 'outline'}
              onClick={() => onSelect(pathStr, 'remote')}
              className="text-xs px-3 h-8 w-full"
            >
              {selection === 'remote' && <Icon icon="lucide:check" className="size-3 mr-1" />}
              Keep Remote
            </Button>
          </div>

          {/* Right side: Remote (incoming) */}
          <div
            className={cn(
              'p-3 rounded border-r-4 transition-all',
              selection === 'remote'
                ? 'bg-green-50 dark:bg-green-950/20 border-r-green-600'
                : 'bg-green-50/50 dark:bg-green-950/10 border-r-green-300 opacity-60',
            )}
          >
            <div className="text-xs font-medium text-green-700 dark:text-green-400 mb-2 flex items-center gap-1">
              <Icon icon="lucide:plus-circle" className="size-3" />
              Remote (Incoming)
            </div>
            <pre className="text-xs font-mono whitespace-pre-wrap wrap-break-word text-foreground/90">
              {formatValue(remote)}
            </pre>
          </div>
        </div>
      </div>
    )
  }

  // Container node
  const keys = new Set([...Object.keys(local || {}), ...Object.keys(remote || {})])
  const sortedKeys = Array.from(keys).sort()

  return (
    <div>
      {path.length > 0 && (
        <div
          className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 py-2 border-b border-border/50"
          style={{ paddingLeft: indent + 16 }}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Icon icon="lucide:folder" className="size-4" />
            <span>{path.join(' › ')}</span>
          </div>
        </div>
      )}
      {sortedKeys.map(key => (
        <DiffNode
          key={key}
          local={local?.[key]}
          remote={remote?.[key]}
          path={[...path, key]}
          diffMap={diffMap}
          selections={selections}
          onSelect={onSelect}
          level={level + 1}
        />
      ))}
    </div>
  )
}

export function GoogleDriveConflictDialog({
  open,
  localConfig,
  remoteConfig,
  onResolve,
  onCancel,
}: {
  open: boolean
  localConfig: Config
  remoteConfig: Config
  onResolve: (mergedConfig: Config) => void
  onCancel: () => void
}) {
  const diffs = useMemo(() => detectConflicts(localConfig, remoteConfig), [localConfig, remoteConfig])

  const diffMap = useMemo(() => {
    const map = new Map<string, ConfigDiff>()
    diffs.forEach(d => map.set(d.path.join('.'), d))
    return map
  }, [diffs])

  const [selections, setSelections] = useState<Record<string, 'local' | 'remote'>>(() =>
    Object.fromEntries(diffs.map(d => [d.path.join('.'), 'local'])),
  )

  const handleSelect = (path: string, side: 'local' | 'remote') => {
    setSelections(prev => ({ ...prev, [path]: side }))
  }

  const selectAllLocal = () => {
    setSelections(Object.fromEntries(diffs.map(d => [d.path.join('.'), 'local'])))
  }

  const selectAllRemote = () => {
    setSelections(Object.fromEntries(diffs.map(d => [d.path.join('.'), 'remote'])))
  }

  const handleConfirm = () => {
    const merged = mergeConfigWithSelections(localConfig, remoteConfig, selections)
    onResolve(merged)
  }

  // Calculate conflict resolution statistics
  const totalConflicts = diffs.length
  const localCount = Object.values(selections).filter(s => s === 'local').length
  const remoteCount = Object.values(selections).filter(s => s === 'remote').length

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="lucide:git-merge" className="size-5" />
            {i18n.t('options.config.sync.googleDrive.conflictDetected')}
          </DialogTitle>
          <DialogDescription>
            {i18n.t('options.config.sync.googleDrive.conflictDescription')}
            {' '}
            <span className="ml-2 text-xs font-mono">
              (
              {totalConflicts}
              {' '}
              conflicts:
              {' '}
              {localCount}
              {' '}
              local,
              {' '}
              {remoteCount}
              {' '}
              remote)
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Header */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2 px-4 py-3 bg-muted/50 rounded-lg border text-sm font-medium shrink-0">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <Icon icon="lucide:monitor" className="size-4" />
            <span>Local (Current)</span>
          </div>
          <div className="w-[140px] text-center text-muted-foreground">
            Actions
          </div>
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <Icon icon="logos:google-drive" className="size-4" />
            <span>Remote (Incoming)</span>
          </div>
        </div>

        <ScrollArea className="flex-1 border rounded-lg min-h-0">
          <DiffNode
            local={localConfig}
            remote={remoteConfig}
            path={[]}
            diffMap={diffMap}
            selections={selections}
            onSelect={handleSelect}
          />
        </ScrollArea>

        <DialogFooter className="shrink-0 gap-2 flex-row justify-between items-center">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={selectAllLocal}>
              <Icon icon="lucide:check-circle" className="size-4 mr-1" />
              Accept All Local
            </Button>
            <Button size="sm" variant="outline" onClick={selectAllRemote}>
              <Icon icon="lucide:check-circle" className="size-4 mr-1" />
              Accept All Remote
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              <Icon icon="lucide:git-merge" className="size-4 mr-1" />
              {i18n.t('options.config.sync.googleDrive.confirmMerge')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
