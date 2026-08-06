const ITEMS = [
  { label: 'USD/KRW', val: '1,382.40', cls: 'up' },
  { label: 'EUR/KRW', val: '1,498.20', cls: 'down' },
  { label: 'ICN→NRT', val: '₩428K', cls: '' },
  { label: 'ICN→CDG', val: '₩1.12M', cls: '' },
  { label: 'ACTIVE MISSIONS', val: '3', cls: '' },
  { label: 'LOGGED COUNTRIES', val: '12', cls: '' },
  { label: 'JPY/KRW', val: '9.24', cls: 'up' },
  { label: 'THB/KRW', val: '40.12', cls: 'down' },
  { label: 'GEO NODES', val: '48 ONLINE', cls: '' },
  { label: 'SYSTEM', val: 'NOMINAL', cls: '' },
]

export function Ticker() {
  const doubled = [...ITEMS, ...ITEMS]

  return (
    <div className="ticker" aria-hidden>
      <div className="ticker-track">
        {doubled.map((item, i) => (
          <span key={`${item.label}-${i}`} className="ticker-item">
            <span className="ticker-sep">◆</span>
            {item.label}
            <span className={`val ${item.cls}`}>{item.val}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
