import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { COUNTRIES, flagEmoji } from '../../data/countries'
import type { VisitFormData } from '../../types/travel'
import type { StoredTravelVisit } from '../../lib/travelStorage'

type Props = {
  open: boolean
  mode: 'create' | 'edit'
  initial?: StoredTravelVisit | null
  defaultCountryCode?: string
  onClose: () => void
  onSubmit: (data: VisitFormData) => void
}

const EMPTY: VisitFormData = {
  countryCode: 'JP',
  title: '',
  cities: '',
  startDate: '',
  endDate: '',
  notes: '',
  rating: 4,
  companions: '',
  budget: '',
}

export function VisitFormModal({
  open,
  mode,
  initial,
  defaultCountryCode,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<VisitFormData>(EMPTY)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        countryCode: initial.countryCode,
        title: initial.title,
        cities: initial.cities.join(', '),
        startDate: initial.startDate,
        endDate: initial.endDate,
        notes: initial.notes,
        rating: initial.rating,
        companions: initial.companions,
        budget: initial.budget != null ? String(initial.budget) : '',
      })
    } else {
      setForm({
        ...EMPTY,
        countryCode: defaultCountryCode || 'JP',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
      })
    }
    setError('')
  }, [open, initial, defaultCountryCode])

  if (!open) return null

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.countryCode) {
      setError('국가를 선택하세요.')
      return
    }
    if (!form.startDate) {
      setError('출발일을 입력하세요.')
      return
    }
    if (form.endDate && form.endDate < form.startDate) {
      setError('종료일은 출발일 이후여야 합니다.')
      return
    }
    onSubmit(form)
    onClose()
  }

  function set<K extends keyof VisitFormData>(key: K, value: VisitFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-panel hud-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="visit-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="hud-corner tl" />
        <span className="hud-corner tr" />
        <span className="hud-corner bl" />
        <span className="hud-corner br" />

        <div className="modal-header">
          <div>
            <p className="section-code">
              {mode === 'create' ? '// NEW TRAVEL RECORD' : '// EDIT TRAVEL RECORD'}
            </p>
            <h2 id="visit-form-title" className="modal-title glow-text">
              {mode === 'create' ? '여행 기록 추가' : '여행 기록 수정'}
            </h2>
          </div>
          <button type="button" className="btn-ghost modal-close" onClick={onClose}>
            CLOSE
          </button>
        </div>

        <form className="visit-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">국가</span>
            <select
              value={form.countryCode}
              onChange={(e) => set('countryCode', e.target.value)}
              required
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {flagEmoji(c.code)} {c.nameKo} ({c.code})
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field-label">제목</span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="예: 도쿄 봄 여행"
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span className="field-label">출발일</span>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => set('startDate', e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span className="field-label">종료일</span>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => set('endDate', e.target.value)}
              />
            </label>
          </div>

          <label className="field">
            <span className="field-label">도시 (쉼표로 구분)</span>
            <input
              type="text"
              value={form.cities}
              onChange={(e) => set('cities', e.target.value)}
              placeholder="예: 도쿄, 시부야, 아사쿠사"
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span className="field-label">동행</span>
              <input
                type="text"
                value={form.companions}
                onChange={(e) => set('companions', e.target.value)}
                placeholder="혼자 / 친구 / 가족"
              />
            </label>
            <label className="field">
              <span className="field-label">예산 (₩)</span>
              <input
                type="text"
                inputMode="numeric"
                value={form.budget}
                onChange={(e) => set('budget', e.target.value)}
                placeholder="1200000"
              />
            </label>
          </div>

          <label className="field">
            <span className="field-label">평점 · {form.rating} / 5</span>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={form.rating}
              onChange={(e) => set('rating', Number(e.target.value))}
            />
          </label>

          <label className="field">
            <span className="field-label">메모</span>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="인상 깊었던 순간, 팁, 다시 갈 곳..."
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {mode === 'create' ? 'Save Record' : 'Update Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
