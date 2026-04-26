import { browser, i18n } from "#imports"
import { IconLock, IconLockOpen, IconSettings, IconX } from "@tabler/icons-react"
import { useAtom, useAtomValue } from "jotai"
import { useEffect, useRef, useState } from "react"
import readFrogLogo from "@/assets/icons/read-frog.png?url&no-inline"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/base-ui/dropdown-menu"
import { ANALYTICS_FEATURE, ANALYTICS_SURFACE } from "@/types/analytics"
import { createFeatureUsageContext } from "@/utils/analytics"
import { configFieldsAtomMap } from "@/utils/atoms/config"
import { APP_NAME } from "@/utils/constants/app"
import { sendMessage } from "@/utils/message"
import { cn } from "@/utils/styles/utils"
import { matchDomainPattern } from "@/utils/url"
import { enablePageTranslationAtom, isDraggingButtonAtom, isSideOpenAtom } from "../../atoms"
import { shadowWrapper } from "../../index"
import HiddenButton from "./components/hidden-button"
import TranslateButton from "./translate-button"

const readFrogLogoUrl = new URL(readFrogLogo, browser.runtime.getURL("/")).href
const floatingButtonControlClassName = cn(
  "absolute invisible cursor-pointer pointer-events-none flex size-6 items-center justify-center",
  "text-neutral-400 transition-[color,left,transform] duration-300 hover:scale-110 hover:text-neutral-600 active:scale-90 active:text-neutral-600",
  "dark:text-neutral-600 dark:hover:text-neutral-400 dark:active:text-neutral-400",
)
const floatingButtonControlOffsetClassNames = {
  collapsed: "left-0",
  expanded: "-left-6",
}

export default function FloatingButton() {
  const [floatingButton, setFloatingButton] = useAtom(
    configFieldsAtomMap.floatingButton,
  )
  const sideContent = useAtomValue(configFieldsAtomMap.sideContent)
  const translationState = useAtomValue(enablePageTranslationAtom)
  const [isSideOpen, setIsSideOpen] = useAtom(isSideOpenAtom)
  const [isDraggingButton, setIsDraggingButton] = useAtom(isDraggingButtonAtom)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isHitAreaExpanded, setIsHitAreaExpanded] = useState(false)
  const [dragPosition, setDragPosition] = useState<number | null>(null)
  const initialClientYRef = useRef<number | null>(null)
  const isFloatingButtonLocked = floatingButton.locked
  const isFloatingButtonExpanded = isHitAreaExpanded || isDraggingButton || isSideOpen || isDropdownOpen
  const isMainButtonAttached = isFloatingButtonLocked || isFloatingButtonExpanded

  // 按钮拖动处理
  useEffect(() => {
    const initialClientY = initialClientYRef.current
    if (!isDraggingButton || !initialClientY || !floatingButton)
      return

    const handleMouseMove = (e: MouseEvent) => {
      const initialY = floatingButton.position * window.innerHeight
      const newY = Math.max(
        30,
        Math.min(
          window.innerHeight - 200,
          initialY + e.clientY - initialClientY,
        ),
      )
      const newPosition = newY / window.innerHeight
      setDragPosition(newPosition)
    }

    const handleMouseUp = () => {
      setIsDraggingButton(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    document.body.style.userSelect = "none"

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.userSelect = ""
    }
  // eslint-disable-next-line react/exhaustive-deps
  }, [isDraggingButton])

  // 拖拽结束时写入 storage
  useEffect(() => {
    if (!isDraggingButton && dragPosition !== null) {
      void setFloatingButton({ position: dragPosition })
      // eslint-disable-next-line react/set-state-in-effect
      setDragPosition(null)
    }
  }, [isDraggingButton, dragPosition, setFloatingButton])

  const handleButtonDragStart = (e: React.MouseEvent) => {
    // 记录初始位置，用于后续判断是点击还是拖动
    initialClientYRef.current = e.clientY
    let hasMoved = false // 标记是否发生了移动

    e.preventDefault()
    setIsDraggingButton(true)

    // 创建一个监听器检测移动
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const moveDistance = Math.abs(moveEvent.clientY - e.clientY)
      // 如果移动距离大于阈值，标记为已移动
      if (moveDistance > 5) {
        hasMoved = true
      }
    }

    // 在鼠标释放时，只有未移动才触发点击事件
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)

      // 只有未移动过才触发点击
      if (!hasMoved) {
        if (floatingButton.clickAction === "translate") {
          const nextEnabled = !translationState.enabled
          void sendMessage("tryToSetEnablePageTranslationOnContentScript", {
            enabled: nextEnabled,
            analyticsContext: nextEnabled
              ? createFeatureUsageContext(ANALYTICS_FEATURE.PAGE_TRANSLATION, ANALYTICS_SURFACE.FLOATING_BUTTON)
              : undefined,
          })
        }
        else {
          setIsSideOpen(o => !o)
        }
      }
    }

    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("mousemove", handleMouseMove)
  }

  const attachSideClassName = isDraggingButton || isSideOpen || isDropdownOpen ? "translate-x-0" : ""

  const handleMouseEnter = () => {
    setIsHitAreaExpanded(true)
  }

  const handleMouseLeave = () => {
    if (!isDropdownOpen) {
      setIsHitAreaExpanded(false)
    }
  }

  if (!floatingButton.enabled || floatingButton.disabledFloatingButtonPatterns.some(pattern => matchDomainPattern(window.location.href, pattern))) {
    return null
  }

  return (
    <div
      className={cn(
        "fixed z-2147483647 flex flex-col items-end gap-2 print:hidden",
        isFloatingButtonExpanded && "pl-6",
      )}
      style={{
        right: isSideOpen
          ? `calc(${sideContent.width}px + var(--removed-body-scroll-bar-size, 0px))`
          : "var(--removed-body-scroll-bar-size, 0px)",
        top: `${(dragPosition ?? floatingButton.position) * 100}vh`,
      }}
      onMouseLeave={handleMouseLeave}
    >
      <TranslateButton className={attachSideClassName} expanded={isFloatingButtonExpanded} />
      <div className="relative">
        <div
          className={cn(
            "border-border relative flex h-10 w-11 items-center rounded-l-full border border-r-0 bg-white shadow-lg transition-transform duration-300 dark:bg-neutral-900",
            isMainButtonAttached ? "translate-x-0" : "translate-x-6",
            isFloatingButtonExpanded ? "opacity-100" : "opacity-60",
            isDraggingButton ? "cursor-move" : "cursor-pointer",
            attachSideClassName,
          )}
          onMouseDown={handleButtonDragStart}
          onMouseEnter={handleMouseEnter}
        >
          <img
            src={readFrogLogoUrl}
            alt={APP_NAME}
            className="ml-1 h-8 w-8 rounded-full"
          />
        </div>

        <FloatingButtonCloseMenu
          expanded={isFloatingButtonExpanded}
          onDropdownOpenChange={setIsDropdownOpen}
        />
        <FloatingButtonLockControl expanded={isFloatingButtonExpanded} />
      </div>
      <HiddenButton
        className={attachSideClassName}
        expanded={isFloatingButtonExpanded}
        icon={<IconSettings className="h-5 w-5" />}
        onClick={() => {
          void sendMessage("openOptionsPage", undefined)
        }}
      />
    </div>
  )
}

interface FloatingButtonCloseMenuProps {
  expanded: boolean
  onDropdownOpenChange: (open: boolean) => void
}

function FloatingButtonCloseMenu({
  expanded,
  onDropdownOpenChange,
}: FloatingButtonCloseMenuProps) {
  const [floatingButton, setFloatingButton] = useAtom(configFieldsAtomMap.floatingButton)
  const [open, setOpen] = useState(false)
  const controlOffsetClassName = !floatingButton.locked && !expanded
    ? floatingButtonControlOffsetClassNames.collapsed
    : floatingButtonControlOffsetClassNames.expanded

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    onDropdownOpenChange(nextOpen)
  }

  const handleDisableForSite = () => {
    const currentDomain = window.location.hostname
    const currentPatterns = floatingButton.disabledFloatingButtonPatterns || []

    void setFloatingButton({
      ...floatingButton,
      disabledFloatingButtonPatterns: [...currentPatterns, currentDomain],
    })
  }

  const handleDisableGlobally = () => {
    void setFloatingButton({ ...floatingButton, enabled: false })
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        render={(
          <button
            type="button"
            aria-label="Close floating button"
            className={cn(
              floatingButtonControlClassName,
              "-top-1",
              controlOffsetClassName,
              expanded && "visible pointer-events-auto",
              open && "visible pointer-events-auto",
            )}
          />
        )}
      >
        <IconX className="h-3 w-3" strokeWidth={3} />
      </DropdownMenuTrigger>
      <DropdownMenuContent container={shadowWrapper} align="start" side="left" className="z-2147483647 w-fit! whitespace-nowrap">
        <DropdownMenuItem
          onMouseDown={e => e.stopPropagation()}
          onClick={handleDisableForSite}
        >
          {i18n.t("options.floatingButtonAndToolbar.floatingButton.closeMenu.disableForSite")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onMouseDown={e => e.stopPropagation()}
          onClick={handleDisableGlobally}
        >
          {i18n.t("options.floatingButtonAndToolbar.floatingButton.closeMenu.disableGlobally")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface FloatingButtonLockControlProps {
  expanded: boolean
}

function FloatingButtonLockControl({ expanded }: FloatingButtonLockControlProps) {
  const [floatingButton, setFloatingButton] = useAtom(configFieldsAtomMap.floatingButton)
  const locked = floatingButton.locked
  const controlOffsetClassName = !locked && !expanded
    ? floatingButtonControlOffsetClassNames.collapsed
    : floatingButtonControlOffsetClassNames.expanded

  const handleToggleLocked = () => {
    void setFloatingButton({ ...floatingButton, locked: !locked })
  }

  return (
    <button
      type="button"
      aria-label={locked ? "Unlock floating button" : "Lock floating button"}
      className={cn(
        floatingButtonControlClassName,
        "-bottom-1",
        controlOffsetClassName,
        expanded && "visible pointer-events-auto",
      )}
      onClick={handleToggleLocked}
    >
      {locked
        ? <IconLock className="h-3 w-3" strokeWidth={3} />
        : <IconLockOpen className="h-3 w-3" strokeWidth={3} />}
    </button>
  )
}
