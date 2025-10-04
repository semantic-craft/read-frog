import type { NavItem } from './nav-items'
import { i18n } from '#imports'
import { Icon } from '@iconify/react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@repo/ui/components/sidebar'
import { cn } from '@repo/ui/lib/utils'
import { Link, useLocation } from 'react-router'
import readFrogLogo from '@/assets/icons/read-frog.png'
import { version } from '../../../../package.json'
import { AnimatedIndicator } from './animated-indicator'
import { PRODUCT_NAV_ITEMS, SETTING_NAV_ITEMS } from './nav-items'

function renderNavItem(
  key: string,
  item: NavItem,
  currentPath: string,
  open: boolean,
  action: boolean = false,
) {
  const title = i18n.t(`options.${item.title}.title`)

  switch (item.type) {
    case 'external':
      return (
        <SidebarMenuItem key={key} className={cn('relative', action && 'text-primary font-semibold hover:text-primary')}>
          <SidebarMenuButton
            asChild
          >
            <a
              href={item.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon icon={item.icon} />
              <span>{title}</span>
            </a>
          </SidebarMenuButton>
          <AnimatedIndicator show={action && open} />
        </SidebarMenuItem>
      )

    case 'component':
      return (
        <SidebarMenuItem key={key} className={cn('relative', action && 'text-primary font-semibold hover:text-primary')}>
          <SidebarMenuButton asChild isActive={currentPath === item.url}>
            <Link to={item.url}>
              <Icon icon={item.icon} />
              <span>{title}</span>
            </Link>
          </SidebarMenuButton>
          <AnimatedIndicator show={action && open} />
        </SidebarMenuItem>
      )
  }
}

export function AppSidebar() {
  const location = useLocation()
  const { open } = useSidebar()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="group-data-[state=expanded]:px-5 group-data-[state=expanded]:pt-4 transition-all">
        <a href="https://readfrog.app" className="flex items-center gap-2">
          <img src={readFrogLogo} alt="Logo" className="h-8 w-8 shrink-0" />
          <span className="text-md font-bold overflow-hidden truncate">{i18n.t('name')}</span>
          <span className="text-xs text-muted-foreground overflow-hidden truncate">
            {`v${version}`}
          </span>
        </a>
      </SidebarHeader>
      <SidebarContent className="group-data-[state=expanded]:px-2 transition-all">
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {Object.entries(SETTING_NAV_ITEMS).map(([key, item]) =>
                renderNavItem(key, item, location.pathname, open),
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Product</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {Object.entries(PRODUCT_NAV_ITEMS).map(([key, item]) =>
                renderNavItem(key, item, location.pathname, open),
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
