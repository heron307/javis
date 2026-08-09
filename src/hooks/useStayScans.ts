import { useCallback, useMemo, useSyncExternalStore } from 'react'
import {
  loadStayScans,
  queryToStayRecord,
  saveStayScans,
} from '../lib/stayStorage'
import type { StayScanQuery, StayScanRecord } from '../types/stay'

let cache = loadStayScans()
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function setCache(next: StayScanRecord[]) {
  cache = next
  saveStayScans(next)
  emit()
}

/** 클라우드 pull 후 localStorage → 캐시만 갱신 */
export function hydrateStayScansFromStorage(): void {
  cache = loadStayScans()
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return cache
}

export function useStayScans() {
  const scans = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const pinned = useMemo(() => scans.filter((s) => s.pinned), [scans])
  const recent = useMemo(() => scans.filter((s) => !s.pinned), [scans])

  const addScan = useCallback((q: StayScanQuery) => {
    const record = queryToStayRecord(q)
    const key = `${record.destinationEn}|${record.checkIn}|${record.checkOut}|${record.adults}|${record.rooms}|${record.stayType}`
    const filtered = cache.filter(
      (s) =>
        `${s.destinationEn}|${s.checkIn}|${s.checkOut}|${s.adults}|${s.rooms}|${s.stayType}` !==
        key,
    )
    setCache([record, ...filtered])
    return record
  }, [])

  const togglePin = useCallback((id: string) => {
    setCache(cache.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s)))
  }, [])

  const removeScan = useCallback((id: string) => {
    setCache(cache.filter((s) => s.id !== id))
  }, [])

  const clearHistory = useCallback(() => {
    setCache(cache.filter((s) => s.pinned))
  }, [])

  return {
    scans,
    pinned,
    recent,
    addScan,
    togglePin,
    removeScan,
    clearHistory,
  }
}
