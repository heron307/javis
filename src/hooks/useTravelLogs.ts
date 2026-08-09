import { useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import { COUNTRIES, getCountry } from '../data/countries'
import {
  calcDays,
  createId,
  loadVisits,
  saveVisits,
  type StoredTravelVisit,
} from '../lib/travelStorage'
import type { CountrySummary, VisitFormData } from '../types/travel'

let cache = loadVisits()
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function setCache(next: StoredTravelVisit[]) {
  cache = next
  saveVisits(next)
  emit()
}

/** 클라우드 pull 후 localStorage → 캐시만 갱신 */
export function hydrateVisitsFromStorage(): void {
  cache = loadVisits()
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return cache
}

export function useTravelLogs() {
  const visits = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const [, bump] = useState(0)
  const force = useCallback(() => bump((n) => n + 1), [])

  const summaries: CountrySummary[] = useMemo(() => {
    return COUNTRIES.map((country) => {
      const list = visits.filter((v) => v.countryCode === country.code)
      const totalDays = list.reduce((sum, v) => sum + calcDays(v.startDate, v.endDate), 0)
      const ratings = list.map((v) => v.rating).filter((r) => r > 0)
      const lastVisit =
        list.length === 0
          ? null
          : [...list].sort((a, b) => b.endDate.localeCompare(a.endDate))[0].endDate

      return {
        ...country,
        visitCount: list.length,
        lastVisit,
        totalDays,
        avgRating: ratings.length
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
          : null,
      }
    }).sort((a, b) => {
      if (b.visitCount !== a.visitCount) return b.visitCount - a.visitCount
      return a.nameKo.localeCompare(b.nameKo, 'ko')
    })
  }, [visits])

  const visitedSummaries = useMemo(
    () => summaries.filter((s) => s.visitCount > 0),
    [summaries],
  )

  const stats = useMemo(() => {
    const countries = visitedSummaries.length
    const trips = visits.length
    const days = visits.reduce((sum, v) => sum + calcDays(v.startDate, v.endDate), 0)
    return { countries, trips, days }
  }, [visitedSummaries, visits])

  const getVisitsByCountry = useCallback(
    (code: string) =>
      visits
        .filter((v) => v.countryCode === code)
        .sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [visits],
  )

  const addVisit = useCallback(
    (data: VisitFormData) => {
      const country = getCountry(data.countryCode)
      if (!country) return null

      const now = new Date().toISOString()
      const visit: StoredTravelVisit = {
        id: createId(),
        countryCode: data.countryCode,
        title: data.title.trim() || `${country.nameKo} 여행`,
        cities: data.cities
          .split(/[,，、]/)
          .map((c) => c.trim())
          .filter(Boolean),
        startDate: data.startDate,
        endDate: data.endDate || data.startDate,
        notes: data.notes.trim(),
        rating: Math.min(5, Math.max(1, data.rating || 3)),
        companions: data.companions.trim(),
        budget: data.budget.trim() ? Number(data.budget.replace(/,/g, '')) : null,
        createdAt: now,
        updatedAt: now,
      }

      setCache([visit, ...cache])
      force()
      return visit
    },
    [force],
  )

  const updateVisit = useCallback(
    (id: string, data: VisitFormData) => {
      const idx = cache.findIndex((v) => v.id === id)
      if (idx < 0) return null

      const prev = cache[idx]
      const updated: StoredTravelVisit = {
        ...prev,
        countryCode: data.countryCode,
        title: data.title.trim() || prev.title,
        cities: data.cities
          .split(/[,，、]/)
          .map((c) => c.trim())
          .filter(Boolean),
        startDate: data.startDate,
        endDate: data.endDate || data.startDate,
        notes: data.notes.trim(),
        rating: Math.min(5, Math.max(1, data.rating || 3)),
        companions: data.companions.trim(),
        budget: data.budget.trim() ? Number(data.budget.replace(/,/g, '')) : null,
        updatedAt: new Date().toISOString(),
      }

      const next = [...cache]
      next[idx] = updated
      setCache(next)
      force()
      return updated
    },
    [force],
  )

  const deleteVisit = useCallback(
    (id: string) => {
      setCache(cache.filter((v) => v.id !== id))
      force()
    },
    [force],
  )

  return {
    visits,
    summaries,
    visitedSummaries,
    stats,
    getVisitsByCountry,
    addVisit,
    updateVisit,
    deleteVisit,
  }
}
