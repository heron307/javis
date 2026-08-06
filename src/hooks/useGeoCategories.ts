import { useCallback, useMemo, useSyncExternalStore } from 'react'
import {
  loadCategories,
  resolveCategoryLabel,
  saveCategories,
  uniqueCategoryId,
} from '../lib/categoryStorage'
import type { PlaceCategory, PlaceCategoryDef } from '../types/geo'

let cache = loadCategories()
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function setCache(next: PlaceCategoryDef[]) {
  cache = next
  saveCategories(next)
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return cache
}

/** 모듈 캐시 기준 한글 라벨 (스토어와 동기) */
export function getCategoryLabel(cat: PlaceCategory): string {
  return resolveCategoryLabel(cat, cache)
}

export function useGeoCategories() {
  const categories = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const filterCategories = useMemo(
    () => categories.filter((c) => c.id !== 'other'),
    [categories],
  )

  const labelOf = useCallback(
    (id: PlaceCategory) => resolveCategoryLabel(id, categories),
    [categories],
  )

  const addCategory = useCallback((label: string, labelKo: string) => {
    const en = label.trim()
    const ko = labelKo.trim()
    if (!en || !ko) return null
    const id = uniqueCategoryId(en, cache)
    const next: PlaceCategoryDef = { id, label: en, labelKo: ko, builtin: false }
    setCache([...cache, next])
    return next
  }, [])

  const updateCategory = useCallback(
    (id: PlaceCategory, patch: { label?: string; labelKo?: string }) => {
      const idx = cache.findIndex((c) => c.id === id)
      if (idx < 0) return null
      const current = cache[idx]
      const nextItem: PlaceCategoryDef = {
        ...current,
        label: patch.label?.trim() || current.label,
        labelKo: patch.labelKo?.trim() || current.labelKo,
      }
      if (!nextItem.label || !nextItem.labelKo) return null
      const next = [...cache]
      next[idx] = nextItem
      setCache(next)
      return nextItem
    },
    [],
  )

  const removeCategory = useCallback((id: PlaceCategory) => {
    if (id === 'other') return false
    if (!cache.some((c) => c.id === id)) return false
    setCache(cache.filter((c) => c.id !== id))
    return true
  }, [])

  return {
    categories,
    filterCategories,
    labelOf,
    addCategory,
    updateCategory,
    removeCategory,
  }
}
