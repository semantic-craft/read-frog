import type { Config } from '@/types/config/config'
import { browser, storage } from '#imports'
import { CONFIG_STORAGE_KEY } from '@/utils/constants/config'
import { shouldEnableAutoTranslation } from '@/utils/host/translate/auto-translation'
import { logger } from '@/utils/logger'
import { onMessage, sendMessage } from '@/utils/message'

export function translationMessage() {
  // === Message Handlers ===
  onMessage('getEnablePageTranslation', async (msg) => {
    const { tabId } = msg.data
    return await getTranslationState(tabId)
  })

  onMessage('setEnablePageTranslation', async (msg) => {
    const { tabId, enabled } = msg.data
    await setTranslationState(tabId, enabled)
  })

  onMessage('setEnablePageTranslationOnContentScript', async (msg) => {
    const tabId = msg.sender?.tab?.id
    const { enabled } = msg.data
    if (typeof tabId === 'number') {
      await setTranslationState(tabId, enabled)
    }
    else {
      logger.error('tabId is not a number', msg)
    }
  })

  onMessage('resetPageTranslationOnNavigation', async (msg) => {
    const tabId = msg.sender?.tab?.id
    const { url } = msg.data
    if (typeof tabId === 'number') {
      const config = await storage.getItem<Config>(`local:${CONFIG_STORAGE_KEY}`)
      if (!config)
        return
      const shouldEnable = await shouldEnableAutoTranslation(url, config)
      await setTranslationState(tabId, shouldEnable)
    }
  })

  // === Helper Functions ===
  async function getTranslationState(tabId: number): Promise<boolean> {
    // TODO: extract this type and use it every where needed
    const state = await storage.getItem<{ enabled: boolean }>(
      `session:translationState.${tabId}`,
    )
    return state?.enabled ?? false
  }

  async function setTranslationState(tabId: number, enabled: boolean) {
    await storage.setItem(`session:translationState.${tabId}`, { enabled })
    // Notify content script in that specific tab
    void sendMessage('translationStateChanged', { enabled }, tabId)
  }

  // === Cleanup ===
  browser.tabs.onRemoved.addListener(async (tabId) => {
    await storage.removeItem(`session:translationState.${tabId}`)
  })
}
