import { browser } from '#imports'
import { logger } from '../logger'

// Google Drive API OAuth 配置
// 注意：实际使用时需要在 Google Cloud Console 创建 OAuth 客户端 ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID'
const GOOGLE_REDIRECT_URI = browser.identity.getRedirectURL()
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file', // 访问 Drive 文件
  'https://www.googleapis.com/auth/drive.appdata', // 访问应用数据文件夹
]

export interface GoogleAuthToken {
  access_token: string
  expires_at: number // Unix timestamp in milliseconds
  token_type: string
}

/**
 * 执行 Google OAuth 认证流程
 * @returns 访问令牌
 */
export async function authenticateGoogleDrive(): Promise<string> {
  try {
    // 构建 OAuth URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
    authUrl.searchParams.set('response_type', 'token')
    authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI)
    authUrl.searchParams.set('scope', GOOGLE_SCOPES.join(' '))

    logger.info('Starting Google OAuth flow', { authUrl: authUrl.toString() })

    // 使用 browser.identity.launchWebAuthFlow 进行认证
    const responseUrl = await browser.identity.launchWebAuthFlow({
      url: authUrl.toString(),
      interactive: true,
    })

    if (!responseUrl) {
      throw new Error('No response URL from Google OAuth')
    }

    // 解析 access token
    const url = new URL(responseUrl)
    const params = new URLSearchParams(url.hash.slice(1)) // hash 中包含 token
    const accessToken = params.get('access_token')
    const expiresIn = params.get('expires_in')

    if (!accessToken) {
      throw new Error('No access token in OAuth response')
    }

    // 计算过期时间
    const expiresAt = Date.now() + (expiresIn ? Number.parseInt(expiresIn) * 1000 : 3600 * 1000)

    // 保存 token 到 storage
    const tokenData: GoogleAuthToken = {
      access_token: accessToken,
      expires_at: expiresAt,
      token_type: 'Bearer',
    }

    await browser.storage.local.set({ google_drive_token: tokenData })

    logger.info('Google OAuth authentication successful')

    return accessToken
  }
  catch (error) {
    logger.error('Google OAuth authentication failed', error)
    throw error
  }
}

/**
 * 获取当前有效的访问令牌，如果过期则重新认证
 * @returns 访问令牌
 */
export async function getValidAccessToken(): Promise<string> {
  try {
    const result = await browser.storage.local.get('google_drive_token')
    const tokenData = result.google_drive_token as GoogleAuthToken | undefined

    // 如果没有 token 或 token 已过期，重新认证
    if (!tokenData || Date.now() >= tokenData.expires_at - 60000) { // 提前 1 分钟刷新
      logger.info('Token expired or not found, re-authenticating')
      return await authenticateGoogleDrive()
    }

    return tokenData.access_token
  }
  catch (error) {
    logger.error('Failed to get valid access token', error)
    throw error
  }
}

/**
 * 清除已保存的访问令牌
 */
export async function clearAccessToken(): Promise<void> {
  try {
    await browser.storage.local.remove('google_drive_token')
    logger.info('Access token cleared')
  }
  catch (error) {
    logger.error('Failed to clear access token', error)
    throw error
  }
}

/**
 * 检查是否已认证
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const result = await browser.storage.local.get('google_drive_token')
    const tokenData = result.google_drive_token as GoogleAuthToken | undefined

    if (!tokenData) {
      return false
    }

    // 检查是否过期
    return Date.now() < tokenData.expires_at - 60000
  }
  catch (error) {
    logger.error('Failed to check authentication status', error)
    return false
  }
}
