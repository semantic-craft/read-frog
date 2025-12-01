import type { Config } from '@/types/config/config'
import { logger } from '../logger'

export interface FieldConflict {
  path: string[] // ['language', 'targetCode']
  baseValue: unknown
  localValue: unknown
  remoteValue: unknown
}

export interface ConflictDiffResult {
  merged: Config // 非冲突字段已自动合并
  conflicts: FieldConflict[]
}

/**
 * Deep equality check for primitive values, arrays, and objects
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b)
    return true

  if (a == null || b == null)
    return a === b

  if (typeof a !== typeof b)
    return false

  if (typeof a !== 'object')
    return false

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length)
      return false
    return a.every((item, index) => deepEqual(item, b[index]))
  }

  if (Array.isArray(a) || Array.isArray(b))
    return false

  const aKeys = Object.keys(a as object)
  const bKeys = Object.keys(b as object)

  if (aKeys.length !== bKeys.length)
    return false

  return aKeys.every(key => deepEqual((a as any)[key], (b as any)[key]))
}

/**
 * Recursively detect conflicts between base, local, and remote configs
 * Returns merged config and list of conflicts
 */
export function detectConflicts(
  base: Config,
  local: Config,
  remote: Config,
): ConflictDiffResult {
  const conflicts: FieldConflict[] = []
  const merged = {} as Config

  function traverse(
    basePath: string[],
    baseVal: any,
    localVal: any,
    remoteVal: any,
    _target: any,
  ) {
    // Handle primitive values or null
    if (
      baseVal == null
      || localVal == null
      || remoteVal == null
      || typeof baseVal !== 'object'
      || typeof localVal !== 'object'
      || typeof remoteVal !== 'object'
    ) {
      const baseChanged = !deepEqual(localVal, baseVal)
      const remoteChanged = !deepEqual(remoteVal, baseVal)

      if (baseChanged && remoteChanged) {
        // Both changed
        if (deepEqual(localVal, remoteVal)) {
          // Changed to same value - no conflict
          return localVal
        }
        else {
          // Conflict!
          conflicts.push({
            path: basePath,
            baseValue: baseVal,
            localValue: localVal,
            remoteValue: remoteVal,
          })
          // Default to local for now (will be resolved by user)
          return localVal
        }
      }
      else if (baseChanged) {
        // Only local changed
        return localVal
      }
      else if (remoteChanged) {
        // Only remote changed
        return remoteVal
      }
      else {
        // No change
        return baseVal
      }
    }

    // Handle arrays
    if (Array.isArray(baseVal)) {
      const baseChanged = !deepEqual(localVal, baseVal)
      const remoteChanged = !deepEqual(remoteVal, baseVal)

      if (baseChanged && remoteChanged) {
        if (deepEqual(localVal, remoteVal)) {
          return localVal
        }
        else {
          conflicts.push({
            path: basePath,
            baseValue: baseVal,
            localValue: localVal,
            remoteValue: remoteVal,
          })
          return localVal
        }
      }
      else if (baseChanged) {
        return localVal
      }
      else if (remoteChanged) {
        return remoteVal
      }
      else {
        return baseVal
      }
    }

    // Handle objects - recurse into properties
    const result: any = {}
    const allKeys = new Set([
      ...Object.keys(baseVal),
      ...Object.keys(localVal),
      ...Object.keys(remoteVal),
    ])

    for (const key of allKeys) {
      result[key] = traverse(
        [...basePath, key],
        baseVal[key],
        localVal[key],
        remoteVal[key],
        result,
      )
    }

    return result
  }

  const mergedResult = traverse([], base, local, remote, merged)

  logger.info('Conflict detection completed', {
    conflictCount: conflicts.length,
    conflicts: conflicts.map(c => c.path.join('.')),
  })

  return {
    merged: mergedResult as Config,
    conflicts,
  }
}

/**
 * Apply user resolutions to the merged config
 */
export function applyResolutions(
  diffResult: ConflictDiffResult,
  resolutions: Record<string, 'local' | 'remote'>,
): Config {
  const result = JSON.parse(JSON.stringify(diffResult.merged)) as Config

  for (const conflict of diffResult.conflicts) {
    const pathKey = conflict.path.join('.')
    const resolution = resolutions[pathKey]

    if (!resolution) {
      logger.warn('Unresolved conflict', { path: pathKey })
      continue
    }

    // Navigate to the parent object
    let current: any = result
    for (let i = 0; i < conflict.path.length - 1; i++) {
      current = current[conflict.path[i]]
    }

    // Set the resolved value
    const lastKey = conflict.path[conflict.path.length - 1]
    current[lastKey] = resolution === 'local' ? conflict.localValue : conflict.remoteValue
  }

  logger.info('Applied resolutions', {
    resolvedCount: Object.keys(resolutions).length,
  })

  return result
}
