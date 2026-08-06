import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { flagEmoji, getCountry } from '../../data/countries'
import { getCategoryLabel } from '../../hooks/useGeoCategories'
import { searchPlacesWeb, type PlaceSearchResult } from '../../lib/placeSearch'

type Props = {
  countryCode?: string
  onSelect: (result: PlaceSearchResult) => void
}

export function PlaceWebSearch({ countryCode, onSelect }: Props) {
  const listId = useId()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceSearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [scopeNote, setScopeNote] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setLoading(false)
      setError('')
      setScopeNote('')
      abortRef.current?.abort()
      return
    }

    setLoading(true)
    setError('')
    setScopeNote('')
    const timer = window.setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const found = await searchPlacesWeb(q, {
          countryCode,
          signal: controller.signal,
        })
        setResults(found.results)
        setOpen(true)
        setActiveIndex(found.results.length > 0 ? 0 : -1)

        const effective = found.effectiveCountry
          ? getCountry(found.effectiveCountry)
          : undefined

        if (found.results.length === 0) {
          setError(
            found.normalizedEnglish
              ? `"${found.normalizedEnglish}" 로 검색했지만 결과가 없습니다. 영문명을 확인해보세요.`
              : '검색 결과가 없습니다. 영문명(예: Baiyoke Sky Hotel)으로 다시 시도해보세요.',
          )
        } else if (found.normalizedEnglish && found.normalizedEnglish !== q) {
          const where = effective
            ? `${flagEmoji(effective.code)} ${effective.nameKo}`
            : '전 세계'
          setScopeNote(`검색어 변환: ${found.normalizedEnglish} · ${where}`)
        } else if (effective) {
          setScopeNote(`${flagEmoji(effective.code)} ${effective.nameKo} 검색`)
        } else {
          setScopeNote('전 세계 검색')
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setResults([])
        setError('웹 검색에 실패했습니다. 네트워크를 확인하세요.')
        setScopeNote('')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 350)

    return () => {
      window.clearTimeout(timer)
    }
  }, [query, countryCode])

  function choose(result: PlaceSearchResult) {
    onSelect(result)
    setQuery(result.name || result.nameEn)
    setOpen(false)
    setResults([])
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      choose(results[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="place-web-search" ref={wrapRef}>
      <label className="field">
        <span className="field-label">
          WEB SEARCH · OSM · 한글표시
          {loading ? ' · SCANNING...' : ''}
        </span>
        <div className="place-search-input-wrap">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => {
              if (results.length > 0) setOpen(true)
            }}
            onKeyDown={onKeyDown}
            placeholder="예: 바이욕 스카이 방콕 / Baiyoke Sky Bangkok"
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
          />
          {loading && <span className="place-search-spinner" aria-hidden />}
        </div>
      </label>

      {scopeNote && !loading && <p className="place-search-scope">{scopeNote}</p>}

      {open && results.length > 0 && (
        <ul id={listId} className="place-search-results" role="listbox">
          {results.map((r, idx) => (
            <li key={r.id} role="option" aria-selected={idx === activeIndex}>
              <button
                type="button"
                className={`place-search-item${idx === activeIndex ? ' active' : ''}`}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => choose(r)}
              >
                <span className="place-search-item-top">
                  <strong>
                    {r.countryCode ? `${flagEmoji(r.countryCode)} ` : ''}
                    {r.name}
                    {r.nameEn && r.nameEn !== r.name ? ` · ${r.nameEn}` : ''}
                  </strong>
                  <span className="geo-cat-badge">{getCategoryLabel(r.category)}</span>
                </span>
                <span className="place-search-item-sub">
                  {[r.city, r.address].filter(Boolean).join(' · ') || r.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && !loading && <p className="place-search-hint">{error}</p>}
      {!error && !loading && query.trim().length > 0 && query.trim().length < 2 && (
        <p className="place-search-hint">2글자 이상 입력하세요.</p>
      )}
    </div>
  )
}
