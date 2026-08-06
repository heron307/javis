import { MISSION_SEED } from '../data/missionSeed'
import type {
  DayFormData,
  ExpenseFormData,
  Mission,
  MissionDay,
  MissionExpense,
  MissionFormData,
  MissionStop,
} from '../types/mission'

const STORAGE_KEY = 'javis.missions.v1'

export function loadMissions(): Mission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MISSION_SEED))
      return structuredClone(MISSION_SEED)
    }
    const parsed = JSON.parse(raw) as Mission[]
    if (!Array.isArray(parsed)) return structuredClone(MISSION_SEED)
    return parsed
  } catch {
    return structuredClone(MISSION_SEED)
  }
}

export function saveMissions(missions: Mission[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(missions))
}

export function createMissionId(): string {
  return `mi-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function createDayId(): string {
  return `md-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function createExpenseId(): string {
  return `me-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function createStopId(): string {
  return `ms-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function calcMissionDays(start: string, end: string): number {
  if (!start || !end) return 0
  const a = new Date(start + 'T00:00:00')
  const b = new Date(end + 'T00:00:00')
  const diff = Math.round((b.getTime() - a.getTime()) / 86400000)
  return Math.max(1, diff + 1)
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function parseCities(raw: string): string[] {
  return raw
    .split(/[,，、/|]/)
    .map((c) => c.trim())
    .filter(Boolean)
}

export function parseStops(raw: string, defaultCost = 0): MissionStop[] {
  return raw
    .split(/\n|,|，/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((title) => ({
      id: createStopId(),
      title,
      notes: '',
      estCost: defaultCost,
    }))
}

export function formToMission(data: MissionFormData, existing?: Mission): Mission {
  const now = new Date().toISOString()
  const budget = Number(data.budgetTotal.replace(/,/g, ''))
  return {
    id: existing?.id ?? createMissionId(),
    title: data.title.trim(),
    countryCode: data.countryCode.toUpperCase(),
    cities: parseCities(data.cities),
    startDate: data.startDate,
    endDate: data.endDate,
    currency: data.currency.trim() || 'KRW',
    budgetTotal: Number.isFinite(budget) ? Math.max(0, budget) : 0,
    status: data.status,
    notes: data.notes.trim(),
    days: existing?.days ?? [],
    expenses: existing?.expenses ?? [],
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
}

export function formToDay(data: DayFormData, existing?: MissionDay): MissionDay {
  const cost = Number(data.estCost.replace(/,/g, ''))
  const stops =
    data.stopsText.trim().length > 0
      ? parseStops(data.stopsText)
      : existing?.stops ?? []

  // 단일 추정비용을 첫 스톱에 반영 (스톱이 하나일 때)
  if (stops.length === 1 && Number.isFinite(cost) && cost > 0) {
    stops[0] = { ...stops[0], estCost: cost }
  } else if (stops.length === 0 && Number.isFinite(cost) && cost > 0) {
    stops.push({
      id: createStopId(),
      title: data.title.trim() || '일정',
      notes: '',
      estCost: cost,
    })
  }

  return {
    id: existing?.id ?? createDayId(),
    day: data.day,
    date: data.date,
    city: data.city.trim(),
    title: data.title.trim(),
    notes: data.notes.trim(),
    stops,
  }
}

export function formToExpense(
  data: ExpenseFormData,
  existing?: MissionExpense,
): MissionExpense {
  const amount = Number(data.amount.replace(/,/g, ''))
  const dayNum = data.day.trim() ? Number(data.day) : null
  return {
    id: existing?.id ?? createExpenseId(),
    category: data.category,
    label: data.label.trim(),
    amount: Number.isFinite(amount) ? Math.max(0, amount) : 0,
    day: dayNum != null && Number.isFinite(dayNum) ? dayNum : null,
    paid: data.paid,
  }
}

export function dayEstCost(day: MissionDay): number {
  return day.stops.reduce((s, x) => s + (x.estCost || 0), 0)
}

export function missionSpent(mission: Mission): number {
  return mission.expenses.reduce((s, e) => s + e.amount, 0)
}

export function missionPaid(mission: Mission): number {
  return mission.expenses.filter((e) => e.paid).reduce((s, e) => s + e.amount, 0)
}

export function missionRouteEst(mission: Mission): number {
  return mission.days.reduce((s, d) => s + dayEstCost(d), 0)
}

export function budgetRemaining(mission: Mission): number {
  return mission.budgetTotal - missionSpent(mission)
}
