import { Suspense, useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getTool } from '@/lib/tools'
import { TOOL_COMPONENTS } from '@/tools/registry'
import { ToolShell } from '@/components/ToolShell'
import { Spinner } from '@/components/ui'

const HOSTNAME = 'https://ilikepdf.pages.dev'

export default function ToolPage() {
  const { slug } = useParams()
  const tool = slug ? getTool(slug) : undefined
  const Comp = slug ? TOOL_COMPONENTS[slug] : undefined

  useEffect(() => {
    if (tool) document.title = `${tool.name} — iLikePDF`
    return () => { document.title = 'iLikePDF — Private Document Tools' }
  }, [tool])

  if (!tool || !Comp) return <Navigate to="/404" replace />

  const url = `${HOSTNAME}/tool/${tool.slug}`
  const description = `${tool.description} Free, private, browser-based tool — no uploads, no tracking.`

  return (
    <>
      <Helmet>
        <title>{tool.name} — iLikePDF</title>
        <meta name="description" content={description} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${tool.name} — iLikePDF`} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        <meta property="og:site_name" content="iLikePDF" />
        <meta property="og:image" content={`${HOSTNAME}/og-image.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${tool.name} — iLikePDF`} />
        <meta name="twitter:description" content={description} />
      </Helmet>
      <ToolShell tool={tool}>
        <Suspense fallback={<div className="grid place-items-center py-16"><Spinner className="h-7 w-7 text-brand-500" /></div>}>
          <Comp />
        </Suspense>
      </ToolShell>
    </>
  )
}
