import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { PlaceFormModal } from '../components/geo/PlaceFormModal'
import { REGIONS, flagEmoji } from '../data/countries'
import { useGeoIntel } from '../hooks/useGeoIntel'
import type { PlaceFormData } from '../types/geo'

export function GeoIntelPage() {
  const { countrySummaries, stats, addPlace } = useGeoIntel()
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState<(typeof REGIONS)[number]>('All')
  const [withDataOnly, setWithDataOnly] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return countrySummaries.filter((c) => {
      if (withDataOnly && c.placeCount === 0) return false
      if (region !== 'All' && c.region !== region) return false
      if (!q) return true
      return (
        c.nameKo.includes(query.trim()) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
      )
    })
  }, [countrySummaries, query, region, withDataOnly])

  const activeCountries = countrySummaries.filter((c) => c.placeCount > 0)

  return (
    <AppShell statusLabel="GEO MODE">
      <main className="page-main">
        <div className="container">
          <header className="page-header">
            <div>
              <p className="section-code">// MODULE 05 · GEO INTEL</p>
              <h1 className="page-title glow-text">현지 지리 인텔</h1>
              <p className="page-desc">
                국가·도시별 관광지·맛집·카페·숙소 정보를 조회·관리하고 Google Maps로 바로 확인합니다.
              </p>
            </div>
            <button type="button" className="btn-primary" onClick={() => setModalOpen(true)}>
              + New Place
            </button>
          </header>

          <div className="stats-row">
            <div className="stat-chip hud-panel">
              <span className="stat-chip-label">COUNTRIES</span>
              <span className="stat-chip-value">{stats.countries}</span>
            </div>
            <div className="stat-chip hud-panel">
              <span className="stat-chip-label">CITIES</span>
              <span className="stat-chip-value">{stats.cities}</span>
            </div>
            <div className="stat-chip hud-panel">
              <span className="stat-chip-label">PLACES</span>
              <span className="stat-chip-value">{stats.places}</span>
            </div>
            <div className="stat-chip hud-panel">
              <span className="stat-chip-label">MAPS</span>
              <span className="stat-chip-value" style={{ fontSize: '0.95rem' }}>
                LINKED
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
                placeholder="국가명, 코드..."
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
                checked={withDataOnly}
                onChange={(e) => setWithDataOnly(e.target.checked)}
              />
              <span>데이터 있는 국가만</span>
            </label>
          </div>

          {activeCountries.length > 0 && (
            <section className="visited-strip">
              <p className="mini-panel-title">Active Geo Nodes · {activeCountries.length}</p>
              <div className="visited-nodes">
                {activeCountries.map((c) => (
                  <Link key={c.code} to={`/geo/${c.code}`} className="visited-node">
                    <span className="visited-flag">{flagEmoji(c.code)}</span>
                    <span className="visited-name">{c.nameKo}</span>
                    <span className="visited-count">{c.placeCount}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="country-grid">
            {filtered.map((c) => (
              <Link
                key={c.code}
                to={`/geo/${c.code}`}
                className={`country-card hud-panel${c.placeCount > 0 ? ' visited' : ''}`}
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
                  {c.placeCount > 0 ? (
                    <>
                      <span>
                        <strong>{c.cityCount}</strong> cities
                      </span>
                      <span>
                        <strong>{c.placeCount}</strong> places
                      </span>
                    </>
                  ) : (
                    <span className="not-visited">NO INTEL</span>
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

      <PlaceFormModal
        open={modalOpen}
        mode="create"
        onClose={() => setModalOpen(false)}
        onSubmit={(data: PlaceFormData) => {
          const result = addPlace(data)
          if (!result.ok) {
            if (result.reason === 'duplicate') {
              window.alert(
                `이미 등록된 장소입니다: 「${result.existing?.name || data.name}」`,
              )
            }
            return false
          }
          return true
        }}
      />
    </AppShell>
  )
}
