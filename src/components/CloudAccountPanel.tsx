import { useState } from 'react'
import { pullCloudBackup, pushCloudBackup } from '../lib/cloudSync'
import {
  displayAuthName,
  displayAuthProvider,
  useAuth,
} from '../hooks/useAuth'

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
    authError,
    clearAuthError,
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
      '클라우드 데이터로 이 브라우저를 덮어씁니다(삭제 포함). 계속할까요?',
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
      setMessage(`불러오기 완료 · ${updatedAt?.slice(0, 19).replace('T', ' ')}`)
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
      setMessage('동기화 요청 완료 (최신 저장본 기준 · 삭제 반영)')
    } catch (err) {
      setError(err instanceof Error ? err.message : '동기화 실패')
    } finally {
      setBusy(false)
    }
  }

  const login = displayAuthName(user)
  const provider = displayAuthProvider(user)

  return (
    <div className="cloud-account">
      <p className="section-code">// CLOUD SYNC · OAUTH</p>
      {!user ? (
        <>
          <p className="cloud-account-hint">
            Google 또는 GitHub로 <strong>앱에 로그인</strong>해야 동기화 버튼이
            나타납니다. (브라우저에 Google 계정이 있어도 J.A.V.I.S. 로그인과는
            별개입니다.)
          </p>
          {(authError || error) && (
            <p className="form-error" role="alert">
              {authError || error}
              {authError ? (
                <>
                  {' '}
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ marginLeft: '0.35rem' }}
                    onClick={clearAuthError}
                  >
                    닫기
                  </button>
                </>
              ) : null}
            </p>
          )}
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
          <p className="cloud-account-hint">
            로그인 후에도 ‘로그인 안 됨’이면 Supabase → Authentication → URL
            Configuration에 Site URL·Redirect URLs로{' '}
            <code>{typeof window !== 'undefined' ? window.location.origin : 'https://…'}</code>
            가 등록돼 있는지 확인하세요.
          </p>
        </>
      ) : (
        <>
          <p className="cloud-account-user font-mono">
            {provider ? `${provider} · ` : ''}
            {login}
            {user.email ? ` · ${user.email}` : ''}
            {syncing ? ' · syncing…' : ''}
          </p>
          <p className="cloud-account-hint">
            동기화는 <strong>마지막에 저장된 쪽</strong>이 기준입니다. 한쪽에서
            삭제한 장소도 클라우드에 반영되면 다른 브라우저에서 사라집니다.
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
      {(message || syncError || error || (user && authError)) && (
        <p className={error || syncError || authError ? 'form-error' : 'place-search-scope'}>
          {error || syncError || (user ? authError : null) || message}
        </p>
      )}
    </div>
  )
}
