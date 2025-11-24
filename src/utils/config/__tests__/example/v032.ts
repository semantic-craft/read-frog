import type { TestSeriesObject } from './types'

export const testSeries: TestSeriesObject = {
  'config-with-llm-detection-field': {
    description: 'Add enableLLMDetection field to translate.page',
    config: {
      language: {
        detectedCode: 'eng',
        sourceCode: 'auto',
        targetCode: 'cmn',
        level: 'intermediate',
      },
      providersConfig: [
        {
          id: 'google-default',
          enabled: true,
          name: 'Google Translate',
          provider: 'google',
        },
        {
          id: 'microsoft-default',
          enabled: true,
          name: 'Microsoft Translator',
          provider: 'microsoft',
        },
        {
          id: 'openai-default',
          enabled: true,
          name: 'OpenAI',
          provider: 'openai',
          apiKey: 'sk-test',
          baseURL: 'https://api.openai.com/v1',
          models: {
            read: {
              model: 'gpt-4o-mini',
              isCustomModel: false,
              customModel: '',
            },
            translate: {
              model: 'gpt-4o-mini',
              isCustomModel: false,
              customModel: '',
            },
          },
        },
        {
          id: 'deeplx-default',
          enabled: true,
          name: 'DeepLX',
          provider: 'deeplx',
          apiKey: undefined,
          baseURL: undefined,
        },
      ],
      read: {
        providerId: 'openai-default',
      },
      translate: {
        providerId: 'microsoft-default',
        mode: 'bilingual',
        node: {
          enabled: true,
          hotkey: 'Control',
        },
        page: {
          range: 'main',
          autoTranslatePatterns: ['news.ycombinator.com'],
          autoTranslateLanguages: [],
          shortcut: ['alt', 't'],
          enableLLMDetection: false, // New field added in v032
        },
        customPromptsConfig: {
          promptId: null,
          patterns: [],
        },
        requestQueueConfig: {
          capacity: 200,
          rate: 2,
        },
        batchQueueConfig: {
          maxCharactersPerBatch: 1000,
          maxItemsPerBatch: 4,
        },
        translationNodeStyle: {
          preset: 'default',
          isCustom: false,
          customCSS: null,
        },
      },
      tts: {
        providerId: null,
        model: 'tts-1',
        voice: 'alloy',
        speed: 1,
      },
      floatingButton: {
        enabled: true,
        position: 0.66,
        disabledFloatingButtonPatterns: [],
      },
      selectionToolbar: {
        enabled: true,
        disabledSelectionToolbarPatterns: [],
      },
      sideContent: {
        width: 420,
      },
      betaExperience: {
        enabled: false,
      },
    },
  },
}
