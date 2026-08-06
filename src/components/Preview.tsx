const RATES = [
  { pair: 'USD / KRW', val: '1,382.40', change: 'up' as const },
  { pair: 'EUR / KRW', val: '1,498.20', change: 'down' as const },
  { pair: 'JPY / KRW', val: '9.24', change: 'up' as const },
  { pair: 'GBP / KRW', val: '1,756.80', change: 'up' as const },
  { pair: 'THB / KRW', val: '40.12', change: 'down' as const },
]

const FLIGHTS = [
  { from: 'ICN', to: 'NRT', airline: 'KE', price: '₩428,000' },
  { from: 'ICN', to: 'CDG', airline: 'AF', price: '₩1,120,000' },
  { from: 'GMP', to: 'HND', airline: 'OZ', price: '₩312,000' },
  { from: 'ICN', to: 'BKK', airline: 'TG', price: '₩389,000' },
]

const MAP_NODES = [
  { x: '28%', y: '38%', label: 'SEOUL', amber: false },
  { x: '72%', y: '32%', label: 'TOKYO', amber: false },
  { x: '55%', y: '58%', label: 'BANGKOK', amber: true },
  { x: '18%', y: '55%', label: 'PARIS', amber: false },
  { x: '80%', y: '62%', label: 'SYDNEY', amber: true },
]

export function Preview() {
  return (
    <section className="preview" id="intel">
      <div className="container">
        <div className="section-header">
          <p className="section-code">// LIVE INTEL PREVIEW</p>
          <h2 className="section-title glow-text">Command Interface</h2>
          <p className="section-desc">
            지도 · 환율 · 항공 데이터를 하나의 HUD에서 모니터링합니다.
          </p>
        </div>

        <div className="preview-frame hud-panel" style={{ clipPath: 'none', border: '1px solid rgba(0,229,255,0.2)' }}>
          <span className="hud-corner tl" />
          <span className="hud-corner tr" />
          <span className="hud-corner bl" />
          <span className="hud-corner br" />

          <div className="preview-header">
            <span className="preview-title">TRAVEL COMMAND CENTER</span>
            <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--cyan-dim)' }}>
              SYNC · 00:00:00 UTC
            </span>
          </div>

          <div className="preview-body">
            <div className="map-panel">
              <div className="map-grid-overlay" />
              {/* Wireframe globe hint */}
              <svg
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.25 }}
                viewBox="0 0 400 320"
                fill="none"
                aria-hidden
              >
                <ellipse cx="200" cy="160" rx="140" ry="120" stroke="#00e5ff" strokeWidth="1" />
                <ellipse cx="200" cy="160" rx="70" ry="120" stroke="#00e5ff" strokeWidth="0.6" />
                <ellipse cx="200" cy="160" rx="140" ry="40" stroke="#00e5ff" strokeWidth="0.6" />
                <ellipse cx="200" cy="160" rx="140" ry="80" stroke="#00e5ff" strokeWidth="0.5" />
                <line x1="60" y1="160" x2="340" y2="160" stroke="#00e5ff" strokeWidth="0.5" />
                <line x1="200" y1="40" x2="200" y2="280" stroke="#00e5ff" strokeWidth="0.5" />
              </svg>

              {MAP_NODES.map((node) => (
                <div key={node.label} style={{ position: 'absolute', left: node.x, top: node.y }}>
                  <div className={`map-node${node.amber ? ' amber' : ''}`} />
                  <span className="map-label">{node.label}</span>
                </div>
              ))}
            </div>

            <div className="side-panels">
              <div className="mini-panel">
                <div className="mini-panel-title">Currency Feed · Live</div>
                {RATES.map((r) => (
                  <div key={r.pair} className="rate-row">
                    <span className="rate-pair">{r.pair}</span>
                    <span className={`rate-val ${r.change === 'up' ? 'up' : 'down'}`}>
                      {r.val} {r.change === 'up' ? '▲' : '▼'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mini-panel">
                <div className="mini-panel-title">Flight Scan · Top Routes</div>
                {FLIGHTS.map((f) => (
                  <div key={`${f.from}-${f.to}`} className="flight-row">
                    <span className="flight-city">{f.from}</span>
                    <span className="flight-arrow">→</span>
                    <span className="flight-city">{f.to}</span>
                    <span className="flight-price">{f.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
