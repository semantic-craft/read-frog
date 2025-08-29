import { Input } from '@repo/ui/components/input'
import { useRecordHotkey } from '@/hooks/use-record-hotkey'
import { logger } from '@/utils/logger'

export function ShortcutKeySelector(
  { value, className }:
  { value: Set<string>, className?: string },
) {
  const [recordDomRef, { start }] = useRecordHotkey({
    onConfirm: (keys) => {
      logger.log(keys, 'onConfirm')
    },
  })

  const hotkey = Array.from(value).join('+')

  return (
    <Input
      ref={recordDomRef}
      className={className}
      // className={cn(
      //   'px-2 py-1 border rounded text-sm w-60 h-12 flex items-center justify-start cursor-pointer',
      //   'file:text-foreground placeholder:text-muted-foreground dark:bg-input/30 border-input min-w-0 border bg-transparent text-base shadow-xs transition-[color,box-shadow] outline-none ',
      //   'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
      //   inRecording ? 'border-blue-500' : '',
      //   className,
      // )}
      value={hotkey}
      onDoubleClick={start}
    />
  )
}
