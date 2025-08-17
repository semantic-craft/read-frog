import type { MockedFunction } from 'vitest'
import type { ProxyResponse } from '@/types/proxy-fetch'
import { storage } from '#imports'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { logger } from '@/utils/logger'
import { SessionCache } from '../session-cache-group'

// Mock the imports
vi.mock('#imports', () => ({
  storage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    getMeta: vi.fn(),
    setMeta: vi.fn(),
    removeMeta: vi.fn(),
    removeItems: vi.fn(),
  },
}))

vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/utils/constants/proxy-fetch', () => ({
  DEFAULT_PROXY_CACHE_TTL_MS: 3600000, // 1 hour
}))

describe('sessionCache', () => {
  let cache: SessionCache
  const mockStorage = storage as unknown as {
    getItem: MockedFunction<any>
    setItem: MockedFunction<any>
    removeItem: MockedFunction<any>
    getMeta: MockedFunction<any>
    setMeta: MockedFunction<any>
    removeMeta: MockedFunction<any>
    removeItems: MockedFunction<any>
  }

  const mockResponse: ProxyResponse = {
    status: 200,
    statusText: 'OK',
    headers: [['content-type', 'application/json']],
    body: '{"success": true}',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    cache = new SessionCache('test')

    // Reset mock implementations
    mockStorage.getItem.mockResolvedValue(null)
    mockStorage.setItem.mockResolvedValue(undefined)
    mockStorage.removeItem.mockResolvedValue(undefined)
    mockStorage.getMeta.mockResolvedValue(null)
    mockStorage.setMeta.mockResolvedValue(undefined)
    mockStorage.removeMeta.mockResolvedValue(undefined)
    mockStorage.removeItems.mockResolvedValue(undefined)
  })

  describe('constructor', () => {
    it('should create cache with default group key', () => {
      const defaultCache = new SessionCache()
      expect(defaultCache).toBeInstanceOf(SessionCache)
    })

    it('should create cache with custom group key', () => {
      const customCache = new SessionCache('auth')
      expect(customCache).toBeInstanceOf(SessionCache)
    })
  })

  describe('makeKey method (via behavior)', () => {
    it('should generate consistent keys for same method and URL', async () => {
      // Set up mock to capture the key being used
      let capturedKey: string = ''
      mockStorage.setItem.mockImplementation((...args: any[]) => {
        const [key] = args
        if (typeof key === 'string' && key.includes('GET_https://api.example.com')) {
          capturedKey = key
        }
        return Promise.resolve()
      })

      await cache.set('GET', 'https://api.example.com', mockResponse)

      expect(capturedKey).toBe('session:cache_test_GET_https://api.example.com')
    })
  })

  describe('ensureKeysListInitialized', () => {
    it('should initialize keys list when first accessed', async () => {
      mockStorage.getItem.mockResolvedValueOnce(null) // Keys list doesn't exist

      await cache.set('GET', 'https://api.example.com', mockResponse)

      // Should create the keys list
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'session:cache_test__meta_keys',
        [],
      )
    })

    it('should not reinitialize if keys list exists', async () => {
      mockStorage.getItem.mockResolvedValueOnce(['existing-key']) // Keys list exists

      await cache.set('GET', 'https://api.example.com', mockResponse)

      // Should not create empty keys list
      expect(mockStorage.setItem).not.toHaveBeenCalledWith(
        'session:cache_test__meta_keys',
        [],
      )
    })
  })

  describe('get method', () => {
    it('should return undefined when item does not exist', async () => {
      mockStorage.getItem.mockResolvedValueOnce(null) // No item
      mockStorage.getMeta.mockResolvedValueOnce(null) // No metadata

      const result = await cache.get('GET', 'https://api.example.com')

      expect(result).toBeUndefined()
    })

    it('should return undefined when metadata does not exist', async () => {
      mockStorage.getItem.mockResolvedValueOnce(mockResponse) // Item exists
      mockStorage.getMeta.mockResolvedValueOnce(null) // No metadata

      const result = await cache.get('GET', 'https://api.example.com')

      expect(result).toBeUndefined()
    })

    it('should return cached item when valid and not expired', async () => {
      const now = Date.now()
      mockStorage.getItem.mockResolvedValueOnce(mockResponse)
      mockStorage.getMeta.mockResolvedValueOnce({ timestamp: now })

      const result = await cache.get('GET', 'https://api.example.com')

      expect(result).toEqual(mockResponse)
      expect(mockStorage.setMeta).toHaveBeenCalledWith(
        'session:cache_test_GET_https://api.example.com',
        { lastAccessed: expect.any(Number) },
      )
    })

    it('should delete and return undefined when item is expired', async () => {
      const expiredTime = Date.now() - 7200000 // 2 hours ago
      mockStorage.getItem.mockResolvedValueOnce(mockResponse)
      mockStorage.getMeta.mockResolvedValueOnce({ timestamp: expiredTime })

      const result = await cache.get('GET', 'https://api.example.com', 3600000) // 1 hour TTL

      expect(result).toBeUndefined()
      // Should call delete method (which calls removeItem and removeMeta)
      expect(mockStorage.removeItem).toHaveBeenCalled()
      expect(mockStorage.removeMeta).toHaveBeenCalled()
    })

    it('should handle errors gracefully', async () => {
      mockStorage.getItem.mockRejectedValueOnce(new Error('Storage error'))

      const result = await cache.get('GET', 'https://api.example.com')

      expect(result).toBeUndefined()
      expect(logger.error).toHaveBeenCalledWith('[SessionCache] Get error:', expect.any(Error))
    })
  })

  describe('set method', () => {
    it('should store item and metadata successfully', async () => {
      mockStorage.getItem.mockResolvedValueOnce([]) // Empty keys list

      await cache.set('POST', 'https://api.example.com', mockResponse)

      // Should store the item
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'session:cache_test_POST_https://api.example.com',
        mockResponse,
      )

      // Should store metadata
      expect(mockStorage.setMeta).toHaveBeenCalledWith(
        'session:cache_test_POST_https://api.example.com',
        {
          timestamp: expect.any(Number),
          lastAccessed: expect.any(Number),
        },
      )
    })

    it('should add key to keys list when not present', async () => {
      const existingKeys = ['session:cache_test_GET_https://other.com']
      mockStorage.getItem.mockResolvedValueOnce([]) // Keys list initialization
      mockStorage.getItem.mockResolvedValueOnce(existingKeys) // Existing keys

      await cache.set('POST', 'https://api.example.com', mockResponse)

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'session:cache_test__meta_keys',
        [
          ...existingKeys,
          'session:cache_test_POST_https://api.example.com',
        ],
      )
    })

    it('should not duplicate key in keys list', async () => {
      const existingKey = 'session:cache_test_POST_https://api.example.com'
      mockStorage.getItem.mockResolvedValueOnce([]) // Keys list initialization
      mockStorage.getItem.mockResolvedValueOnce([existingKey]) // Key already exists

      await cache.set('POST', 'https://api.example.com', mockResponse)

      // Should not add duplicate
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'session:cache_test__meta_keys',
        [existingKey], // Same array, no duplication
      )
    })

    it('should handle errors gracefully', async () => {
      mockStorage.setItem.mockRejectedValueOnce(new Error('Storage error'))

      await cache.set('POST', 'https://api.example.com', mockResponse)

      expect(logger.error).toHaveBeenCalledWith('[SessionCache] Set error:', expect.any(Error))
    })
  })

  describe('delete method', () => {
    it('should remove item, metadata, and update keys list', async () => {
      const keyToDelete = 'session:cache_test_DELETE_https://api.example.com'
      const existingKeys = [keyToDelete, 'session:cache_test_GET_https://other.com']

      mockStorage.getItem.mockResolvedValueOnce([]) // Keys list initialization
      mockStorage.getItem.mockResolvedValueOnce(existingKeys) // Existing keys

      await cache.delete('DELETE', 'https://api.example.com')

      // Should remove item and metadata
      expect(mockStorage.removeItem).toHaveBeenCalledWith(keyToDelete)
      expect(mockStorage.removeMeta).toHaveBeenCalledWith(keyToDelete)

      // Should update keys list
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'session:cache_test__meta_keys',
        ['session:cache_test_GET_https://other.com'],
      )
    })

    it('should handle errors gracefully', async () => {
      mockStorage.removeItem.mockRejectedValueOnce(new Error('Storage error'))

      await cache.delete('DELETE', 'https://api.example.com')

      expect(logger.error).toHaveBeenCalledWith('[SessionCache] Delete error:', expect.any(Error))
    })
  })

  describe('clear method', () => {
    it('should clear all cached items and reset state', async () => {
      const keysToDelete = [
        'session:cache_test_GET_https://api.example.com',
        'session:cache_test_POST_https://api.example.com',
      ]

      mockStorage.getItem.mockResolvedValueOnce([]) // Keys list initialization
      mockStorage.getItem.mockResolvedValueOnce(keysToDelete) // Keys to delete

      await cache.clear()

      // Should use bulk removal
      expect(mockStorage.removeItems).toHaveBeenCalledWith(
        keysToDelete.map(key => ({
          key,
          options: { removeMeta: true },
        })),
      )

      // Should remove keys list
      expect(mockStorage.removeItem).toHaveBeenCalledWith('session:cache_test__meta_keys')

      expect(logger.info).toHaveBeenCalledWith('[SessionCache] Cleared cache:', { count: 2 })
    })

    it('should handle empty keys list', async () => {
      mockStorage.getItem.mockResolvedValueOnce([]) // Keys list initialization
      mockStorage.getItem.mockResolvedValueOnce([]) // Empty keys list

      await cache.clear()

      // Should not call removeItems for empty list
      expect(mockStorage.removeItems).not.toHaveBeenCalled()

      // Should still remove keys list
      expect(mockStorage.removeItem).toHaveBeenCalledWith('session:cache_test__meta_keys')
    })

    it('should handle errors gracefully', async () => {
      mockStorage.getItem.mockRejectedValueOnce(new Error('Storage error'))

      await cache.clear()

      expect(logger.error).toHaveBeenCalledWith('[SessionCache] Clear error:', expect.any(Error))
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete cache lifecycle', async () => {
      // Setup: empty cache
      mockStorage.getItem.mockResolvedValue([])

      // Set item
      await cache.set('GET', 'https://api.example.com', mockResponse)

      // Mock the stored data for get
      mockStorage.getItem.mockResolvedValueOnce(mockResponse)
      mockStorage.getMeta.mockResolvedValueOnce({ timestamp: Date.now() })

      // Get item
      const result = await cache.get('GET', 'https://api.example.com')
      expect(result).toEqual(mockResponse)

      // Clear cache
      mockStorage.getItem.mockResolvedValueOnce(['session:cache_test_GET_https://api.example.com'])
      await cache.clear()

      expect(mockStorage.removeItems).toHaveBeenCalled()
    })

    it('should handle multiple cache groups independently', async () => {
      const authCache = new SessionCache('auth')
      const apiCache = new SessionCache('api')

      mockStorage.getItem.mockResolvedValue([])

      await authCache.set('GET', 'https://auth.com', mockResponse)
      await apiCache.set('GET', 'https://api.com', mockResponse)

      // Each should have its own keys list
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'session:cache_auth__meta_keys',
        expect.any(Array),
      )
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'session:cache_api__meta_keys',
        expect.any(Array),
      )
    })
  })
})
