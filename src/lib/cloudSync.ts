import {
  applyBackup,
  backupDataEqual,
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

/** 로컬 데이터가 마지막으로 바뀐 시각 (삭제 포함). LWW 비교용 */
const LOCAL_REVISED_KEY = 'javis.sync.localRevisedAt'

/** pull 적용 중에는 자동 push 하지 않음 */
let suppressCloudPush = false
let pushTimer: ReturnType<typeof setTimeout> | null = null
let pushInFlight: Promise<void> | null = null
let syncInFlight: Promise<'pulled' | 'unchanged' | 'pushed' | 'noop'> | null =
  null

async function hasSessionUser(): Promise<boolean> {
  const supabase = getSupabase()
  if (!supabase) return false
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return Boolean(session?.user)
}

function withPushSuppressed<T>(fn: () => T): T {
  suppressCloudPush = true
  try {
    return fn()
  } finally {
    window.setTimeout(() => {
      suppressCloudPush = false
    }, 800)
  }
}

export function getLocalRevisedAt(): string | null {
  return localStorage.getItem(LOCAL_REVISED_KEY)
}

/** 로컬 저장(추가·수정·삭제) 시 호출 — 클라우드보다 최신인지 판단 */
export function touchLocalRevision(iso = new Date().toISOString()): void {
  localStorage.setItem(LOCAL_REVISED_KEY, iso)
}

function setLocalRevisedAt(iso: string): void {
  localStorage.setItem(LOCAL_REVISED_KEY, iso)
}

function parseTime(iso: string | null | undefined): number {
  if (!iso) return 0
  const t = Date.parse(iso)
  return Number.isNaN(t) ? 0 : t
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
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('javis_user_data')
    .upsert(
      {
        user_id: user.id,
        payload,
        updated_at: now,
      },
      { onConflict: 'user_id' },
    )
    .select('updated_at')
    .single()

  if (error) throw error
  // 푸시 성공 후 로컬 리비전을 클라우드 시각에 맞춤 (삭제 반영본이 기준)
  setLocalRevisedAt(data.updated_at)
  return { updatedAt: data.updated_at }
}

/**
 * 로컬 데이터가 바뀌면 잠시 후 클라우드에 자동 업로드.
 * (로그인 상태일 때만)
 */
export function queueCloudPush(delayMs = 1200): void {
  if (suppressCloudPush) return
  if (!isCloudConfigured()) return

  touchLocalRevision()

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

/**
 * 클라우드로 로컬을 덮어씀 (삭제 포함).
 * 적용 후 페이지 새로고침 권장.
 */
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

  const local = buildBackup()
  const changed = !backupDataEqual(local.data, payload.data)

  if (changed) {
    withPushSuppressed(() => {
      applyBackup(payload)
    })
  }
  setLocalRevisedAt(data.updated_at)

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
 * 로그인/포커스 동기화 — 마지막 저장 시각 기준(LWW).
 * 로컬이 더 최신이면 push(삭제 포함), 클라우드가 같거나 더 최신이면 pull.
 */
export async function syncOnLogin(): Promise<
  'pulled' | 'unchanged' | 'pushed' | 'noop'
> {
  if (syncInFlight) return syncInFlight

  syncInFlight = (async () => {
    const supabase = getSupabase()
    if (!supabase) return 'noop'

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return 'noop'

    if (pushInFlight) {
      try {
        await pushInFlight
      } catch {
        /* ignore */
      }
    }

    const { data, error } = await supabase
      .from('javis_user_data')
      .select('payload, updated_at')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) throw error

    const local = buildBackup()
    const localTime = parseTime(getLocalRevisedAt())

    if (
      !data?.payload ||
      typeof data.payload !== 'object' ||
      !('data' in data.payload)
    ) {
      await pushCloudBackup()
      return 'pushed'
    }

    const remote = data.payload as JavisBackupFile
    const cloudTime = parseTime(data.updated_at)
    const same = backupDataEqual(local.data, remote.data)

    if (same) {
      setLocalRevisedAt(data.updated_at)
      return 'unchanged'
    }

    // 로컬 수정(삭제 포함)이 클라우드보다 늦으면 로컬이 이김
    if (localTime > cloudTime) {
      await pushCloudBackup()
      return 'pushed'
    }

    // 클라우드가 같거나 더 최신 → 덮어쓰기 (원격 삭제 반영)
    withPushSuppressed(() => {
      applyBackup(remote)
    })
    setLocalRevisedAt(data.updated_at)
    return 'pulled'
  })()

  try {
    return await syncInFlight
  } finally {
    syncInFlight = null
  }
}
