import { useState } from 'react'
import { pullCloudBackup, pushCloudBackup } from '../lib/cloudSync'
import { useAuth } from '../hooks/useAuth'

export function CloudAccountPanel() {
  const {
    configured,
    loading,
    user,
    signInWithGitHub,
    signOut,
    syncing,
    lastSyncAt,
    syncError,
  } = useAuth()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  if (!configured) {
    return (
      <div className="cloud-account">
        <p className="section-code">// CLOUD SYNC</p>
        <p className="cloud-account-hint">
          GitHub 로그인 동기화가 아직 설정되지 않았습니다. 프로젝트 루트의{' '}
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

  async function handleLogin() {
    setError('')
    try {
      await signInWithGitHub()
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
      '클라우드 데이터로 현재 브라우저 데이터를 덮어씁니다. 계속할까요?',
    )
    if (!ok) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const { applied, updatedAt } = await pullCloudBackup()
      if (!applied) {
        setMessage('클라우드에 저장된 데이터가 없습니다. 먼저 업로드하세요.')
        return
      }
      setMessage(`다운로드 완료 · ${updatedAt?.slice(0, 19).replace('T', ' ')} · 새로고침…`)
      window.setTimeout(() => window.location.reload(), 400)
    } catch (err) {
      setError(err instanceof Error ? err.message : '다운로드 실패')
    } finally {
      setBusy(false)
    }
  }

  const login = user?.user_metadata?.user_name || user?.email || user?.id

  return (
    <div className="cloud-account">
      <p className="section-code">// CLOUD SYNC · GITHUB</p>
      {!user ? (
        <>
          <p className="cloud-account-hint">
            GitHub로 로그인하면 어디서든 같은 개인 데이터를 불러올 수 있습니다.
          </p>
          <button type="button" className="btn-primary" onClick={handleLogin}>
            GitHub로 로그인
          </button>
        </>
      ) : (
        <>
          <p className="cloud-account-user font-mono">
            @{login}
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
              클라우드에서 불러오기
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
