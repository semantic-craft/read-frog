import { i18n } from "#imports"
import { Icon } from "@iconify/react"
import guest from "@/assets/icons/avatars/guest.svg"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/base-ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/base-ui/sidebar"
import { authClient } from "@/utils/auth/auth-client"
import { WEBSITE_URL } from "@/utils/constants/url"
import { cn } from "@/utils/styles/utils"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { data, isPending } = authClient.useSession()
  const user = data?.user

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<SidebarMenuButton size="lg" className="cursor-pointer" />}
          >
            <img
              src={user?.image ?? guest}
              alt="Avatar"
              className={cn("h-8 w-8 rounded-full border shrink-0", !user?.image && "p-1")}
            />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">
                {isPending ? "..." : (user?.name ?? i18n.t("options.sidebar.guest"))}
              </span>
              {user?.email && (
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              )}
            </div>
            <Icon icon="tabler:selector" className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
            className="w-56"
          >
            <DropdownMenuLabel>
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <img
                  src={user?.image ?? guest}
                  alt="Avatar"
                  className={cn("h-8 w-8 rounded-full border shrink-0", !user?.image && "p-1")}
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user?.name ?? i18n.t("options.sidebar.guest")}
                  </span>
                  {user?.email && (
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user
              ? (
                  <DropdownMenuItem onClick={() => authClient.signOut()} className="cursor-pointer">
                    <Icon icon="tabler:logout" />
                    {i18n.t("options.sidebar.logOut")}
                  </DropdownMenuItem>
                )
              : (
                  <DropdownMenuItem onClick={() => window.open(`${WEBSITE_URL}/log-in`, "_blank")} className="cursor-pointer">
                    <Icon icon="tabler:login" />
                    {i18n.t("options.sidebar.logIn")}
                  </DropdownMenuItem>
                )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
