import { MarkdownRenderer } from './markdown-renderer'

interface StreamingMarkdownProps {
  content: string
  className?: string
}

export function StreamingMarkdown({ content, className = '' }: StreamingMarkdownProps) {
  return <MarkdownRenderer content={content} className={className} />
}
