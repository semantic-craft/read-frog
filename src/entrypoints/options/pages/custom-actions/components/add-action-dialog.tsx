import type { CustomActionTemplate } from "@/utils/constants/custom-action-templates"
import { Icon } from "@iconify/react"
import { i18n } from "#imports"
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/base-ui/dialog"
import { CUSTOM_ACTION_TEMPLATES } from "@/utils/constants/custom-action-templates"

const T_PREFIX = "options.floatingButtonAndToolbar.selectionToolbar.customActions.templates"

type TemplateI18nKey = Parameters<typeof i18n.t>[0]

function tTemplateKey(key: string) {
  return i18n.t(key as TemplateI18nKey)
}

function ActionRow({ icon, name, description, onClick, disabled }: {
  icon: string
  name: string
  description: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      className="flex items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted/70 disabled:cursor-not-allowed disabled:opacity-60"
      onClick={onClick}
      disabled={disabled}
    >
      <Icon icon={icon} className="size-5 shrink-0 text-zinc-600 dark:text-zinc-300" />
      <div className="min-w-0">
        <div className="text-sm font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </button>
  )
}

export function AddActionDialog({
  onSelectTemplate,
}: {
  onSelectTemplate: (template: CustomActionTemplate) => void
}) {
  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{i18n.t(`${T_PREFIX}.dialogTitle`)}</DialogTitle>
        <DialogDescription>{i18n.t(`${T_PREFIX}.dialogDescription`)}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-2">
        {CUSTOM_ACTION_TEMPLATES.map(template => (
          <ActionRow
            key={template.id}
            icon={template.icon}
            name={tTemplateKey(template.nameKey)}
            description={tTemplateKey(template.descriptionKey)}
            onClick={() => onSelectTemplate(template)}
          />
        ))}
      </div>
    </DialogContent>
  )
}
