import { useEffect, useId, useRef, useState } from 'react'
import { searchDestinations, type StayDestination } from '../../data/stayDestinations'

type Props = {
  label: string
  value: string
  valueEn: string
  onChange: (nameKo: string, nameEn: string) => void
}

export function DestinationPicker({ label, value, valueEn, onChange }: Props) {
  const listId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const results = searchDestinations(query || value, 14)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function choose(d: StayDestination) {
    onChange(d.nameKo, d.nameEn)
    setQuery('')
    setOpen(false)
  }

  function commitFreeText() {
    const t = query.trim() || value.trim()
    if (!t) return
    const hit = searchDestinations(t, 1)[0]
    if (
      hit &&
      (hit.nameKo === t || hit.nameEn.toLowerCase() === t.toLowerCase())
    ) {
      onChange(hit.nameKo, hit.nameEn)
    } else {
      onChange(t, valueEn && value === t ? valueEn : t)
    }
    setOpen(false)
  }

  return (
    <div className="field airport-picker" ref={wrapRef}>
      <span className="field-label">{label}</span>
      <div className="airport-picker-input-wrap">
        <input
          type="text"
          value={open ? query : value}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            setQuery(value)
            setOpen(true)
          }}
          onBlur={() => {
            // slight delay so click on list registers
            window.setTimeout(() => {
              if (open) commitFreeText()
            }, 120)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commitFreeText()
            }
          }}
          placeholder="도시명 (방콕 / Bangkok)"
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
              onChange('', '')
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
          {results.map((d) => (
            <li key={d.id}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => choose(d)}>
                <strong>
                  {d.nameKo} · {d.nameEn}
                </strong>
                <span>{d.countryCode}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
