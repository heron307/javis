import { useState } from 'react'
import { pullCloudBackup, pushCloudBackup } from '../lib/cloudSync'
import { displayAuthName, useAuth } from '../hooks/useAuth'

export function CloudAccountPanel() {
  const {
    configured,
    loading,
    user,
    signInWithGitHub,
    signInWithGoogle,
    signOut,
    syncing,
    lastSyncAt,
    syncError,
    resync,
  } = useAuth()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  if (!configured) {
    return (
      <div className="cloud-account">
        <p className="section-code">// CLOUD SYNC</p>
        <p className="cloud-account-hint">
          클라우드 로그인이 아직 설정되지 않았습니다. 프로젝트 루트의{' '}
          <code>.env</code>에 Supabase 키를 넣고,{' '}
          <code>supabase/schema.sql</code>을 실행하세요.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="cloud-account">
        <p className="cloud-account-hint">계정 확인 중…</p>
      </div>
    )
  }

  async function handleLogin(provider: 'github' | 'google') {
    setError('')
    try {
      if (provider === 'google') await signInWithGoogle()
      else await signInWithGitHub()
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인 실패')
    }
  }

  async function handleLogout() {
    setError('')
    try {
      await signOut()
      setMessage('로그아웃되었습니다.')
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그아웃 실패')
    }
  }

  async function handlePush() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const { updatedAt } = await pushCloudBackup()
      setMessage(`클라우드 업로드 완료 · ${updatedAt.slice(0, 19).replace('T', ' ')}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드 실패')
    } finally {
      setBusy(false)
    }
  }

  async function handlePull() {
    const ok = window.confirm(
      '클라우드와 이 브라우저 데이터를 합칩니다(장소 등 id 기준). 계속할까요?',
    )
    if (!ok) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const { applied, changed, updatedAt } = await pullCloudBackup()
      if (!applied) {
        setMessage('클라우드에 저장된 데이터가 없습니다. 먼저 업로드하세요.')
        return
      }
      if (!changed) {
        setMessage(
          `이미 최신입니다 · ${updatedAt?.slice(0, 19).replace('T', ' ')}`,
        )
        return
      }
      setMessage(`병합 완료 · ${updatedAt?.slice(0, 19).replace('T', ' ')} · 새로고침…`)
      window.setTimeout(() => {
        window.location.assign(`${window.location.origin}/`)
      }, 400)
    } catch (err) {
      setError(err instanceof Error ? err.message : '다운로드 실패')
    } finally {
      setBusy(false)
    }
  }

  async function handleResync() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await resync()
      setMessage('동기화(병합) 요청 완료')
    } catch (err) {
      setError(err instanceof Error ? err.message : '동기화 실패')
    } finally {
      setBusy(false)
    }
  }

  const login = displayAuthName(user)

  return (
    <div className="cloud-account">
      <p className="section-code">// CLOUD SYNC · OAUTH</p>
      {!user ? (
        <>
          <p className="cloud-account-hint">
            Google 또는 GitHub로 로그인하면 기기·브라우저 데이터를 합쳐(병합)
            같은 Geo / Travel / Mission 목록을 유지합니다.
          </p>
          <div className="cloud-account-actions">
            <button
              type="button"
              className="btn-primary cloud-login-google"
              onClick={() => handleLogin('google')}
            >
              Google로 로그인
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => handleLogin('github')}
            >
              GitHub로 로그인
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="cloud-account-user font-mono">
            {login}
            {syncing ? ' · syncing…' : ''}
          </p>
          {lastSyncAt && (
            <p className="cloud-account-hint">
              최근 동기화 {lastSyncAt.slice(0, 19).replace('T', ' ')}
            </p>
          )}
          <div className="cloud-account-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={handleResync}
              disabled={busy || syncing}
            >
              지금 동기화
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={handlePush}
              disabled={busy || syncing}
            >
              클라우드에 저장
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={handlePull}
              disabled={busy || syncing}
            >
              클라우드와 병합
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={handleLogout}
              disabled={busy}
            >
              로그아웃
            </button>
          </div>
        </>
      )}
      {(message || syncError || error) && (
        <p className={error || syncError ? 'form-error' : 'place-search-scope'}>
          {error || syncError || message}
        </p>
      )}
    </div>
  )
}
