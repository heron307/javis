import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { VisitFormModal } from '../components/travel/VisitFormModal'
import { REGIONS, flagEmoji } from '../data/countries'
import { useTravelLogs } from '../hooks/useTravelLogs'
import type { VisitFormData } from '../types/travel'

export function TravelLogPage() {
  const { summaries, visitedSummaries, stats, addVisit } = useTravelLogs()
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState<(typeof REGIONS)[number]>('All')
  const [showVisitedOnly, setShowVisitedOnly] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return summaries.filter((c) => {
      if (showVisitedOnly && c.visitCount === 0) return false
      if (region !== 'All' && c.region !== region) return false
      if (!q) return true
      return (
        c.nameKo.includes(query.trim()) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.capital.toLowerCase().includes(q)
      )
    })
  }, [summaries, query, region, showVisitedOnly])

  function handleCreate(data: VisitFormData) {
    addVisit(data)
  }

  return (
    <AppShell statusLabel="LOG MODE">
      <main className="page-main">
        <div className="container">
          <header className="page-header">
            <div>
              <p className="section-code">// MODULE 01 · TRAVEL LOG</p>
              <h1 className="page-title glow-text">국가별 여행 기록</h1>
              <p className="page-desc">
                방문한 국가와 여행 히스토리를 조회·관리합니다. 기록은 브라우저에 저장됩니다.
              </p>
            </div>
            <button type="button" className="btn-primary" onClick={() => setModalOpen(true)}>
              + New Record
            </button>
          </header>

          <div className="stats-row">
            <div className="stat-chip hud-panel">
              <span className="stat-chip-label">COUNTRIES</span>
              <span className="stat-chip-value">{stats.countries}</span>
            </div>
            <div className="stat-chip hud-panel">
              <span className="stat-chip-label">TRIPS</span>
              <span className="stat-chip-value">{stats.trips}</span>
            </div>
            <div className="stat-chip hud-panel">
              <span className="stat-chip-label">TOTAL DAYS</span>
              <span className="stat-chip-value">{stats.days}</span>
            </div>
            <div className="stat-chip hud-panel">
              <span className="stat-chip-label">LAST SYNC</span>
              <span className="stat-chip-value" style={{ fontSize: '0.95rem' }}>
                LOCAL
              </span>
            </div>
          </div>

          <div className="log-toolbar">
            <label className="search-field">
              <span className="field-label">SEARCH</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="국가명, 코드, 수도..."
              />
            </label>

            <div className="region-filters">
              {REGIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`filter-chip${region === r ? ' active' : ''}`}
                  onClick={() => setRegion(r)}
                >
                  {r}
                </button>
              ))}
            </div>

            <label className="toggle-visited">
              <input
                type="checkbox"
                checked={showVisitedOnly}
                onChange={(e) => setShowVisitedOnly(e.target.checked)}
              />
              <span>방문 국가만</span>
            </label>
          </div>

          {visitedSummaries.length > 0 && (
            <section className="visited-strip">
              <p className="mini-panel-title">Visited Nodes · {visitedSummaries.length}</p>
              <div className="visited-nodes">
                {visitedSummaries.map((c) => (
                  <Link key={c.code} to={`/logs/${c.code}`} className="visited-node">
                    <span className="visited-flag">{flagEmoji(c.code)}</span>
                    <span className="visited-name">{c.nameKo}</span>
                    <span className="visited-count">{c.visitCount}x</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="country-grid">
            {filtered.map((c) => (
              <Link
                key={c.code}
                to={`/logs/${c.code}`}
                className={`country-card hud-panel${c.visitCount > 0 ? ' visited' : ''}`}
              >
                <span className="hud-corner tl" />
                <span className="hud-corner tr" />
                <span className="hud-corner bl" />
                <span className="hud-corner br" />

                <div className="country-card-top">
                  <span className="country-flag">{flagEmoji(c.code)}</span>
                  <span className="country-code font-mono">{c.code}</span>
                </div>

                <h2 className="country-name">{c.nameKo}</h2>
                <p className="country-en">{c.nameEn}</p>

                <div className="country-meta">
                  <span>{c.region}</span>
                  <span>{c.capital}</span>
                </div>

                <div className="country-stats">
                  {c.visitCount > 0 ? (
                    <>
                      <span>
                        <strong>{c.visitCount}</strong> trips
                      </span>
                      <span>
                        <strong>{c.totalDays}</strong> days
                      </span>
                      {c.avgRating != null && (
                        <span>
                          ★ <strong>{c.avgRating}</strong>
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="not-visited">NO LOG</span>
                  )}
                </div>
              </Link>
            ))}
          </section>

          {filtered.length === 0 && (
            <div className="empty-state hud-panel">
              <p className="section-code">// NO MATCH</p>
              <p>검색 조건에 해당하는 국가가 없습니다.</p>
            </div>
          )}
        </div>
      </main>

      <VisitFormModal
        open={modalOpen}
        mode="create"
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </AppShell>
  )
}
