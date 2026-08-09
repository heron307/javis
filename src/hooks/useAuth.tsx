import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Provider, Session, User } from '@supabase/supabase-js'
import { syncOnLogin } from '../lib/cloudSync'
import { getSupabase, isCloudConfigured } from '../lib/supabase'

export type OAuthProvider = Extract<Provider, 'github' | 'google'>

type AuthContextValue = {
  configured: boolean
  loading: boolean
  session: Session | null
  user: User | null
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>
  signInWithGitHub: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  syncing: boolean
  lastSyncAt: string | null
  syncError: string | null
  /** 수동/포커스 동기화 (로컬↔클라우드 병합) */
  resync: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isCloudConfigured()
  const [loading, setLoading] = useState(configured)
  const [session, setSession] = useState<Session | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const initialSyncDoneRef = useRef(false)
  const syncingRef = useRef(false)

  const runLoginSync = useCallback(async (opts?: { forceReload?: boolean }) => {
    if (syncingRef.current) return
    syncingRef.current = true
    setSyncing(true)
    setSyncError(null)
    try {
      const result = await syncOnLogin()
      setLastSyncAt(new Date().toISOString())
      initialSyncDoneRef.current = true
      // 클라우드·로컬 병합으로 로컬이 바뀌면 캐시 갱신 위해 홈으로 이동
      if (result === 'pulled' || opts?.forceReload) {
        window.setTimeout(() => {
          window.location.assign(`${window.location.origin}/`)
        }, 350)
      }
    } catch (err) {
      console.error(err)
      setSyncError(err instanceof Error ? err.message : '동기화 실패')
      // 실패 시 다음 포커스/재시도 가능
      initialSyncDoneRef.current = false
    } finally {
      syncingRef.current = false
      setSyncing(false)
    }
  }, [])

  const resync = useCallback(async () => {
    await runLoginSync()
  }, [runLoginSync])

  useEffect(() => {
    if (!configured) {
      setLoading(false)
      return
    }
    const supabase = getSupabase()
    if (!supabase) {
      setLoading(false)
      return
    }

    let cancelled = false

    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return
      setSession(data.session)
      setLoading(false)
      if (data.session?.user && !initialSyncDoneRef.current) {
        await runLoginSync()
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, next) => {
      setSession(next)
      if (event === 'SIGNED_IN' && next?.user) {
        initialSyncDoneRef.current = false
        await runLoginSync()
      }
      if (event === 'SIGNED_OUT') {
        initialSyncDoneRef.current = false
        setLastSyncAt(null)
      }
    })

    let focusTimer: ReturnType<typeof setTimeout> | null = null
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      if (!initialSyncDoneRef.current) return
      if (focusTimer) clearTimeout(focusTimer)
      focusTimer = setTimeout(() => {
        focusTimer = null
        void supabase.auth.getSession().then(({ data }) => {
          if (data.session?.user) void runLoginSync()
        })
      }, 400)
    }

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)

    return () => {
      cancelled = true
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
      if (focusTimer) clearTimeout(focusTimer)
    }
  }, [configured, runLoginSync])

  const signInWithOAuth = useCallback(async (provider: OAuthProvider) => {
    const supabase = getSupabase()
    if (!supabase) throw new Error('클라우드가 설정되지 않았습니다.')
    const redirectTo = `${window.location.origin}/`
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        queryParams:
          provider === 'google'
            ? { access_type: 'offline', prompt: 'consent' }
            : undefined,
      },
    })
    if (error) throw error
  }, [])

  const signInWithGitHub = useCallback(
    () => signInWithOAuth('github'),
    [signInWithOAuth],
  )

  const signInWithGoogle = useCallback(
    () => signInWithOAuth('google'),
    [signInWithOAuth],
  )

  const signOut = useCallback(async () => {
    const supabase = getSupabase()
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setLastSyncAt(null)
    initialSyncDoneRef.current = false
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      loading,
      session,
      user: session?.user ?? null,
      signInWithOAuth,
      signInWithGitHub,
      signInWithGoogle,
      signOut,
      syncing,
      lastSyncAt,
      syncError,
      resync,
    }),
    [
      configured,
      loading,
      session,
      signInWithOAuth,
      signInWithGitHub,
      signInWithGoogle,
      signOut,
      syncing,
      lastSyncAt,
      syncError,
      resync,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}

/** GitHub / Google 공통 표시 이름 */
export function displayAuthName(user: User | null | undefined): string | null {
  if (!user) return null
  const meta = user.user_metadata || {}
  return (
    (meta.user_name as string | undefined) ||
    (meta.preferred_username as string | undefined) ||
    (meta.full_name as string | undefined) ||
    (meta.name as string | undefined) ||
    user.email?.split('@')[0] ||
    user.id
  )
}
