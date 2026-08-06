import { useMemo, useState } from 'react'
import { AppShell } from '../components/AppShell'
import { AirportPicker } from '../components/flight/AirportPicker'
import { useFlightScans } from '../hooks/useFlightScans'
import {
  buildFlightLinks,
  describeScan,
  isValidScanQuery,
} from '../lib/flightLinks'
import type { CabinClass, FlightScanQuery, TripType } from '../types/flight'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function plusDaysISO(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const EMPTY: FlightScanQuery = {
  origin: 'ICN',
  destination: 'BKK',
  departDate: plusDaysISO(14),
  returnDate: plusDaysISO(21),
  tripType: 'round',
  cabin: 'economy',
  adults: 1,
}

export function FlightScanPage() {
  const { pinned, recent, addScan, togglePin, removeScan, clearHistory } =
    useFlightScans()
  const [form, setForm] = useState<FlightScanQuery>(EMPTY)
  const [error, setError] = useState('')
  const [active, setActive] = useState<FlightScanQuery | null>(null)

  const links = useMemo(
    () => (active ? buildFlightLinks(active) : []),
    [active],
  )

  function set<K extends keyof FlightScanQuery>(key: K, value: FlightScanQuery[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function swapAirports() {
    setForm((prev) => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin,
    }))
  }

  function runScan(q: FlightScanQuery = form) {
    const err = isValidScanQuery(q)
    if (err) {
      setError(err)
      setActive(null)
      return
    }
    setError('')
    const record = addScan(q)
    setActive({
      origin: record.origin,
      destination: record.destination,
      departDate: record.departDate,
      returnDate: record.returnDate,
      tripType: record.tripType,
      cabin: record.cabin,
      adults: record.adults,
    })
  }

  function loadScan(q: FlightScanQuery) {
    setForm({
      origin: q.origin,
      destination: q.destination,
      departDate: q.departDate || todayISO(),
      returnDate: q.returnDate || plusDaysISO(7),
      tripType: q.tripType,
      cabin: q.cabin,
      adults: q.adults,
    })
    runScan(q)
  }

  const metaLinks = links.filter((l) => l.kind === 'meta')
  const airlineLinks = links.filter((l) => l.kind === 'airline')

  return (
    <AppShell statusLabel="FLIGHT SCAN">
      <main className="page-main">
        <div className="container">
          <header className="page-header">
            <div>
              <p className="section-code">// MODULE 03 · FLIGHT SCAN</p>
              <h1 className="page-title glow-text">항공편 스캔</h1>
              <p className="page-desc">
                노선을 구성하면 Google Flights·스카이스캐너·항공사로 바로 검색합니다.
                요금은 외부 사이트에서 확인하고, 검색 기록은 이 기기에 저장됩니다.
              </p>
            </div>
          </header>

          <div className="stats-row">
            <div className="stat-chip hud-panel">
              <span className="stat-chip-label">PINNED</span>
              <span className="stat-chip-value">{pinned.length}</span>
            </div>
            <div className="stat-chip hud-panel">
              <span className="stat-chip-label">HISTORY</span>
              <span className="stat-chip-value">{recent.length}</span>
            </div>
            <div className="stat-chip hud-panel">
              <span className="stat-chip-label">FEED</span>
              <span className="stat-chip-value" style={{ fontSize: '0.95rem' }}>
                LIVE LINK
              </span>
            </div>
          </div>

          <div className="flight-layout">
            <section className="hud-panel flight-scan-panel">
              <span className="hud-corner tl" />
              <span className="hud-corner tr" />
              <span className="hud-corner bl" />
              <span className="hud-corner br" />

              <p className="mini-panel-title">SCAN QUERY</p>

              <div className="flight-trip-toggle" role="group" aria-label="여정 유형">
                <button
                  type="button"
                  className={`filter-chip${form.tripType === 'round' ? ' active' : ''}`}
                  onClick={() => set('tripType', 'round' as TripType)}
                >
                  왕복
                </button>
                <button
                  type="button"
                  className={`filter-chip${form.tripType === 'oneway' ? ' active' : ''}`}
                  onClick={() => set('tripType', 'oneway' as TripType)}
                >
                  편도
                </button>
              </div>

              <div className="flight-airports">
                <AirportPicker
                  label="출발"
                  value={form.origin}
                  exclude={form.destination}
                  onChange={(code) => set('origin', code)}
                />
                <button
                  type="button"
                  className="btn-ghost flight-swap"
                  onClick={swapAirports}
                  aria-label="출발·도착 바꾸기"
                >
                  ⇄
                </button>
                <AirportPicker
                  label="도착"
                  value={form.destination}
                  exclude={form.origin}
                  onChange={(code) => set('destination', code)}
                />
              </div>

              <div className="field-row">
                <label className="field">
                  <span className="field-label">출발일</span>
                  <input
                    type="date"
                    value={form.departDate}
                    min={todayISO()}
                    onChange={(e) => set('departDate', e.target.value)}
                  />
                </label>
                {form.tripType === 'round' && (
                  <label className="field">
                    <span className="field-label">귀국일</span>
                    <input
                      type="date"
                      value={form.returnDate}
                      min={form.departDate || todayISO()}
                      onChange={(e) => set('returnDate', e.target.value)}
                    />
                  </label>
                )}
              </div>

              <div className="field-row">
                <label className="field">
                  <span className="field-label">좌석</span>
                  <select
                    value={form.cabin}
                    onChange={(e) => set('cabin', e.target.value as CabinClass)}
                  >
                    <option value="economy">이코노미</option>
                    <option value="premium">프리미엄 이코노미</option>
                    <option value="business">비즈니스</option>
                    <option value="first">일등석</option>
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">인원</span>
                  <input
                    type="number"
                    min={1}
                    max={9}
                    value={form.adults}
                    onChange={(e) => set('adults', Number(e.target.value) || 1)}
                  />
                </label>
              </div>

              {error && <p className="form-error">{error}</p>}

              <button type="button" className="btn-primary flight-scan-btn" onClick={() => runScan()}>
                SCAN ROUTES
              </button>
            </section>

            <aside className="hud-panel flight-results-panel">
              <span className="hud-corner tl" />
              <span className="hud-corner tr" />
              <span className="hud-corner bl" />
              <span className="hud-corner br" />

              {active ? (
                <>
                  <p className="mini-panel-title">TARGET ROUTES</p>
                  <h2 className="flight-active-title glow-text">
                    {describeScan(active)}
                  </h2>
                  <p className="page-desc" style={{ marginBottom: '1rem' }}>
                    아래 링크로 실시간 요금·스케줄을 확인하세요.
                  </p>

                  <p className="field-label">META SEARCH</p>
                  <div className="flight-link-grid">
                    {metaLinks.map((l) => (
                      <a
                        key={l.id}
                        className="btn-primary flight-link-card"
                        href={l.href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span>{l.labelKo}</span>
                        <span className="font-mono">{l.label}</span>
                      </a>
                    ))}
                  </div>

                  <p className="field-label" style={{ marginTop: '1.25rem' }}>
                    AIRLINES
                  </p>
                  <div className="flight-link-grid airlines">
                    {airlineLinks.map((l) => (
                      <a
                        key={l.id}
                        className="btn-ghost flight-link-card"
                        href={l.href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span>{l.labelKo}</span>
                        <span className="font-mono">{l.label}</span>
                      </a>
                    ))}
                  </div>
                </>
              ) : (
                <div className="empty-state" style={{ border: 'none', padding: '2rem 0' }}>
                  <p className="section-code">// AWAITING SCAN</p>
                  <p>출발·도착·날짜를 설정한 뒤 SCAN ROUTES를 누르세요.</p>
                </div>
              )}
            </aside>
          </div>

          <section className="flight-history">
            <div className="flight-history-head">
              <p className="mini-panel-title" style={{ marginBottom: 0 }}>
                SCAN MEMORY
              </p>
              {recent.length > 0 && (
                <button type="button" className="btn-ghost" onClick={clearHistory}>
                  Clear History
                </button>
              )}
            </div>

            {pinned.length === 0 && recent.length === 0 ? (
              <div className="empty-state hud-panel">
                <p className="section-code">// NO SCANS</p>
                <p>스캔한 노선이 여기에 저장됩니다. 핀으로 즐겨찾기를 남겨두세요.</p>
              </div>
            ) : (
              <div className="flight-history-lists">
                {pinned.length > 0 && (
                  <div>
                    <p className="field-label">PINNED</p>
                    <ul className="flight-history-list">
                      {pinned.map((s) => (
                        <li key={s.id} className="hud-panel flight-history-item">
                          <button
                            type="button"
                            className="flight-history-main"
                            onClick={() => loadScan(s)}
                          >
                            <strong>
                              {s.origin} → {s.destination}
                            </strong>
                            <span>
                              {s.departDate}
                              {s.tripType === 'round' && s.returnDate
                                ? ` / ${s.returnDate}`
                                : ' · 편도'}
                            </span>
                          </button>
                          <div className="flight-history-actions">
                            <button type="button" className="btn-ghost" onClick={() => togglePin(s.id)}>
                              Unpin
                            </button>
                            <button
                              type="button"
                              className="btn-danger"
                              onClick={() => removeScan(s.id)}
                            >
                              Del
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {recent.length > 0 && (
                  <div>
                    <p className="field-label">RECENT</p>
                    <ul className="flight-history-list">
                      {recent.map((s) => (
                        <li key={s.id} className="hud-panel flight-history-item">
                          <button
                            type="button"
                            className="flight-history-main"
                            onClick={() => loadScan(s)}
                          >
                            <strong>
                              {s.origin} → {s.destination}
                            </strong>
                            <span>
                              {s.originLabel} → {s.destinationLabel}
                              {' · '}
                              {s.departDate}
                              {s.tripType === 'round' && s.returnDate
                                ? ` / ${s.returnDate}`
                                : ''}
                            </span>
                          </button>
                          <div className="flight-history-actions">
                            <button type="button" className="btn-ghost" onClick={() => togglePin(s.id)}>
                              Pin
                            </button>
                            <button
                              type="button"
                              className="btn-danger"
                              onClick={() => removeScan(s.id)}
                            >
                              Del
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </AppShell>
  )
}
