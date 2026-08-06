import { getCountry } from '../data/countries'
import type { PlaceCategory, PlaceFormData } from '../types/geo'
import { hasHangul } from './translateToKorean'
import { searchPlacesWeb, type PlaceSearchResult } from './placeSearch'

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export type EnrichOptions = {
  name: string
  countryCode: string
  city: string
  /** 검색 실패·other 일 때 사용할 기본 카테고리 */
  fallbackCategory: PlaceCategory
  /** true면 OSM 카테고리 무시하고 fallback 유지 */
  lockCategory?: boolean
  signal?: AbortSignal
}

function preferKoreanName(resultName: string, displayName: string): string {
  if (hasHangul(resultName)) return resultName
  if (hasHangul(displayName)) return displayName.trim()
  return resultName || displayName
}

export function searchResultToFormData(
  result: PlaceSearchResult,
  opts: {
    countryCode: string
    city: string
    displayName: string
    fallbackCategory: PlaceCategory
    lockCategory?: boolean
  },
): PlaceFormData {
  const matchedCountry =
    result.countryCode && getCountry(result.countryCode)
      ? result.countryCode
      : opts.countryCode

  const category =
    opts.lockCategory || !result.category || result.category === 'other'
      ? opts.fallbackCategory
      : result.category

  const tags = Array.from(
    new Set(['import', ...result.tags.filter(Boolean)]),
  ).join(', ')

  const noteParts = [
    'OSM 자동조회 등록',
    result.label ? `출처: ${result.label}` : '',
  ].filter(Boolean)

  const city =
    (result.city && hasHangul(result.city) ? result.city : '') ||
    (hasHangul(opts.city) ? opts.city : result.city) ||
    opts.city

  return {
    countryCode: matchedCountry,
    city,
    name: preferKoreanName(result.name, opts.displayName),
    nameEn: result.nameEn || '',
    category,
    address: result.address || '',
    lat: Number.isFinite(result.lat) ? String(result.lat) : '',
    lng: Number.isFinite(result.lng) ? String(result.lng) : '',
    rating: 4,
    notes: noteParts.join(' · '),
    tags,
  }
}

function fallbackForm(opts: EnrichOptions): PlaceFormData {
  return {
    countryCode: opts.countryCode,
    city: opts.city,
    name: opts.name,
    nameEn: '',
    category: opts.fallbackCategory,
    address: '',
    lat: '',
    lng: '',
    rating: 4,
    notes: '목록 등록 · 지도 검색 결과 없음',
    tags: 'import,unresolved',
  }
}

/** 단일 장소명 → OSM/Photon 조회 후 PlaceFormData */
export async function enrichImportedPlace(
  opts: EnrichOptions,
): Promise<{ form: PlaceFormData; matched: boolean; hit?: PlaceSearchResult }> {
  const q = [opts.name, opts.city].filter(Boolean).join(' ')
  try {
    const found = await searchPlacesWeb(q, {
      countryCode: opts.countryCode,
      signal: opts.signal,
    })

    const preferred =
      found.results.find((r) => r.countryCode === opts.countryCode.toUpperCase()) ||
      found.results[0]

    if (!preferred) {
      return { form: fallbackForm(opts), matched: false }
    }

    return {
      form: searchResultToFormData(preferred, {
        countryCode: opts.countryCode,
        city: opts.city,
        displayName: opts.name,
        fallbackCategory: opts.fallbackCategory,
        lockCategory: opts.lockCategory,
      }),
      matched: true,
      hit: preferred,
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    return { form: fallbackForm(opts), matched: false }
  }
}

/** 여러 장소 순차 조회 (Nominatim 예의를 위해 간격) */
export async function enrichImportedPlaces(
  names: string[],
  base: Omit<EnrichOptions, 'name'>,
  onProgress?: (done: number, total: number, name: string) => void,
): Promise<PlaceFormData[]> {
  const out: PlaceFormData[] = []
  for (let i = 0; i < names.length; i++) {
    const name = names[i]
    onProgress?.(i + 1, names.length, name)
    if (i > 0) await sleep(350)
    if (base.signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    const { form } = await enrichImportedPlace({ ...base, name })
    out.push(form)
  }
  return out
}
