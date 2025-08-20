import { i18n } from '#imports'
import { Icon } from '@iconify/react'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import { saveAs } from 'file-saver'
import { useAtomValue } from 'jotai'
import { toast } from 'sonner'
import { configAtom } from '@/utils/atoms/config'
import { APP_NAME } from '@/utils/constants/app'
import { ConfigCard } from '../../components/config-card'

const CONFIG_FILE = `${APP_NAME}: config`

function ConfigSync() {
  return (
    <ConfigCard
      title={i18n.t('options.config.title')}
      description={i18n.t('options.config.sync.description')}
    >
      <div className="w-full text-end gap-3 flex justify-end">
        <ImportConfig />
        <ExportConfig />
      </div>
    </ConfigCard>
  )
}

function ImportConfig() {
  const importConfig = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (!file)
        return

      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const fileResult = event.target?.result
          if (typeof fileResult === 'string') {
            const _config = JSON.parse(fileResult)
            // TODO: 验证配置格式并应用到系统
            toast.success(`${i18n.t('options.config.sync.importSuccess')} !`)
          }
        }
        catch {
          toast.error('Invalid config file format')
        }
      }
      reader.readAsText(file)
    }
    catch {
      toast.error('Failed to import config')
    }
    finally {
      e.target.value = ''
      e.target.files = null
    }
  }

  return (
    <Button variant="outline" className="p-0">
      <Label htmlFor="import-config-file" className="w-full px-3">
        <Icon icon="tabler:file-download" className="size-4" />
        {i18n.t('options.config.sync.import')}
      </Label>
      <Input
        type="file"
        id="import-config-file"
        className="hidden"
        accept=".json"
        onChange={importConfig}
      />
    </Button>
  )
}

function ExportConfig() {
  const config = useAtomValue(configAtom)

  const exportConfig = () => {
    const json = JSON.stringify(config, null, 2)
    const blob = new Blob([json], { type: 'text/json' })
    saveAs(blob, `${CONFIG_FILE}.json`)
  }

  return (
    <Button onClick={exportConfig}>
      <Icon icon="tabler:file-upload" className="size-4" />
      {i18n.t('options.config.sync.export')}
    </Button>
  )
}

export default ConfigSync
