import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { VisitFormModal } from '../components/travel/VisitFormModal'
import { flagEmoji, getCountry } from '../data/countries'
import { useTravelLogs } from '../hooks/useTravelLogs'
import {
  calcDays,
  formatBudget,
  formatDateRange,
  type StoredTravelVisit,
} from '../lib/travelStorage'
import type { VisitFormData } from '../types/travel'

export function CountryDetailPage() {
  const { code = '' } = useParams()
  const country = getCountry(code.toUpperCase())
  const { getVisitsByCountry, addVisit, updateVisit, deleteVisit, summaries } = useTravelLogs()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<StoredTravelVisit | null>(null)

  const visits = getVisitsByCountry(code.toUpperCase())
  const summary = useMemo(
    () => summaries.find((s) => s.code === code.toUpperCase()),
    [summaries, code],
  )

  if (!country) {
    return <Navigate to="/logs" replace />
  }

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(visit: StoredTravelVisit) {
    setEditing(visit)
    setModalOpen(true)
  }

  function handleSubmit(data: VisitFormData) {
    if (editing) {
      updateVisit(editing.id, data)
    } else {
      addVisit(data)
    }
  }

  function handleDelete(id: string, title: string) {
    if (window.confirm(`「${title}」 기록을 삭제할까요?`)) {
      deleteVisit(id)
    }
  }

  return (
    <AppShell statusLabel={`${country.code} LOG`}>
      <main className="page-main">
        <div className="container">
          <div className="breadcrumb font-mono">
            <Link to="/logs">TRAVEL LOG</Link>
            <span>/</span>
            <span>{country.code}</span>
          </div>

          <header className="page-header country-detail-header">
            <div className="country-detail-identity">
              <span className="country-detail-flag">{flagEmoji(country.code)}</span>
              <div>
                <p className="section-code">
                  // {country.region.toUpperCase()} · {country.currency}
                </p>
                <h1 className="page-title glow-text">{country.nameKo}</h1>
                <p className="page-desc">
                  {country.nameEn} · Capital {country.capital}
                </p>
              </div>
            </div>
            <button type="button" className="btn-primary" onClick={openCreate}>
              + Add Visit
            </button>
          </header>

          <div className="stats-row">
            <div className="stat-chip hud-panel">
              <span className="stat-chip-label">TRIPS</span>
              <span className="stat-chip-value">{summary?.visitCount ?? 0}</span>
            </div>
            <div className="stat-chip hud-panel">
              <span className="stat-chip-label">DAYS</span>
              <span className="stat-chip-value">{summary?.totalDays ?? 0}</span>
            </div>
            <div className="stat-chip hud-panel">
              <span className="stat-chip-label">AVG RATING</span>
              <span className="stat-chip-value">
                {summary?.avgRating != null ? summary.avgRating : '—'}
              </span>
            </div>
            <div className="stat-chip hud-panel">
              <span className="stat-chip-label">LAST VISIT</span>
              <span className="stat-chip-value" style={{ fontSize: '0.9rem' }}>
                {summary?.lastVisit?.replaceAll('-', '.') ?? '—'}
              </span>
            </div>
          </div>

          <section className="visit-list">
            <p className="mini-panel-title">Mission History · {visits.length}</p>

            {visits.length === 0 ? (
              <div className="empty-state hud-panel">
                <p className="section-code">// NO RECORDS</p>
                <p>아직 {country.nameKo} 여행 기록이 없습니다.</p>
                <button type="button" className="btn-primary" onClick={openCreate}>
                  첫 기록 추가
                </button>
              </div>
            ) : (
              <div className="visit-cards">
                {visits.map((v, i) => (
                  <article key={v.id} className="visit-card hud-panel">
                    <span className="hud-corner tl" />
                    <span className="hud-corner tr" />
                    <span className="hud-corner bl" />
                    <span className="hud-corner br" />

                    <div className="visit-card-head">
                      <span className="visit-index font-mono">
                        LOG.{String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="visit-rating">{'★'.repeat(v.rating)}{'☆'.repeat(5 - v.rating)}</span>
                    </div>

                    <h2 className="visit-title">{v.title}</h2>
                    <p className="visit-dates font-mono">
                      {formatDateRange(v.startDate, v.endDate)} · {calcDays(v.startDate, v.endDate)}일
                    </p>

                    {v.cities.length > 0 && (
                      <div className="feature-tags">
                        {v.cities.map((city) => (
                          <span key={city} className="feature-tag">
                            {city}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="visit-meta">
                      <span>동행 · {v.companions || '—'}</span>
                      <span>예산 · {formatBudget(v.budget)}</span>
                    </div>

                    {v.notes && <p className="visit-notes">{v.notes}</p>}

                    <div className="visit-actions">
                      <button type="button" className="btn-ghost" onClick={() => openEdit(v)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={() => handleDelete(v.id, v.title)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <VisitFormModal
        open={modalOpen}
        mode={editing ? 'edit' : 'create'}
        initial={editing}
        defaultCountryCode={country.code}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSubmit={handleSubmit}
      />
    </AppShell>
  )
}
