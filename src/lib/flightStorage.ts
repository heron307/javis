import type { FlightScanQuery, FlightScanRecord } from '../types/flight'
import { airportLabel } from '../data/airports'

const STORAGE_KEY = 'javis.flight.scans.v1'
const MAX_HISTORY = 40

export function loadFlightScans(): FlightScanRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as FlightScanRecord[]
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveFlightScans(scans: FlightScanRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scans.slice(0, MAX_HISTORY)))
}

export function createScanId(): string {
  return `fs-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function queryToRecord(q: FlightScanQuery): FlightScanRecord {
  return {
    ...q,
    origin: q.origin.toUpperCase(),
    destination: q.destination.toUpperCase(),
    id: createScanId(),
    originLabel: airportLabel(q.origin),
    destinationLabel: airportLabel(q.destination),
    createdAt: new Date().toISOString(),
    pinned: false,
  }
}
