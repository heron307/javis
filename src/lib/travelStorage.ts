import type { TravelVisit } from '../types/travel'

const STORAGE_KEY = 'javis.travel.visits.v1'

const SEED: TravelVisit[] = [
  {
    id: 'seed-jp-1',
    title: '도쿄 봄 여행',
    cities: ['도쿄', '시부야', '아사쿠사'],
    startDate: '2025-03-15',
    endDate: '2025-03-20',
    notes: '벚꽃 시즌. 스시 오마카세와 팀즈 스퀘어 야경이 인상적이었다.',
    rating: 5,
    companions: '혼자',
    budget: 1200000,
    createdAt: '2025-03-21T10:00:00.000Z',
    updatedAt: '2025-03-21T10:00:00.000Z',
  },
  {
    id: 'seed-jp-2',
    title: '오사카·교토 미식 투어',
    cities: ['오사카', '교토', '나라'],
    startDate: '2024-11-02',
    endDate: '2024-11-08',
    notes: '타코야키, 가이세키, 후시미이나리. 교토는 다시 가고 싶다.',
    rating: 5,
    companions: '친구',
    budget: 980000,
    createdAt: '2024-11-09T10:00:00.000Z',
    updatedAt: '2024-11-09T10:00:00.000Z',
  },
  {
    id: 'seed-th-1',
    title: '방콕 위크엔드',
    cities: ['방콕', '아유타야'],
    startDate: '2024-07-10',
    endDate: '2024-07-14',
    notes: '짜뚜짝 마켓과 왕궁. 더위 대비 필수.',
    rating: 4,
    companions: '가족',
    budget: 650000,
    createdAt: '2024-07-15T10:00:00.000Z',
    updatedAt: '2024-07-15T10:00:00.000Z',
  },
  {
    id: 'seed-fr-1',
    title: '파리 첫 유럽',
    cities: ['파리'],
    startDate: '2023-09-01',
    endDate: '2023-09-08',
    notes: '루브르, 오르세, 몽마르트. 카페 크루아상이 최고.',
    rating: 5,
    companions: '연인',
    budget: 2100000,
    createdAt: '2023-09-09T10:00:00.000Z',
    updatedAt: '2023-09-09T10:00:00.000Z',
  },
]

/** Seed visits are stored with countryCode in a wrapper; we store flat with countryCode field */
type StoredVisit = TravelVisit & { countryCode: string }

const SEED_STORED: StoredVisit[] = [
  { ...SEED[0], countryCode: 'JP' },
  { ...SEED[1], countryCode: 'JP' },
  { ...SEED[2], countryCode: 'TH' },
  { ...SEED[3], countryCode: 'FR' },
]

export type StoredTravelVisit = StoredVisit

export function loadVisits(): StoredTravelVisit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_STORED))
      return [...SEED_STORED]
    }
    const parsed = JSON.parse(raw) as StoredTravelVisit[]
    if (!Array.isArray(parsed)) return [...SEED_STORED]
    return parsed
  } catch {
    return [...SEED_STORED]
  }
}

export function saveVisits(visits: StoredTravelVisit[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(visits))
  void import('./cloudSync').then((m) => m.queueCloudPush()).catch(() => {})
}

export function createId(): string {
  return `tv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function calcDays(start: string, end: string): number {
  const s = new Date(start)
  const e = new Date(end)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0
  const diff = Math.round((e.getTime() - s.getTime()) / 86400000)
  return Math.max(diff + 1, 1)
}

export function formatDateRange(start: string, end: string): string {
  return `${start.replaceAll('-', '.')} — ${end.replaceAll('-', '.')}`
}

export function formatBudget(amount: number | null): string {
  if (amount == null || Number.isNaN(amount)) return '—'
  return `₩${amount.toLocaleString('ko-KR')}`
}
