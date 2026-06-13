import type { ActionCollectionInstallOutput } from "@read-frog/api-contract"
import type { Config } from "@/types/config/config"
import type { SelectionToolbarCustomAction } from "@/types/config/selection-toolbar"
import { env } from "@/env"
import { getEnabledLLMProvidersConfig } from "@/utils/config/helpers"
import { getLocalConfig, setLocalConfig } from "@/utils/config/storage"
import { DEFAULT_CONFIG } from "@/utils/constants/config"
import { getRandomUUID } from "@/utils/crypto-polyfill"
import { getUniqueName } from "@/utils/name"
import { sanitizeSelectionToolbarCustomAction } from "@/utils/notebase"

export interface InstallActionCollectionResult {
  action: SelectionToolbarCustomAction
  nextConfig: Config
}

export function buildActionCollectionShareUrl(collectionId: number) {
  return `${env.WXT_WEBSITE_URL}/action-collections/${collectionId}`
}

function resolveInstalledActionName(desiredName: string, actions: SelectionToolbarCustomAction[]) {
  const existingNames = new Set(actions.map(action => action.name))
  return getUniqueName(desiredName, existingNames)
}

function resolveProviderId(config: Config) {
  const enabledLLMProviders = getEnabledLLMProvidersConfig(config.providersConfig)
  const translateProviderId = config.translate.providerId
  if (translateProviderId && enabledLLMProviders.some(provider => provider.id === translateProviderId)) {
    return translateProviderId
  }

  return enabledLLMProviders[0]?.id
}

function upsertInstalledActionCollection(config: Config, payload: ActionCollectionInstallOutput): InstallActionCollectionResult {
  const customActions = config.selectionToolbar.customActions

  const nextAction = sanitizeSelectionToolbarCustomAction({
    id: getRandomUUID(),
    name: resolveInstalledActionName(payload.collection.name, customActions),
    enabled: true,
    icon: payload.collection.icon ?? "tabler:sparkles",
    providerId: resolveProviderId(config),
    systemPrompt: payload.systemPrompt,
    prompt: payload.prompt,
    outputSchema: payload.outputSchema,
  })

  return {
    action: nextAction,
    nextConfig: {
      ...config,
      selectionToolbar: {
        ...config.selectionToolbar,
        customActions: [...customActions, nextAction],
      },
    },
  }
}

export async function applyInstalledActionCollectionPayload(payload: ActionCollectionInstallOutput): Promise<InstallActionCollectionResult> {
  const config = await getLocalConfig() ?? DEFAULT_CONFIG
  const result = upsertInstalledActionCollection(config, payload)
  await setLocalConfig(result.nextConfig)
  return result
}
