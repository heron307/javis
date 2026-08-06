import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { syncOnLogin } from '../lib/cloudSync'
import { getSupabase, isCloudConfigured } from '../lib/supabase'

type AuthContextValue = {
  configured: boolean
  loading: boolean
  session: Session | null
  user: User | null
  signInWithGitHub: () => Promise<void>
  signOut: () => Promise<void>
  syncing: boolean
  lastSyncAt: string | null
  syncError: string | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isCloudConfigured()
  const [loading, setLoading] = useState(configured)
  const [session, setSession] = useState<Session | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  const runLoginSync = useCallback(async () => {
    setSyncing(true)
    setSyncError(null)
    try {
      const result = await syncOnLogin()
      setLastSyncAt(new Date().toISOString())
      if (result === 'pulled') {
        // 모듈 캐시 갱신을 위해 새로고침
        window.setTimeout(() => window.location.reload(), 350)
      }
    } catch (err) {
      console.error(err)
      setSyncError(err instanceof Error ? err.message : '동기화 실패')
    } finally {
      setSyncing(false)
    }
  }, [])

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

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, next) => {
      setSession(next)
      if (event === 'SIGNED_IN') {
        await runLoginSync()
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [configured, runLoginSync])

  const signInWithGitHub = useCallback(async () => {
    const supabase = getSupabase()
    if (!supabase) throw new Error('클라우드가 설정되지 않았습니다.')
    const redirectTo = `${window.location.origin}${window.location.pathname}`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo },
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    const supabase = getSupabase()
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setLastSyncAt(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      loading,
      session,
      user: session?.user ?? null,
      signInWithGitHub,
      signOut,
      syncing,
      lastSyncAt,
      syncError,
    }),
    [
      configured,
      loading,
      session,
      signInWithGitHub,
      signOut,
      syncing,
      lastSyncAt,
      syncError,
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
