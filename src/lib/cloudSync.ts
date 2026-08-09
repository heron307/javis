import {
  applyBackup,
  buildBackup,
  type JavisBackupFile,
} from './dataBackup'
import { getSupabase, isCloudConfigured } from './supabase'

export type CloudSyncStatus =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'ready'; updatedAt: string | null }
  | { state: 'error'; message: string }

type UserDataRow = {
  user_id: string
  payload: JavisBackupFile
  updated_at: string
}

/** pull 적용 중에는 자동 push 하지 않음 */
let suppressCloudPush = false
let pushTimer: ReturnType<typeof setTimeout> | null = null
let pushInFlight: Promise<void> | null = null

async function hasSessionUser(): Promise<boolean> {
  const supabase = getSupabase()
  if (!supabase) return false
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return Boolean(session?.user)
}

/** 현재 로컬 데이터를 클라우드에 저장 (로그인 사용자 전용) */
export async function pushCloudBackup(): Promise<{ updatedAt: string }> {
  const supabase = getSupabase()
  if (!supabase) throw new Error('클라우드가 설정되지 않았습니다.')

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()
  if (userErr) throw userErr
  if (!user) throw new Error('로그인이 필요합니다.')

  const payload = buildBackup()
  const { data, error } = await supabase
    .from('javis_user_data')
    .upsert(
      {
        user_id: user.id,
        payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select('updated_at')
    .single()

  if (error) throw error
  return { updatedAt: data.updated_at }
}

/**
 * 로컬 데이터가 바뀌면 잠시 후 클라우드에 자동 업로드.
 * (로그인 상태일 때만)
 */
export function queueCloudPush(delayMs = 1200): void {
  if (suppressCloudPush) return
  if (!isCloudConfigured()) return

  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    pushTimer = null
    void (async () => {
      try {
        if (!(await hasSessionUser())) return
        if (suppressCloudPush) return
        pushInFlight = pushCloudBackup()
          .then(() => undefined)
          .catch((err) => {
            console.warn('[javis] cloud auto-push failed', err)
          })
          .finally(() => {
            pushInFlight = null
          })
        await pushInFlight
      } catch (err) {
        console.warn('[javis] cloud auto-push skipped', err)
      }
    })()
  }, delayMs)
}

/** 클라우드 데이터를 로컬에 적용. 적용 후 페이지 새로고침 권장 */
export async function pullCloudBackup(): Promise<{
  applied: boolean
  changed: boolean
  updatedAt: string | null
}> {
  const supabase = getSupabase()
  if (!supabase) throw new Error('클라우드가 설정되지 않았습니다.')

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()
  if (userErr) throw userErr
  if (!user) throw new Error('로그인이 필요합니다.')

  const { data, error } = await supabase
    .from('javis_user_data')
    .select('payload, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error
  if (!data?.payload) {
    return { applied: false, changed: false, updatedAt: null }
  }

  const payload = data.payload as JavisBackupFile
  if (!payload?.data || typeof payload.data !== 'object') {
    throw new Error('클라우드 데이터 형식이 올바르지 않습니다.')
  }

  const before = JSON.stringify(buildBackup().data)
  const incoming = JSON.stringify(payload.data)
  const changed = before !== incoming

  suppressCloudPush = true
  try {
    applyBackup(payload)
  } finally {
    // 다음 tick까지 push 억제 (save 연쇄 방지)
    window.setTimeout(() => {
      suppressCloudPush = false
    }, 500)
  }

  return { applied: true, changed, updatedAt: data.updated_at }
}

export async function fetchCloudMeta(): Promise<{ updatedAt: string | null }> {
  const supabase = getSupabase()
  if (!supabase || !isCloudConfigured()) return { updatedAt: null }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { updatedAt: null }

  const { data, error } = await supabase
    .from('javis_user_data')
    .select('updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error
  return { updatedAt: (data as UserDataRow | null)?.updated_at ?? null }
}

/**
 * 로그인/세션 복원 시 동기화:
 * - 클라우드에 데이터 있으면 pull (기기 간 동일 결과)
 * - 없으면 현재 로컬을 push
 */
export async function syncOnLogin(): Promise<
  'pulled' | 'unchanged' | 'pushed' | 'noop'
> {
  const supabase = getSupabase()
  if (!supabase) return 'noop'

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return 'noop'

  const { data, error } = await supabase
    .from('javis_user_data')
    .select('payload, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error

  if (data?.payload && typeof data.payload === 'object' && 'data' in data.payload) {
    const payload = data.payload as JavisBackupFile
    const before = JSON.stringify(buildBackup().data)
    const incoming = JSON.stringify(payload.data)
    if (before === incoming) return 'unchanged'

    suppressCloudPush = true
    try {
      applyBackup(payload)
    } finally {
      window.setTimeout(() => {
        suppressCloudPush = false
      }, 500)
    }
    return 'pulled'
  }

  await pushCloudBackup()
  return 'pushed'
}
