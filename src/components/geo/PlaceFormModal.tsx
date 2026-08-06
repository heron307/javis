import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { COUNTRIES, flagEmoji, getCountry } from '../../data/countries'
import { useGeoCategories } from '../../hooks/useGeoCategories'
import type { GeoPlace } from '../../types/geo'
import type { PlaceFormData } from '../../types/geo'
import type { PlaceSearchResult } from '../../lib/placeSearch'
import { PlaceWebSearch } from './PlaceWebSearch'

type Props = {
  open: boolean
  mode: 'create' | 'edit'
  initial?: GeoPlace | null
  defaultCountryCode?: string
  defaultCity?: string
  onClose: () => void
  /** false 를 반환하면 모달을 닫지 않음 (중복 등) */
  onSubmit: (data: PlaceFormData) => boolean | void
}

const EMPTY: PlaceFormData = {
  countryCode: 'JP',
  city: '',
  name: '',
  nameEn: '',
  category: 'attraction',
  address: '',
  lat: '',
  lng: '',
  rating: 4,
  notes: '',
  tags: '',
}

export function PlaceFormModal({
  open,
  mode,
  initial,
  defaultCountryCode,
  defaultCity,
  onClose,
  onSubmit,
}: Props) {
  const { categories } = useGeoCategories()
  const [form, setForm] = useState<PlaceFormData>(EMPTY)
  const [error, setError] = useState('')
  const [autofillNote, setAutofillNote] = useState('')

  useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        countryCode: initial.countryCode,
        city: initial.city,
        name: initial.name,
        nameEn: initial.nameEn,
        category: initial.category,
        address: initial.address,
        lat: initial.lat != null ? String(initial.lat) : '',
        lng: initial.lng != null ? String(initial.lng) : '',
        rating: initial.rating,
        notes: initial.notes,
        tags: initial.tags.join(', '),
      })
    } else {
      setForm({
        ...EMPTY,
        countryCode: defaultCountryCode || 'JP',
        city: defaultCity || '',
      })
    }
    setError('')
    setAutofillNote('')
  }, [open, initial, defaultCountryCode, defaultCity])

  if (!open) return null

  function set<K extends keyof PlaceFormData>(key: K, value: PlaceFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function applySearchResult(result: PlaceSearchResult) {
    const matchedCountry =
      result.countryCode && getCountry(result.countryCode)
        ? result.countryCode
        : form.countryCode

    setForm((prev) => ({
      ...prev,
      countryCode: matchedCountry,
      city: result.city || prev.city,
      name: result.name || prev.name,
      nameEn: result.nameEn || prev.nameEn,
      category: result.category || prev.category,
      address: result.address || prev.address,
      lat: Number.isFinite(result.lat) ? String(result.lat) : prev.lat,
      lng: Number.isFinite(result.lng) ? String(result.lng) : prev.lng,
      tags: result.tags.length ? result.tags.join(', ') : prev.tags,
    }))

    setAutofillNote(`웹 검색 결과가 자동 입력되었습니다 · ${result.name}`)
    setError('')
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.countryCode) {
      setError('국가를 선택하세요.')
      return
    }
    if (!form.city.trim()) {
      setError('도시를 입력하세요.')
      return
    }
    if (!form.name.trim()) {
      setError('장소명을 입력하세요.')
      return
    }
    const ok = onSubmit(form)
    if (ok === false) return
    onClose()
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-panel hud-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="place-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="hud-corner tl" />
        <span className="hud-corner tr" />
        <span className="hud-corner bl" />
        <span className="hud-corner br" />

        <div className="modal-header">
          <div>
            <p className="section-code">
              {mode === 'create' ? '// NEW GEO NODE' : '// EDIT GEO NODE'}
            </p>
            <h2 id="place-form-title" className="modal-title glow-text">
              {mode === 'create' ? '장소 정보 추가' : '장소 정보 수정'}
            </h2>
          </div>
          <button type="button" className="btn-ghost modal-close" onClick={onClose}>
            CLOSE
          </button>
        </div>

        <form className="visit-form" onSubmit={handleSubmit}>
          <PlaceWebSearch countryCode={form.countryCode} onSelect={applySearchResult} />

          {autofillNote && <p className="place-autofill-note">{autofillNote}</p>}

          <div className="field-row">
            <label className="field">
              <span className="field-label">국가</span>
              <select
                value={form.countryCode}
                onChange={(e) => set('countryCode', e.target.value)}
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
              <span className="field-label">카테고리</span>
              <select
                value={form.category}
                onChange={(e) =>
                  set('category', e.target.value as PlaceFormData['category'])
                }
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.labelKo} ({c.label})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="field">
            <span className="field-label">도시</span>
            <input
              type="text"
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
              placeholder="예: 도쿄"
              required
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span className="field-label">장소명 (한글)</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="예: 센소지"
                required
              />
            </label>
            <label className="field">
              <span className="field-label">영문명</span>
              <input
                type="text"
                value={form.nameEn}
                onChange={(e) => set('nameEn', e.target.value)}
                placeholder="Senso-ji"
              />
            </label>
          </div>

          <label className="field">
            <span className="field-label">주소</span>
            <input
              type="text"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="Google Maps에 표시될 주소"
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span className="field-label">위도 (LAT)</span>
              <input
                type="text"
                inputMode="decimal"
                value={form.lat}
                onChange={(e) => set('lat', e.target.value)}
                placeholder="35.7148"
              />
            </label>
            <label className="field">
              <span className="field-label">경도 (LNG)</span>
              <input
                type="text"
                inputMode="decimal"
                value={form.lng}
                onChange={(e) => set('lng', e.target.value)}
                placeholder="139.7967"
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
            <span className="field-label">태그 (쉼표 구분)</span>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => set('tags', e.target.value)}
              placeholder="필수, 야경, 커피"
            />
          </label>

          <label className="field">
            <span className="field-label">메모</span>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="팁, 운영시간, 추천 포인트..."
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {mode === 'create' ? 'Save Node' : 'Update Node'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
