import { useEffect } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import Product from './pages/Product'
import Demos from './pages/Demos'
import Connect from './pages/Connect'
import Coverage from './pages/Coverage'
import NotFound from './pages/NotFound'

/** Old enquiry and pricing links keep their query and show the contact page immediately. */
function LegacyConnect() {
  const { search } = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    navigate({ pathname: '/connect', search }, { replace: true })
  }, [navigate, search])
  return <Connect />
}

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="plugins" element={<Catalog />} />
        <Route path="plugins/:slug" element={<Product />} />
        <Route path="demos" element={<Demos />} />
        <Route path="demos/:id" element={<Demos />} />
        <Route path="connect" element={<Connect />} />
        <Route path="coverage" element={<Coverage />} />
        <Route path="pricing" element={<LegacyConnect />} />
        <Route path="custom-development" element={<LegacyConnect />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
