import { Button } from '@repo/ui/components/button'
import { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemTitle } from '@repo/ui/components/item'
import { useAtomValue } from 'jotai'
import { configAtom } from '@/utils/atoms/config'
import { ViewConfig } from '../../components/view-config'

export function BackupConfigItem() {
  const config = useAtomValue(configAtom)
  return (
    <Item variant="muted">
      <ItemContent>
        <ItemTitle>Backup at 2025-01-15 14:30:25</ItemTitle>
        <ItemDescription>
          Extension version: 1.12.0
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button variant="outline">
          Restore
        </Button>
      </ItemActions>
      <ItemFooter><ViewConfig config={config} /></ItemFooter>
    </Item>
  )
}
