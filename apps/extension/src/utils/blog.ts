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
 */
export function hasNewBlogPost(lastViewedDate: Date | null, latestDate: Date | null): boolean {
  if (!latestDate)
    return false
  if (!lastViewedDate)
    return true
  return latestDate > lastViewedDate
}

/**
 * Fetches blog posts from the Read Frog blog and returns the latest post date.
 * Uses background fetch with optional 1-day cache.
 *
 * @param blogUrl - The URL of the blog page (default: production URL)
 * @param useCache - Whether to use cache (default: true)
 * @returns Promise resolving to the latest blog post date, or null if no posts found
 *
 * @example
 * ```ts
 * const latestDate = await getLatestBlogDate('http://localhost:8888/en/blog')
 * console.log(latestDate) // Date object of the most recent post
 *
 * // Without cache
 * const freshDate = await getLatestBlogDate('http://localhost:8888/en/blog', false)
 * ```
 */
export async function getLatestBlogDate(
  blogUrl: string = 'https://readfrog.app/en/blog',
  useCache: boolean = true,
): Promise<Date | null> {
  try {
    const response = await sendMessage('backgroundFetch', {
      url: blogUrl,
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

    const html = response.body

    // Extract all date strings from the HTML
    // Pattern: <p class="...">Day Mon DD YYYY</p>
    const datePattern = /<p[^>]*class="[^"]*text-xs[^"]*"[^>]*>([^<]+\d{4})<\/p>/g
    const matches = html.matchAll(datePattern)
    const dates: Date[] = []

    for (const match of matches) {
      const dateStr = match[1].trim()
      const parsed = new Date(dateStr)

      if (!Number.isNaN(parsed.getTime())) {
        dates.push(parsed)
      }
    }

    if (dates.length === 0) {
      return null
    }

    // Return the latest date
    return dates.reduce((latest, current) => current > latest ? current : latest,
    )
  }
  catch (error) {
    console.error('Error fetching blog dates:', error)
    return null
  }
}
