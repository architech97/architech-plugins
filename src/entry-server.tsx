import { renderToString } from 'react-dom/server'
import { StrictMode } from 'react'
import { StaticRouter } from 'react-router-dom/server'
import { App } from './App'

/** `url` includes the site base, for example `/automation/plugins/sheet-export/`. */
export function render(url: string) {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '')
  return renderToString(
    <StrictMode>
      <StaticRouter location={url} basename={basename}>
        <App />
      </StaticRouter>
    </StrictMode>,
  )
}
