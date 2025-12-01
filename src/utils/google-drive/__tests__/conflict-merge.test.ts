import type { Config } from '@/types/config/config'
import { describe, expect, it } from 'vitest'
import { applyResolutions, detectConflicts } from '../conflict-merge'

// Test data factory
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

describe('conflict-merge', () => {
  describe('detectConflicts', () => {
    it('should detect no conflicts when all configs are identical', () => {
      const base = createMockConfig()
      const local = createMockConfig()
      const remote = createMockConfig()

      const result = detectConflicts(base, local, remote)

      expect(result.conflicts).toHaveLength(0)
      expect(result.merged).toEqual(base)
    })

    it('should detect no conflict when only local changed', () => {
      const base = createMockConfig()
      const local = createMockConfig({
        language: { ...base.language, targetCode: 'jpn' },
      })
      const remote = createMockConfig()

      const result = detectConflicts(base, local, remote)

      expect(result.conflicts).toHaveLength(0)
      expect(result.merged.language.targetCode).toBe('jpn')
    })

    it('should detect no conflict when only remote changed', () => {
      const base = createMockConfig()
      const local = createMockConfig()
      const remote = createMockConfig({
        language: { ...base.language, targetCode: 'jpn' },
      })

      const result = detectConflicts(base, local, remote)

      expect(result.conflicts).toHaveLength(0)
      expect(result.merged.language.targetCode).toBe('jpn')
    })

    it('should detect no conflict when both changed to same value', () => {
      const base = createMockConfig()
      const local = createMockConfig({
        language: { ...base.language, targetCode: 'jpn' },
      })
      const remote = createMockConfig({
        language: { ...base.language, targetCode: 'jpn' },
      })

      const result = detectConflicts(base, local, remote)

      expect(result.conflicts).toHaveLength(0)
      expect(result.merged.language.targetCode).toBe('jpn')
    })

    it('should detect conflict when both changed to different values', () => {
      const base = createMockConfig()
      const local = createMockConfig({
        language: { ...base.language, targetCode: 'jpn' },
      })
      const remote = createMockConfig({
        language: { ...base.language, targetCode: 'kor' },
      })

      const result = detectConflicts(base, local, remote)

      expect(result.conflicts).toHaveLength(1)
      expect(result.conflicts[0]).toEqual({
        path: ['language', 'targetCode'],
        baseValue: 'cmn',
        localValue: 'jpn',
        remoteValue: 'kor',
      })
    })

    it('should detect multiple conflicts', () => {
      const base = createMockConfig()
      const local = createMockConfig({
        language: { ...base.language, targetCode: 'jpn' },
        translate: { ...base.translate, mode: 'target-only' },
      })
      const remote = createMockConfig({
        language: { ...base.language, targetCode: 'kor' },
        translate: { ...base.translate, mode: 'original-only' },
      })

      const result = detectConflicts(base, local, remote)

      expect(result.conflicts).toHaveLength(2)
      expect(result.conflicts.find(c => c.path.join('.') === 'language.targetCode')).toBeDefined()
      expect(result.conflicts.find(c => c.path.join('.') === 'translate.mode')).toBeDefined()
    })

    it('should handle array conflicts', () => {
      const base = createMockConfig()
      const local = createMockConfig({
        translate: {
          ...base.translate,
          page: {
            ...base.translate.page,
            autoTranslatePatterns: ['example.com'],
          },
        },
      })
      const remote = createMockConfig({
        translate: {
          ...base.translate,
          page: {
            ...base.translate.page,
            autoTranslatePatterns: ['test.com'],
          },
        },
      })

      const result = detectConflicts(base, local, remote)

      expect(result.conflicts).toHaveLength(1)
      expect(result.conflicts[0].path).toEqual(['translate', 'page', 'autoTranslatePatterns'])
    })

    it('should handle nested object conflicts', () => {
      const base = createMockConfig()
      const local = createMockConfig({
        translate: {
          ...base.translate,
          requestQueueConfig: {
            capacity: 20,
            rate: 3,
          },
        },
      })
      const remote = createMockConfig({
        translate: {
          ...base.translate,
          requestQueueConfig: {
            capacity: 15,
            rate: 2,
          },
        },
      })

      const result = detectConflicts(base, local, remote)

      expect(result.conflicts.length).toBeGreaterThan(0)
      expect(result.conflicts.find(c => c.path.join('.') === 'translate.requestQueueConfig.capacity')).toBeDefined()
    })

    it('should auto-merge non-conflicting changes', () => {
      const base = createMockConfig()
      const local = createMockConfig({
        language: { ...base.language, targetCode: 'jpn' },
      })
      const remote = createMockConfig({
        translate: { ...base.translate, mode: 'target-only' },
      })

      const result = detectConflicts(base, local, remote)

      expect(result.conflicts).toHaveLength(0)
      expect(result.merged.language.targetCode).toBe('jpn')
      expect(result.merged.translate.mode).toBe('target-only')
    })

    it('should auto-merge when both sides change different nested fields', () => {
      const base = createMockConfig()
      const local = createMockConfig({
        language: { ...base.language, targetCode: 'jpn', level: 'advanced' },
        floatingButton: { ...base.floatingButton, position: 0.8 },
      })
      const remote = createMockConfig({
        translate: {
          ...base.translate,
          mode: 'target-only',
          requestQueueConfig: {
            capacity: 20,
            rate: 3,
          },
        },
      })

      const result = detectConflicts(base, local, remote)

      expect(result.conflicts).toHaveLength(0)
      expect(result.merged.language.targetCode).toBe('jpn')
      expect(result.merged.language.level).toBe('advanced')
      expect(result.merged.floatingButton.position).toBe(0.8)
      expect(result.merged.translate.mode).toBe('target-only')
      expect(result.merged.translate.requestQueueConfig.capacity).toBe(20)
      expect(result.merged.translate.requestQueueConfig.rate).toBe(3)
    })
  })

  describe('applyResolutions', () => {
    it('should apply local resolution', () => {
      const base = createMockConfig()
      const local = createMockConfig({
        language: { ...base.language, targetCode: 'jpn' },
      })
      const remote = createMockConfig({
        language: { ...base.language, targetCode: 'kor' },
      })

      const diffResult = detectConflicts(base, local, remote)
      const resolutions = {
        'language.targetCode': 'local' as const,
      }

      const result = applyResolutions(diffResult, resolutions)

      expect(result.language.targetCode).toBe('jpn')
    })

    it('should apply remote resolution', () => {
      const base = createMockConfig()
      const local = createMockConfig({
        language: { ...base.language, targetCode: 'jpn' },
      })
      const remote = createMockConfig({
        language: { ...base.language, targetCode: 'kor' },
      })

      const diffResult = detectConflicts(base, local, remote)
      const resolutions = {
        'language.targetCode': 'remote' as const,
      }

      const result = applyResolutions(diffResult, resolutions)

      expect(result.language.targetCode).toBe('kor')
    })

    it('should apply multiple resolutions', () => {
      const base = createMockConfig()
      const local = createMockConfig({
        language: { ...base.language, targetCode: 'jpn' },
        translate: { ...base.translate, mode: 'target-only' },
      })
      const remote = createMockConfig({
        language: { ...base.language, targetCode: 'kor' },
        translate: { ...base.translate, mode: 'original-only' },
      })

      const diffResult = detectConflicts(base, local, remote)
      const resolutions = {
        'language.targetCode': 'local' as const,
        'translate.mode': 'remote' as const,
      }

      const result = applyResolutions(diffResult, resolutions)

      expect(result.language.targetCode).toBe('jpn')
      expect(result.translate.mode).toBe('original-only')
    })

    it('should preserve non-conflicting merged values', () => {
      const base = createMockConfig()
      const local = createMockConfig({
        language: { ...base.language, targetCode: 'jpn', level: 'advanced' },
      })
      const remote = createMockConfig({
        language: { ...base.language, targetCode: 'kor' },
      })

      const diffResult = detectConflicts(base, local, remote)
      const resolutions = {
        'language.targetCode': 'remote' as const,
      }

      const result = applyResolutions(diffResult, resolutions)

      expect(result.language.targetCode).toBe('kor')
      expect(result.language.level).toBe('advanced') // Non-conflicting change preserved
    })
  })
})
