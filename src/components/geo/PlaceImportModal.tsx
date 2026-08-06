import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { FEATURE_PLACE_IMPORT } from '../../config/features'
import { useGeoCategories } from '../../hooks/useGeoCategories'
import { enrichImportedPlaces } from '../../lib/enrichImportedPlace'
import {
  extractPlaceNameCandidates,
  normalizePastedNameList,
} from '../../lib/extractPlaceNames'
import { ocrImageToPlaceNames } from '../../lib/ocrPlaceImage'
import type { PlaceCategory, PlaceFormData } from '../../types/geo'

type Candidate = {
  name: string
  selected: boolean
}

type Props = {
  open: boolean
  countryCode: string
  defaultCity?: string
  onClose: () => void
  onImport: (items: PlaceFormData[]) => void
}

export function PlaceImportModal({
  open,
  countryCode,
  defaultCity = '',
  onClose,
  onImport,
}: Props) {
  const { categories } = useGeoCategories()
  const [tab, setTab] = useState<'image' | 'text'>('image')
  const [city, setCity] = useState(defaultCity)
  const [category, setCategory] = useState<PlaceCategory>('attraction')
  const [lockCategory, setLockCategory] = useState(false)
  const [paste, setPaste] = useState('')
  const [rawOcr, setRawOcr] = useState('')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!open) return
    setCity(defaultCity)
    setCategory('attraction')
    setLockCategory(false)
    setPaste('')
    setRawOcr('')
    setCandidates([])
    setBusy(false)
    setProgress('')
    setError('')
    setTab('image')
    abortRef.current?.abort()
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
  }, [open, defaultCity])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const selectedCount = useMemo(
    () => candidates.filter((c) => c.selected).length,
    [candidates],
  )

  if (!open || !FEATURE_PLACE_IMPORT) return null

  function applyNames(names: string[]) {
    setCandidates(names.map((name) => ({ name, selected: true })))
    if (names.length === 0) {
      setError('장소명 후보를 찾지 못했습니다. 텍스트 탭에서 직접 붙여넣어 보세요.')
    } else {
      setError('')
    }
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있습니다.')
      return
    }

    setBusy(true)
    setError('')
    setProgress('OCR 준비 중… (첫 실행 시 언어팩 다운로드)')
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })

    try {
      const { text, names } = await ocrImageToPlaceNames(file, (p) => {
        const pct = Math.round(p.progress * 100)
        setProgress(`${p.status} ${pct}%`)
      })
      setRawOcr(text)
      applyNames(names)
      setProgress(`완료 · 후보 ${names.length}개`)
    } catch (err) {
      console.error(err)
      setError('OCR에 실패했습니다. 텍스트로 붙여넣기 해보세요.')
      setProgress('')
    } finally {
      setBusy(false)
    }
  }

  function handleExtractPaste() {
    const names = normalizePastedNameList(paste)
    setRawOcr(paste)
    applyNames(names)
    setProgress(`텍스트에서 후보 ${names.length}개`)
  }

  function toggle(i: number) {
    setCandidates((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, selected: !c.selected } : c)),
    )
  }

  function rename(i: number, name: string) {
    setCandidates((prev) => prev.map((c, idx) => (idx === i ? { ...c, name } : c)))
  }

  function selectAll(selected: boolean) {
    setCandidates((prev) => prev.map((c) => ({ ...c, selected })))
  }

  function refilterFromOcr() {
    if (!rawOcr.trim()) return
    applyNames(extractPlaceNameCandidates(rawOcr))
  }

  async function handleImport() {
    const picked = candidates.filter((c) => c.selected && c.name.trim())
    if (picked.length === 0) {
      setError('등록할 항목을 선택하세요.')
      return
    }
    if (!city.trim()) {
      setError('도시를 입력하세요.')
      return
    }

    setBusy(true)
    setError('')
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const names = picked.map((c) => c.name.trim())
      const items = await enrichImportedPlaces(
        names,
        {
          countryCode,
          city: city.trim(),
          fallbackCategory: category,
          lockCategory,
          signal: controller.signal,
        },
        (done, total, name) => {
          setProgress(`지도 검색 ${done}/${total} · ${name}`)
        },
      )

      const matched = items.filter((x) => !x.tags.includes('unresolved')).length
      setProgress(`등록 준비 완료 · 매칭 ${matched}/${items.length}`)
      onImport(items)
      onClose()
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      console.error(err)
      setError('지도 검색 중 오류가 발생했습니다. 네트워크를 확인하세요.')
    } finally {
      if (!controller.signal.aborted) setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-panel hud-panel place-import-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="place-import-title"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="hud-corner tl" />
        <span className="hud-corner tr" />
        <span className="hud-corner bl" />
        <span className="hud-corner br" />

        <div className="modal-header">
          <div>
            <p className="section-code">// PLACE IMPORT · OCR + OSM</p>
            <h2 id="place-import-title" className="modal-title glow-text">
              목록에서 장소 가져오기
            </h2>
          </div>
          <button type="button" className="btn-ghost modal-close" onClick={onClose}>
            CLOSE
          </button>
        </div>

        <p className="page-desc" style={{ marginBottom: '0.85rem' }}>
          장소명 후보를 고른 뒤 등록하면 OSM 지도 검색으로 이름·영문명·주소·좌표·태그·카테고리를
          자동 채웁니다.
        </p>

        <div className="flight-trip-toggle" role="tablist">
          <button
            type="button"
            className={`filter-chip${tab === 'image' ? ' active' : ''}`}
            onClick={() => setTab('image')}
            disabled={busy}
          >
            이미지 OCR
          </button>
          <button
            type="button"
            className={`filter-chip${tab === 'text' ? ' active' : ''}`}
            onClick={() => setTab('text')}
            disabled={busy}
          >
            텍스트 붙여넣기
          </button>
        </div>

        <div className="field-row">
          <label className="field">
            <span className="field-label">도시</span>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="예: 오사카"
              disabled={busy}
            />
          </label>
          <label className="field">
            <span className="field-label">기본 카테고리</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={busy}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.labelKo}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="toggle-visited" style={{ marginBottom: '0.75rem' }}>
          <input
            type="checkbox"
            checked={lockCategory}
            onChange={(e) => setLockCategory(e.target.checked)}
            disabled={busy}
          />
          <span>카테고리 고정 (지도 결과로 바꾸지 않음)</span>
        </label>

        {tab === 'image' ? (
          <div className="place-import-upload">
            <label className="btn-ghost place-import-file">
              이미지 선택
              <input
                type="file"
                accept="image/*"
                hidden
                disabled={busy}
                onChange={handleFile}
              />
            </label>
            {previewUrl && (
              <img src={previewUrl} alt="업로드 미리보기" className="place-import-preview" />
            )}
            {(busy || progress) && (
              <p className="place-search-scope">{progress || '처리 중…'}</p>
            )}
          </div>
        ) : (
          <div className="place-import-paste">
            <label className="field">
              <span className="field-label">목록 / AI 결과 텍스트</span>
              <textarea
                rows={6}
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                placeholder={'도톤보리\n신세카이\n하루카스 300\n우메다 스카이빌딩'}
                disabled={busy}
              />
            </label>
            <button
              type="button"
              className="btn-primary"
              onClick={handleExtractPaste}
              disabled={busy}
            >
              이름 후보 추출
            </button>
          </div>
        )}

        {candidates.length > 0 && (
          <div className="place-import-candidates">
            <div className="place-import-cand-head">
              <p className="field-label" style={{ marginBottom: 0 }}>
                CANDIDATES · {selectedCount}/{candidates.length}
              </p>
              <div className="flight-history-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => selectAll(true)}
                  disabled={busy}
                >
                  All
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => selectAll(false)}
                  disabled={busy}
                >
                  None
                </button>
                {rawOcr && (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={refilterFromOcr}
                    disabled={busy}
                  >
                    Re-filter
                  </button>
                )}
              </div>
            </div>
            <ul className="place-import-list">
              {candidates.map((c, i) => (
                <li key={`${c.name}-${i}`}>
                  <label className="place-import-item">
                    <input
                      type="checkbox"
                      checked={c.selected}
                      onChange={() => toggle(i)}
                      disabled={busy}
                    />
                    <input
                      className="place-import-name"
                      value={c.name}
                      onChange={(e) => rename(i, e.target.value)}
                      disabled={busy}
                    />
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && <p className="form-error">{error}</p>}

        <div className="visit-actions" style={{ marginTop: '1rem' }}>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleImport}
            disabled={busy || selectedCount === 0}
          >
            {busy ? '조회 중…' : `${selectedCount}개 조회 후 등록`}
          </button>
        </div>
      </div>
    </div>
  )
}
