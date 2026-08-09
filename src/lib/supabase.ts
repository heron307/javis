import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export function isCloudConfigured(): boolean {
  return Boolean(url?.trim() && anonKey?.trim())
}

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (!isCloudConfigured()) return null
  if (!client) {
    client = createClient(url!.trim(), anonKey!.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // PKCE 코드 교환은 useAuth에서 직접 처리 (실패 시 세션 삭제 버그 회피)
        detectSessionInUrl: false,
        flowType: 'pkce',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    })
  }
  return client
}

/** OAuth 리다이렉트 URL의 error / code 파싱 */
export function readOAuthCallback(): {
  code: string | null
  error: string | null
} {
  if (typeof window === 'undefined') return { code: null, error: null }

  const query = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))

  const error =
    query.get('error_description') ||
    query.get('error') ||
    hash.get('error_description') ||
    hash.get('error')

  const code = query.get('code') || hash.get('code')

  return {
    code: code?.trim() || null,
    error: error ? decodeURIComponent(error.replace(/\+/g, ' ')) : null,
  }
}

export function clearOAuthParamsFromUrl(): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  const keys = [
    'code',
    'error',
    'error_description',
    'error_code',
    'state',
    'access_token',
    'refresh_token',
    'expires_in',
    'token_type',
    'provider_token',
    'provider_refresh_token',
  ]
  let changed = false
  for (const key of keys) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key)
      changed = true
    }
  }
  if (url.hash && /access_token|error|code=/.test(url.hash)) {
    url.hash = ''
    changed = true
  }
  if (changed) {
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}`)
  }
}
