import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/chrome.css'
import './styles/site.css'
import './styles/motion.css'
import './styles/continuity.css'
import './styles/refine.css'
import './styles/pill.css'
import { App } from './App'

// GitHub Pages serves 404.html for deep links; it stores the path and redirects here.
const redirect = sessionStorage.getItem('spa-redirect')
if (redirect) { sessionStorage.removeItem('spa-redirect'); history.replaceState(null, '', redirect) }

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')
const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Missing #root')

const tree = (
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>
)

if (rootEl.childElementCount > 0) hydrateRoot(rootEl, tree)
else createRoot(rootEl).render(tree)
