import type { MockedClass, MockedFunction } from 'vitest'
import type { SessionCache } from '../session-cache-group'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SessionCacheGroupRegistry } from '../session-cache-group-registry'

// Mock storage
const mockStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}

// Mock logger
const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
}

// Mock SessionCache
const mockSessionCacheInstance = {
  clear: vi.fn().mockResolvedValue(undefined),
}

const MockSessionCache = vi.fn().mockImplementation(() => mockSessionCacheInstance)

// Apply mocks
vi.mock('#imports', () => ({
  storage: mockStorage,
}))

vi.mock('@/utils/logger', () => ({
  logger: mockLogger,
}))

vi.mock('../session-cache-group', () => ({
  SessionCache: MockSessionCache,
}))

describe('sessionCacheGroupRegistry', () => {
  const typedMockStorage = mockStorage as {
    getItem: MockedFunction<any>
    setItem: MockedFunction<any>
    removeItem: MockedFunction<any>
  }

  const MockedSessionCacheClass = MockSessionCache as unknown as MockedClass<typeof SessionCache>

  beforeEach(() => {
    vi.clearAllMocks()

    // Reset mock implementations
    typedMockStorage.getItem.mockResolvedValue([])
    typedMockStorage.setItem.mockResolvedValue(undefined)
    typedMockStorage.removeItem.mockResolvedValue(undefined)
  })

  describe('registerCacheGroup', () => {
    it('should register a new cache group', async () => {
      typedMockStorage.getItem.mockResolvedValueOnce([]) // Empty registry

      await SessionCacheGroupRegistry.registerCacheGroup('auth')

      expect(typedMockStorage.setItem).toHaveBeenCalledWith(
        'session:__system_cache_registry',
        ['auth'],
      )
      expect(mockLogger.info).toHaveBeenCalledWith('[CacheRegistry] Registered group:', 'auth')
    })

    it('should not register duplicate cache groups', async () => {
      typedMockStorage.getItem.mockResolvedValueOnce(['auth', 'api']) // Existing registry

      await SessionCacheGroupRegistry.registerCacheGroup('auth')

      // Should not call setItem since 'auth' already exists
      expect(typedMockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should add to existing registry', async () => {
      typedMockStorage.getItem.mockResolvedValueOnce(['auth']) // Existing registry

      await SessionCacheGroupRegistry.registerCacheGroup('api')

      expect(typedMockStorage.setItem).toHaveBeenCalledWith(
        'session:__system_cache_registry',
        ['auth', 'api'],
      )
    })

    it('should handle storage errors gracefully', async () => {
      typedMockStorage.getItem.mockRejectedValueOnce(new Error('Storage error'))

      await SessionCacheGroupRegistry.registerCacheGroup('auth')

      expect(mockLogger.error).toHaveBeenCalledWith(
        '[CacheRegistry] Failed to register group:',
        expect.any(Error),
      )
    })
  })

  describe('getAllCacheGroup', () => {
    it('should return all registered cache groups', async () => {
      const expectedGroups = ['auth', 'api', 'translate']
      typedMockStorage.getItem.mockResolvedValueOnce(expectedGroups)

      const result = await SessionCacheGroupRegistry.getAllCacheGroup()

      expect(result).toEqual(expectedGroups)
      expect(typedMockStorage.getItem).toHaveBeenCalledWith('session:__system_cache_registry')
    })

    it('should return empty array when no registry exists', async () => {
      typedMockStorage.getItem.mockResolvedValueOnce(null)

      const result = await SessionCacheGroupRegistry.getAllCacheGroup()

      expect(result).toEqual([])
    })

    it('should handle storage errors gracefully', async () => {
      typedMockStorage.getItem.mockRejectedValueOnce(new Error('Storage error'))

      const result = await SessionCacheGroupRegistry.getAllCacheGroup()

      expect(result).toEqual([])
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[CacheRegistry] Failed to get registry:',
        expect.any(Error),
      )
    })
  })

  describe('getCacheGroup', () => {
    it('should register group and return SessionCache instance', async () => {
      typedMockStorage.getItem.mockResolvedValueOnce(['existing']) // Existing registry

      const result = await SessionCacheGroupRegistry.getCacheGroup('newGroup')

      // Should register the group
      expect(typedMockStorage.setItem).toHaveBeenCalledWith(
        'session:__system_cache_registry',
        ['existing', 'newGroup'],
      )

      // Should create and return SessionCache instance
      expect(MockedSessionCacheClass).toHaveBeenCalledWith('newGroup')
      expect(result).toBeDefined()
    })

    it('should not duplicate registration for existing group', async () => {
      typedMockStorage.getItem.mockResolvedValueOnce(['auth']) // Group already exists

      const result = await SessionCacheGroupRegistry.getCacheGroup('auth')

      // Should not update registry
      expect(typedMockStorage.setItem).not.toHaveBeenCalled()

      // Should still return SessionCache instance
      expect(MockedSessionCacheClass).toHaveBeenCalledWith('auth')
      expect(result).toBeDefined()
    })
  })

  describe('clearAllCacheGroup', () => {
    it('should clear all registered cache groups and registry', async () => {
      const registeredGroups = ['auth', 'api', 'translate']
      typedMockStorage.getItem.mockResolvedValueOnce(registeredGroups)

      await SessionCacheGroupRegistry.clearAllCacheGroup()

      // Should create SessionCache for each group and call clear
      expect(MockedSessionCacheClass).toHaveBeenCalledTimes(3)
      expect(MockedSessionCacheClass).toHaveBeenCalledWith('auth')
      expect(MockedSessionCacheClass).toHaveBeenCalledWith('api')
      expect(MockedSessionCacheClass).toHaveBeenCalledWith('translate')

      // Should clear the registry
      expect(typedMockStorage.removeItem).toHaveBeenCalledWith('session:__system_cache_registry')

      expect(mockLogger.info).toHaveBeenCalledWith(
        '[CacheRegistry] Clearing all cache groups:',
        registeredGroups,
      )
      expect(mockLogger.info).toHaveBeenCalledWith('[CacheRegistry] All caches cleared')
    })

    it('should handle empty registry', async () => {
      typedMockStorage.getItem.mockResolvedValueOnce([])

      await SessionCacheGroupRegistry.clearAllCacheGroup()

      // Should not create any SessionCache instances
      expect(MockedSessionCacheClass).not.toHaveBeenCalled()

      // Should still clear the registry
      expect(typedMockStorage.removeItem).toHaveBeenCalledWith('session:__system_cache_registry')
    })

    it('should handle errors gracefully', async () => {
      typedMockStorage.getItem.mockRejectedValueOnce(new Error('Storage error'))

      await SessionCacheGroupRegistry.clearAllCacheGroup()

      expect(mockLogger.error).toHaveBeenCalledWith(
        '[CacheRegistry] Failed to clear all caches:',
        expect.any(Error),
      )
    })
  })

  describe('removeCacheGroup', () => {
    it('should clear cache group and remove from registry', async () => {
      const existingRegistry = ['auth', 'api', 'translate']
      typedMockStorage.getItem.mockResolvedValueOnce(existingRegistry)

      await SessionCacheGroupRegistry.removeCacheGroup('api')

      // Should clear the cache
      expect(MockedSessionCacheClass).toHaveBeenCalledWith('api')
      expect(mockSessionCacheInstance.clear).toHaveBeenCalled()

      // Should remove from registry
      expect(typedMockStorage.setItem).toHaveBeenCalledWith(
        'session:__system_cache_registry',
        ['auth', 'translate'], // 'api' removed
      )

      expect(mockLogger.info).toHaveBeenCalledWith(
        '[CacheRegistry] Removed group completely:',
        'api',
      )
    })

    it('should handle removing non-existent group', async () => {
      const existingRegistry = ['auth', 'translate']
      typedMockStorage.getItem.mockResolvedValueOnce(existingRegistry)

      await SessionCacheGroupRegistry.removeCacheGroup('nonexistent')

      // Should still try to clear the cache
      expect(mockSessionCacheInstance.clear).toHaveBeenCalled()

      // Registry should remain unchanged (filter will remove nothing)
      expect(typedMockStorage.setItem).toHaveBeenCalledWith(
        'session:__system_cache_registry',
        ['auth', 'translate'],
      )
    })

    it('should handle errors gracefully', async () => {
      typedMockStorage.getItem.mockRejectedValueOnce(new Error('Storage error'))

      await SessionCacheGroupRegistry.removeCacheGroup('api')

      expect(mockLogger.error).toHaveBeenCalledWith(
        '[CacheRegistry] Failed to remove group:',
        expect.any(Error),
      )
    })
  })
})
