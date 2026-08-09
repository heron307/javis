import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  applyBackup,
  readBackupFile,
  saveBackup,
  summarizeLocalData,
  type BackupSummary,
  type JavisBackupFile,
} from '../lib/dataBackup'
import { CloudAccountPanel } from './CloudAccountPanel'

type Props = {
  open: boolean
  onClose: () => void
}

export function BackupRestoreModal({ open, onClose }: Props) {
  const titleId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [localSummary, setLocalSummary] = useState<BackupSummary[]>([])
  const [pending, setPending] = useState<JavisBackupFile | null>(null)
  const [pendingSummary, setPendingSummary] = useState<BackupSummary[]>([])
  const [fileName, setFileName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setLocalSummary(summarizeLocalData())
    setPending(null)
    setPendingSummary([])
    setFileName('')
    setMessage('')
    setError('')
    setBusy(false)
  }, [open])

  const localCounts = useMemo(() => {
    const places = localSummary.find((s) => s.key === 'javis.geo.places.v1')
    const visits = localSummary.find((s) => s.key === 'javis.travel.visits.v1')
    const missions = localSummary.find((s) => s.key === 'javis.missions.v1')
    return {
      places: places?.count ?? 0,
      visits: visits?.count ?? 0,
      missions: missions?.count ?? 0,
    }
  }, [localSummary])

  if (!open) return null

  async function handleBackup() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await saveBackup()
      if (!result.ok) {
        if (!result.cancelled) setError(result.error)
        return
      }
      setMessage(
        result.method === 'picker'
          ? `저장 완료: ${result.name}`
          : `다운로드 폴더로 저장됨: ${result.name}`,
      )
      setLocalSummary(summarizeLocalData())
    } catch (err) {
      console.error(err)
      setError('백업 파일 저장에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await readBackupFile(file)
      if (!result.ok) {
        setPending(null)
        setPendingSummary([])
        setFileName('')
        setError(result.error)
        return
      }
      setPending(result.backup)
      setPendingSummary(result.summary)
      setFileName(file.name)
      setMessage(
        `복구 준비 완료 · ${result.backup.exportedAt.slice(0, 19).replace('T', ' ')} 백업`,
      )
    } catch (err) {
      console.error(err)
      setError('백업 파일을 읽는 중 오류가 발생했습니다.')
    } finally {
      setBusy(false)
    }
  }

  function handleRestore() {
    if (!pending) {
      setError('먼저 백업 파일을 선택하세요.')
      return
    }
    const ok = window.confirm(
      '현재 브라우저에 저장된 데이터를 백업 파일 내용으로 덮어씁니다.\n복구 후 페이지가 새로고침됩니다. 계속할까요?',
    )
    if (!ok) return

    try {
      setBusy(true)
      const { appliedKeys } = applyBackup(pending)
      setMessage(`${appliedKeys.length}개 항목 복구 완료. 새로고침 중…`)
      window.setTimeout(() => {
        // SPA 경로(/missions 등)에서 reload 시 호스팅 404를 피하기 위해 홈으로 이동
        window.location.assign(`${window.location.origin}/`)
      }, 400)
    } catch (err) {
      console.error(err)
      setBusy(false)
      setError('복구에 실패했습니다.')
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-panel hud-panel backup-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="hud-corner tl" />
        <span className="hud-corner tr" />
        <span className="hud-corner bl" />
        <span className="hud-corner br" />

        <div className="modal-header">
          <div>
            <p className="section-code">// DATA ARCHIVE</p>
            <h2 id={titleId} className="modal-title glow-text">
              데이터 백업 · 복구
            </h2>
          </div>
          <button type="button" className="btn-ghost modal-close" onClick={onClose}>
            CLOSE
          </button>
        </div>

        <p className="page-desc" style={{ marginBottom: '1rem' }}>
          Google/GitHub로 앱에 로그인하면 기기 간 동기화(삭제 포함)가 가능합니다.
          JSON 파일로도 백업·복구할 수 있습니다.
        </p>

        <section className="backup-section">
          <CloudAccountPanel />
        </section>

        <div className="backup-stats">
          <div className="stat-chip hud-panel">
            <span className="stat-chip-label">PLACES</span>
            <span className="stat-chip-value">{localCounts.places}</span>
          </div>
          <div className="stat-chip hud-panel">
            <span className="stat-chip-label">VISITS</span>
            <span className="stat-chip-value">{localCounts.visits}</span>
          </div>
          <div className="stat-chip hud-panel">
            <span className="stat-chip-label">MISSIONS</span>
            <span className="stat-chip-value">{localCounts.missions}</span>
          </div>
        </div>

        <section className="backup-section">
          <p className="mini-panel-title">BACKUP</p>
          <p className="backup-hint">
            저장할 폴더와 파일명을 선택한 뒤 JSON으로 내보냅니다. (Chrome · Edge 권장)
          </p>
          <button type="button" className="btn-primary" onClick={handleBackup} disabled={busy}>
            {busy ? '저장 중…' : '백업 파일 저장'}
          </button>
        </section>

        <section className="backup-section">
          <p className="mini-panel-title">RESTORE</p>
          <p className="backup-hint">백업 JSON을 선택하고 복구를 실행하세요.</p>
          <div className="backup-restore-row">
            <button
              type="button"
              className="btn-ghost"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              파일 선택
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={handleFile}
            />
            <span className="backup-filename font-mono">
              {fileName || '선택된 파일 없음'}
            </span>
          </div>

          {pendingSummary.some((s) => s.present) && (
            <ul className="backup-key-list">
              {pendingSummary
                .filter((s) => s.present)
                .map((s) => (
                  <li key={s.key}>
                    <span>{s.label}</span>
                    <span className="font-mono">
                      {s.count != null ? `${s.count}` : 'ok'}
                    </span>
                  </li>
                ))}
            </ul>
          )}

          <button
            type="button"
            className="btn-primary"
            onClick={handleRestore}
            disabled={busy || !pending}
          >
            {busy ? '처리 중…' : '복구 실행'}
          </button>
        </section>

        {message && <p className="place-search-scope">{message}</p>}
        {error && <p className="form-error">{error}</p>}
      </div>
    </div>
  )
}
