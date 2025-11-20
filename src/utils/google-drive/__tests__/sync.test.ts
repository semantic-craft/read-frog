import type { RemoteConfigData } from '../sync'
import type { Config } from '@/types/config/config'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { configSchema } from '@/types/config/config'
import { CONFIG_SCHEMA_VERSION, CONFIG_SCHEMA_VERSION_STORAGE_KEY, CONFIG_STORAGE_KEY, LAST_SYNC_TIME_STORAGE_KEY } from '@/utils/constants/config'

// Import after mocking
import { syncConfig } from '../sync'

// Mock all external dependencies before importing
const mockStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  getMeta: vi.fn(),
  setMeta: vi.fn(),
}

const mockMigrateConfig = vi.fn()
const mockLogger = {
  error: vi.fn(),
  info: vi.fn(),
}

const mockApi = {
  findFileInAppData: vi.fn(),
  downloadFile: vi.fn(),
  uploadFile: vi.fn(),
}

const mockAuth = {
  getValidAccessToken: vi.fn(),
}

vi.mock('#imports', () => ({
  storage: mockStorage,
}))

vi.mock('@/utils/config/migration', () => ({
  migrateConfig: mockMigrateConfig,
}))

vi.mock('@/utils/logger', () => ({
  logger: mockLogger,
}))

vi.mock('../api', () => mockApi)

vi.mock('../auth', () => mockAuth)

// Test data factories
function createMockConfig(overrides: Partial<Config> = {}): Config {
  return {
    language: {
      detectedCode: 'eng',
      sourceCode: 'auto',
      targetCode: 'cmn',
      level: 'intermediate',
    },
    providersConfig: [],
    read: { providerId: 'test-read' },
    translate: {
      providerId: 'test-translate',
      mode: 'bilingual',
      node: { enabled: true, hotkey: 'Control' },
      page: {
        range: 'main',
        autoTranslatePatterns: [],
        autoTranslateLanguages: [],
        shortcut: ['ctrl+shift+t'],
      },
      promptsConfig: {
        prompt: '',
        patterns: [],
      },
      requestQueueConfig: {
        capacity: 10,
        rate: 2,
      },
      batchQueueConfig: {
        maxCharactersPerBatch: 1000,
        maxItemsPerBatch: 5,
      },
      translationNodeStyle: {
        preset: 'default',
        isCustom: false,
        customCSS: null,
      },
    },
    tts: { providerId: null, model: 'tts-1', voice: 'alloy', speed: 1 },
    floatingButton: { enabled: true, position: 0.66, disabledFloatingButtonPatterns: [] },
    selectionToolbar: { enabled: true, disabledSelectionToolbarPatterns: [] },
    sideContent: { width: 400 },
    betaExperience: { enabled: false },
    ...overrides,
  }
}

function createMockRemoteConfigData(overrides: Partial<RemoteConfigData> = {}): RemoteConfigData {
  return {
    [CONFIG_STORAGE_KEY]: createMockConfig(),
    [CONFIG_SCHEMA_VERSION_STORAGE_KEY]: CONFIG_SCHEMA_VERSION,
    lastModified: Date.now(),
    ...overrides,
  }
}

function createMockGoogleDriveFile(overrides: Partial<{ id: string, name: string, mimeType: string, modifiedTime: string, size: string }> = {}) {
  return {
    id: 'test-file-id',
    name: 'read-frog-config.json',
    mimeType: 'application/json',
    modifiedTime: new Date().toISOString(),
    size: '1024',
    ...overrides,
  }
}

describe('googleDrive configuration sync', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock implementations
    mockAuth.getValidAccessToken.mockResolvedValue('test-access-token')
    mockStorage.getItem.mockResolvedValue(null)
    mockStorage.setItem.mockResolvedValue(undefined)
    mockStorage.getMeta.mockResolvedValue({ modifiedAt: Date.now() })
    mockStorage.setMeta.mockResolvedValue(undefined)
    mockMigrateConfig.mockImplementation(async (config, _version) => config)
    mockApi.findFileInAppData.mockResolvedValue(null)
    mockApi.downloadFile.mockResolvedValue('{}')
    mockApi.uploadFile.mockResolvedValue(createMockGoogleDriveFile())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('syncConfig integration tests', () => {
    describe('first sync scenarios', () => {
      it('should upload local config when no remote config exists', async () => {
        const mockConfig = createMockConfig()
        const localModifiedTime = Date.now() - 5000

        mockStorage.getItem
          .mockResolvedValueOnce(mockConfig)
          .mockResolvedValueOnce(CONFIG_SCHEMA_VERSION)
          .mockResolvedValueOnce(null) // No last sync time
        mockStorage.getMeta.mockResolvedValue({ modifiedAt: localModifiedTime })
        mockApi.findFileInAppData.mockResolvedValue(null)
        mockApi.uploadFile.mockResolvedValue(createMockGoogleDriveFile())

        await syncConfig()

        expect(mockApi.findFileInAppData).toHaveBeenCalledWith('read-frog-config.json')
        expect(mockApi.uploadFile).toHaveBeenCalled()
        expect(mockStorage.setItem).toHaveBeenCalledWith(
          expect.stringContaining(LAST_SYNC_TIME_STORAGE_KEY),
          expect.any(Number),
        )
      })

      it('should download remote config on first sync when remote exists', async () => {
        const mockConfig = createMockConfig()
        const mockRemoteData = createMockRemoteConfigData({
          [CONFIG_STORAGE_KEY]: mockConfig,
          lastModified: Date.now() - 1000,
        })

        mockStorage.getItem
          .mockResolvedValueOnce(mockConfig)
          .mockResolvedValueOnce(CONFIG_SCHEMA_VERSION)
          .mockResolvedValueOnce(null) // No last sync time
        mockStorage.getMeta.mockResolvedValue({ modifiedAt: Date.now() - 5000 })
        mockApi.findFileInAppData.mockResolvedValue(createMockGoogleDriveFile())
        mockApi.downloadFile.mockResolvedValue(JSON.stringify(mockRemoteData))
        mockMigrateConfig.mockResolvedValue(mockConfig)
        vi.spyOn(configSchema, 'parse').mockReturnValue(mockConfig)

        await syncConfig()

        expect(mockApi.downloadFile).toHaveBeenCalled()
        expect(mockStorage.setItem).toHaveBeenCalledWith(`local:${CONFIG_STORAGE_KEY}`, mockConfig)
      })
    })

    describe('remote newer scenarios', () => {
      it('should download remote config when remote is newer', async () => {
        const mockConfig = createMockConfig()
        const mockRemoteData = createMockRemoteConfigData({
          [CONFIG_STORAGE_KEY]: mockConfig,
          lastModified: Date.now(), // Remote is newer
        })
        const localModifiedTime = Date.now() - 5000
        const lastSyncTime = Date.now() - 10000

        mockStorage.getItem
          .mockResolvedValueOnce(mockConfig)
          .mockResolvedValueOnce(CONFIG_SCHEMA_VERSION)
          .mockResolvedValueOnce(lastSyncTime)
        mockStorage.getMeta.mockResolvedValue({ modifiedAt: localModifiedTime })
        mockApi.findFileInAppData.mockResolvedValue(createMockGoogleDriveFile())
        mockApi.downloadFile.mockResolvedValue(JSON.stringify(mockRemoteData))
        mockMigrateConfig.mockResolvedValue(mockConfig)
        vi.spyOn(configSchema, 'parse').mockReturnValue(mockConfig)

        await syncConfig()

        expect(mockApi.downloadFile).toHaveBeenCalled()
        expect(mockStorage.setItem).toHaveBeenCalledWith(`local:${CONFIG_STORAGE_KEY}`, mockConfig)
      })

      it('should migrate remote config when remote has older schema version', async () => {
        const mockOldConfig = createMockConfig()
        const mockNewConfig = createMockConfig({ language: { ...mockOldConfig.language, targetCode: 'jpn' } })
        const mockRemoteData = createMockRemoteConfigData({
          [CONFIG_STORAGE_KEY]: mockOldConfig,
          [CONFIG_SCHEMA_VERSION_STORAGE_KEY]: CONFIG_SCHEMA_VERSION - 1,
          lastModified: Date.now(),
        })

        mockStorage.getItem
          .mockResolvedValueOnce(mockOldConfig)
          .mockResolvedValueOnce(CONFIG_SCHEMA_VERSION)
          .mockResolvedValueOnce(Date.now() - 10000)
        mockStorage.getMeta.mockResolvedValue({ modifiedAt: Date.now() - 5000 })
        mockApi.findFileInAppData.mockResolvedValue(createMockGoogleDriveFile())
        mockApi.downloadFile.mockResolvedValue(JSON.stringify(mockRemoteData))
        mockMigrateConfig.mockResolvedValue(mockNewConfig)
        vi.spyOn(configSchema, 'parse').mockReturnValue(mockNewConfig)

        await syncConfig()

        expect(mockMigrateConfig).toHaveBeenCalledWith(mockOldConfig, CONFIG_SCHEMA_VERSION - 1)
        expect(mockStorage.setItem).toHaveBeenCalledWith(`local:${CONFIG_STORAGE_KEY}`, mockNewConfig)
      })
    })

    describe('local newer scenarios', () => {
      it('should upload local config when local is newer', async () => {
        const mockConfig = createMockConfig()
        const mockRemoteData = createMockRemoteConfigData({
          [CONFIG_STORAGE_KEY]: mockConfig,
          lastModified: Date.now() - 5000, // Remote is older
        })
        const localModifiedTime = Date.now()

        mockStorage.getItem
          .mockResolvedValueOnce(mockConfig)
          .mockResolvedValueOnce(CONFIG_SCHEMA_VERSION)
          .mockResolvedValueOnce(Date.now() - 10000)
        mockStorage.getMeta.mockResolvedValue({ modifiedAt: localModifiedTime })
        mockApi.findFileInAppData.mockResolvedValue(createMockGoogleDriveFile())
        mockApi.downloadFile.mockResolvedValue(JSON.stringify(mockRemoteData))

        await syncConfig()

        expect(mockApi.uploadFile).toHaveBeenCalled()
      })
    })

    describe('equal timestamps scenario', () => {
      it('should update sync time when timestamps are equal', async () => {
        const mockConfig = createMockConfig()
        const mockRemoteData = createMockRemoteConfigData({
          [CONFIG_STORAGE_KEY]: mockConfig,
          lastModified: Date.now(), // Same as local
        })
        const localModifiedTime = Date.now()

        mockStorage.getItem
          .mockResolvedValueOnce(mockConfig)
          .mockResolvedValueOnce(CONFIG_SCHEMA_VERSION)
          .mockResolvedValueOnce(Date.now() - 10000)
        mockStorage.getMeta.mockResolvedValue({ modifiedAt: localModifiedTime })
        mockApi.findFileInAppData.mockResolvedValue(createMockGoogleDriveFile())
        mockApi.downloadFile.mockResolvedValue(JSON.stringify(mockRemoteData))

        await syncConfig()

        expect(mockApi.uploadFile).not.toHaveBeenCalled()
        expect(mockStorage.setItem).toHaveBeenCalledWith(
          expect.stringContaining(LAST_SYNC_TIME_STORAGE_KEY),
          expect.any(Number),
        )
      })
    })

    describe('migration scenarios', () => {
      it('should handle migration failures gracefully', async () => {
        const mockConfig = createMockConfig()
        const mockRemoteData = createMockRemoteConfigData({
          [CONFIG_STORAGE_KEY]: mockConfig,
          [CONFIG_SCHEMA_VERSION_STORAGE_KEY]: CONFIG_SCHEMA_VERSION - 1,
          lastModified: Date.now(),
        })

        mockStorage.getItem
          .mockResolvedValueOnce(mockConfig)
          .mockResolvedValueOnce(CONFIG_SCHEMA_VERSION)
          .mockResolvedValueOnce(null)
        mockStorage.getMeta.mockResolvedValue({ modifiedAt: Date.now() - 5000 })
        mockApi.findFileInAppData.mockResolvedValue(createMockGoogleDriveFile())
        mockApi.downloadFile.mockResolvedValue(JSON.stringify(mockRemoteData))
        mockMigrateConfig.mockRejectedValue(new Error('Migration failed'))

        await expect(syncConfig()).rejects.toThrow('Migration failed')
      })
    })
  })
})
