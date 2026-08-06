import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { ExpenseCategory, ExpenseFormData, MissionExpense } from '../../types/mission'
import { EXPENSE_CATEGORIES } from '../../types/mission'

type Props = {
  open: boolean
  mode: 'create' | 'edit'
  initial?: MissionExpense | null
  onClose: () => void
  onSubmit: (data: ExpenseFormData) => void
}

function toForm(e?: MissionExpense | null): ExpenseFormData {
  if (!e) {
    return {
      category: 'other',
      label: '',
      amount: '',
      day: '',
      paid: false,
    }
  }
  return {
    category: e.category,
    label: e.label,
    amount: String(e.amount),
    day: e.day != null ? String(e.day) : '',
    paid: e.paid,
  }
}

export function ExpenseFormModal({ open, mode, initial, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<ExpenseFormData>(toForm())
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm(toForm(initial))
    setError('')
  }, [open, initial])

  if (!open) return null

  function set<K extends keyof ExpenseFormData>(key: K, value: ExpenseFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.label.trim()) {
      setError('항목명을 입력하세요.')
      return
    }
    if (!form.amount.trim()) {
      setError('금액을 입력하세요.')
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
            <p className="section-code">// BUDGET NODE</p>
            <h2 className="modal-title glow-text">
              {mode === 'create' ? '예산 항목 추가' : '예산 항목 수정'}
            </h2>
          </div>
          <button type="button" className="btn-ghost modal-close" onClick={onClose}>
            CLOSE
          </button>
        </div>

        <form className="visit-form" onSubmit={handleSubmit}>
          <div className="field-row">
            <label className="field">
              <span className="field-label">카테고리</span>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value as ExpenseCategory)}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.labelKo}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">연결 Day (선택)</span>
              <input
                value={form.day}
                onChange={(e) => set('day', e.target.value)}
                placeholder="2"
                inputMode="numeric"
              />
            </label>
          </div>

          <label className="field">
            <span className="field-label">항목명</span>
            <input
              value={form.label}
              onChange={(e) => set('label', e.target.value)}
              placeholder="왕복 항공"
              required
            />
          </label>

          <label className="field">
            <span className="field-label">금액</span>
            <input
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              placeholder="350000"
              inputMode="numeric"
              required
            />
          </label>

          <label className="toggle-visited">
            <input
              type="checkbox"
              checked={form.paid}
              onChange={(e) => set('paid', e.target.checked)}
            />
            <span>결제 완료</span>
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="visit-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
