import type { FieldConflict } from '@/utils/google-drive/conflict-merge'
import { i18n } from '#imports'
import { Icon } from '@iconify/react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/shadcn/button'

interface JsonTreeViewProps {
  data: any
  conflictMap: Map<string, FieldConflict>
  resolutions: Record<string, 'local' | 'remote'>
  onSelectLocal: (pathKey: string) => void
  onSelectRemote: (pathKey: string) => void
  onReset: (pathKey: string) => void
}

interface InternalProps extends JsonTreeViewProps {
  path: string[]
  level: number
}

export function JsonTreeView(props: JsonTreeViewProps) {
  return <JsonTreeViewInternal {...props} path={[]} level={0} />
}

function JsonTreeViewInternal({
  data,
  conflictMap,
  resolutions,
  onSelectLocal,
  onSelectRemote,
  onReset,
  path,
  level,
}: InternalProps) {
  const initialCollapsed = useMemo(() => {
    const collapsed: Record<string, boolean> = {}
    const entries = Array.isArray(data) ? data.map((v, i) => [String(i), v]) : Object.entries(data)

    for (const [key, value] of entries) {
      const pathKey = [...path, key].join('.')
      if (value !== null && typeof value === 'object') {
        const hasConflict = Array.from(conflictMap.keys()).some(cp =>
          cp === pathKey || cp.startsWith(`${pathKey}.`),
        )
        if (!hasConflict) {
          collapsed[pathKey] = true
        }
      }
    }
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

  if (level === 0) {
    return (
      <div className="font-mono text-sm">
        <div className="text-slate-500">{'{'}</div>
        {entries.map(([key, value]) => {
          const currentPath = [...path, key]
          const pathKey = currentPath.join('.')
          const conflict = conflictMap.get(pathKey)
          const resolution = resolutions[pathKey]
          const isCollapsed = collapsed[pathKey]
          const hasChildren = value !== null && typeof value === 'object'
          const childCount = hasChildren ? (Array.isArray(value) ? value.length : Object.keys(value).length) : 0
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
                level={level + 1}
                isArray={isArray}
              />
            )
          }

          return (
            <div key={pathKey}>
              <div
                className="flex items-center hover:bg-slate-100/50 dark:hover:bg-slate-800/50 py-0.5"
                style={{ paddingLeft: (level + 1) * 16 }}
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
                                  {childCount === 1 ? i18n.t('options.config.sync.googleDrive.conflict.item') : i18n.t('options.config.sync.googleDrive.conflict.items')}
                                </span>
                                {Array.isArray(value) ? ']' : '}'}
                                {hasConflictInChildren && (
                                  <span className="ml-2 text-orange-500 dark:text-orange-400 text-xs">{i18n.t('options.config.sync.googleDrive.conflict.hasConflictInChildren')}</span>
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
                  <JsonTreeViewInternal
                    data={value}
                    conflictMap={conflictMap}
                    resolutions={resolutions}
                    onSelectLocal={onSelectLocal}
                    onSelectRemote={onSelectRemote}
                    onReset={onReset}
                    path={currentPath}
                    level={level + 1}
                  />
                  <div className="text-slate-500 dark:text-slate-500" style={{ paddingLeft: (level + 1) * 16 }}>
                    {Array.isArray(value) ? ']' : '}'}
                    <span className="text-slate-400 dark:text-slate-600">,</span>
                  </div>
                </>
              )}
            </div>
          )
        })}
        <div className="text-slate-500">{'}'}</div>
      </div>
    )
  }

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
                                {childCount === 1 ? i18n.t('options.config.sync.googleDrive.conflict.item') : i18n.t('options.config.sync.googleDrive.conflict.items')}
                              </span>
                              {Array.isArray(value) ? ']' : '}'}
                              {hasConflictInChildren && (
                                <span className="ml-2 text-orange-500 dark:text-orange-400 text-xs">{i18n.t('options.config.sync.googleDrive.conflict.hasConflictInChildren')}</span>
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
                <JsonTreeViewInternal
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
      <div className="flex items-center py-1" style={{ paddingLeft: indent }}>
        <Icon icon="mdi:alert" className="size-4 text-orange-500 dark:text-orange-400 shrink-0 mr-2" />
        <span className="text-orange-600 dark:text-orange-300 text-xs font-semibold">{i18n.t('options.config.sync.googleDrive.conflict.conflictPrompt')}</span>

        {resolution && (
          <div className="flex py-1" style={{ paddingLeft: indent + 20 }}>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              onClick={onReset}
            >
              <Icon icon="mdi:undo" className="size-3 mr-1" />
              {i18n.t('options.config.sync.googleDrive.conflict.reset')}
            </Button>
          </div>
        )}
      </div>

      <div
        className={`flex items-center cursor-pointer hover:bg-green-200/50 dark:hover:bg-green-900/50 py-1 ${resolution === 'local' ? 'bg-green-200/60 dark:bg-green-900/40' : ''}`}
        style={{ paddingLeft: indent + 20 }}
        onClick={onSelectLocal}
      >
        <span className="text-green-600 dark:text-green-400 text-xs px-2 py-0.5 bg-green-200/60 dark:bg-green-900/50 rounded mr-2 shrink-0">{i18n.t('options.config.sync.googleDrive.conflict.localLatest')}</span>
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

      <div
        className={`flex items-center cursor-pointer hover:bg-blue-200/50 dark:hover:bg-blue-900/50 py-1 ${resolution === 'remote' ? 'bg-blue-200/60 dark:bg-blue-900/40' : ''}`}
        style={{ paddingLeft: indent + 20 }}
        onClick={onSelectRemote}
      >
        <span className="text-blue-600 dark:text-blue-400 text-xs px-2 py-0.5 bg-blue-200/60 dark:bg-blue-900/50 rounded mr-2 shrink-0">{i18n.t('options.config.sync.googleDrive.conflict.remoteLatest')}</span>
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
