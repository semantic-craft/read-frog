import { storage } from '#imports'
import { sendMessage } from './message'

const LAST_VIEWED_BLOG_DATE_KEY = 'lastViewedBlogDate'
const ONE_DAY_MS = 24 * 60 * 60 * 1000

/**
 * Saves the last viewed blog date to Chrome storage
 */
export async function saveLastViewedBlogDate(date: Date): Promise<void> {
  await storage.setItem(`local:${LAST_VIEWED_BLOG_DATE_KEY}`, date.toISOString())
}

/**
 * Retrieves the last viewed blog date from Chrome storage
 */
export async function getLastViewedBlogDate(): Promise<Date | null> {
  const dateStr = await storage.getItem<string>(`local:${LAST_VIEWED_BLOG_DATE_KEY}`)
  return dateStr ? new Date(dateStr) : null
}

/**
 * Checks if there's a new blog post by comparing last viewed date with latest blog date
 * and extension version compatibility
 * @param lastViewedDate - The last date the user viewed the blog
 * @param latestDate - The date of the latest blog post
 * @param currentExtensionVersion - Current extension version (e.g., "1.10.0")
 * @param blogExtensionVersion - Minimum extension version required for the blog post (e.g., "1.11.0")
 */
export function hasNewBlogPost(
  lastViewedDate: Date | null,
  latestDate: Date | null,
  currentExtensionVersion?: string,
  blogExtensionVersion?: string | null,
): boolean {
  if (!latestDate)
    return false

  // If blog post requires a specific extension version, check version compatibility
  if (blogExtensionVersion && currentExtensionVersion) {
    if (compareVersions(currentExtensionVersion, blogExtensionVersion) < 0) {
      // Current extension version is older than required version
      return false
    }
  }

  if (!lastViewedDate)
    return true
  return latestDate > lastViewedDate
}

/**
 * Compares two semantic version strings
 * @returns -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0
    const part2 = parts2[i] || 0

    if (part1 < part2)
      return -1
    if (part1 > part2)
      return 1
  }

  return 0
}

/**
 * Fetches the latest blog post from the Read Frog blog API.
 * Uses background fetch with optional 1-day cache.
 *
 * @param apiUrl - The URL of the blog API endpoint (default: production URL)
 * @param locale - The locale to fetch the latest post for (default: 'en')
 * @param useCache - Whether to use cache (default: true)
 * @returns Promise resolving to the latest blog post data (date and extensionVersion), or null if no posts found
 *
 * @example
 * ```ts
 * const latestPost = await getLatestBlogDate('http://localhost:8888/api/blog/latest', 'en')
 * console.log(latestPost) // { date: Date, extensionVersion: '1.11.0' }
 *
 * // Without cache
 * const freshPost = await getLatestBlogDate('http://localhost:8888/api/blog/latest', 'en', false)
 * ```
 */
export async function getLatestBlogDate(
  apiUrl: string = 'https://readfrog.app/api/blog/latest',
  locale: string = 'en',
  useCache: boolean = true,
): Promise<{ date: Date, extensionVersion?: string | null } | null> {
  try {
    const url = new URL(apiUrl)
    url.searchParams.set('locale', locale)

    const response = await sendMessage('backgroundFetch', {
      url: url.toString(),
      method: 'GET',
      cacheConfig: useCache
        ? {
            enabled: true,
            groupKey: 'blog-fetch',
            ttl: ONE_DAY_MS,
          }
        : undefined,
    })

    if (response.status !== 200) {
      throw new Error(`Failed to fetch blog: ${response.status}`)
    }

    const data = JSON.parse(response.body) as {
      date: string
      title: string
      description: string
      url: string
      extensionVersion?: string | null
    } | null

    if (!data) {
      return null
    }

    return {
      date: new Date(data.date),
      extensionVersion: data.extensionVersion ?? null,
    }
  }
  catch (error) {
    console.error('Error fetching latest blog post:', error)
    return null
  }
}
