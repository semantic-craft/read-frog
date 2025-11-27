import type { VariantProps } from 'class-variance-authority'
import type { badgeVariants } from '@/components/shadcn/badge'
import { Badge } from '@/components/shadcn/badge'

type NewBadgeProps = Pick<VariantProps<typeof badgeVariants>, 'size'>

export function NewBadge({ size }: NewBadgeProps) {
  return (
    <Badge variant="accent" size={size}>
      New
    </Badge>
  )
}
