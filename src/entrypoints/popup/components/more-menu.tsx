import { Icon } from '@iconify/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu'

const MENU_ITEMS = [
  {
    label: 'Discord',
    icon: 'tabler:brand-discord',
    url: 'https://discord.gg/ej45e3PezJ',
  },
  {
    label: 'Github',
    icon: 'tabler:brand-github',
    url: 'https://github.com/mengxi-ream/read-frog',
  },
  {
    label: 'E-book',
    icon: 'tabler:book',
    url: 'https://www.neat-reader.com/webapp#/',
  },
  {
    label: 'Help',
    icon: 'tabler:help-circle',
    url: 'https://readfrog.app/tutorial/',
  },
]

export function MoreMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 hover:bg-neutral-300 dark:hover:bg-neutral-700"
        >
          <Icon icon="tabler:dots" className="size-4" strokeWidth={1.6} />
          <span className="text-[13px] font-medium">More</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top">
        {MENU_ITEMS.map(item => (
          <DropdownMenuItem
            key={item.label}
            onClick={() => window.open(item.url, '_blank')}
            className="cursor-pointer"
          >
            <Icon icon={item.icon} className="size-4" strokeWidth={1.6} />
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
