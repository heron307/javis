import { Link } from 'react-router-dom'

const FEATURES = [
  {
    id: '01',
    code: 'MOD.TRAVEL_LOG',
    title: 'Travel Log',
    desc: '국가별 여행 기록을 체계적으로 관리하고 조회합니다. 방문 이력, 기간, 메모를 한눈에 파악하세요.',
    tags: ['국가별 기록', '히스토리', '조회'],
    wide: false,
    href: '/logs' as string | null,
    icon: (
      <svg viewBox="0 0 44 44" fill="none" className="feature-icon" aria-hidden>
        <circle cx="22" cy="22" r="18" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <ellipse cx="22" cy="22" rx="8" ry="18" stroke="currentColor" strokeWidth="1" />
        <line x1="4" y1="22" x2="40" y2="22" stroke="currentColor" strokeWidth="1" />
        <circle cx="22" cy="14" r="2.5" fill="currentColor" opacity="0.8" />
        <circle cx="30" cy="26" r="2" fill="currentColor" opacity="0.5" />
      </svg>
    ),
  },
  {
    id: '02',
    code: 'MOD.MISSION_PLAN',
    title: 'Mission Plan',
    desc: '일정·예산·동선을 포함한 여행 계획을 수립합니다. 미션 단위로 루트를 설계하고 예산을 추적하세요.',
    tags: ['일정', '예산', '동선'],
    wide: false,
    href: '/missions',
    icon: (
      <svg viewBox="0 0 44 44" fill="none" className="feature-icon" aria-hidden>
        <rect x="8" y="10" width="28" height="24" rx="2" stroke="currentColor" strokeWidth="1.2" />
        <line x1="8" y1="18" x2="36" y2="18" stroke="currentColor" strokeWidth="1" />
        <line x1="16" y1="10" x2="16" y2="7" stroke="currentColor" strokeWidth="1.5" />
        <line x1="28" y1="10" x2="28" y2="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14 26 L18 30 L26 22" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    ),
  },
  {
    id: '03',
    code: 'MOD.FLIGHT_SCAN',
    title: 'Flight Scan',
    desc: '주요 항공사와 Google Flights 연동으로 항공편을 실시간 스캔합니다. 최적의 스케줄을 찾아냅니다.',
    tags: ['항공사', 'Google Flights', '실시간'],
    wide: false,
    href: '/flights',
    icon: (
      <svg viewBox="0 0 44 44" fill="none" className="feature-icon" aria-hidden>
        <path d="M6 28 L22 12 L38 28" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <path
          d="M10 24 L22 14 L34 24 L22 20 Z"
          stroke="currentColor"
          strokeWidth="1"
          fill="rgba(0,229,255,0.15)"
        />
        <line x1="22" y1="20" x2="22" y2="34" stroke="currentColor" strokeWidth="1.2" />
        <line x1="14" y1="34" x2="30" y2="34" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      </svg>
    ),
  },
  {
    id: '06',
    code: 'MOD.STAY_SCAN',
    title: 'Stay Scan',
    desc: '목적지·일정 기준으로 Google Hotels·부킹닷컴·아고다 등에서 숙소를 바로 검색합니다.',
    tags: ['호텔', 'Booking', 'Agoda'],
    wide: false,
    href: '/stays',
    icon: (
      <svg viewBox="0 0 44 44" fill="none" className="feature-icon" aria-hidden>
        <path
          d="M8 34 V18 L22 10 L36 18 V34"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="rgba(0,229,255,0.08)"
        />
        <rect x="14" y="22" width="6" height="6" stroke="currentColor" strokeWidth="1" />
        <rect x="24" y="22" width="6" height="6" stroke="currentColor" strokeWidth="1" />
        <line x1="8" y1="34" x2="36" y2="34" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    id: '04',
    code: 'MOD.CURRENCY_FEED',
    title: 'Currency Feed',
    desc: '주요 국가 환율을 실시간으로 모니터링합니다. 여행 예산 환산에 바로 활용할 수 있습니다.',
    tags: ['환율', '실시간', '환산'],
    wide: true,
    href: null,
    icon: (
      <svg viewBox="0 0 44 44" fill="none" className="feature-icon" aria-hidden>
        <circle cx="22" cy="22" r="16" stroke="currentColor" strokeWidth="1.2" />
        <text
          x="22"
          y="26"
          textAnchor="middle"
          fill="currentColor"
          fontSize="16"
          fontFamily="Orbitron, sans-serif"
          fontWeight="600"
        >
          ₩
        </text>
        <path
          d="M32 10 Q38 16 36 24"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          opacity="0.5"
        />
      </svg>
    ),
  },
  {
    id: '05',
    code: 'MOD.GEO_INTEL',
    title: 'Geo Intel',
    desc: '국가별 주요 도시·관광지·맛집·카페·숙소 정보를 조회·관리합니다. Google Maps와 연동되어 위치를 바로 확인하세요.',
    tags: ['관광지', '맛집', '숙소', 'Google Maps'],
    wide: true,
    href: '/geo',
    icon: (
      <svg viewBox="0 0 44 44" fill="none" className="feature-icon" aria-hidden>
        <path
          d="M22 8 C15 8 10 13.5 10 20 C10 28 22 38 22 38 C22 38 34 28 34 20 C34 13.5 29 8 22 8Z"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="rgba(0,229,255,0.1)"
        />
        <circle cx="22" cy="20" r="4" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
]

export function Features() {
  return (
    <section className="features" id="modules">
      <div className="container">
        <div className="section-header">
          <p className="section-code">// SYSTEM MODULES</p>
          <h2 className="section-title glow-text">Core Capabilities</h2>
          <p className="section-desc">
            여행의 모든 단계를 하나의 인텔리전스 시스템으로 통합합니다.
          </p>
        </div>

        <div className="features-grid">
          {FEATURES.map((f) => {
            const body = (
              <>
                <span className="hud-corner tl" />
                <span className="hud-corner tr" />
                <span className="hud-corner bl" />
                <span className="hud-corner br" />

                <div className="feature-id">
                  <span>
                    {f.code} — {f.id}
                  </span>
                  <span className="status-dot" />
                </div>

                {f.icon}

                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>

                <div className="feature-tags">
                  {f.tags.map((tag) => (
                    <span key={tag} className="feature-tag">
                      {tag}
                    </span>
                  ))}
                  {f.href && <span className="feature-tag feature-tag-live">ENTER →</span>}
                </div>
              </>
            )

            return f.href ? (
              <Link
                key={f.id}
                to={f.href}
                className={`hud-panel feature-card feature-card-link${f.wide ? ' wide' : ''}`}
              >
                {body}
              </Link>
            ) : (
              <article key={f.id} className={`hud-panel feature-card${f.wide ? ' wide' : ''}`}>
                {body}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
