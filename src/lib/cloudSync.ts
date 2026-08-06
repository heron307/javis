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

/** 클라우드 데이터를 로컬에 적용. 적용 후 페이지 새로고침 권장 */
export async function pullCloudBackup(): Promise<{
  applied: boolean
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
    return { applied: false, updatedAt: null }
  }

  const payload = data.payload as JavisBackupFile
  if (!payload?.data || typeof payload.data !== 'object') {
    throw new Error('클라우드 데이터 형식이 올바르지 않습니다.')
  }

  applyBackup(payload)
  return { applied: true, updatedAt: data.updated_at }
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
 * 로그인 직후 동기화:
 * - 클라우드에 데이터 있으면 pull
 * - 없으면 현재 로컬을 push
 */
export async function syncOnLogin(): Promise<'pulled' | 'pushed' | 'noop'> {
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
    applyBackup(data.payload as JavisBackupFile)
    return 'pulled'
  }

  await pushCloudBackup()
  return 'pushed'
}
