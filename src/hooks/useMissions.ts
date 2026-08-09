import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { getCountry } from '../data/countries'
import {
  formToDay,
  formToExpense,
  formToMission,
  loadMissions,
  missionPaid,
  missionRouteEst,
  missionSpent,
  saveMissions,
} from '../lib/missionStorage'
import type {
  DayFormData,
  ExpenseFormData,
  Mission,
  MissionFormData,
} from '../types/mission'

let cache = loadMissions()
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function setCache(next: Mission[]) {
  cache = next
  saveMissions(next)
  emit()
}

/** 클라우드 pull 후 localStorage → 캐시만 갱신 */
export function hydrateMissionsFromStorage(): void {
  cache = loadMissions()
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return cache
}

export function useMissions() {
  const missions = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const stats = useMemo(() => {
    const active = missions.filter((m) => m.status === 'active').length
    const draft = missions.filter((m) => m.status === 'draft').length
    const budget = missions.reduce((s, m) => s + m.budgetTotal, 0)
    return { total: missions.length, active, draft, budget }
  }, [missions])

  const sorted = useMemo(
    () =>
      [...missions].sort((a, b) => {
        if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate)
        return b.updatedAt.localeCompare(a.updatedAt)
      }),
    [missions],
  )

  const getMission = useCallback(
    (id: string) => missions.find((m) => m.id === id) ?? null,
    [missions],
  )

  const addMission = useCallback((data: MissionFormData) => {
    if (!getCountry(data.countryCode)) return null
    const mission = formToMission(data)
    setCache([mission, ...cache])
    return mission
  }, [])

  const updateMission = useCallback((id: string, data: MissionFormData) => {
    const idx = cache.findIndex((m) => m.id === id)
    if (idx < 0) return null
    const updated = formToMission(data, cache[idx])
    const next = [...cache]
    next[idx] = updated
    setCache(next)
    return updated
  }, [])

  const deleteMission = useCallback((id: string) => {
    setCache(cache.filter((m) => m.id !== id))
  }, [])

  const upsertDay = useCallback((missionId: string, data: DayFormData, dayId?: string) => {
    const idx = cache.findIndex((m) => m.id === missionId)
    if (idx < 0) return null
    const mission = cache[idx]
    const existing = dayId ? mission.days.find((d) => d.id === dayId) : undefined
    const day = formToDay(data, existing)
    let days = [...mission.days]
    if (existing) {
      days = days.map((d) => (d.id === dayId ? day : d))
    } else {
      days.push(day)
    }
    days.sort((a, b) => a.day - b.day || a.date.localeCompare(b.date))
    const updated: Mission = {
      ...mission,
      days,
      updatedAt: new Date().toISOString(),
    }
    const next = [...cache]
    next[idx] = updated
    setCache(next)
    return updated
  }, [])

  const deleteDay = useCallback((missionId: string, dayId: string) => {
    const idx = cache.findIndex((m) => m.id === missionId)
    if (idx < 0) return
    const mission = cache[idx]
    const updated: Mission = {
      ...mission,
      days: mission.days.filter((d) => d.id !== dayId),
      updatedAt: new Date().toISOString(),
    }
    const next = [...cache]
    next[idx] = updated
    setCache(next)
  }, [])

  const upsertExpense = useCallback(
    (missionId: string, data: ExpenseFormData, expenseId?: string) => {
      const idx = cache.findIndex((m) => m.id === missionId)
      if (idx < 0) return null
      const mission = cache[idx]
      const existing = expenseId
        ? mission.expenses.find((e) => e.id === expenseId)
        : undefined
      const expense = formToExpense(data, existing)
      let expenses = [...mission.expenses]
      if (existing) {
        expenses = expenses.map((e) => (e.id === expenseId ? expense : e))
      } else {
        expenses.push(expense)
      }
      const updated: Mission = {
        ...mission,
        expenses,
        updatedAt: new Date().toISOString(),
      }
      const next = [...cache]
      next[idx] = updated
      setCache(next)
      return updated
    },
    [],
  )

  const deleteExpense = useCallback((missionId: string, expenseId: string) => {
    const idx = cache.findIndex((m) => m.id === missionId)
    if (idx < 0) return
    const mission = cache[idx]
    const updated: Mission = {
      ...mission,
      expenses: mission.expenses.filter((e) => e.id !== expenseId),
      updatedAt: new Date().toISOString(),
    }
    const next = [...cache]
    next[idx] = updated
    setCache(next)
  }, [])

  const toggleExpensePaid = useCallback((missionId: string, expenseId: string) => {
    const idx = cache.findIndex((m) => m.id === missionId)
    if (idx < 0) return
    const mission = cache[idx]
    const updated: Mission = {
      ...mission,
      expenses: mission.expenses.map((e) =>
        e.id === expenseId ? { ...e, paid: !e.paid } : e,
      ),
      updatedAt: new Date().toISOString(),
    }
    const next = [...cache]
    next[idx] = updated
    setCache(next)
  }, [])

  return {
    missions: sorted,
    stats,
    getMission,
    addMission,
    updateMission,
    deleteMission,
    upsertDay,
    deleteDay,
    upsertExpense,
    deleteExpense,
    toggleExpensePaid,
    missionSpent,
    missionPaid,
    missionRouteEst,
  }
}
