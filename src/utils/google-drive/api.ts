import { logger } from '../logger'
import { getValidAccessToken } from './auth'

const GOOGLE_DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'
const GOOGLE_DRIVE_UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3'

export interface GoogleDriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime: string
  size?: string
}

export interface GoogleDriveFileListResponse {
  files: GoogleDriveFile[]
  nextPageToken?: string
}

/**
 * 在 appDataFolder 中搜索文件
 * @param fileName 文件名
 * @returns 文件信息，如果不存在返回 null
 */
export async function findFileInAppData(fileName: string): Promise<GoogleDriveFile | null> {
  try {
    const accessToken = await getValidAccessToken()

    const url = new URL(`${GOOGLE_DRIVE_API_BASE}/files`)
    url.searchParams.set('spaces', 'appDataFolder')
    url.searchParams.set('q', `name='${fileName}'`)
    url.searchParams.set('fields', 'files(id, name, mimeType, modifiedTime, size)')

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to search file: ${response.statusText}`)
    }

    const data = await response.json() as GoogleDriveFileListResponse

    return data.files.length > 0 ? data.files[0] : null
  }
  catch (error) {
    logger.error('Failed to find file in appData', error)
    throw error
  }
}

/**
 * 从 Google Drive 下载文件内容
 * @param fileId 文件 ID
 * @returns 文件内容（JSON 字符串）
 */
export async function downloadFile(fileId: string): Promise<string> {
  try {
    const accessToken = await getValidAccessToken()

    const url = `${GOOGLE_DRIVE_API_BASE}/files/${fileId}?alt=media`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`)
    }

    return await response.text()
  }
  catch (error) {
    logger.error('Failed to download file', error)
    throw error
  }
}

/**
 * 上传文件到 Google Drive appDataFolder
 * @param fileName 文件名
 * @param content 文件内容
 * @param fileId 如果提供则更新现有文件，否则创建新文件
 * @returns 文件信息
 */
export async function uploadFile(
  fileName: string,
  content: string,
  fileId?: string,
): Promise<GoogleDriveFile> {
  try {
    const accessToken = await getValidAccessToken()

    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      ...(!fileId && { parents: ['appDataFolder'] }),
    }

    const boundary = '-------314159265358979323846'
    const delimiter = `\r\n--${boundary}\r\n`
    const closeDelimiter = `\r\n--${boundary}--`

    const multipartRequestBody
      = `${delimiter}Content-Type: application/json\r\n\r\n${
        JSON.stringify(metadata)
      }${delimiter}Content-Type: application/json\r\n\r\n${
        content
      }${closeDelimiter}`

    const method = fileId ? 'PATCH' : 'POST'
    const url = fileId
      ? `${GOOGLE_DRIVE_UPLOAD_API_BASE}/files/${fileId}?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size`
      : `${GOOGLE_DRIVE_UPLOAD_API_BASE}/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size`

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to upload file: ${response.statusText}, ${errorText}`)
    }

    const fileInfo = await response.json() as GoogleDriveFile

    logger.info('File uploaded successfully', fileInfo)

    return fileInfo
  }
  catch (error) {
    logger.error('Failed to upload file', error)
    throw error
  }
}

/**
 * 删除文件
 * @param fileId 文件 ID
 */
export async function deleteFile(fileId: string): Promise<void> {
  try {
    const accessToken = await getValidAccessToken()

    const url = `${GOOGLE_DRIVE_API_BASE}/files/${fileId}`

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.statusText}`)
    }

    logger.info('File deleted successfully', fileId)
  }
  catch (error) {
    logger.error('Failed to delete file', error)
    throw error
  }
}
