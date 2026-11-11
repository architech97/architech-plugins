import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './styles/site.css'
import { Layout } from './components/Layout'
import Home from './pages/Home'

const Catalog = lazy(() => import('./pages/Catalog'))
const Product = lazy(() => import('./pages/Product'))
const Demos = lazy(() => import('./pages/Demos'))
const Connect = lazy(() => import('./pages/Connect'))
const Coverage = lazy(() => import('./pages/Coverage'))

/** Old enquiry and pricing links keep working: they open Connect with their query intact. */
function ToConnect() {
  return <Navigate to={{ pathname: '/connect', search: useLocation().search }} replace />
}
const NotFound = lazy(() => import('./pages/NotFound'))

// GitHub Pages serves 404.html for deep links; it stores the path and redirects here.
const redirect = sessionStorage.getItem('spa-redirect')
if (redirect) { sessionStorage.removeItem('spa-redirect'); history.replaceState(null, '', redirect) }

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <Suspense fallback={<div style={{ minHeight: '60vh' }} />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="plugins" element={<Catalog />} />
            <Route path="plugins/:slug" element={<Product />} />
            <Route path="demos" element={<Demos />} />
            <Route path="demos/:id" element={<Demos />} />
            <Route path="connect" element={<Connect />} />
            <Route path="coverage" element={<Coverage />} />
            <Route path="pricing" element={<ToConnect />} />
            <Route path="custom-development" element={<ToConnect />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
)
