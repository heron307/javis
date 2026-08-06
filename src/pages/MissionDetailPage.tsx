import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { DayFormModal } from '../components/mission/DayFormModal'
import { ExpenseFormModal } from '../components/mission/ExpenseFormModal'
import { MissionFormModal } from '../components/mission/MissionFormModal'
import { flagEmoji, getCountry } from '../data/countries'
import { useMissions } from '../hooks/useMissions'
import {
  addDaysISO,
  budgetRemaining,
  calcMissionDays,
  dayEstCost,
} from '../lib/missionStorage'
import type {
  DayFormData,
  ExpenseFormData,
  MissionDay,
  MissionExpense,
  MissionFormData,
} from '../types/mission'
import { expenseLabel, statusLabel } from '../types/mission'

function formatMoney(n: number, currency: string) {
  return `${n.toLocaleString('ko-KR')} ${currency}`
}

export function MissionDetailPage() {
  const { id = '' } = useParams()
  const {
    getMission,
    updateMission,
    deleteMission,
    upsertDay,
    deleteDay,
    upsertExpense,
    deleteExpense,
    toggleExpensePaid,
    missionSpent,
    missionPaid,
    missionRouteEst,
  } = useMissions()

  const mission = getMission(id)
  const [editOpen, setEditOpen] = useState(false)
  const [dayOpen, setDayOpen] = useState(false)
  const [editingDay, setEditingDay] = useState<MissionDay | null>(null)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<MissionExpense | null>(null)

  const country = mission ? getCountry(mission.countryCode) : undefined

  const nextDayDefaults = useMemo(() => {
    if (!mission) return { day: 1, date: '', city: '' }
    const maxDay = mission.days.reduce((m, d) => Math.max(m, d.day), 0)
    const day = maxDay + 1
    const date =
      mission.days.length > 0
        ? addDaysISO(
            [...mission.days].sort((a, b) => b.date.localeCompare(a.date))[0].date,
            1,
          )
        : mission.startDate
    return {
      day,
      date,
      city: mission.cities[0] || country?.capital || '',
    }
  }, [mission, country])

  if (!mission) {
    return <Navigate to="/missions" replace />
  }

  const spent = missionSpent(mission)
  const paid = missionPaid(mission)
  const remain = budgetRemaining(mission)
  const routeEst = missionRouteEst(mission)
  const span = calcMissionDays(mission.startDate, mission.endDate)
  const pct =
    mission.budgetTotal > 0
      ? Math.min(100, Math.round((spent / mission.budgetTotal) * 100))
      : 0

  function handleUpdate(data: MissionFormData) {
    updateMission(mission!.id, data)
  }

  function handleDeleteMission() {
    if (window.confirm(`「${mission!.title}」 미션을 삭제할까요?`)) {
      deleteMission(mission!.id)
    }
  }

  function openCreateDay() {
    setEditingDay(null)
    setDayOpen(true)
  }

  function openEditDay(d: MissionDay) {
    setEditingDay(d)
    setDayOpen(true)
  }

  function handleDaySubmit(data: DayFormData) {
    upsertDay(mission!.id, data, editingDay?.id)
  }

  function handleDeleteDay(d: MissionDay) {
    if (window.confirm(`Day ${d.day} 「${d.title || d.city}」을 삭제할까요?`)) {
      deleteDay(mission!.id, d.id)
    }
  }

  function openCreateExpense() {
    setEditingExpense(null)
    setExpenseOpen(true)
  }

  function openEditExpense(e: MissionExpense) {
    setEditingExpense(e)
    setExpenseOpen(true)
  }

  function handleExpenseSubmit(data: ExpenseFormData) {
    upsertExpense(mission!.id, data, editingExpense?.id)
  }

  function handleDeleteExpense(e: MissionExpense) {
    if (window.confirm(`「${e.label}」 항목을 삭제할까요?`)) {
      deleteExpense(mission!.id, e.id)
    }
  }

  return (
    <AppShell statusLabel="MISSION">
      <main className="page-main">
        <div className="container">
          <div className="breadcrumb font-mono">
            <Link to="/missions">MISSION PLAN</Link>
            <span>/</span>
            <span>{mission.title}</span>
          </div>

          <header className="page-header country-detail-header">
            <div className="country-detail-identity">
              <span className="country-detail-flag">
                {flagEmoji(mission.countryCode)}
              </span>
              <div>
                <p className="section-code">
                  // {statusLabel(mission.status).toUpperCase()} ·{' '}
                  {country?.nameEn?.toUpperCase() ?? mission.countryCode}
                </p>
                <h1 className="page-title glow-text">{mission.title}</h1>
                <p className="page-desc">
                  {mission.startDate} → {mission.endDate} · {span} days ·{' '}
                  {mission.cities.join(' · ') || country?.nameKo}
                </p>
              </div>
            </div>
            <div className="visit-actions">
              <button type="button" className="btn-ghost" onClick={() => setEditOpen(true)}>
                Edit
              </button>
              <button type="button" className="btn-danger" onClick={handleDeleteMission}>
                Delete
              </button>
            </div>
          </header>

          <div className="stats-row">
            <div className="stat-chip hud-panel">
              <span className="stat-chip-label">BUDGET</span>
              <span className="stat-chip-value" style={{ fontSize: '0.95rem' }}>
                {formatMoney(mission.budgetTotal, mission.currency)}
              </span>
            </div>
            <div className="stat-chip hud-panel">
              <span className="stat-chip-label">ALLOCATED</span>
              <span className="stat-chip-value" style={{ fontSize: '0.95rem' }}>
                {formatMoney(spent, mission.currency)}
              </span>
            </div>
            <div className="stat-chip hud-panel">
              <span className="stat-chip-label">PAID</span>
              <span className="stat-chip-value" style={{ fontSize: '0.95rem' }}>
                {formatMoney(paid, mission.currency)}
              </span>
            </div>
            <div className="stat-chip hud-panel">
              <span className="stat-chip-label">REMAIN</span>
              <span className="stat-chip-value" style={{ fontSize: '0.95rem' }}>
                {formatMoney(remain, mission.currency)}
              </span>
            </div>
          </div>

          <div className="mission-budget-bar large" aria-hidden>
            <span style={{ width: `${pct}%` }} />
          </div>
          <p className="mission-budget-text font-mono" style={{ marginBottom: '1.5rem' }}>
            예산 사용 {pct}% · 동선 추정 {formatMoney(routeEst, mission.currency)}
          </p>

          {mission.notes && <p className="visit-notes">{mission.notes}</p>}

          <div className="mission-detail-layout">
            <section className="hud-panel mission-section">
              <span className="hud-corner tl" />
              <span className="hud-corner tr" />
              <span className="hud-corner bl" />
              <span className="hud-corner br" />

              <div className="mission-section-head">
                <p className="mini-panel-title" style={{ marginBottom: 0 }}>
                  ROUTE TIMELINE · {mission.days.length}
                </p>
                <button type="button" className="btn-primary" onClick={openCreateDay}>
                  + Day
                </button>
              </div>

              {mission.days.length === 0 ? (
                <div className="empty-state" style={{ border: 'none' }}>
                  <p className="section-code">// NO ROUTE</p>
                  <p>일차별 동선을 추가하세요.</p>
                </div>
              ) : (
                <ol className="mission-timeline">
                  {mission.days.map((d) => (
                    <li key={d.id} className="mission-day-card">
                      <div className="mission-day-badge font-mono">D{d.day}</div>
                      <div className="mission-day-body">
                        <div className="mission-day-top">
                          <div>
                            <h3>{d.title || `Day ${d.day}`}</h3>
                            <p className="font-mono">
                              {d.date} · {d.city || '—'} · est{' '}
                              {formatMoney(dayEstCost(d), mission.currency)}
                            </p>
                          </div>
                          <div className="flight-history-actions">
                            <button
                              type="button"
                              className="btn-ghost"
                              onClick={() => openEditDay(d)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn-danger"
                              onClick={() => handleDeleteDay(d)}
                            >
                              Del
                            </button>
                          </div>
                        </div>
                        {d.stops.length > 0 && (
                          <ul className="mission-stops">
                            {d.stops.map((s) => (
                              <li key={s.id}>
                                <span>{s.title}</span>
                                {s.estCost > 0 && (
                                  <span className="font-mono">
                                    {s.estCost.toLocaleString('ko-KR')}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                        {d.notes && <p className="mission-day-notes">{d.notes}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <aside className="hud-panel mission-section">
              <span className="hud-corner tl" />
              <span className="hud-corner tr" />
              <span className="hud-corner bl" />
              <span className="hud-corner br" />

              <div className="mission-section-head">
                <p className="mini-panel-title" style={{ marginBottom: 0 }}>
                  BUDGET TRACK · {mission.expenses.length}
                </p>
                <button type="button" className="btn-primary" onClick={openCreateExpense}>
                  + Item
                </button>
              </div>

              {mission.expenses.length === 0 ? (
                <div className="empty-state" style={{ border: 'none' }}>
                  <p className="section-code">// NO BUDGET NODES</p>
                  <p>항공·숙소·식비 항목을 추가하세요.</p>
                </div>
              ) : (
                <ul className="mission-expense-list">
                  {mission.expenses.map((e) => (
                    <li key={e.id} className={`mission-expense-item${e.paid ? ' paid' : ''}`}>
                      <button
                        type="button"
                        className="mission-expense-main"
                        onClick={() => toggleExpensePaid(mission.id, e.id)}
                        title="결제 여부 토글"
                      >
                        <span className="mission-expense-cat">
                          {expenseLabel(e.category)}
                          {e.day != null ? ` · D${e.day}` : ''}
                        </span>
                        <strong>{e.label}</strong>
                        <span className="font-mono">
                          {formatMoney(e.amount, mission.currency)}
                          {e.paid ? ' · PAID' : ''}
                        </span>
                      </button>
                      <div className="flight-history-actions">
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => openEditExpense(e)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => handleDeleteExpense(e)}
                        >
                          Del
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          </div>
        </div>
      </main>

      <MissionFormModal
        open={editOpen}
        mode="edit"
        initial={mission}
        onClose={() => setEditOpen(false)}
        onSubmit={handleUpdate}
      />

      <DayFormModal
        open={dayOpen}
        mode={editingDay ? 'edit' : 'create'}
        initial={editingDay}
        defaultDay={nextDayDefaults.day}
        defaultDate={nextDayDefaults.date}
        defaultCity={nextDayDefaults.city}
        onClose={() => {
          setDayOpen(false)
          setEditingDay(null)
        }}
        onSubmit={handleDaySubmit}
      />

      <ExpenseFormModal
        open={expenseOpen}
        mode={editingExpense ? 'edit' : 'create'}
        initial={editingExpense}
        onClose={() => {
          setExpenseOpen(false)
          setEditingExpense(null)
        }}
        onSubmit={handleExpenseSubmit}
      />
    </AppShell>
  )
}
