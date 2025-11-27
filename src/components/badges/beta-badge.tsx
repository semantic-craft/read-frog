import type { VariantProps } from 'class-variance-authority'
import type { badgeVariants } from '@/components/shadcn/badge'
import { Badge } from '@/components/shadcn/badge'

type BetaBadgeProps = Pick<VariantProps<typeof badgeVariants>, 'size'>

export function BetaBadge({ size }: BetaBadgeProps) {
  return (
    <Badge variant="secondary" size={size}>
      Beta
    </Badge>
  )
}
