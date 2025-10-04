'use client'

import { cn } from '@repo/ui/lib/utils'
import { buttonVariants } from 'fumadocs-ui/components/ui/button'
import { useCopyButton } from 'fumadocs-ui/utils/use-copy-button'
import { Check, Share } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function ShareButton({ url }: { url: string }) {
  const t = useTranslations('blog')
  const [isChecked, onCopy] = useCopyButton(() => {
    void navigator.clipboard.writeText(`${window.location.origin}${url}`)
  })

  return (
    <button
      type="button"
      className={cn(
        buttonVariants({ className: 'gap-2', color: 'secondary' }),
      )}
      onClick={onCopy}
    >
      {isChecked ? <Check className="size-4" /> : <Share className="size-4" />}
      {isChecked ? t('copiedUrl') : t('sharePost')}
    </button>
  )
}
