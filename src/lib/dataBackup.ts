/** J.A.V.I.S. localStorage 백업 · 복구 */

export const BACKUP_FORMAT = 'javis-backup' as const
export const BACKUP_VERSION = 1 as const

/** 백업 대상 키 (앱 데이터) */
export const BACKUP_KEYS = [
  'javis.geo.places.v1',
  'javis.geo.categories.v1',
  'javis.geo.listView',
  'javis.travel.visits.v1',
  'javis.missions.v1',
  'javis.flight.scans.v1',
  'javis.stay.scans.v1',
] as const

export type BackupKey = (typeof BACKUP_KEYS)[number]

export type JavisBackupFile = {
  format: typeof BACKUP_FORMAT
  version: typeof BACKUP_VERSION
  exportedAt: string
  app: 'J.A.V.I.S.'
  data: Partial<Record<BackupKey, unknown>>
}

export type BackupSummary = {
  key: BackupKey
  label: string
  count: number | null
  present: boolean
}

const KEY_LABELS: Record<BackupKey, string> = {
  'javis.geo.places.v1': 'Geo Places',
  'javis.geo.categories.v1': 'Geo Categories',
  'javis.geo.listView': 'Geo List View',
  'javis.travel.visits.v1': 'Travel Visits',
  'javis.missions.v1': 'Missions',
  'javis.flight.scans.v1': 'Flight Scans',
  'javis.stay.scans.v1': 'Stay Scans',
}

function countItems(value: unknown): number | null {
  if (Array.isArray(value)) return value.length
  if (typeof value === 'string') return null
  return null
}

export function summarizeLocalData(): BackupSummary[] {
  return BACKUP_KEYS.map((key) => {
    const raw = localStorage.getItem(key)
    let count: number | null = null
    let present = false
    if (raw != null) {
      present = true
      try {
        count = countItems(JSON.parse(raw))
      } catch {
        count = null
      }
    }
    return { key, label: KEY_LABELS[key], count, present }
  })
}

export function buildBackup(): JavisBackupFile {
  const data: JavisBackupFile['data'] = {}
  for (const key of BACKUP_KEYS) {
    const raw = localStorage.getItem(key)
    if (raw == null) continue
    try {
      data[key] = JSON.parse(raw)
    } catch {
      data[key] = raw
    }
  }
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'J.A.V.I.S.',
    data,
  }
}

export function backupFilename(exportedAt = new Date()): string {
  const stamp = exportedAt
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19)
  return `javis-backup_${stamp}.json`
}

export type SaveBackupResult =
  | { ok: true; method: 'picker' | 'download'; name: string }
  | { ok: false; cancelled: true }
  | { ok: false; cancelled: false; error: string }

function backupBlob(backup: JavisBackupFile): Blob {
  return new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
}

/** 폴더/파일 위치 선택 없이 브라우저 기본 다운로드 */
function downloadBackupFallback(backup: JavisBackupFile, name: string): void {
  const url = URL.createObjectURL(backupBlob(backup))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

type SaveFilePickerOptions = {
  suggestedName?: string
  types?: Array<{
    description?: string
    accept: Record<string, string[]>
  }>
}

type FileSystemWritableFileStream = {
  write: (data: Blob) => Promise<void>
  close: () => Promise<void>
}

type FileSystemFileHandle = {
  name: string
  createWritable: () => Promise<FileSystemWritableFileStream>
}

function getSaveFilePicker():
  | ((options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>)
  | undefined {
  const w = window as Window & {
    showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>
  }
  return typeof w.showSaveFilePicker === 'function' ? w.showSaveFilePicker.bind(w) : undefined
}

/**
 * 가능하면 저장 위치(폴더/파일명) 선택 대화상자를 띄우고,
 * 미지원 브라우저에서는 기본 다운로드로 저장합니다.
 */
export async function saveBackup(
  backup: JavisBackupFile = buildBackup(),
): Promise<SaveBackupResult> {
  const name = backupFilename(new Date(backup.exportedAt))
  const picker = getSaveFilePicker()

  if (picker) {
    try {
      const handle = await picker({
        suggestedName: name,
        types: [
          {
            description: 'J.A.V.I.S. Backup',
            accept: { 'application/json': ['.json'] },
          },
        ],
      })
      const writable = await handle.createWritable()
      await writable.write(backupBlob(backup))
      await writable.close()
      return { ok: true, method: 'picker', name: handle.name || name }
    } catch (err) {
      // 사용자가 취소한 경우
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { ok: false, cancelled: true }
      }
      // 권한/보안 이슈 등은 다운로드로 폴백
      console.warn('showSaveFilePicker failed, falling back to download', err)
    }
  }

  try {
    downloadBackupFallback(backup, name)
    return { ok: true, method: 'download', name }
  } catch (err) {
    console.error(err)
    return { ok: false, cancelled: false, error: '백업 파일 저장에 실패했습니다.' }
  }
}

/** @deprecated saveBackup 사용 권장 */
export async function downloadBackup(
  backup: JavisBackupFile = buildBackup(),
): Promise<SaveBackupResult> {
  return saveBackup(backup)
}

export type ParseBackupResult =
  | { ok: true; backup: JavisBackupFile; summary: BackupSummary[] }
  | { ok: false; error: string }

export function parseBackupJson(text: string): ParseBackupResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'JSON 파일이 아닙니다. 올바른 백업 파일을 선택하세요.' }
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: '백업 파일 형식이 올바르지 않습니다.' }
  }

  const obj = parsed as Record<string, unknown>

  // 정식 포맷
  if (obj.format === BACKUP_FORMAT) {
    if (typeof obj.version !== 'number' || obj.version > BACKUP_VERSION) {
      return { ok: false, error: '지원하지 않는 백업 버전입니다.' }
    }
    if (!obj.data || typeof obj.data !== 'object') {
      return { ok: false, error: '백업 데이터(data)가 없습니다.' }
    }
    const data = obj.data as JavisBackupFile['data']
    const known = BACKUP_KEYS.filter((k) => k in data)
    if (known.length === 0) {
      return { ok: false, error: '복구할 J.A.V.I.S. 데이터가 없습니다.' }
    }
    const backup: JavisBackupFile = {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt:
        typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString(),
      app: 'J.A.V.I.S.',
      data,
    }
    return {
      ok: true,
      backup,
      summary: BACKUP_KEYS.map((key) => ({
        key,
        label: KEY_LABELS[key],
        count: key in data ? countItems(data[key]) : null,
        present: key in data,
      })),
    }
  }

  // 느슨한 포맷: javis.* 키가 루트에 직접 있는 경우
  const loose: JavisBackupFile['data'] = {}
  for (const key of BACKUP_KEYS) {
    if (key in obj) loose[key] = obj[key]
  }
  if (Object.keys(loose).length > 0) {
    const backup: JavisBackupFile = {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      app: 'J.A.V.I.S.',
      data: loose,
    }
    return {
      ok: true,
      backup,
      summary: BACKUP_KEYS.map((key) => ({
        key,
        label: KEY_LABELS[key],
        count: key in loose ? countItems(loose[key]) : null,
        present: key in loose,
      })),
    }
  }

  return {
    ok: false,
    error: 'J.A.V.I.S. 백업 파일이 아닙니다. (format: javis-backup)',
  }
}

export type ApplyBackupResult = {
  appliedKeys: BackupKey[]
}

/** localStorage에 백업 데이터를 덮어씀. 적용 후 페이지 새로고침 권장 */
export function applyBackup(backup: JavisBackupFile): ApplyBackupResult {
  const appliedKeys: BackupKey[] = []
  for (const key of BACKUP_KEYS) {
    if (!(key in backup.data)) continue
    const value = backup.data[key]
    localStorage.setItem(
      key,
      typeof value === 'string' ? value : JSON.stringify(value),
    )
    appliedKeys.push(key)
  }
  return { appliedKeys }
}

type IdRecord = {
  id: string
  updatedAt?: string
  createdAt?: string
  visited?: boolean
}

function recordTime(item: IdRecord): number {
  for (const key of ['updatedAt', 'createdAt'] as const) {
    const raw = item[key]
    if (!raw) continue
    const t = Date.parse(raw)
    if (!Number.isNaN(t)) return t
  }
  return 0
}

/** 같은 id는 최신(updatedAt/createdAt) 우선. visited는 OR. */
function mergeIdArrays(local: unknown, remote: unknown): unknown[] {
  const a = Array.isArray(local) ? local : []
  const b = Array.isArray(remote) ? remote : []
  const map = new Map<string, IdRecord>()

  const ingest = (list: unknown[]) => {
    for (const raw of list) {
      if (!raw || typeof raw !== 'object') continue
      const item = raw as IdRecord
      if (typeof item.id !== 'string' || !item.id) continue
      const prev = map.get(item.id)
      if (!prev) {
        map.set(item.id, { ...item })
        continue
      }
      const newer = recordTime(item) >= recordTime(prev) ? item : prev
      const older = newer === item ? prev : item
      map.set(item.id, {
        ...older,
        ...newer,
        visited: Boolean(prev.visited) || Boolean(item.visited),
      })
    }
  }

  ingest(a)
  ingest(b)
  return [...map.values()].sort((x, y) => x.id.localeCompare(y.id))
}

const MERGE_ARRAY_KEYS: BackupKey[] = [
  'javis.geo.places.v1',
  'javis.geo.categories.v1',
  'javis.travel.visits.v1',
  'javis.missions.v1',
  'javis.flight.scans.v1',
  'javis.stay.scans.v1',
]

/**
 * 로컬 + 클라우드를 합칩니다 (덮어쓰기 대신 합집합).
 * 배열 키는 id 기준 병합, 그 외(listView 등)는 클라우드 우선.
 */
export function mergeBackupData(
  local: JavisBackupFile['data'],
  remote: JavisBackupFile['data'],
): JavisBackupFile['data'] {
  const out: JavisBackupFile['data'] = { ...local }

  for (const key of BACKUP_KEYS) {
    const hasLocal = key in local
    const hasRemote = key in remote
    if (!hasLocal && !hasRemote) continue

    if (MERGE_ARRAY_KEYS.includes(key)) {
      out[key] = mergeIdArrays(local[key], remote[key])
      continue
    }

    // 스칼라/기타: 클라우드 값 우선, 없으면 로컬
    if (hasRemote) out[key] = remote[key]
    else out[key] = local[key]
  }

  return out
}

export function mergeBackups(
  local: JavisBackupFile,
  remote: JavisBackupFile,
): JavisBackupFile {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'J.A.V.I.S.',
    data: mergeBackupData(local.data, remote.data),
  }
}

function canonicalizeData(
  data: JavisBackupFile['data'],
): JavisBackupFile['data'] {
  const out: JavisBackupFile['data'] = {}
  for (const key of BACKUP_KEYS) {
    if (!(key in data)) continue
    const value = data[key]
    if (Array.isArray(value)) {
      const sorted = [...value].sort((x, y) => {
        const xid =
          x && typeof x === 'object' && 'id' in x
            ? String((x as IdRecord).id)
            : ''
        const yid =
          y && typeof y === 'object' && 'id' in y
            ? String((y as IdRecord).id)
            : ''
        return xid.localeCompare(yid)
      })
      out[key] = sorted
    } else {
      out[key] = value
    }
  }
  return out
}

export function backupDataEqual(
  a: JavisBackupFile['data'],
  b: JavisBackupFile['data'],
): boolean {
  return (
    JSON.stringify(canonicalizeData(a)) === JSON.stringify(canonicalizeData(b))
  )
}

export async function readBackupFile(file: File): Promise<ParseBackupResult> {
  if (!file.name.toLowerCase().endsWith('.json') && file.type && !file.type.includes('json')) {
    return { ok: false, error: 'JSON 백업 파일만 선택할 수 있습니다.' }
  }
  const text = await file.text()
  return parseBackupJson(text)
}
