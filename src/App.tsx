import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { MotionConfig } from 'framer-motion'
import { Layout } from './components/Layout'
import { Spinner } from './components/ui'

const Home = lazy(() => import('./pages/Home'))
const Category = lazy(() => import('./pages/Category'))
const ToolPage = lazy(() => import('./pages/ToolPage'))
const StaticPage = lazy(() => import('./pages/StaticPages'))
const NotFound = lazy(() => import('./pages/NotFound'))

function Loading() {
  return (
    <div className="grid place-items-center min-h-[60vh]">
      <Spinner className="h-8 w-8 text-brand-500" />
    </div>
  )
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <HelmetProvider>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="/category/:cat" element={<Category />} />
              <Route path="/tool/:slug" element={<ToolPage />} />
              <Route path="/about" element={<StaticPage page="about" />} />
              <Route path="/privacy" element={<StaticPage page="privacy" />} />
              <Route path="/terms" element={<StaticPage page="terms" />} />
              <Route path="/contact" element={<StaticPage page="contact" />} />
              <Route path="/faq" element={<StaticPage page="faq" />} />
              <Route path="/changelog" element={<StaticPage page="changelog" />} />
              <Route path="/release-notes" element={<StaticPage page="changelog" />} />
              <Route path="/shortcuts" element={<StaticPage page="shortcuts" />} />
              <Route path="/accessibility" element={<StaticPage page="accessibility" />} />
              <Route path="/offline-guide" element={<StaticPage page="offline" />} />
              <Route path="/pwa-install" element={<StaticPage page="pwa" />} />
              <Route path="/licenses" element={<StaticPage page="licenses" />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </HelmetProvider>
    </MotionConfig>
  )
}
