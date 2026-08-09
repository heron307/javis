import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { COUNTRIES, getCountry } from '../data/countries'
import {
  findDuplicatePlace,
  formToPlace,
  loadPlaces,
  savePlaces,
  type PlaceWriteResult,
} from '../lib/geoStorage'
import type { CitySummary, GeoPlace, PlaceCategory, PlaceFormData } from '../types/geo'

let cache = loadPlaces()
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function setCache(next: GeoPlace[]) {
  cache = next
  savePlaces(next)
  emit()
}

/** 클라우드 pull 후 localStorage → 캐시만 갱신 (save/push 없음) */
export function hydratePlacesFromStorage(): void {
  cache = loadPlaces()
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return cache
}

export function useGeoIntel() {
  const places = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const stats = useMemo(() => {
    const countries = new Set(places.map((p) => p.countryCode)).size
    const cities = new Set(places.map((p) => `${p.countryCode}:${p.city}`)).size
    return { countries, cities, places: places.length }
  }, [places])

  const countrySummaries = useMemo(() => {
    return COUNTRIES.map((country) => {
      const list = places.filter((p) => p.countryCode === country.code)
      const cities = new Set(list.map((p) => p.city))
      const byCat = list.reduce(
        (acc, p) => {
          acc[p.category] = (acc[p.category] || 0) + 1
          return acc
        },
        {} as Partial<Record<PlaceCategory, number>>,
      )
      return {
        ...country,
        placeCount: list.length,
        cityCount: cities.size,
        byCat,
      }
    }).sort((a, b) => {
      if (b.placeCount !== a.placeCount) return b.placeCount - a.placeCount
      return a.nameKo.localeCompare(b.nameKo, 'ko')
    })
  }, [places])

  const getPlacesByCountry = useCallback(
    (code: string) =>
      places
        .filter((p) => p.countryCode === code.toUpperCase())
        .sort((a, b) => a.city.localeCompare(b.city, 'ko') || a.name.localeCompare(b.name, 'ko')),
    [places],
  )

  const getCitiesByCountry = useCallback(
    (code: string): CitySummary[] => {
      const list = getPlacesByCountry(code)
      const map = new Map<string, CitySummary>()
      for (const p of list) {
        const existing = map.get(p.city)
        if (!existing) {
          map.set(p.city, {
            city: p.city,
            countryCode: code.toUpperCase(),
            placeCount: 1,
            categories: { [p.category]: 1 },
          })
        } else {
          existing.placeCount += 1
          existing.categories[p.category] = (existing.categories[p.category] || 0) + 1
        }
      }
      return [...map.values()].sort((a, b) => b.placeCount - a.placeCount)
    },
    [getPlacesByCountry],
  )

  const addPlace = useCallback((data: PlaceFormData): PlaceWriteResult => {
    if (!getCountry(data.countryCode)) {
      return { ok: false, reason: 'invalid_country' }
    }
    const place = formToPlace(data)
    const dup = findDuplicatePlace(place, cache)
    if (dup) return { ok: false, reason: 'duplicate', existing: dup }
    setCache([place, ...cache])
    return { ok: true, place }
  }, [])

  const updatePlace = useCallback((id: string, data: PlaceFormData): PlaceWriteResult => {
    const idx = cache.findIndex((p) => p.id === id)
    if (idx < 0) return { ok: false, reason: 'invalid_country' }
    const prev = cache[idx]
    const updated = formToPlace(data, prev)

    // 이름·도시·좌표 등 식별값이 바뀐 경우에만 중복 검사 (태그·메모·평점만 수정 시 통과)
    const identityChanged =
      updated.countryCode !== prev.countryCode ||
      updated.city !== prev.city ||
      updated.name !== prev.name ||
      updated.nameEn !== prev.nameEn ||
      updated.lat !== prev.lat ||
      updated.lng !== prev.lng

    if (identityChanged) {
      const dup = findDuplicatePlace(updated, cache, id)
      if (dup) return { ok: false, reason: 'duplicate', existing: dup }
    }

    const next = [...cache]
    next[idx] = updated
    setCache(next)
    return { ok: true, place: updated }
  }, [])

  const findDuplicate = useCallback(
    (data: PlaceFormData, excludeId?: string) => {
      const draft = formToPlace(data)
      return findDuplicatePlace(draft, cache, excludeId)
    },
    [],
  )

  const updatePlaceCategory = useCallback((id: string, category: PlaceCategory) => {
    const idx = cache.findIndex((p) => p.id === id)
    if (idx < 0) return null
    const now = new Date().toISOString()
    const updated: GeoPlace = { ...cache[idx], category, updatedAt: now }
    const next = [...cache]
    next[idx] = updated
    setCache(next)
    return updated
  }, [])

  const togglePlaceVisited = useCallback((id: string) => {
    const idx = cache.findIndex((p) => p.id === id)
    if (idx < 0) return null
    const now = new Date().toISOString()
    const updated: GeoPlace = {
      ...cache[idx],
      visited: !cache[idx].visited,
      updatedAt: now,
    }
    const next = [...cache]
    next[idx] = updated
    setCache(next)
    return updated
  }, [])

  /** 카테고리 삭제 시 해당 place들을 fallback(기본 other)으로 이동 */
  const reassignCategory = useCallback(
    (from: PlaceCategory, to: PlaceCategory = 'other') => {
      const now = new Date().toISOString()
      let changed = 0
      const next = cache.map((p) => {
        if (p.category !== from) return p
        changed += 1
        return { ...p, category: to, updatedAt: now }
      })
      if (changed > 0) setCache(next)
      return changed
    },
    [],
  )

  const countByCategory = useCallback(
    (category: PlaceCategory) => places.filter((p) => p.category === category).length,
    [places],
  )

  const deletePlace = useCallback((id: string) => {
    setCache(cache.filter((p) => p.id !== id))
  }, [])

  return {
    places,
    stats,
    countrySummaries,
    getPlacesByCountry,
    getCitiesByCountry,
    addPlace,
    updatePlace,
    updatePlaceCategory,
    togglePlaceVisited,
    reassignCategory,
    countByCategory,
    deletePlace,
    findDuplicate,
  }
}
