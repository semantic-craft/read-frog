import type { Config } from '@/types/config/config'
import { storage } from '#imports'
import { CONFIG_STORAGE_KEY, DEFAULT_PROVIDER_CONFIG } from '@/utils/constants/config'
import { sendMessage } from '@/utils/message'

export async function deeplxTranslate(
  sourceText: string,
  fromLang: string,
  toLang: string,
  options?: { backgroundFetch?: boolean },
): Promise<string> {
  const config = await storage.getItem<Config>(`local:${CONFIG_STORAGE_KEY}`)
  const baseURL = config?.providersConfig?.deeplx?.baseURL ?? DEFAULT_PROVIDER_CONFIG.deeplx.baseURL
  const apiKey = config?.providersConfig?.deeplx?.apiKey

  if (!baseURL) {
    throw new Error('DeepLX baseURL is not configured')
  }

  const formatLang = (lang: string) => {
    if (lang === 'auto')
      return 'auto'
    let formattedLang = lang.toUpperCase()
    if (formattedLang === 'ZH-TW')
      formattedLang = 'ZH-HANT'
    return formattedLang
  }

  const url = `${baseURL.replace(/\/$/, '')}${apiKey ? `/${apiKey}` : ''}/translate`

  const requestBody = JSON.stringify({
    text: sourceText,
    source_lang: formatLang(fromLang),
    target_lang: formatLang(toLang),
  })

  const fetchResponse = options?.backgroundFetch
    ? await fetchViaBackground(url, requestBody)
    : await fetchDirect(url, requestBody)

  return parseDeepLXResponse(fetchResponse)
}

async function fetchViaBackground(url: string, body: string) {
  const resp = await sendMessage('backgroundFetch', {
    url,
    method: 'POST',
    headers: [['Content-Type', 'application/json']],
    body,
    credentials: 'omit',
  })

  return {
    ok: resp.status >= 200 && resp.status < 300,
    status: resp.status,
    statusText: resp.statusText,
    text: () => Promise.resolve(resp.body),
    json: () => Promise.resolve(JSON.parse(resp.body)),
  }
}

async function fetchDirect(url: string, body: string) {
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  }).catch((error) => {
    throw new Error(`Network error during DeepLX translation: ${error.message}`)
  })

  return resp
}

async function parseDeepLXResponse(resp: { ok: boolean, status: number, statusText: string, json: () => Promise<any> }) {
  if (!resp.ok) {
    throw new Error(
      `DeepLX translation request failed: ${resp.status} ${resp.statusText}`,
    )
  }

  try {
    const result = await resp.json()
    if (typeof result?.data !== 'string') {
      throw new TypeError('Unexpected response format from DeepLX translation API')
    }
    return result.data
  }
  catch (error) {
    throw new Error(
      `Failed to parse DeepLX translation response: ${(error as Error).message}`,
    )
  }
}
