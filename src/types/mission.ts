export type MissionStatus = 'draft' | 'active' | 'done'

export type ExpenseCategory =
  | 'flight'
  | 'lodging'
  | 'food'
  | 'transport'
  | 'activity'
  | 'other'

export type MissionStop = {
  id: string
  /** 장소/활동명 */
  title: string
  notes: string
  estCost: number
}

export type MissionDay = {
  id: string
  /** 1-based day number */
  day: number
  date: string
  city: string
  title: string
  notes: string
  stops: MissionStop[]
}

export type MissionExpense = {
  id: string
  category: ExpenseCategory
  label: string
  amount: number
  /** 연결 일차 (optional) */
  day: number | null
  paid: boolean
}

export type Mission = {
  id: string
  title: string
  countryCode: string
  cities: string[]
  startDate: string
  endDate: string
  currency: string
  budgetTotal: number
  status: MissionStatus
  notes: string
  days: MissionDay[]
  expenses: MissionExpense[]
  createdAt: string
  updatedAt: string
}

export type MissionFormData = {
  title: string
  countryCode: string
  cities: string
  startDate: string
  endDate: string
  currency: string
  budgetTotal: string
  status: MissionStatus
  notes: string
}

export type DayFormData = {
  day: number
  date: string
  city: string
  title: string
  notes: string
  stopsText: string
  estCost: string
}

export type ExpenseFormData = {
  category: ExpenseCategory
  label: string
  amount: string
  day: string
  paid: boolean
}

export const EXPENSE_CATEGORIES: {
  value: ExpenseCategory
  label: string
  labelKo: string
}[] = [
  { value: 'flight', label: 'Flight', labelKo: '항공' },
  { value: 'lodging', label: 'Lodging', labelKo: '숙소' },
  { value: 'food', label: 'Food', labelKo: '식비' },
  { value: 'transport', label: 'Transport', labelKo: '교통' },
  { value: 'activity', label: 'Activity', labelKo: '액티비티' },
  { value: 'other', label: 'Other', labelKo: '기타' },
]

export const MISSION_STATUSES: {
  value: MissionStatus
  label: string
  labelKo: string
}[] = [
  { value: 'draft', label: 'Draft', labelKo: '초안' },
  { value: 'active', label: 'Active', labelKo: '진행' },
  { value: 'done', label: 'Done', labelKo: '완료' },
]

export function expenseLabel(cat: ExpenseCategory): string {
  return EXPENSE_CATEGORIES.find((c) => c.value === cat)?.labelKo ?? cat
}

export function statusLabel(status: MissionStatus): string {
  return MISSION_STATUSES.find((s) => s.value === status)?.labelKo ?? status
}
