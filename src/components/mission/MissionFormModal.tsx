import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { COUNTRIES, flagEmoji, getCountry } from '../../data/countries'
import {
  isMonitorCurrency,
  MONITOR_CURRENCIES,
} from '../../data/monitorCurrencies'
import type { Mission, MissionFormData, MissionStatus } from '../../types/mission'
import { MISSION_STATUSES } from '../../types/mission'

type Props = {
  open: boolean
  mode: 'create' | 'edit'
  initial?: Mission | null
  onClose: () => void
  onSubmit: (data: MissionFormData) => void
}

const BUDGET_STEP = 1000

function toForm(m?: Mission | null): MissionFormData {
  if (!m) {
    const start = new Date()
    start.setDate(start.getDate() + 21)
    const end = new Date(start)
    end.setDate(end.getDate() + 3)
    return {
      title: '',
      countryCode: 'TH',
      cities: '',
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      currency: 'KRW',
      budgetTotal: '',
      status: 'draft',
      notes: '',
    }
  }
  return {
    title: m.title,
    countryCode: m.countryCode,
    cities: m.cities.join(', '),
    startDate: m.startDate,
    endDate: m.endDate,
    currency: isMonitorCurrency(m.currency) ? m.currency : 'KRW',
    budgetTotal: String(m.budgetTotal || ''),
    status: m.status,
    notes: m.notes,
  }
}

function openDatePicker(el: HTMLInputElement) {
  try {
    el.showPicker?.()
  } catch {
    /* 브라우저/보안 정책상 무시 */
  }
}

export function MissionFormModal({ open, mode, initial, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<MissionFormData>(toForm())
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm(toForm(initial))
    setError('')
  }, [open, initial])

  if (!open) return null

  function set<K extends keyof MissionFormData>(key: K, value: MissionFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleCountry(code: string) {
    const c = getCountry(code)
    const nextCurrency =
      c?.currency && isMonitorCurrency(c.currency) ? c.currency : undefined
    setForm((prev) => ({
      ...prev,
      countryCode: code,
      currency: nextCurrency || prev.currency,
      cities: prev.cities.trim() ? prev.cities : c?.capital || '',
    }))
  }

  function adjustBudget(delta: number) {
    setForm((prev) => {
      const raw = prev.budgetTotal.replace(/[^\d]/g, '')
      const current = raw ? Number(raw) : 0
      const next = Math.max(0, current + delta)
      return { ...prev, budgetTotal: String(next) }
    })
  }

  function handleBudgetChange(value: string) {
    const cleaned = value.replace(/[^\d]/g, '')
    set('budgetTotal', cleaned)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('미션 제목을 입력하세요.')
      return
    }
    if (!form.countryCode) {
      setError('국가를 선택하세요.')
      return
    }
    if (!form.startDate || !form.endDate) {
      setError('일정을 입력하세요.')
      return
    }
    if (form.endDate < form.startDate) {
      setError('종료일이 시작일보다 빠릅니다.')
      return
    }
    if (!isMonitorCurrency(form.currency)) {
      setError('모니터링 대상 통화를 선택하세요.')
      return
    }
    onSubmit(form)
    onClose()
  }

  const currencyOptions = MONITOR_CURRENCIES.some((c) => c.code === form.currency)
    ? MONITOR_CURRENCIES
    : [
        ...MONITOR_CURRENCIES,
        { code: form.currency, labelKo: form.currency, pair: undefined },
      ]

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-panel hud-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mission-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="hud-corner tl" />
        <span className="hud-corner tr" />
        <span className="hud-corner bl" />
        <span className="hud-corner br" />

        <div className="modal-header">
          <div>
            <p className="section-code">
              {mode === 'create' ? '// NEW MISSION' : '// EDIT MISSION'}
            </p>
            <h2 id="mission-form-title" className="modal-title glow-text">
              {mode === 'create' ? '미션 생성' : '미션 수정'}
            </h2>
          </div>
          <button type="button" className="btn-ghost modal-close" onClick={onClose}>
            CLOSE
          </button>
        </div>

        <form className="visit-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">미션명</span>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="예: 방콕 주말 미션"
              required
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span className="field-label">국가</span>
              <select
                value={form.countryCode}
                onChange={(e) => handleCountry(e.target.value)}
                required
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {flagEmoji(c.code)} {c.nameKo}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">상태</span>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value as MissionStatus)}
              >
                {MISSION_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.labelKo}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="field">
            <span className="field-label">도시 (쉼표 구분)</span>
            <input
              value={form.cities}
              onChange={(e) => set('cities', e.target.value)}
              placeholder="예: 방콕, 파타야"
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span className="field-label">시작일</span>
              <input
                type="date"
                className="field-date"
                value={form.startDate}
                max={form.endDate || undefined}
                onChange={(e) => set('startDate', e.target.value)}
                onClick={(e) => openDatePicker(e.currentTarget)}
                onFocus={(e) => openDatePicker(e.currentTarget)}
                required
              />
            </label>
            <label className="field">
              <span className="field-label">종료일</span>
              <input
                type="date"
                className="field-date"
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(e) => set('endDate', e.target.value)}
                onClick={(e) => openDatePicker(e.currentTarget)}
                onFocus={(e) => openDatePicker(e.currentTarget)}
                required
              />
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span className="field-label">총 예산</span>
              <div className="budget-stepper">
                <input
                  value={form.budgetTotal}
                  onChange={(e) => handleBudgetChange(e.target.value)}
                  placeholder="800000"
                  inputMode="numeric"
                  aria-label="총 예산"
                />
                <div className="budget-stepper-btns" role="group" aria-label="예산 1000 단위 조정">
                  <button
                    type="button"
                    className="budget-step-btn"
                    onClick={() => adjustBudget(BUDGET_STEP)}
                    aria-label="1000 증가"
                    title="+1,000"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="budget-step-btn"
                    onClick={() => adjustBudget(-BUDGET_STEP)}
                    aria-label="1000 감소"
                    title="-1,000"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </label>
            <label className="field">
              <span className="field-label">통화 · Command Monitor</span>
              <select
                value={form.currency}
                onChange={(e) => set('currency', e.target.value)}
                required
              >
                {currencyOptions.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} · {c.labelKo}
                    {c.pair ? ` (${c.pair})` : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="field">
            <span className="field-label">메모</span>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              placeholder="목적, 동행, 제약사항..."
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="visit-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {mode === 'create' ? 'Create Mission' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
