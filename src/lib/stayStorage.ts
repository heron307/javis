import { resolveDestinationEn } from '../data/stayDestinations'
import type { StayScanQuery, StayScanRecord } from '../types/stay'

const STORAGE_KEY = 'javis.stay.scans.v1'
const MAX_HISTORY = 40

export function loadStayScans(): StayScanRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StayScanRecord[]
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveStayScans(scans: StayScanRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scans.slice(0, MAX_HISTORY)))
}

export function createStayScanId(): string {
  return `ss-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function queryToStayRecord(q: StayScanQuery): StayScanRecord {
  const destination = q.destination.trim()
  const destinationEn = resolveDestinationEn(destination, q.destinationEn)
  return {
    ...q,
    destination,
    destinationEn,
    id: createStayScanId(),
    createdAt: new Date().toISOString(),
    pinned: false,
  }
}
