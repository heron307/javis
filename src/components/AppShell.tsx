import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth, displayAuthName } from '../hooks/useAuth'
import { BackupRestoreModal } from './BackupRestoreModal'

type Props = {
  children: ReactNode
  statusLabel?: string
}

const NAV_ITEMS = [
  { to: '/', end: true, en: 'Home', ko: '홈' },
  { to: '/logs', en: 'Travel Log', ko: '여행 기록' },
  { to: '/missions', en: 'Mission Plan', ko: '미션 플랜' },
  { to: '/flights', en: 'Flight Scan', ko: '항공 스캔' },
  { to: '/stays', en: 'Stay Scan', ko: '숙소 스캔' },
  { to: '/geo', en: 'Geo Intel', ko: '지리 인텔' },
] as const

export function AppShell({ children, statusLabel = 'ONLINE' }: Props) {
  const [backupOpen, setBackupOpen] = useState(false)
  const { configured, user } = useAuth()
  const accountName = displayAuthName(user)

  return (
    <div className="app-shell">
      <div className="scanlines" aria-hidden />

      <nav className="nav">
        <div className="container nav-inner">
          <Link to="/" className="nav-brand glow-text">
            <span className="nav-brand-dot" />
            J.A.V.I.S.
          </Link>

          <ul className="nav-links">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={'end' in item ? item.end : undefined}
                  className="nav-link"
                  data-en={item.en}
                  data-ko={item.ko}
                  aria-label={item.ko}
                >
                  <span className="nav-link-en">{item.en}</span>
                  <span className="nav-link-ko" aria-hidden>
                    {item.ko}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="nav-status">
            {configured && accountName && (
              <span className="nav-gh-user font-mono" title="로그인됨">
                {accountName}
              </span>
            )}
            <button
              type="button"
              className="nav-backup-btn"
              onClick={() => setBackupOpen(true)}
              title="데이터 백업 · 복구 · 클라우드"
            >
              <span className="nav-link-en">ARCHIVE</span>
              <span className="nav-link-ko" aria-hidden>
                보관함
              </span>
            </button>
            <span>SYS</span>
            <div className="nav-status-bar">
              <span />
            </div>
            <span>{statusLabel}</span>
          </div>
        </div>
      </nav>

      {children}

      <BackupRestoreModal open={backupOpen} onClose={() => setBackupOpen(false)} />
    </div>
  )
}
