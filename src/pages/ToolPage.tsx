import { Suspense, useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getTool } from '@/lib/tools'
import { TOOL_COMPONENTS } from '@/tools/registry'
import { ToolShell } from '@/components/ToolShell'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ToolSkeleton } from '@/components/ui'

const HOSTNAME = 'https://ilike2pdf.pages.dev'

export default function ToolPage() {
  const { slug } = useParams()
  const tool = slug ? getTool(slug) : undefined
  const Comp = slug ? TOOL_COMPONENTS[slug] : undefined

  useEffect(() => {
    if (tool) document.title = `${tool.name} — iLike2PDF`
    return () => { document.title = 'iLike2PDF — Private Document Tools' }
  }, [tool])

  if (!tool || !Comp) return <Navigate to="/404" replace />

  const url = `${HOSTNAME}/tool/${tool.slug}`
  const description = `${tool.description} Free, private, browser-based tool — no uploads, no tracking.`

  return (
    <>
      <Helmet>
        <title>{tool.name} — iLike2PDF</title>
        <meta name="description" content={description} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${tool.name} — iLike2PDF`} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        <meta property="og:site_name" content="iLike2PDF" />
        <meta property="og:image" content={`${HOSTNAME}/og-image.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${tool.name} — iLike2PDF`} />
        <meta name="twitter:description" content={description} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: `${tool.name} — iLike2PDF`,
          url,
          description,
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Web Browser',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          isPartOf: { '@type': 'WebSite', name: 'iLike2PDF', url: HOSTNAME },
          breadcrumb: {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: HOSTNAME },
              { '@type': 'ListItem', position: 2, name: `${tool.name}`, item: url },
            ],
          },
        }) }} />
      </Helmet>
      <ToolShell tool={tool}>
        <ErrorBoundary toolName={tool.name}>
          <Suspense fallback={<ToolSkeleton />}>
            <Comp />
          </Suspense>
        </ErrorBoundary>
      </ToolShell>
    </>
  )
}
