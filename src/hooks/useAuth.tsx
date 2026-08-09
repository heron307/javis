import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
        window.setTimeout(() => {
          window.location.assign(`${window.location.origin}/`)
        }, 350)
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

  const signInWithOAuth = useCallback(async (provider: OAuthProvider) => {
    const supabase = getSupabase()
    if (!supabase) throw new Error('클라우드가 설정되지 않았습니다.')
    const redirectTo = `${window.location.origin}${window.location.pathname}`
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
