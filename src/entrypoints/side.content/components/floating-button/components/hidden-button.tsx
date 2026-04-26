import { cn } from "@/utils/styles/utils"

export default function HiddenButton({
  icon,
  onClick,
  children,
  className,
  expanded = false,
}: {
  icon: React.ReactNode
  onClick: () => void
  children?: React.ReactNode
  className?: string
  expanded?: boolean
}) {
  return (
    <button
      type="button"
      className={cn(
        "border-border mr-2 cursor-pointer rounded-full border bg-white shadow-lg p-1.5 text-neutral-600 dark:text-neutral-400 transition-transform duration-300 hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800",
        expanded ? "translate-x-0" : "translate-x-12",
        className,
      )}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  )
}
