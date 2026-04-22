import type { VariantProps } from "class-variance-authority"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { IconCheck, IconChevronDown, IconChevronUp } from "@tabler/icons-react"
import { cva } from "class-variance-authority"

import * as React from "react"
import { SHARED_POPUP_CLOSED_STATE_CLASS } from "@/components/ui/base-ui/popup-animation-classes"
import { cn } from "@/utils/styles/utils"

const Select = SelectPrimitive.Root

const selectTriggerVariants = cva(
  "shadow-xs border-input data-placeholder:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 gap-1.5 rounded-lg border bg-transparent py-2 pr-2 pl-2.5 text-sm transition-colors select-none focus-visible:ring-3 aria-invalid:ring-3 *:data-[slot=select-value]:gap-1.5 [&_svg:not([class*='size-'])]:size-4 flex w-fit items-center justify-between whitespace-nowrap outline-none disabled:cursor-not-allowed disabled:opacity-50 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "",
        panel: "border-white/10 bg-black/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:bg-white/[0.05] focus-visible:border-white/18 focus-visible:ring-white/12 [&_svg]:text-white/42",
      },
      size: {
        default: "h-8",
        sm: "h-7 rounded-[min(var(--radius-md),10px)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

const selectTriggerIconVariants = cva("size-4 pointer-events-none", {
  variants: {
    variant: {
      default: "text-muted-foreground",
      panel: "text-white/50",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

const selectContentVariants = cva(
  "pointer-events-auto data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 min-w-36 rounded-lg duration-100 data-[side=inline-start]:slide-in-from-right-2 data-[side=inline-end]:slide-in-from-left-2 relative isolate z-50 max-h-(--available-height) w-(--anchor-width) origin-(--transform-origin) overflow-x-hidden overflow-y-auto overscroll-contain data-[align-trigger=true]:animate-none",
  {
    variants: {
      variant: {
        default: "bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10",
        panel: "border border-white/10 bg-[linear-gradient(180deg,rgba(18,20,25,0.98)_0%,rgba(11,13,18,0.98)_100%)] text-white shadow-[0_18px_38px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.05)] ring-white/10 backdrop-blur-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

const selectListVariants = cva("", {
  variants: {
    variant: {
      default: "",
      panel: "py-1",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

const selectItemVariants = cva(
  "gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2 relative flex w-full cursor-default items-center outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground",
        panel: "text-white/84 [&_span]:text-inherit [&_svg]:text-white/72 hover:bg-white/[0.08] hover:text-white focus:bg-white/[0.08] focus:text-white data-[highlighted]:bg-white/[0.08] data-[highlighted]:text-white data-[selected]:bg-white/[0.05] data-[selected]:text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

const selectScrollButtonVariants = cva(
  "bg-popover z-10 flex cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4 w-full",
  {
    variants: {
      variant: {
        default: "",
        panel: "bg-[#0f1217]/96 text-white/52",
      },
      direction: {
        up: "top-0",
        down: "bottom-0",
      },
    },
    compoundVariants: [
      {
        direction: "up",
        variant: "panel",
        className: "border-b border-white/8",
      },
      {
        direction: "down",
        variant: "panel",
        className: "border-t border-white/8",
      },
    ],
    defaultVariants: {
      variant: "default",
    },
  },
)

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  )
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("flex flex-1 text-left", className)}
      {...props}
    />
  )
}

function SelectTrigger({
  className,
  size = "default",
  variant = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props
  & Pick<VariantProps<typeof selectTriggerVariants>, "size" | "variant">) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      data-variant={variant}
      className={cn(selectTriggerVariants({ size, variant }), className)}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={(
          <IconChevronDown className={selectTriggerIconVariants({ variant })} />
        )}
      />
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  container,
  className,
  children,
  positionerClassName,
  variant = "default",
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = false,
  ...props
}: SelectPrimitive.Popup.Props
  & Pick<SelectPrimitive.Portal.Props, "container">
  & {
    positionerClassName?: string
    variant?: VariantProps<typeof selectContentVariants>["variant"]
  }
  & Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >) {
  return (
    <SelectPrimitive.Portal container={container}>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className={cn("pointer-events-auto isolate z-50", positionerClassName)}
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          data-variant={variant}
          className={cn(selectContentVariants({ variant }), SHARED_POPUP_CLOSED_STATE_CLASS, className)}
          {...props}
        >
          <SelectScrollUpButton variant={variant} />
          <SelectPrimitive.List className={selectListVariants({ variant })}>
            {children}
          </SelectPrimitive.List>
          <SelectScrollDownButton variant={variant} />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn("text-muted-foreground px-1.5 py-1 text-xs", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  variant = "default",
  ...props
}: SelectPrimitive.Item.Props & Pick<VariantProps<typeof selectItemVariants>, "variant">) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      data-variant={variant}
      className={cn(selectItemVariants({ variant }), className)}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex flex-1 gap-2 shrink-0 whitespace-nowrap">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={props => (
          <span {...props} className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
            <IconCheck className="pointer-events-none" />
          </span>
        )}
      />
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("bg-border -mx-1 my-1 h-px pointer-events-none", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>
  & Pick<VariantProps<typeof selectScrollButtonVariants>, "variant">) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      data-variant={variant}
      className={cn(selectScrollButtonVariants({ direction: "up", variant }), className)}
      {...props}
    >
      <IconChevronUp />
    </SelectPrimitive.ScrollUpArrow>
  )
}

function SelectScrollDownButton({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>
  & Pick<VariantProps<typeof selectScrollButtonVariants>, "variant">) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      data-variant={variant}
      className={cn(selectScrollButtonVariants({ direction: "down", variant }), className)}
      {...props}
    >
      <IconChevronDown />
    </SelectPrimitive.ScrollDownArrow>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
