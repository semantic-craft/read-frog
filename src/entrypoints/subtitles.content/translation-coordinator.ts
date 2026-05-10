import type { SegmentationPipeline } from "./segmentation-pipeline"
import type { Config } from "@/types/config/config"
import type { SubtitlesVideoContext } from "@/utils/subtitles/processor/translator"
import type { SubtitlesFragment, SubtitlesState } from "@/utils/subtitles/types"
import { getLocalConfig } from "@/utils/config/storage"
import {
  DIRECT_TRANSLATION_WARMUP_BATCH_SIZE,
  DIRECT_TRANSLATION_WARMUP_INTERVAL_MS,
  DIRECT_TRANSLATION_WARMUP_LOOK_AHEAD_MS,
  TRANSLATE_LOOK_AHEAD_MS,
  TRANSLATION_BATCH_SIZE,
} from "@/utils/constants/subtitles"
import { buildDirectSubtitleTranslations, translateSubtitles } from "@/utils/subtitles/processor/translator"

export interface TranslationCoordinatorOptions {
  getFragments: () => SubtitlesFragment[]
  getVideoElement: () => HTMLVideoElement | null
  getCurrentState: () => SubtitlesState
  segmentationPipeline: SegmentationPipeline | null
  onTranslated: (fragments: SubtitlesFragment[]) => void
  onStateChange: (state: SubtitlesState, data?: Record<string, string>) => void
}

export class TranslationCoordinator {
  private translatingStarts = new Set<number>()
  private translatedStarts = new Set<number>()
  private failedStarts = new Set<number>()
  private warmingStarts = new Set<number>()
  private warmedStarts = new Set<number>()
  private warmupFailedStarts = new Set<number>()
  private isTranslating = false
  private isWarming = false
  private lastEmittedState: SubtitlesState = "idle"
  private videoContext: SubtitlesVideoContext = { videoTitle: "", subtitlesTextContent: "" }
  private sourceLanguageHint: string | undefined
  private directSubtitleTargetLanguage: Config["language"]["targetCode"] | undefined
  private lastWarmupAtMs = Number.NEGATIVE_INFINITY

  private getFragments: () => SubtitlesFragment[]
  private getVideoElement: () => HTMLVideoElement | null
  private getCurrentState: () => SubtitlesState
  private segmentationPipeline: SegmentationPipeline | null
  private onTranslated: (fragments: SubtitlesFragment[]) => void
  private onStateChange: (state: SubtitlesState, data?: Record<string, string>) => void

  constructor(options: TranslationCoordinatorOptions) {
    this.getFragments = options.getFragments
    this.getVideoElement = options.getVideoElement
    this.getCurrentState = options.getCurrentState
    this.segmentationPipeline = options.segmentationPipeline
    this.onTranslated = options.onTranslated
    this.onStateChange = options.onStateChange
  }

  start(
    videoContext?: SubtitlesVideoContext,
    sourceLanguageHint?: string,
    directSubtitleTargetLanguage?: Config["language"]["targetCode"],
  ) {
    if (videoContext !== undefined) {
      this.videoContext = videoContext
    }
    if (sourceLanguageHint !== undefined) {
      this.sourceLanguageHint = sourceLanguageHint
    }
    if (directSubtitleTargetLanguage !== undefined) {
      this.directSubtitleTargetLanguage = directSubtitleTargetLanguage
    }

    const video = this.getVideoElement()
    if (!video)
      return

    video.addEventListener("timeupdate", this.handleTranslationTick)
    video.addEventListener("seeked", this.handleTranslationTick)

    if (this.segmentationPipeline) {
      video.addEventListener("seeked", this.handleSeek)
      this.segmentationPipeline.start()
    }

    this.handleTranslationTick()
  }

  stop() {
    const video = this.getVideoElement()
    if (!video)
      return
    video.removeEventListener("timeupdate", this.handleTranslationTick)
    video.removeEventListener("seeked", this.handleTranslationTick)
    video.removeEventListener("seeked", this.handleSeek)
    this.segmentationPipeline?.stop()
  }

  reset() {
    this.translatingStarts.clear()
    this.translatedStarts.clear()
    this.failedStarts.clear()
    this.warmingStarts.clear()
    this.warmedStarts.clear()
    this.warmupFailedStarts.clear()
    this.isTranslating = false
    this.isWarming = false
    this.lastEmittedState = "idle"
    this.videoContext = { videoTitle: "", subtitlesTextContent: "" }
    this.sourceLanguageHint = undefined
    this.directSubtitleTargetLanguage = undefined
    this.lastWarmupAtMs = Number.NEGATIVE_INFINITY
  }

  clearFailed() {
    this.failedStarts.clear()
  }

  private handleTranslationTick = () => {
    const video = this.getVideoElement()
    if (!video)
      return

    const currentTimeMs = video.currentTime * 1000
    const fragments = this.getFragments()

    if (this.getCurrentState() === "error")
      return

    this.updateLoadingStateAt(currentTimeMs, fragments)

    if (this.segmentationPipeline && !this.segmentationPipeline.isRunning
      && this.segmentationPipeline.hasUnprocessedChunks()) {
      this.segmentationPipeline.restart()
    }

    if (this.shouldWarmupAt(currentTimeMs)) {
      void this.warmupNearby(currentTimeMs)
    }

    if (this.isTranslating)
      return
    void this.translateNearby(currentTimeMs)
  }

  private shouldWarmupAt(currentTimeMs: number): boolean {
    return !!this.directSubtitleTargetLanguage
      && !this.isWarming
      && currentTimeMs - this.lastWarmupAtMs >= DIRECT_TRANSLATION_WARMUP_INTERVAL_MS
  }

  private async translateNearby(currentTimeMs: number) {
    const fragments = this.getFragments()

    const batch = fragments
      .filter(f => !this.translatedStarts.has(f.start)
        && !this.translatingStarts.has(f.start)
        && !this.failedStarts.has(f.start)
        && f.start >= currentTimeMs - 5000
        && f.start <= currentTimeMs + TRANSLATE_LOOK_AHEAD_MS)
      .slice(0, TRANSLATION_BATCH_SIZE)

    if (batch.length === 0) {
      return
    }

    this.isTranslating = true
    batch.forEach(f => this.translatingStarts.add(f.start))

    try {
      const translated = await translateSubtitles(batch, this.videoContext, this.sourceLanguageHint)
      translated.forEach((f) => {
        this.translatingStarts.delete(f.start)
        this.translatedStarts.add(f.start)
      })
      this.onTranslated(translated)

      const latestTimeMs = this.getCurrentVideoTimeMs(currentTimeMs)
      const latestFragments = this.getFragments()
      this.updateLoadingStateAt(latestTimeMs, latestFragments)
    }
    catch (error) {
      batch.forEach((f) => {
        this.translatingStarts.delete(f.start)
        this.failedStarts.add(f.start)
      })

      const config = await getLocalConfig()
      const displayMode = config?.videoSubtitles?.style.displayMode
      const fallback = displayMode === "translationOnly"
        ? batch.map(f => ({ ...f, translation: f.text }))
        : batch.map(f => ({ ...f, translation: "" }))
      this.onTranslated(fallback)

      const errorMessage = error instanceof Error ? error.message : String(error)
      this.lastEmittedState = "error"
      this.onStateChange("error", { message: errorMessage })
    }
    finally {
      this.isTranslating = false
    }
  }

  private async warmupNearby(currentTimeMs: number) {
    const fragments = this.getFragments()

    const batch = fragments
      .filter(f => !this.warmedStarts.has(f.start)
        && !this.warmingStarts.has(f.start)
        && !this.warmupFailedStarts.has(f.start)
        && f.start > currentTimeMs + TRANSLATE_LOOK_AHEAD_MS
        && f.start <= currentTimeMs + DIRECT_TRANSLATION_WARMUP_LOOK_AHEAD_MS)
      .slice(0, DIRECT_TRANSLATION_WARMUP_BATCH_SIZE)

    if (batch.length === 0 || !this.directSubtitleTargetLanguage) {
      return
    }

    this.isWarming = true
    this.lastWarmupAtMs = currentTimeMs
    batch.forEach(f => this.warmingStarts.add(f.start))

    try {
      const result = await buildDirectSubtitleTranslations(
        batch,
        this.sourceLanguageHint,
        this.directSubtitleTargetLanguage,
        this.videoContext,
      )

      batch.forEach((fragment) => {
        this.warmingStarts.delete(fragment.start)
        if (result.values.has(fragment.start)) {
          this.warmedStarts.add(fragment.start)
          this.warmupFailedStarts.delete(fragment.start)
        }
        else if (result.allRejected) {
          this.warmupFailedStarts.add(fragment.start)
        }
      })
    }
    catch {
      batch.forEach((fragment) => {
        this.warmingStarts.delete(fragment.start)
        this.warmupFailedStarts.add(fragment.start)
      })
    }
    finally {
      this.isWarming = false
    }
  }

  private getCurrentVideoTimeMs(fallbackTimeMs: number): number {
    const video = this.getVideoElement()
    if (!video) {
      return fallbackTimeMs
    }
    return video.currentTime * 1000
  }

  private findActiveCue(
    timeMs: number,
    fragments: SubtitlesFragment[],
  ): SubtitlesFragment | null {
    return fragments.find(f => f.start <= timeMs && f.end > timeMs) ?? null
  }

  private isCueResolved(startMs: number): boolean {
    return this.translatedStarts.has(startMs) || this.failedStarts.has(startMs)
  }

  private updateLoadingStateAt(timeMs: number, fragments: SubtitlesFragment[]) {
    const activeCue = this.findActiveCue(timeMs, fragments)

    if (activeCue) {
      const nextState: SubtitlesState = this.isCueResolved(activeCue.start) ? "idle" : "loading"
      if (nextState === this.lastEmittedState)
        return
      this.lastEmittedState = nextState
      this.onStateChange(nextState)
      return
    }

    // Gap: keep loading if next cue needs translation
    const nextCue = fragments.find(f => f.start > timeMs)
    const nextState: SubtitlesState = nextCue && !this.isCueResolved(nextCue.start) ? "loading" : "idle"
    if (nextState === this.lastEmittedState)
      return
    this.lastEmittedState = nextState
    this.onStateChange(nextState)
  }

  private handleSeek = () => {
    this.warmupFailedStarts.clear()
    this.lastWarmupAtMs = Number.NEGATIVE_INFINITY
    this.segmentationPipeline?.restart()
  }
}
