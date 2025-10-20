import { i18n } from '#imports'
import { PageLayout } from '../../components/page-layout'
import { SelectionToolbarDisabledSites } from './selection-toolbar-disabled-sites'

export function SelectionToolbarPage() {
  return (
    <PageLayout title={i18n.t('options.selectionToolbar.title')} innerClassName="[&>*]:border-b [&>*:last-child]:border-b-0">
      <SelectionToolbarDisabledSites />
    </PageLayout>
  )
}
