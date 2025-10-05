import { describe, expect, it } from 'vitest'
import { hasNewBlogPost } from '../blog'

// Extract compareVersions for testing by importing the entire module
// Since compareVersions is not exported, we'll test it indirectly through hasNewBlogPost

describe('hasNewBlogPost', () => {
  const baseDate = new Date('2025-01-01')
  const newerDate = new Date('2025-01-02')
  const olderDate = new Date('2024-12-31')

  describe('basic functionality without version check', () => {
    it('should return false if latestDate is null', () => {
      expect(hasNewBlogPost(baseDate, null)).toBe(false)
    })

    it('should return true if lastViewedDate is null and latestDate exists', () => {
      expect(hasNewBlogPost(null, baseDate)).toBe(true)
    })

    it('should return true if latestDate is newer than lastViewedDate', () => {
      expect(hasNewBlogPost(olderDate, newerDate)).toBe(true)
    })

    it('should return false if latestDate is older than lastViewedDate', () => {
      expect(hasNewBlogPost(newerDate, olderDate)).toBe(false)
    })

    it('should return false if dates are equal', () => {
      expect(hasNewBlogPost(baseDate, baseDate)).toBe(false)
    })
  })

  describe('version compatibility check', () => {
    it('should return false if current version is lower than required version', () => {
      const result = hasNewBlogPost(null, baseDate, '1.10.0', '1.11.0')
      expect(result).toBe(false)
    })

    it('should return true if current version equals required version', () => {
      const result = hasNewBlogPost(null, baseDate, '1.11.0', '1.11.0')
      expect(result).toBe(true)
    })

    it('should return true if current version is higher than required version', () => {
      const result = hasNewBlogPost(null, baseDate, '1.12.0', '1.11.0')
      expect(result).toBe(true)
    })

    it('should ignore version check if blogExtensionVersion is null', () => {
      const result = hasNewBlogPost(null, baseDate, '1.10.0', null)
      expect(result).toBe(true)
    })

    it('should ignore version check if blogExtensionVersion is undefined', () => {
      const result = hasNewBlogPost(null, baseDate, '1.10.0', undefined)
      expect(result).toBe(true)
    })

    it('should ignore version check if currentExtensionVersion is undefined', () => {
      const result = hasNewBlogPost(null, baseDate, undefined, '1.11.0')
      expect(result).toBe(true)
    })

    it('should handle major version differences', () => {
      expect(hasNewBlogPost(null, baseDate, '1.0.0', '2.0.0')).toBe(false)
      expect(hasNewBlogPost(null, baseDate, '2.0.0', '1.0.0')).toBe(true)
    })

    it('should handle minor version differences', () => {
      expect(hasNewBlogPost(null, baseDate, '1.10.0', '1.11.0')).toBe(false)
      expect(hasNewBlogPost(null, baseDate, '1.11.0', '1.10.0')).toBe(true)
    })

    it('should handle patch version differences', () => {
      expect(hasNewBlogPost(null, baseDate, '1.11.0', '1.11.1')).toBe(false)
      expect(hasNewBlogPost(null, baseDate, '1.11.1', '1.11.0')).toBe(true)
    })

    it('should handle version strings with different segment counts', () => {
      expect(hasNewBlogPost(null, baseDate, '1.11', '1.11.0')).toBe(true)
      expect(hasNewBlogPost(null, baseDate, '1.11.0', '1.11')).toBe(true)
      expect(hasNewBlogPost(null, baseDate, '1.10', '1.11.0')).toBe(false)
    })
  })

  describe('combined date and version checks', () => {
    it('should return false if version is incompatible even with newer date', () => {
      const result = hasNewBlogPost(olderDate, newerDate, '1.10.0', '1.11.0')
      expect(result).toBe(false)
    })

    it('should return true if version is compatible and date is newer', () => {
      const result = hasNewBlogPost(olderDate, newerDate, '1.11.0', '1.11.0')
      expect(result).toBe(true)
    })

    it('should return false if version is compatible but date is older', () => {
      const result = hasNewBlogPost(newerDate, olderDate, '1.11.0', '1.11.0')
      expect(result).toBe(false)
    })

    it('should prioritize version check over date check', () => {
      const result = hasNewBlogPost(null, newerDate, '1.10.0', '1.11.0')
      expect(result).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle all null/undefined parameters', () => {
      expect(hasNewBlogPost(null, null)).toBe(false)
      expect(hasNewBlogPost(null, null, undefined, undefined)).toBe(false)
    })

    it('should handle zero-padded versions', () => {
      expect(hasNewBlogPost(null, baseDate, '1.09.0', '1.10.0')).toBe(false)
      expect(hasNewBlogPost(null, baseDate, '1.10.0', '1.09.0')).toBe(true)
    })

    it('should handle large version numbers', () => {
      expect(hasNewBlogPost(null, baseDate, '10.20.30', '11.0.0')).toBe(false)
      expect(hasNewBlogPost(null, baseDate, '11.0.0', '10.20.30')).toBe(true)
    })
  })
})
