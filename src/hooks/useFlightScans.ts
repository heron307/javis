import { useCallback, useMemo, useSyncExternalStore } from 'react'
import {
  loadFlightScans,
  queryToRecord,
  saveFlightScans,
} from '../lib/flightStorage'
import type { FlightScanQuery, FlightScanRecord } from '../types/flight'

let cache = loadFlightScans()
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function setCache(next: FlightScanRecord[]) {
  cache = next
  saveFlightScans(next)
  emit()
}

/** 클라우드 pull 후 localStorage → 캐시만 갱신 */
export function hydrateFlightScansFromStorage(): void {
  cache = loadFlightScans()
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return cache
}

export function useFlightScans() {
  const scans = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const pinned = useMemo(() => scans.filter((s) => s.pinned), [scans])
  const recent = useMemo(() => scans.filter((s) => !s.pinned), [scans])

  const addScan = useCallback((q: FlightScanQuery) => {
    const record = queryToRecord(q)
    // 동일 조건 최근 기록 중복 제거
    const key = `${record.origin}|${record.destination}|${record.departDate}|${record.returnDate}|${record.tripType}`
    const filtered = cache.filter(
      (s) =>
        `${s.origin}|${s.destination}|${s.departDate}|${s.returnDate}|${s.tripType}` !== key,
    )
    setCache([record, ...filtered])
    return record
  }, [])

  const togglePin = useCallback((id: string) => {
    setCache(
      cache.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s)),
    )
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
