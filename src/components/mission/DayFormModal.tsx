import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { DayFormData, MissionDay } from '../../types/mission'

type Props = {
  open: boolean
  mode: 'create' | 'edit'
  initial?: MissionDay | null
  defaultDay: number
  defaultDate: string
  defaultCity?: string
  onClose: () => void
  onSubmit: (data: DayFormData) => void
}

function toForm(
  d: MissionDay | null | undefined,
  defaultDay: number,
  defaultDate: string,
  defaultCity: string,
): DayFormData {
  if (!d) {
    return {
      day: defaultDay,
      date: defaultDate,
      city: defaultCity,
      title: '',
      notes: '',
      stopsText: '',
      estCost: '',
    }
  }
  return {
    day: d.day,
    date: d.date,
    city: d.city,
    title: d.title,
    notes: d.notes,
    stopsText: d.stops.map((s) => s.title).join('\n'),
    estCost: String(d.stops.reduce((sum, s) => sum + s.estCost, 0) || ''),
  }
}

export function DayFormModal({
  open,
  mode,
  initial,
  defaultDay,
  defaultDate,
  defaultCity = '',
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<DayFormData>(
    toForm(null, defaultDay, defaultDate, defaultCity),
  )
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm(toForm(initial, defaultDay, defaultDate, defaultCity))
    setError('')
  }, [open, initial, defaultDay, defaultDate, defaultCity])

  if (!open) return null

  function set<K extends keyof DayFormData>(key: K, value: DayFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.title.trim() && !form.stopsText.trim()) {
      setError('일차 제목 또는 동선 항목을 입력하세요.')
      return
    }
    if (!form.date) {
      setError('날짜를 입력하세요.')
      return
    }
    onSubmit(form)
    onClose()
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-panel hud-panel"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="hud-corner tl" />
        <span className="hud-corner tr" />
        <span className="hud-corner bl" />
        <span className="hud-corner br" />

        <div className="modal-header">
          <div>
            <p className="section-code">// ROUTE DAY</p>
            <h2 className="modal-title glow-text">
              {mode === 'create' ? '일차 추가' : '일차 수정'}
            </h2>
          </div>
          <button type="button" className="btn-ghost modal-close" onClick={onClose}>
            CLOSE
          </button>
        </div>

        <form className="visit-form" onSubmit={handleSubmit}>
          <div className="field-row">
            <label className="field">
              <span className="field-label">Day #</span>
              <input
                type="number"
                min={1}
                value={form.day}
                onChange={(e) => set('day', Number(e.target.value) || 1)}
              />
            </label>
            <label className="field">
              <span className="field-label">날짜</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                required
              />
            </label>
          </div>

          <label className="field">
            <span className="field-label">도시</span>
            <input
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
              placeholder="방콕"
            />
          </label>

          <label className="field">
            <span className="field-label">일차 제목</span>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="왕궁 · 왓아룬"
            />
          </label>

          <label className="field">
            <span className="field-label">동선 (줄바꿈 또는 쉼표)</span>
            <textarea
              value={form.stopsText}
              onChange={(e) => set('stopsText', e.target.value)}
              rows={4}
              placeholder={'그랜드 팰리스\n왓 아룬\n야시장'}
            />
          </label>

          <label className="field">
            <span className="field-label">추정 비용</span>
            <input
              value={form.estCost}
              onChange={(e) => set('estCost', e.target.value)}
              placeholder="50000"
              inputMode="numeric"
            />
          </label>

          <label className="field">
            <span className="field-label">메모</span>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="visit-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Day
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
