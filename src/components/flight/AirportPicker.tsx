import { useEffect, useId, useRef, useState } from 'react'
import { getAirport, searchAirports } from '../../data/airports'
import type { Airport } from '../../types/flight'

type Props = {
  label: string
  value: string
  onChange: (code: string) => void
  exclude?: string
}

export function AirportPicker({ label, value, onChange, exclude }: Props) {
  const listId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const selected = value ? getAirport(value) : undefined

  const results = searchAirports(query || value, 14).filter(
    (a) => !exclude || a.code !== exclude.toUpperCase(),
  )

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function choose(a: Airport) {
    onChange(a.code)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="field airport-picker" ref={wrapRef}>
      <span className="field-label">{label}</span>
      <div className="airport-picker-input-wrap">
        <input
          type="text"
          value={open ? query : selected ? `${selected.cityKo} (${selected.code})` : value}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            setQuery('')
            setOpen(true)
          }}
          placeholder="도시 또는 공항코드 (ICN)"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
        />
        {value && (
          <button
            type="button"
            className="airport-picker-clear"
            onClick={() => {
              onChange('')
              setQuery('')
            }}
            aria-label="지우기"
          >
            ×
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <ul id={listId} className="airport-picker-list" role="listbox">
          {results.map((a) => (
            <li key={a.code}>
              <button type="button" onClick={() => choose(a)}>
                <strong>
                  {a.code} · {a.cityKo}
                </strong>
                <span>
                  {a.nameKo} · {a.nameEn}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
