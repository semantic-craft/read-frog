import { ConfigCard } from '@/entrypoints/options/components/config-card'
import { BackupConfigItem } from './components/backup-config-item'

export function ConfigBackup() {
  return (
    <ConfigCard
      title="Config Backup"
      description="Restore your previous configurations"
    >
      <BackupConfigItem />
    </ConfigCard>
  )
}
