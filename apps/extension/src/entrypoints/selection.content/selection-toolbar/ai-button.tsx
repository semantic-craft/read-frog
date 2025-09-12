import type { HighlightData } from '../utils'
import { useCallback, useEffect, useState } from '#imports'
import { Icon } from '@iconify/react'
import { streamText } from 'ai'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { configAtom } from '@/utils/atoms/config'
import { readProviderConfigAtom } from '@/utils/atoms/provider'
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

      const prompt = `请分析以下选中的文本内容，提供详细的语言学习解释：

选中文本: "${highlightData.context.selection}"
前文: "${highlightData.context.before}"
后文: "${highlightData.context.after}"

请提供：
1. 文本的语言分析（语法、词汇、句式）
2. 重点词汇和短语的解释
3. 文化背景或语境说明
4. 学习建议

请用中文回答。`

      const result = await streamText({
        model,
        prompt,
      })

      // 流式读取响应
      for await (const delta of result.textStream) {
        setAiResponse(prev => prev + delta)
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
                {highlightData.context.selection}
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
            <p className="text-sm text-zinc-500">
              AI正在分析中...
            </p>
          )}
          {error && (
            <p className="text-sm text-red-500">
              错误:
              {' '}
              {error}
            </p>
          )}
          {aiResponse && (
            <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
              {aiResponse}
              {isLoading && <span className="animate-pulse">|</span>}
            </div>
          )}
        </div>
      </div>
    </PopoverWrapper>
  )
}
