import { useRef, useState, type KeyboardEvent } from 'react'
import { ArrowRight, Search, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { asset } from '../../components/Brand'
import { productBySlug } from '../../data/catalog'
import { DEMO_PROJECT } from '../../data/demoProject'
import { SUITE_HOME, type LauncherSuite } from '../suiteHomeCatalog'
import type { DemoContext } from '../types'
import './suiteHome.css'

const GLYPHS: Record<string, string> = {
  Views: 'M2,3 H18 V17 H2 Z M2,8 H18 M8,8 V17',
  'View Templates': 'M2,6 L10,2 18,6 10,10 Z M2,10 L10,14 18,10 M2,14 L10,18 18,14',
  Annotation: 'M3,4 H17 M10,4 V17 M6,17 H14 M3,4 V7 M17,4 V7',
  Detailing: 'M3,17 V3 H17 Z M7,13 V7 H13 Z',
  Schedules: 'M2,3 H18 V17 H2 Z M2,8 H18 M2,12.5 H18 M8,8 V17',
  Sheets: 'M4,2 H12 L17,7 V18 H4 Z M12,2 V7 H17 M7,11 H14 M7,14 H14',
  Publish: 'M10,13 V2 M6,6 L10,2 14,6 M3,11 V18 H17 V11',
  Rooms: 'M2,17 V3 H18 V17 H13 M2,17 H7 V11 A6,6 0 0 1 13,17',
  Finishes: 'M2,6 L10,2 18,6 10,10 Z M2,10 L10,14 18,10 M2,14 L10,18 18,14',
  Parameters: 'M3,5 H17 M7,3 V7 M3,10 H17 M13,8 V12 M3,15 H17 M9,13 V17',
  'Scan to BIM': 'M2,7 V2 H7 M13,2 H18 V7 M18,13 V18 H13 M7,18 H2 V13 M6,10 H7 M9,6 H10 M11,13 H12 M14,9 H15',
  'Model Health': 'M2,10 H6 L8,4 12,16 14,10 H18',
  Coordination: 'M10,2 L18,6 V14 L10,18 2,14 V6 Z M2,6 L10,10 18,6 M10,10 V18',
  Links: 'M8,6 L11,3 16,3 18,5 V9 L15,12 M12,14 L9,17 H4 L2,15 V11 L5,8 M6,14 L14,6',
  Standards: 'M4,2 H16 V18 H4 Z M7,7 L9,9 13,5 M7,13 H13 M7,15 H13',
  'Clean Up': 'M3,5 H17 M7,5 V3 H13 V5 M5,5 L6,17 H14 L15,5 M8,8 V14 M12,8 V14',
}

const SCENARIOS = {
  project: 'Sample project',
  noModel: 'No active model',
  blocked: 'Ribbon command unavailable',
} as const
type Scenario = keyof typeof SCENARIOS

function PanelGlyph({ panel }: { panel: string }) {
  return <span className="suite-home-glyph"><svg viewBox="0 0 20 20" aria-hidden="true"><path d={GLYPHS[panel]} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" /></svg></span>
}

export function makeSuiteHome(suite: LauncherSuite) {
  const definition = SUITE_HOME[suite]
  const tools = definition.panels.flatMap(({ label, tools: entries }) => entries.map((tool) => ({ ...tool, panel: label })))
  return function SuiteHome({ theme, setTheme, done, rewind, notify, close }: DemoContext) {
    const [category, setCategory] = useState('')
    const [query, setQuery] = useState('')
    const [selectedSlug, setSelectedSlug] = useState('')
    const [scenario, setScenario] = useState<Scenario>('project')
    const [opened, setOpened] = useState('')
    const search = useRef<HTMLInputElement>(null)
    const rows = useRef<Map<string, HTMLButtonElement>>(new Map())
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
    const matches = tools.filter((tool) => (!category || tool.panel === category) &&
      words.every((word) => [tool.name, tool.description, tool.panel, tool.keywords].some((text) => text.toLowerCase().includes(word))))
    const selected = matches.find((tool) => tool.slug === selectedSlug) ?? matches[0]
    const selectedProduct = selected && productBySlug(selected.slug)
    const reason = (slug: string) => {
      if (scenario === 'noModel') return 'Open a Revit model'
      if (scenario === 'blocked') return 'Revit cannot open this ribbon command right now'
      if (slug === 'text-tag-align') return 'Needs a different view or selection'
      return ''
    }
    const unavailable = selected ? reason(selected.slug) : ''
    const clearOpen = () => {
      if (opened) { setOpened(''); rewind('open') }
    }
    const filter = (panel: string) => {
      clearOpen()
      setCategory(panel)
      if (panel) done('browse')
    }
    const changeQuery = (value: string) => {
      clearOpen()
      setQuery(value)
      if (value.trim()) done('search')
    }
    const clearSearch = () => { changeQuery(''); search.current?.focus() }
    const choose = (slug: string) => { clearOpen(); setSelectedSlug(slug); done('select') }
    const open = () => {
      if (!selected || !selectedProduct || unavailable) return
      setOpened(selected.slug)
      done('open')
      notify({ kind: 'success', text: selected.name + ' is ready in the browser.' })
    }
    const focusResult = (index: number) => {
      const tool = matches[index]
      if (tool) { choose(tool.slug); rows.current.get(tool.slug)?.focus() }
    }
    const keyDown = (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        if (query) clearSearch(); else close()
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        search.current?.focus()
        search.current?.select()
      }
    }
    return (
      <div className="suite-home" data-suite={suite} data-theme={theme} onKeyDown={keyDown}>
        <label className="suite-home-scenario">
          <span>Browser sample context</span>
          <select value={scenario} onChange={(event) => { clearOpen(); setScenario(event.target.value as Scenario) }}>
            {Object.entries(SCENARIOS).map(([key, name]) => <option value={key} key={key}>{name}</option>)}
          </select>
        </label>
        <section className="suite-home-window" aria-label={definition.title + ' browser simulation'}>
          <header className="suite-home-header">
            <img alt="ArchiTECH" src={asset(theme === 'dark' ? 'media/brand/architech-logo-dark-ui.webp' : 'media/brand/architech-logo-light-ui.webp')} />
            <div><h3>{definition.title}</h3><p>{definition.subtitle}</p></div>
            <label><span className="sr-only">Dialog theme</span><select value={theme} onChange={(event) => setTheme(event.target.value === 'light' ? 'light' : 'dark')}><option value="dark">Dark</option><option value="light">Light</option></select></label>
            <button type="button" className="suite-home-close" aria-label={'Close ' + definition.title} onClick={close}><X size={16} /></button>
          </header>
          <div className="suite-home-workspace">
            <nav className="suite-home-rail" aria-label="Ribbon categories">
              <span className="suite-home-caption">Browse</span>
              <button type="button" aria-pressed={!category} onClick={() => filter('')}>All tools <span>{tools.length}</span></button>
              {definition.panels.map((panel) => <button type="button" key={panel.label} aria-pressed={category === panel.label} data-demo={panel.label === definition.examplePanel ? 'suite-home-category' : undefined} onClick={() => filter(panel.label)}>{panel.label} <span>{panel.tools.length}</span></button>)}
            </nav>
            <section className="suite-home-search-area" aria-label={definition.title + ' tool results'}>
              <div className="suite-home-search">
                <label><Search aria-hidden="true" size={16} /><input type="search" autoComplete="off" ref={search} data-demo="suite-home-search" aria-label={'Search ' + definition.title.replace(' Home', '') + ' tools'} placeholder={definition.placeholder} value={query}
                  onChange={(event) => changeQuery(event.target.value)} onKeyDown={(event) => {
                    if (event.key === 'ArrowDown' || event.key === 'Enter') {
                      event.preventDefault()
                      focusResult(Math.max(0, matches.findIndex((tool) => tool.slug === selected?.slug)))
                    }
                  }} /></label>
                <button type="button" disabled={!query} onClick={clearSearch}>Clear</button>
              </div>
              <div className="suite-home-result-heading">
                <h4>{words.length ? 'Search results' : category || 'All tools'}</h4>
                <span aria-live="polite">{matches.length === tools.length ? `${tools.length} tools` : `${matches.length} of ${tools.length} tools`}</span>
              </div>
              {matches.length > 0 ? (
                <ul className="suite-home-list">
                  {matches.map((tool, index) => {
                    const status = reason(tool.slug)
                    return <li key={tool.slug}>
                      <button type="button" aria-pressed={selected?.slug === tool.slug} data-demo={index === 0 ? 'suite-home-match' : undefined}
                        ref={(element) => { if (element) rows.current.set(tool.slug, element); else rows.current.delete(tool.slug) }}
                        onClick={() => choose(tool.slug)} onDoubleClick={open} onKeyDown={(event) => {
                          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                            event.preventDefault()
                            focusResult(Math.max(0, Math.min(matches.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1))))
                          }
                          if (event.key === 'Enter' && selected?.slug === tool.slug && !event.repeat) {
                            event.preventDefault()
                            choose(tool.slug)
                            open()
                          }
                        }}>
                        <PanelGlyph panel={tool.panel} />
                        <span className="suite-home-row-label"><strong>{tool.name}</strong><small>{tool.panel}</small></span>
                        <span className={'suite-home-status ' + (status ? 'is-unavailable' : 'is-ready')} aria-label={status || 'Ready to open'}>{status && <small>Unavailable</small>}<i /></span>
                      </button>
                    </li>
                  })}
                </ul>
              ) : (
                <div className="suite-home-empty">
                  <b>No matching tools</b>
                  <p>Try a different term or browse all tools.</p>
                  <button type="button" onClick={() => { filter(''); clearSearch() }}>Reset filters</button>
                </div>
              )}
            </section>
            <section className="suite-home-preview" aria-label="Tool preview">
              <div>
                <span className="suite-home-caption">Tool preview</span>
                {selected ? <>
                  <PanelGlyph panel={selected.panel} />
                  <small>{selected.panel}</small>
                  <h4>{selected.name}</h4>
                  <p>{selected.description}</p>
                  <p className={'suite-home-status ' + (unavailable ? 'is-unavailable' : 'is-ready')} role="status"><i />{unavailable || 'Ready to open in the sample context'}</p>
                </> : <p>Tool details appear here when your search finds a match.</p>}
              </div>
              <footer>
                <button type="button" className="suite-home-open" data-demo="suite-home-open" disabled={!selectedProduct || !!unavailable} aria-label={selected ? 'Open tool ' + selected.name : 'Open tool'} onClick={open}>Open tool</button>
              </footer>
            </section>
          </div>
          <footer className="suite-home-footer"><span>Arch {definition.title.replace(' Home', '')} by ArchiTECH · Revit 2024 simulation</span><span>{scenario === 'noModel' ? 'No active model' : 'Sample model: ' + DEMO_PROJECT.name}</span></footer>
        </section>
        {opened && selected?.slug === opened && selectedProduct && (
          <section className="suite-home-handoff" aria-label="Browser tool ready">
            <p role="status"><b>{selected.name} is ready.</b> The browser workflow opens with sample data.</p>
            <Link className="suite-home-open" to={'/demos/' + (selectedProduct.demo ?? selectedProduct.slug)}>Continue to {selected.name} <ArrowRight size={16} /></Link>
          </section>
        )}
      </div>
    )
  }
}
