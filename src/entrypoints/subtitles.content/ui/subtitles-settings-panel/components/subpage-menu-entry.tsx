import type { ReactNode } from "react"
import { IconChevronRight } from "@tabler/icons-react"
import { Button } from "@/components/ui/base-ui/button"
import { Label } from "@/components/ui/base-ui/label"
import { cn } from "@/utils/styles/utils"

const MENU_ENTRY_CLASS = "min-h-11 w-full justify-start rounded-[14px] px-2 py-1.5 text-left"
const MENU_ENTRY_ICON_CLASS = "text-muted-foreground flex size-5 shrink-0 items-center justify-center"
const MENU_ENTRY_LABEL_CLASS = "font-light! cursor-pointer text-left text-[13px] leading-5"
const MENU_ENTRY_VALUE_CLASS = "bg-accent/60 text-accent-foreground rounded-full px-2 py-0.5 text-[12px] leading-4"
const MENU_ENTRY_CHEVRON_CLASS = "text-muted-foreground size-4 shrink-0"

interface SubpageMenuEntryProps {
  icon?: ReactNode
  label: string
  value?: string
  onClick: () => void
}

export function SubpageMenuEntry({
  icon,
  label,
  value,
  onClick,
}: SubpageMenuEntryProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(MENU_ENTRY_CLASS)}
    >
      <div className="flex w-full items-center gap-3">
        <div className={cn(MENU_ENTRY_ICON_CLASS)}>
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <Label className={cn(MENU_ENTRY_LABEL_CLASS)}>
            {label}
          </Label>
        </div>

        {value
          ? (
              <span className={cn(MENU_ENTRY_VALUE_CLASS, "max-w-[7.5rem] truncate")}>
                {value}
              </span>
            )
          : null}

        <IconChevronRight className={cn(MENU_ENTRY_CHEVRON_CLASS)} />
      </div>
    </Button>
  )
}
