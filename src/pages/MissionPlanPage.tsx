import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { MissionFormModal } from '../components/mission/MissionFormModal'
import { flagEmoji, getCountry } from '../data/countries'
import { useMissions } from '../hooks/useMissions'
import {
  budgetRemaining,
  calcMissionDays,
  missionSpent,
} from '../lib/missionStorage'
import type { Mission, MissionFormData, MissionStatus } from '../types/mission'
import { statusLabel } from '../types/mission'

function formatMoney(n: number, currency: string) {
  return `${n.toLocaleString('ko-KR')} ${currency}`
}

export function MissionPlanPage() {
  const { missions, stats, addMission, deleteMission } = useMissions()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<MissionStatus | 'All'>('All')
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return missions.filter((m) => {
      if (status !== 'All' && m.status !== status) return false
      if (!q) return true
      const country = getCountry(m.countryCode)
      return (
        m.title.toLowerCase().includes(q) ||
        m.cities.some((c) => c.includes(query.trim()) || c.toLowerCase().includes(q)) ||
        m.countryCode.toLowerCase().includes(q) ||
        (country?.nameKo.includes(query.trim()) ?? false) ||
        (country?.nameEn.toLowerCase().includes(q) ?? false)
      )
    })
  }, [missions, query, status])

  function handleCreate(data: MissionFormData) {
    addMission(data)
  }

  function handleDelete(m: Mission) {
    if (window.confirm(`「${m.title}」 미션을 삭제할까요?`)) {
      deleteMission(m.id)
    }
  }

  return (
    <AppShell statusLabel="MISSION">
      <main className="page-main">
        <div className="container">
          <header className="page-header">
            <div>
              <p className="section-code">// MODULE 02 · MISSION PLAN</p>
              <h1 className="page-title glow-text">여행 미션 계획</h1>
              <p className="page-desc">
                일정·동선·예산을 미션 단위로 설계합니다. 데이터는 이 기기에 저장됩니다.
              </p>
            </div>
            <button type="button" className="btn-primary" onClick={() => setModalOpen(true)}>
              + New Mission
            </button>
          </header>

          <div className="stats-row">
            <div className="stat-chip hud-panel">
              <span className="stat-chip-label">MISSIONS</span>
              <span className="stat-chip-value">{stats.total}</span>
            </div>
            <div className="stat-chip hud-panel">
              <span className="stat-chip-label">ACTIVE</span>
              <span className="stat-chip-value">{stats.active}</span>
            </div>
            <div className="stat-chip hud-panel">
              <span className="stat-chip-label">DRAFT</span>
              <span className="stat-chip-value">{stats.draft}</span>
            </div>
            <div className="stat-chip hud-panel">
              <span className="stat-chip-label">BUDGET Σ</span>
              <span className="stat-chip-value" style={{ fontSize: '0.95rem' }}>
                {stats.budget.toLocaleString('ko-KR')}
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
                placeholder="미션명, 국가, 도시..."
              />
            </label>
            <div className="region-filters">
              {(['All', 'draft', 'active', 'done'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`filter-chip${status === s ? ' active' : ''}`}
                  onClick={() => setStatus(s)}
                >
                  {s === 'All' ? 'All' : statusLabel(s)}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state hud-panel">
              <p className="section-code">// NO MISSIONS</p>
              <p>새 미션을 만들어 일정과 예산을 구성하세요.</p>
              <button type="button" className="btn-primary" onClick={() => setModalOpen(true)}>
                미션 생성
              </button>
            </div>
          ) : (
            <div className="mission-grid">
              {filtered.map((m) => {
                const country = getCountry(m.countryCode)
                const spent = missionSpent(m)
                const remain = budgetRemaining(m)
                const days = calcMissionDays(m.startDate, m.endDate)
                const pct =
                  m.budgetTotal > 0
                    ? Math.min(100, Math.round((spent / m.budgetTotal) * 100))
                    : 0

                return (
                  <article key={m.id} className="hud-panel mission-card">
                    <span className="hud-corner tl" />
                    <span className="hud-corner tr" />
                    <span className="hud-corner bl" />
                    <span className="hud-corner br" />

                    <div className="mission-card-top">
                      <span className={`mission-status status-${m.status}`}>
                        {statusLabel(m.status)}
                      </span>
                      <span className="font-mono mission-card-meta">
                        {flagEmoji(m.countryCode)} {country?.nameKo ?? m.countryCode}
                      </span>
                    </div>

                    <h2 className="mission-card-title">
                      <Link to={`/missions/${m.id}`}>{m.title}</Link>
                    </h2>

                    <p className="mission-card-sub font-mono">
                      {m.startDate} → {m.endDate} · {days}D · {m.days.length} routes
                    </p>

                    {m.cities.length > 0 && (
                      <p className="mission-card-cities">{m.cities.join(' · ')}</p>
                    )}

                    <div className="mission-budget-bar" aria-hidden>
                      <span style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mission-budget-text font-mono">
                      {formatMoney(spent, m.currency)} / {formatMoney(m.budgetTotal, m.currency)}
                      <span> · 잔여 {formatMoney(remain, m.currency)}</span>
                    </p>

                    <div className="visit-actions" style={{ marginTop: '0.85rem' }}>
                      <Link className="btn-primary" to={`/missions/${m.id}`}>
                        Open
                      </Link>
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={() => handleDelete(m)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <MissionFormModal
        open={modalOpen}
        mode="create"
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </AppShell>
  )
}
