import type { ConfigBackup } from '@/types/backup'
import type { Config } from '@/types/config/config'
import { storage } from '#imports'
import { configSchema } from '@/types/config/config'
import { migrateConfig } from '../config/migration'
import { CONFIG_SCHEMA_VERSION, CONFIG_SCHEMA_VERSION_STORAGE_KEY, CONFIG_STORAGE_KEY, LAST_SYNC_TIME_STORAGE_KEY } from '../constants/config'
import { logger } from '../logger'
import { downloadFile, findFileInAppData, uploadFile } from './api'
import { getValidAccessToken } from './auth'

// Google Drive 中存储配置的文件名
const GOOGLE_DRIVE_CONFIG_FILENAME = 'read-frog-config.json'

export interface RemoteConfigData extends ConfigBackup {
  lastModified: number // 最后修改时间戳（毫秒）
}

/**
 * 获取本地配置及其修改时间
 */
async function getLocalConfig(): Promise<{ config: Config, schemaVersion: number, lastModified: number }> {
  try {
    const config = await storage.getItem<Config>(`local:${CONFIG_STORAGE_KEY}`)
    const schemaVersion = await storage.getItem<number>(`local:${CONFIG_SCHEMA_VERSION_STORAGE_KEY}`) ?? CONFIG_SCHEMA_VERSION

    if (!config) {
      throw new Error('Local config not found')
    }

    // 获取配置的最后修改时间（使用 storage meta）
    const meta = await storage.getMeta(`local:${CONFIG_STORAGE_KEY}`)
    const lastModified = (meta?.modifiedAt as number) ?? Date.now()

    return { config, schemaVersion, lastModified }
  }
  catch (error) {
    logger.error('Failed to get local config', error)
    throw error
  }
}

/**
 * 获取上次同步时间
 */
async function getLastSyncTime(): Promise<number | null> {
  const lastSyncTime = await storage.getItem<number>(`local:${LAST_SYNC_TIME_STORAGE_KEY}`)
  return lastSyncTime ?? null
}

/**
 * 设置上次同步时间
 */
async function setLastSyncTime(timestamp: number): Promise<void> {
  await storage.setItem(`local:${LAST_SYNC_TIME_STORAGE_KEY}`, timestamp)
}

/**
 * 获取远端配置及其修改时间
 */
async function getRemoteConfig(): Promise<RemoteConfigData | null> {
  try {
    // 确保已认证
    await getValidAccessToken()

    // 查找远端配置文件
    const file = await findFileInAppData(GOOGLE_DRIVE_CONFIG_FILENAME)

    if (!file) {
      logger.info('No remote config found')
      return null
    }

    // 下载文件内容
    const content = await downloadFile(file.id)
    const remoteData = JSON.parse(content) as RemoteConfigData

    logger.info('Remote config retrieved', {
      lastModified: remoteData.lastModified,
      schemaVersion: remoteData[CONFIG_SCHEMA_VERSION_STORAGE_KEY],
    })

    return remoteData
  }
  catch (error) {
    logger.error('Failed to get remote config', error)
    throw error
  }
}

/**
 * 上传本地配置到远端
 */
async function uploadLocalConfig(
  config: Config,
  schemaVersion: number,
  lastModified: number,
): Promise<void> {
  try {
    // 查找是否已存在配置文件
    const existingFile = await findFileInAppData(GOOGLE_DRIVE_CONFIG_FILENAME)

    const remoteData: RemoteConfigData = {
      [CONFIG_STORAGE_KEY]: config,
      [CONFIG_SCHEMA_VERSION_STORAGE_KEY]: schemaVersion,
      lastModified,
    }

    const content = JSON.stringify(remoteData, null, 2)

    await uploadFile(
      GOOGLE_DRIVE_CONFIG_FILENAME,
      content,
      existingFile?.id,
    )

    logger.info('Local config uploaded to Google Drive', { lastModified })
  }
  catch (error) {
    logger.error('Failed to upload local config', error)
    throw error
  }
}

/**
 * 下载远端配置并更新本地
 */
async function downloadRemoteConfig(remoteData: RemoteConfigData): Promise<void> {
  try {
    let config: Config = remoteData[CONFIG_STORAGE_KEY]
    const remoteSchemaVersion = remoteData[CONFIG_SCHEMA_VERSION_STORAGE_KEY]

    // 如果远端配置的 schema 版本较旧，进行迁移
    if (remoteSchemaVersion < CONFIG_SCHEMA_VERSION) {
      logger.info('Migrating remote config', {
        from: remoteSchemaVersion,
        to: CONFIG_SCHEMA_VERSION,
      })
      config = await migrateConfig(config, remoteSchemaVersion)
    }

    // 验证配置
    const validatedConfig = configSchema.parse(config)

    // 保存到本地
    await storage.setItem(`local:${CONFIG_STORAGE_KEY}`, validatedConfig)
    await storage.setItem(`local:${CONFIG_SCHEMA_VERSION_STORAGE_KEY}`, CONFIG_SCHEMA_VERSION)
    // 同时保存修改时间到 meta
    await storage.setMeta(`local:${CONFIG_STORAGE_KEY}`, { modifiedAt: remoteData.lastModified })

    logger.info('Remote config downloaded and applied', {
      lastModified: remoteData.lastModified,
    })
  }
  catch (error) {
    logger.error('Failed to download remote config', error)
    throw error
  }
}

/**
 * 同步配置
 * - 如果远端没有配置，上传本地配置
 * - 如果本地没有进行过同步且存在远端配置，下载远端配置
 * - 如果远端配置较新，下载远端配置
 * - 如果本地配置较新，上传本地配置
 * - 如果时间相同，不做任何操作
 * @throws 同步失败时抛出错误
 */
export async function syncConfig(): Promise<void> {
  try {
    // 获取本地配置
    const local = await getLocalConfig()

    // 获取远端配置
    const remote = await getRemoteConfig()

    // 如果远端没有配置，上传本地配置
    if (!remote) {
      await uploadLocalConfig(local.config, local.schemaVersion, local.lastModified)
      await setLastSyncTime(Date.now())
      return
    }

    const lastSyncTime = await getLastSyncTime()
    const isFirstSync = lastSyncTime === null

    if (isFirstSync) {
      await downloadRemoteConfig(remote)
      await setLastSyncTime(Date.now())
      return
    }

    if (remote.lastModified > local.lastModified) {
      await downloadRemoteConfig(remote)
      await setLastSyncTime(Date.now())
      return
    }

    if (local.lastModified > remote.lastModified) {
      await uploadLocalConfig(local.config, local.schemaVersion, local.lastModified)
      await setLastSyncTime(Date.now())
      return
    }

    await setLastSyncTime(Date.now())
  }
  catch (error) {
    logger.error('Config sync failed', error)
    throw error
  }
}
