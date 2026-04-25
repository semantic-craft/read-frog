import type { APIProviderConfig } from "@/types/config/provider"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { DEFAULT_CONFIG } from "@/utils/constants/config"

const {
  onMessageMock,
  ensureInitializedConfigMock,
  executeTranslateMock,
  generateArticleSummaryMock,
  putBatchRequestRecordMock,
  articleSummaryCacheGetMock,
  articleSummaryCachePutMock,
  translationCacheGetMock,
  translationCachePutMock,
  requestQueueInstances,
  batchQueueInstances,
} = vi.hoisted(() => ({
  onMessageMock: vi.fn(),
  ensureInitializedConfigMock: vi.fn(),
  executeTranslateMock: vi.fn(),
  generateArticleSummaryMock: vi.fn(),
  putBatchRequestRecordMock: vi.fn(),
  articleSummaryCacheGetMock: vi.fn(),
  articleSummaryCachePutMock: vi.fn(),
  translationCacheGetMock: vi.fn(),
  translationCachePutMock: vi.fn(),
  requestQueueInstances: [] as Array<{ options: Record<string, unknown>, enqueue: ReturnType<typeof vi.fn>, setQueueOptions: ReturnType<typeof vi.fn> }>,
  batchQueueInstances: [] as Array<{ options: Record<string, unknown>, enqueue: ReturnType<typeof vi.fn>, setBatchConfig: ReturnType<typeof vi.fn> }>,
}))

vi.mock("@/utils/message", () => ({
  onMessage: onMessageMock,
}))

vi.mock("../config", () => ({
  ensureInitializedConfig: ensureInitializedConfigMock,
}))

vi.mock("@/utils/host/translate/execute-translate", () => ({
  executeTranslate: executeTranslateMock,
}))

vi.mock("@/utils/content/summary", () => ({
  generateArticleSummary: generateArticleSummaryMock,
}))

vi.mock("@/utils/batch-request-record", () => ({
  putBatchRequestRecord: putBatchRequestRecordMock,
}))

vi.mock("@/utils/db/dexie/db", () => ({
  db: {
    articleSummaryCache: {
      get: articleSummaryCacheGetMock,
      put: articleSummaryCachePutMock,
    },
    translationCache: {
      get: translationCacheGetMock,
      put: translationCachePutMock,
    },
  },
}))

vi.mock("@/utils/request/request-queue", () => ({
  RequestQueue: class {
    options: Record<string, unknown>
    enqueue = vi.fn().mockResolvedValue("translated")
    setQueueOptions = vi.fn()

    constructor(options: Record<string, unknown>) {
      this.options = options
      requestQueueInstances.push(this)
    }
  },
}))

vi.mock("@/utils/request/batch-queue", () => ({
  BatchQueue: class {
    options: Record<string, unknown>
    enqueue = vi.fn().mockResolvedValue("translated")
    setBatchConfig = vi.fn()

    constructor(options: Record<string, unknown>) {
      this.options = options
      batchQueueInstances.push(this)
    }
  },
}))

function getRegisteredMessageHandler(name: string) {
  const registration = onMessageMock.mock.calls.find(call => call[0] === name)
  if (!registration) {
    throw new Error(`Message handler not registered: ${name}`)
  }
  return registration[1] as (message: { data: Record<string, unknown> }) => Promise<unknown>
}

const baseProviderConfig: APIProviderConfig = {
  id: "openai-default",
  name: "OpenAI",
  provider: "openai",
  enabled: true,
  apiKey: "sk-test",
  model: {
    model: "gpt-5-mini",
    isCustomModel: false,
    customModel: null,
  },
}

describe("provider request queue overrides", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    requestQueueInstances.length = 0
    batchQueueInstances.length = 0

    ensureInitializedConfigMock.mockResolvedValue({
      ...DEFAULT_CONFIG,
      videoSubtitles: {
        ...DEFAULT_CONFIG.videoSubtitles,
        requestQueueConfig: {
          rate: 10,
          capacity: 20,
        },
      },
    })

    executeTranslateMock.mockResolvedValue("translated")
    generateArticleSummaryMock.mockResolvedValue("Generated summary")
    putBatchRequestRecordMock.mockResolvedValue(undefined)
    articleSummaryCacheGetMock.mockResolvedValue(undefined)
    articleSummaryCachePutMock.mockResolvedValue(undefined)
    translationCacheGetMock.mockResolvedValue(undefined)
    translationCachePutMock.mockResolvedValue(undefined)
  })

  it("creates webpage translation queues with provider-specific request overrides", async () => {
    const { setUpWebPageTranslationQueue } = await import("../translation-queues")
    await setUpWebPageTranslationQueue()

    const handler = getRegisteredMessageHandler("enqueueTranslateRequest")
    await handler({
      data: {
        text: "hello",
        langConfig: DEFAULT_CONFIG.language,
        providerConfig: {
          ...baseProviderConfig,
          requestQueueConfig: {
            rate: 1,
            capacity: 2,
          },
        },
        scheduleAt: Date.now(),
        hash: "page-request",
      },
    })

    expect(requestQueueInstances).toHaveLength(1)
    expect(requestQueueInstances[0]?.options).toEqual(expect.objectContaining({
      rate: 1,
      capacity: 2,
      timeoutMs: 20_000,
      maxRetries: 2,
      baseRetryDelayMs: 1_000,
    }))
  })

  it("reuses the same provider queue and updates it when the override changes", async () => {
    const { setUpWebPageTranslationQueue } = await import("../translation-queues")
    await setUpWebPageTranslationQueue()

    const handler = getRegisteredMessageHandler("enqueueTranslateRequest")
    await handler({
      data: {
        text: "hello",
        langConfig: DEFAULT_CONFIG.language,
        providerConfig: {
          ...baseProviderConfig,
          requestQueueConfig: {
            rate: 1,
            capacity: 2,
          },
        },
        scheduleAt: Date.now(),
        hash: "page-request-a",
      },
    })

    await handler({
      data: {
        text: "world",
        langConfig: DEFAULT_CONFIG.language,
        providerConfig: {
          ...baseProviderConfig,
          requestQueueConfig: {
            rate: 3,
            capacity: 4,
          },
        },
        scheduleAt: Date.now(),
        hash: "page-request-b",
      },
    })

    expect(requestQueueInstances).toHaveLength(1)
    expect(requestQueueInstances[0]?.setQueueOptions).toHaveBeenLastCalledWith({
      rate: 3,
      capacity: 4,
    })
  })

  it("preserves provider overrides when the global webpage request config changes", async () => {
    const { setUpWebPageTranslationQueue } = await import("../translation-queues")
    await setUpWebPageTranslationQueue()

    const enqueueHandler = getRegisteredMessageHandler("enqueueTranslateRequest")
    await enqueueHandler({
      data: {
        text: "hello",
        langConfig: DEFAULT_CONFIG.language,
        providerConfig: {
          ...baseProviderConfig,
          requestQueueConfig: {
            capacity: 2,
          },
        },
        scheduleAt: Date.now(),
        hash: "page-request",
      },
    })

    const updateHandler = getRegisteredMessageHandler("setTranslateRequestQueueConfig")
    await updateHandler({
      data: {
        rate: 99,
        capacity: 100,
      },
    })

    expect(requestQueueInstances[0]?.setQueueOptions).toHaveBeenLastCalledWith({
      rate: 99,
      capacity: 2,
    })
  })

  it("uses the subtitles global request config as the fallback base before applying provider overrides", async () => {
    const { setUpSubtitlesTranslationQueue } = await import("../translation-queues")
    await setUpSubtitlesTranslationQueue()

    const handler = getRegisteredMessageHandler("enqueueSubtitlesTranslateRequest")
    await handler({
      data: {
        text: "hello",
        langConfig: DEFAULT_CONFIG.language,
        providerConfig: {
          ...baseProviderConfig,
          requestQueueConfig: {
            capacity: 2,
          },
        },
        scheduleAt: Date.now(),
        hash: "subtitle-request",
      },
    })

    expect(requestQueueInstances).toHaveLength(1)
    expect(requestQueueInstances[0]?.options).toEqual(expect.objectContaining({
      rate: 10,
      capacity: 2,
    }))
  })
})
