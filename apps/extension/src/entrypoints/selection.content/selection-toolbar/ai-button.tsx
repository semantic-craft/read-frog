import type { HighlightData } from '../utils'
import type { PopoverWrapperRef } from './popover-wrapper'
import { useCallback, useEffect, useRef, useState } from '#imports'
import { Icon } from '@iconify/react'
import { streamText } from 'ai'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { configAtom } from '@/utils/atoms/config'
import { readProviderConfigAtom } from '@/utils/atoms/provider'
import { getWordExplainPrompt } from '@/utils/prompts/word-explain'
import { getReadModel } from '@/utils/providers/model'
import { createHighlightData } from '../utils'
import { isAiPopoverVisibleAtom, isTooltipVisibleAtom, mouseClickPositionAtom, selectionRangeAtom } from './atom'
import { PopoverWrapper } from './popover-wrapper'

export function AiButton() {
  const setIsTooltipVisible = useSetAtom(isTooltipVisibleAtom)
  const setIsAiPopoverVisible = useSetAtom(isAiPopoverVisibleAtom)
  const setMousePosition = useSetAtom(mouseClickPositionAtom)

  const handleClick = async (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = rect.left
    const y = rect.top

    setMousePosition({ x, y })
    setIsTooltipVisible(false)
    setIsAiPopoverVisible(true)
  }

  // eslint-disable-next-line turbo/no-undeclared-env-vars
  if (!import.meta.env.DEV) {
    return null
  }

  return (
    <button type="button" className="size-6 flex items-center justify-center hover:bg-zinc-300 dark:hover:bg-zinc-700 cursor-pointer" onClick={handleClick}>
      <Icon icon="hugeicons:ai-innovation-02" strokeWidth={0.8} className="size-4" />
    </button>
  )
}

export function AiPopover() {
  const [isVisible, setIsVisible] = useAtom(isAiPopoverVisibleAtom)
  const selectionRange = useAtomValue(selectionRangeAtom)
  const config = useAtomValue(configAtom)
  const readProviderConfig = useAtomValue(readProviderConfigAtom)
  const [highlightData, setHighlightData] = useState<HighlightData | null>(null)
  const popoverRef = useRef<PopoverWrapperRef>(null)

  const [aiResponse, setAiResponse] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const analyzeSelection = useCallback(async (highlightData: any) => {
    if (!readProviderConfig || !config) {
      setError('AI配置未找到')
      return
    }

    setIsLoading(true)
    setError('')
    setAiResponse('')

    try {
      const model = await getReadModel(readProviderConfig.name)

      const prompt = getWordExplainPrompt(
        config.language.sourceCode,
        config.language.targetCode,
        config.language.level,
        highlightData,
      )

      const result = await streamText({
        model,
        prompt,
      })

      // 流式读取响应
      for await (const delta of result.textStream) {
        setAiResponse(prev => prev + delta)
        // 每次更新内容后自动滚动到底部
        popoverRef.current?.scrollToBottom()
      }
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'AI分析失败')
    }
    finally {
      setIsLoading(false)
    }
  }, [readProviderConfig, config])

  useEffect(() => {
    if (!selectionRange || !isVisible) {
      return
    }

    const highlightData = createHighlightData(selectionRange)
    // eslint-disable-next-line no-console
    console.log('%c seda [ highlightData.context ]-46', 'font-size:13px; background:pink; color:#bf2c9f;', highlightData.context)
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setHighlightData(highlightData)

    // 自动触发AI分析
    analyzeSelection(highlightData)
  }, [selectionRange, isVisible, analyzeSelection, setHighlightData])

  return (
    <PopoverWrapper
      ref={popoverRef}
      title="AI"
      icon="hugeicons:ai-innovation-02"
      isVisible={isVisible}
      setIsVisible={setIsVisible}
    >
      <div className="p-4 border-b pt-0">
        <div className="border-b pb-4 sticky pt-4 top-0 bg-white dark:bg-zinc-800 z-10">
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-2">上下文:</p>
          <div className="text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 p-3 rounded leading-relaxed">
            {highlightData?.context.before && (
              <span className="text-zinc-500 dark:text-zinc-400">
                {highlightData.context.before}
              </span>
            )}
            {highlightData?.context.selection && (
              <span
                className="mx-1.5 rounded font-medium px-0.5"
                style={{ backgroundColor: 'var(--read-frog-primary)' }}
              >
                {` ${highlightData.context.selection} `}
              </span>
            )}
            {highlightData?.context.after && (
              <span className="text-zinc-500 dark:text-zinc-400">
                {highlightData.context.after}
              </span>
            )}
            {!highlightData?.context.selection && (
              <span className="text-zinc-400 dark:text-zinc-500">无选中内容</span>
            )}
          </div>
        </div>
        <div className="pt-4">
          {isLoading && !aiResponse && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-3 text-slate-500">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm font-medium">AI正在分析中...</span>
              </div>
            </div>
          )}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">!</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">分析失败</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
          {aiResponse && (
            <div className="rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <MarkdownRenderer content={aiResponse} />
            </div>
          )}
        </div>
      </div>
    </PopoverWrapper>
  )
}
