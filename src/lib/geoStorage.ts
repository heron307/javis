import { GEO_SEED } from '../data/geoSeed'
import type { GeoPlace, PlaceFormData } from '../types/geo'

const STORAGE_KEY = 'javis.geo.places.v1'

export function loadPlaces(): GeoPlace[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(GEO_SEED))
      return GEO_SEED.map(normalizePlace)
    }
    const parsed = JSON.parse(raw) as GeoPlace[]
    if (!Array.isArray(parsed)) return GEO_SEED.map(normalizePlace)
    return parsed.map(normalizePlace)
  } catch {
    return GEO_SEED.map(normalizePlace)
  }
}

function normalizePlace(p: GeoPlace): GeoPlace {
  return {
    ...p,
    visited: Boolean((p as { visited?: boolean }).visited),
    tags: Array.isArray(p.tags) ? p.tags : [],
  }
}

export function savePlaces(places: GeoPlace[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(places))
}

export function createPlaceId(): string {
  return `gp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function mapsSearchUrl(place: Pick<GeoPlace, 'name' | 'nameEn' | 'address' | 'lat' | 'lng' | 'city'>): string {
  if (place.lat != null && place.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`
  }
  const q = [place.nameEn || place.name, place.address || place.city].filter(Boolean).join(', ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

export function mapsEmbedUrl(place: Pick<GeoPlace, 'name' | 'nameEn' | 'address' | 'lat' | 'lng' | 'city'>): string {
  if (place.lat != null && place.lng != null) {
    return `https://maps.google.com/maps?q=${place.lat},${place.lng}&z=15&output=embed`
  }
  const q = [place.nameEn || place.name, place.address || place.city].filter(Boolean).join(', ')
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=14&output=embed`
}

export function mapsDirectionsUrl(place: Pick<GeoPlace, 'name' | 'nameEn' | 'address' | 'lat' | 'lng'>): string {
  if (place.lat != null && place.lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`
  }
  const q = place.address || place.nameEn || place.name
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`
}

export function formToPlace(data: PlaceFormData, existing?: GeoPlace): GeoPlace {
  const now = new Date().toISOString()
  const lat = data.lat.trim() ? Number(data.lat) : null
  const lng = data.lng.trim() ? Number(data.lng) : null

  return {
    id: existing?.id ?? createPlaceId(),
    countryCode: data.countryCode,
    city: data.city.trim(),
    name: data.name.trim(),
    nameEn: data.nameEn.trim(),
    category: data.category,
    address: data.address.trim(),
    lat: lat != null && !Number.isNaN(lat) ? lat : null,
    lng: lng != null && !Number.isNaN(lng) ? lng : null,
    rating: Math.min(5, Math.max(1, data.rating || 3)),
    visited: existing?.visited ?? false,
    notes: data.notes.trim(),
    tags: data.tags
      .split(/[,，、]/)
      .map((t) => t.trim())
      .filter(Boolean),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
}

function normalizeKey(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[\s\u00A0]+/g, '')
    .replace(/[·・.'’"“”]/g, '')
}

function namesMatch(a: string, b: string): boolean {
  const na = normalizeKey(a)
  const nb = normalizeKey(b)
  if (!na || !nb) return false
  return na === nb
}

function namesOverlap(
  a: Pick<GeoPlace, 'name' | 'nameEn'>,
  b: Pick<GeoPlace, 'name' | 'nameEn'>,
): boolean {
  return (
    namesMatch(a.name, b.name) ||
    namesMatch(a.name, b.nameEn) ||
    (Boolean(a.nameEn) &&
      (namesMatch(a.nameEn, b.nameEn) || namesMatch(a.nameEn, b.name)))
  )
}

/**
 * 동일 국가·도시에서 이름(한/영)이 같으면 중복.
 * 좌표가 가까워도 이름이 다르면 다른 장소로 본다 (인접 매장 오탐 방지).
 * excludeId: 수정 중인 자신은 제외
 */
export function findDuplicatePlace(
  candidate: Pick<GeoPlace, 'countryCode' | 'city' | 'name' | 'nameEn' | 'lat' | 'lng'>,
  existing: GeoPlace[],
  excludeId?: string,
): GeoPlace | null {
  const country = candidate.countryCode.toUpperCase()
  const cityKey = normalizeKey(candidate.city)

  for (const p of existing) {
    if (excludeId && p.id === excludeId) continue
    if (p.countryCode.toUpperCase() !== country) continue

    const sameCity = normalizeKey(p.city) === cityKey
    if (!sameCity) continue

    if (namesOverlap(candidate, p)) return p
  }
  return null
}

export type PlaceWriteResult =
  | { ok: true; place: GeoPlace }
  | { ok: false; reason: 'invalid_country' | 'duplicate'; existing?: GeoPlace }

