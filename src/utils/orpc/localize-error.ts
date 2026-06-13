import { ORPCError } from "@orpc/client"
import { match, P } from "ts-pattern"
import { i18n } from "#imports"

export function localizeOrpcError(error: unknown): string {
  return match(error)
    .with(P.instanceOf(ORPCError), (e) => {
      const key = `errors.${e.code.toLowerCase()}` as Parameters<typeof i18n.t>[0]
      const localized = i18n.t(key)
      return localized && localized !== key ? localized : (e.message || i18n.t("errors.unknown"))
    })
    .with(P.instanceOf(Error), e => e.message || i18n.t("errors.unknown"))
    .otherwise(() => i18n.t("errors.unknown"))
}
