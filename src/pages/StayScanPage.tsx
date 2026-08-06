import { useMemo, useState } from 'react'
import { AppShell } from '../components/AppShell'
import { DestinationPicker } from '../components/stay/DestinationPicker'
import { useStayScans } from '../hooks/useStayScans'
import {
  buildStayLinks,
  describeStayScan,
  isValidStayQuery,
} from '../lib/stayLinks'
import type { StayScanQuery, StayType } from '../types/stay'
import { STAY_TYPES } from '../types/stay'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function plusDaysISO(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const EMPTY: StayScanQuery = {
  destination: '방콕',
  destinationEn: 'Bangkok',
  checkIn: plusDaysISO(14),
  checkOut: plusDaysISO(17),
  adults: 2,
  rooms: 1,
  stayType: 'any',
}

export function StayScanPage() {
  const { pinned, recent, addScan, togglePin, removeScan, clearHistory } =
    useStayScans()
  const [form, setForm] = useState<StayScanQuery>(EMPTY)
  const [error, setError] = useState('')
  const [active, setActive] = useState<StayScanQuery | null>(null)

  const links = useMemo(
    () => (active ? buildStayLinks(active) : []),
    [active],
  )

  function set<K extends keyof StayScanQuery>(key: K, value: StayScanQuery[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function runScan(q: StayScanQuery = form) {
    const err = isValidStayQuery(q)
    if (err) {
      setError(err)
      setActive(null)
      return
    }
    setError('')
    const record = addScan(q)
    setActive({
      destination: record.destination,
      destinationEn: record.destinationEn,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      adults: record.adults,
      rooms: record.rooms,
      stayType: record.stayType,
    })
  }

  function loadScan(q: StayScanQuery) {
    setForm({ ...q })
    runScan(q)
  }

  const metaLinks = links.filter((l) => l.kind === 'meta')
  const otaLinks = links.filter((l) => l.kind === 'ota')

  return (
    <AppShell statusLabel="STAY SCAN">
      <main className="page-main">
        <div className="container">
          <header className="page-header">
            <div>
              <p className="section-code">// MODULE 06 · STAY SCAN</p>
              <h1 className="page-title glow-text">숙소 스캔</h1>
              <p className="page-desc">
                목적지와 일정을 입력하면 Google Hotels·부킹닷컴·아고다 등으로 바로 검색합니다.
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

              <div className="flight-trip-toggle" role="group" aria-label="숙소 유형">
                {STAY_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    className={`filter-chip${form.stayType === t.value ? ' active' : ''}`}
                    onClick={() => set('stayType', t.value as StayType)}
                  >
                    {t.labelKo}
                  </button>
                ))}
              </div>

              <DestinationPicker
                label="목적지"
                value={form.destination}
                valueEn={form.destinationEn}
                onChange={(ko, en) => {
                  setForm((prev) => ({
                    ...prev,
                    destination: ko,
                    destinationEn: en,
                  }))
                }}
              />

              <div className="field-row">
                <label className="field">
                  <span className="field-label">체크인</span>
                  <input
                    type="date"
                    value={form.checkIn}
                    min={todayISO()}
                    onChange={(e) => set('checkIn', e.target.value)}
                  />
                </label>
                <label className="field">
                  <span className="field-label">체크아웃</span>
                  <input
                    type="date"
                    value={form.checkOut}
                    min={form.checkIn || todayISO()}
                    onChange={(e) => set('checkOut', e.target.value)}
                  />
                </label>
              </div>

              <div className="field-row">
                <label className="field">
                  <span className="field-label">성인</span>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={form.adults}
                    onChange={(e) => set('adults', Number(e.target.value) || 1)}
                  />
                </label>
                <label className="field">
                  <span className="field-label">객실</span>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={form.rooms}
                    onChange={(e) => set('rooms', Number(e.target.value) || 1)}
                  />
                </label>
              </div>

              {error && <p className="form-error">{error}</p>}

              <button
                type="button"
                className="btn-primary flight-scan-btn"
                onClick={() => runScan()}
              >
                SCAN STAYS
              </button>
            </section>

            <aside className="hud-panel flight-results-panel">
              <span className="hud-corner tl" />
              <span className="hud-corner tr" />
              <span className="hud-corner bl" />
              <span className="hud-corner br" />

              {active ? (
                <>
                  <p className="mini-panel-title">TARGET STAYS</p>
                  <h2 className="flight-active-title glow-text">
                    {describeStayScan(active)}
                  </h2>
                  <p className="page-desc" style={{ marginBottom: '1rem' }}>
                    아래 링크로 실시간 요금·공실을 확인하세요.
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
                    OTA
                  </p>
                  <div className="flight-link-grid airlines">
                    {otaLinks.map((l) => (
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
                  <p>목적지·일정을 설정한 뒤 SCAN STAYS를 누르세요.</p>
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
                <p>스캔한 숙소 조건이 여기에 저장됩니다. 핀으로 즐겨찾기를 남겨두세요.</p>
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
                            <strong>{s.destination}</strong>
                            <span>
                              {s.checkIn} → {s.checkOut} · 성인 {s.adults} · 객실 {s.rooms}
                            </span>
                          </button>
                          <div className="flight-history-actions">
                            <button
                              type="button"
                              className="btn-ghost"
                              onClick={() => togglePin(s.id)}
                            >
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
                              {s.destination}
                              {s.destinationEn && s.destinationEn !== s.destination
                                ? ` · ${s.destinationEn}`
                                : ''}
                            </strong>
                            <span>
                              {s.checkIn} → {s.checkOut} · 성인 {s.adults} · 객실 {s.rooms}
                            </span>
                          </button>
                          <div className="flight-history-actions">
                            <button
                              type="button"
                              className="btn-ghost"
                              onClick={() => togglePin(s.id)}
                            >
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
