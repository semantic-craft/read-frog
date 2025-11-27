import type { Config } from '@/types/config/config'
import { dequal } from 'dequal'

export interface ConfigDiff {
  path: string[]
  localValue: unknown
  remoteValue: unknown
  type: 'primitive' | 'array' | 'object'
}

export interface ConflictResolution {
  diffs: ConfigDiff[]
  selections: Record<string, 'local' | 'remote'>
}

export function detectConflicts(
  local: Record<string, any>,
  remote: Record<string, any>,
  basePath: string[] = [],
): ConfigDiff[] {
  const diffs: ConfigDiff[] = []
  const allKeys = new Set([...Object.keys(local), ...Object.keys(remote)])

  for (const key of allKeys) {
    const currentPath = [...basePath, key]
    const localVal = local[key]
    const remoteVal = remote[key]

    if (dequal(localVal, remoteVal)) {
      continue
    }

    const isLocalArray = Array.isArray(localVal)
    const isRemoteArray = Array.isArray(remoteVal)
    // Treat as object only if it's a non-null object and NOT an array
    const isLocalObject = typeof localVal === 'object' && localVal !== null && !isLocalArray
    const isRemoteObject = typeof remoteVal === 'object' && remoteVal !== null && !isRemoteArray

    if (isLocalArray || isRemoteArray) {
      diffs.push({
        path: currentPath,
        localValue: localVal,
        remoteValue: remoteVal,
        type: 'array',
      })
    }
    else if (isLocalObject && isRemoteObject) {
      diffs.push(...detectConflicts(localVal, remoteVal, currentPath))
    }
    else {
      diffs.push({
        path: currentPath,
        localValue: localVal,
        remoteValue: remoteVal,
        type: 'primitive',
      })
    }
  }

  return diffs
}

export function mergeConfigWithSelections(
  local: Config,
  remote: Config,
  selections: Record<string, 'local' | 'remote'>,
): Config {
  // Start with a deep clone of local config
  const result = JSON.parse(JSON.stringify(local))

  // Apply remote selections
  for (const [pathStr, selection] of Object.entries(selections)) {
    if (selection === 'remote') {
      const path = pathStr.split('.')
      let current = result as any

      // Navigate to the parent object
      for (let i = 0; i < path.length - 1; i++) {
        if (current[path[i]] === undefined) {
          // Create object if missing (though structure should ideally match)
          current[path[i]] = {}
        }
        current = current[path[i]]
      }

      const lastKey = path[path.length - 1]

      // Get value from remote
      let remoteVal: any = remote
      for (const key of path) {
        remoteVal = remoteVal?.[key]
      }

      current[lastKey] = remoteVal
    }
  }

  return result
}
