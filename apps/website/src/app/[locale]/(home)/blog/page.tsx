import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { blog } from '@/lib/source'

export default async function BlogPage(props: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await props.params
  const searchParams = await props.searchParams
  const showLatestIndicator = searchParams['latest-indicator'] === 'true'
  const t = await getTranslations('blog')
  const posts = [...blog.getPages(params.locale)].sort(
    (a, b) =>
      new Date(b.data.date ?? b.path).getTime()
        - new Date(a.data.date ?? a.path).getTime(),
  )

  const svg = `<svg viewBox='0 0 500 500' xmlns='http://www.w3.org/2000/svg'>
  <filter id='noiseFilter'>
    <feTurbulence 
      type='fractalNoise' 
      baseFrequency='0.65' 
      numOctaves='3' 
      stitchTiles='stitch'/>
  </filter>
  
  <rect width='100%' height='100%' filter='url(#noiseFilter)'/>
</svg>`

  return (
    <main className="mx-auto w-full max-w-fd-container sm:px-4 md:py-12">
      <div
        className="h-[300px] p-8 md:h-[400px] md:p-12"
        style={{
          backgroundImage: [
            'radial-gradient(circle at 70% 10%, rgba(34, 193, 195, 0.5), transparent)',
            'radial-gradient(circle at 0% 80%, rgba(139, 92, 246, 0.5), transparent)',
            'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.3), transparent)',
            `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
          ].join(', '),
        }}
      >
        <h1 className="mb-4 border-b-4 border-fd-foreground pb-2 text-4xl font-bold md:text-5xl">
          {t('title')}
        </h1>
        <p className="text-sm md:text-base">
          {t('description')}
        </p>
      </div>
      <div className="grid grid-cols-1 border md:grid-cols-3 lg:grid-cols-4">
        {posts.map((post, index) => (
          <Link
            key={post.url}
            href={post.url}
            className="relative flex flex-col bg-fd-card p-4 transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
          >
            <p className="font-medium">{post.data.title}</p>
            <p className="text-sm text-fd-muted-foreground mt-1">
              {post.data.description}
            </p>

            <p className="mt-auto pt-4 text-xs text-fd-muted-foreground">
              {new Date(post.data.date ?? post.path).toDateString()}
            </p>

            {index === 0 && showLatestIndicator && (
              <span className="absolute top-2.5 right-2.5 flex items-center justify-center size-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-primary"></span>
              </span>
            )}
          </Link>
        ))}
      </div>
    </main>
  )
}
