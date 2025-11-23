import type { ConfigBackup } from '@/types/backup'
import type { Config } from '@/types/config/config'
import { storage } from '#imports'
import { configSchema } from '@/types/config/config'
import { migrateConfig } from '../config/migration'
import { CONFIG_SCHEMA_VERSION, CONFIG_SCHEMA_VERSION_STORAGE_KEY, CONFIG_STORAGE_KEY, LAST_SYNC_TIME_STORAGE_KEY } from '../constants/config'
import { logger } from '../logger'
import { downloadFile, findFileInAppData, uploadFile } from './api'
import { getValidAccessToken } from './auth'

const GOOGLE_DRIVE_CONFIG_FILENAME = 'read-frog-config.json'

export interface RemoteConfigData extends ConfigBackup {
  lastModified: number
}

async function getLocalConfig(): Promise<{ config: Config, schemaVersion: number, lastModified: number }> {
  try {
    const config = await storage.getItem<Config>(`local:${CONFIG_STORAGE_KEY}`)
    const schemaVersion = await storage.getItem<number>(`local:${CONFIG_SCHEMA_VERSION_STORAGE_KEY}`) ?? CONFIG_SCHEMA_VERSION

    if (!config) {
      throw new Error('Local config not found')
    }

    const meta = await storage.getMeta(`local:${CONFIG_STORAGE_KEY}`)
    const lastModified = (meta?.modifiedAt as number) ?? Date.now()

    return { config, schemaVersion, lastModified }
  }
  catch (error) {
    logger.error('Failed to get local config', error)
    throw error
  }
}

async function getLastSyncTime(): Promise<number | null> {
  const lastSyncTime = await storage.getItem<number>(`local:${LAST_SYNC_TIME_STORAGE_KEY}`)
  return lastSyncTime ?? null
}

async function setLastSyncTime(timestamp: number): Promise<void> {
  await storage.setItem(`local:${LAST_SYNC_TIME_STORAGE_KEY}`, timestamp)
}

async function getRemoteConfig(): Promise<RemoteConfigData | null> {
  try {
    await getValidAccessToken()
    const file = await findFileInAppData(GOOGLE_DRIVE_CONFIG_FILENAME)

    if (!file) {
      return null
    }

    const content = await downloadFile(file.id)
    return JSON.parse(content) as RemoteConfigData
  }
  catch (error) {
    logger.error('Failed to get remote config', error)
    throw error
  }
}

async function uploadLocalConfig(
  config: Config,
  schemaVersion: number,
  lastModified: number,
): Promise<void> {
  try {
    const existingFile = await findFileInAppData(GOOGLE_DRIVE_CONFIG_FILENAME)

    const remoteData: RemoteConfigData = {
      [CONFIG_STORAGE_KEY]: config,
      [CONFIG_SCHEMA_VERSION_STORAGE_KEY]: schemaVersion,
      lastModified,
    }

    const content = JSON.stringify(remoteData, null, 2)
    await uploadFile(GOOGLE_DRIVE_CONFIG_FILENAME, content, existingFile?.id)
  }
  catch (error) {
    logger.error('Failed to upload local config', error)
    throw error
  }
}

async function downloadRemoteConfig(remoteData: RemoteConfigData): Promise<void> {
  try {
    let config: Config = remoteData[CONFIG_STORAGE_KEY]
    const remoteSchemaVersion = remoteData[CONFIG_SCHEMA_VERSION_STORAGE_KEY]

    // Migrate if remote schema version is older
    if (remoteSchemaVersion < CONFIG_SCHEMA_VERSION) {
      logger.info('Migrating remote config', {
        from: remoteSchemaVersion,
        to: CONFIG_SCHEMA_VERSION,
      })
      config = await migrateConfig(config, remoteSchemaVersion)
    }

    const validatedConfig = configSchema.parse(config)

    await storage.setItem(`local:${CONFIG_STORAGE_KEY}`, validatedConfig)
    await storage.setItem(`local:${CONFIG_SCHEMA_VERSION_STORAGE_KEY}`, CONFIG_SCHEMA_VERSION)
    await storage.setMeta(`local:${CONFIG_STORAGE_KEY}`, { modifiedAt: remoteData.lastModified })
  }
  catch (error) {
    logger.error('Failed to download remote config', error)
    throw error
  }
}

/**
 * Synchronize configuration between local and Google Drive
 * - Upload local config if remote doesn't exist
 * - Download remote config on first sync
 * - Sync based on last modified timestamp
 */
export async function syncConfig(): Promise<void> {
  try {
    const local = await getLocalConfig()
    const remote = await getRemoteConfig()

    if (!remote) {
      logger.info('No remote config found, uploading local config')
      await uploadLocalConfig(local.config, local.schemaVersion, local.lastModified)
      await setLastSyncTime(Date.now())
      return
    }

    const lastSyncTime = await getLastSyncTime()
    const isFirstSync = lastSyncTime === null

    if (isFirstSync) {
      logger.info('First sync, downloading remote config')
      await downloadRemoteConfig(remote)
      await setLastSyncTime(Date.now())
      return
    }

    if (remote.lastModified > local.lastModified) {
      logger.info('Remote config is newer, downloading remote config')
      await downloadRemoteConfig(remote)
      await setLastSyncTime(Date.now())
      return
    }

    if (local.lastModified > remote.lastModified) {
      logger.info('Local config is newer, uploading local config')
      await uploadLocalConfig(local.config, local.schemaVersion, local.lastModified)
      await setLastSyncTime(Date.now())
      return
    }

    logger.info('No changes, skipping sync')
    await setLastSyncTime(Date.now())
  }
  catch (error) {
    logger.error('Config sync failed', error)
    throw error
  }
}
