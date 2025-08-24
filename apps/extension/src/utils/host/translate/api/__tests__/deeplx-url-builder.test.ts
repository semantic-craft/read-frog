import { describe, expect, it } from 'vitest'
import { buildDeepLXUrl } from '../deeplx'

describe('buildDeepLXUrl', () => {
  describe('token placeholder functionality', () => {
    it('should replace {{token}} with API key in path', () => {
      const result = buildDeepLXUrl('https://api.deeplx.com/{{token}}/translate', 'abc123')
      expect(result).toBe('https://api.deeplx.com/abc123/translate')
    })

    it('should replace {{token}} with API key as query parameter', () => {
      const result = buildDeepLXUrl('https://api.deeplx.com/v1/translate?token={{token}}', 'mykey')
      expect(result).toBe('https://api.deeplx.com/v1/translate?token=mykey')
    })

    it('should replace multiple {{token}} occurrences', () => {
      const result = buildDeepLXUrl('https://{{token}}.api.deeplx.com/{{token}}/translate', 'test')
      expect(result).toBe('https://test.api.deeplx.com/test/translate')
    })

    it('should throw error when {{token}} is used without API key', () => {
      expect(() => buildDeepLXUrl('https://api.deeplx.com/{{token}}/translate')).toThrow(
        'API key is required when using {{token}} placeholder in DeepLX baseURL',
      )
    })

    it('should replace {{token}} in complex URL patterns', () => {
      const result = buildDeepLXUrl('https://api.example.com/v2/{{token}}/services/translate?version=1', 'secret')
      expect(result).toBe('https://api.example.com/v2/secret/services/translate?version=1')
    })
  })

  describe('special logic for api.deeplx.org', () => {
    it('should handle api.deeplx.org without API key', () => {
      const result = buildDeepLXUrl('https://api.deeplx.org')
      expect(result).toBe('https://api.deeplx.org/translate')
    })

    it('should handle api.deeplx.org with API key', () => {
      const result = buildDeepLXUrl('https://api.deeplx.org', 'mytoken')
      expect(result).toBe('https://api.deeplx.org/mytoken/translate')
    })

    it('should handle api.deeplx.org with trailing slash', () => {
      const result = buildDeepLXUrl('https://api.deeplx.org/', 'mytoken')
      expect(result).toBe('https://api.deeplx.org/mytoken/translate')
    })
  })

  describe('standard DeepLX URL handling', () => {
    it('should append /translate to baseURL without it', () => {
      const result = buildDeepLXUrl('https://deeplx.vercel.app')
      expect(result).toBe('https://deeplx.vercel.app/translate')
    })

    it('should append API key and /translate to baseURL', () => {
      const result = buildDeepLXUrl('https://deeplx.example.com', 'token123')
      expect(result).toBe('https://deeplx.example.com/token123/translate')
    })

    it('should preserve baseURL that already ends with /translate', () => {
      const result = buildDeepLXUrl('https://api.example.com/v1/translate')
      expect(result).toBe('https://api.example.com/v1/translate')
    })

    it('should preserve complex baseURL that ends with /translate', () => {
      const result = buildDeepLXUrl('https://api.example.com/v2/services/translate')
      expect(result).toBe('https://api.example.com/v2/services/translate')
    })
  })

  describe('uRL cleaning', () => {
    it('should remove trailing slash from baseURL', () => {
      const result = buildDeepLXUrl('https://deeplx.vercel.app/')
      expect(result).toBe('https://deeplx.vercel.app/translate')
    })

    it('should handle multiple trailing slashes', () => {
      const result = buildDeepLXUrl('https://deeplx.vercel.app///')
      expect(result).toBe('https://deeplx.vercel.app/translate')
    })
  })

  describe('edge cases', () => {
    it('should handle empty API key with standard URLs', () => {
      const result = buildDeepLXUrl('https://free-deeplx.com', '')
      expect(result).toBe('https://free-deeplx.com/translate')
    })

    it('should handle undefined API key', () => {
      const result = buildDeepLXUrl('https://free-deeplx.com', undefined)
      expect(result).toBe('https://free-deeplx.com/translate')
    })

    it('should handle baseURL with port', () => {
      const result = buildDeepLXUrl('http://localhost:8080/deeplx', 'local')
      expect(result).toBe('http://localhost:8080/deeplx/local/translate')
    })

    it('should handle IP address baseURL', () => {
      const result = buildDeepLXUrl('http://192.168.1.100:3000')
      expect(result).toBe('http://192.168.1.100:3000/translate')
    })
  })

  describe('real-world examples from issue description', () => {
    it('should handle api.deeplx.com/{{token}}/translate pattern', () => {
      const result = buildDeepLXUrl('https://api.deeplx.com/{{token}}/translate', 'user-token')
      expect(result).toBe('https://api.deeplx.com/user-token/translate')
    })

    it('should handle query parameter pattern', () => {
      const result = buildDeepLXUrl('https://api.deeplx.com/v1/translate?token={{token}}', 'query-token')
      expect(result).toBe('https://api.deeplx.com/v1/translate?token=query-token')
    })

    it('should handle api.deeplx.org without token', () => {
      const result = buildDeepLXUrl('https://api.deeplx.org')
      expect(result).toBe('https://api.deeplx.org/translate')
    })

    it('should handle providers that do not need tokens', () => {
      const result = buildDeepLXUrl('https://deeplx.vercel.app')
      expect(result).toBe('https://deeplx.vercel.app/translate')
    })
  })
})
