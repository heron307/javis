import type { PlaceCategory } from '../types/geo'
import { getCountry } from '../data/countries'
import { matchFamousPlaces } from './famousPlaces'
import {
  buildEnglishSearchQueries,
  normalizePlaceQuery,
} from './placeQueryNormalize'
import {
  fetchWikidataKoLabel,
  hasHangul,
  sourceHintForCountry,
  translateToKorean,
} from './translateToKorean'

export type PlaceSearchResult = {
  id: string
  label: string
  name: string
  nameEn: string
  city: string
  countryCode: string | null
  address: string
  lat: number
  lng: number
  category: PlaceCategory
  tags: string[]
  wikidata?: string
  inSelectedCountry?: boolean
  fromGlobal?: boolean
}

export type PlaceSearchResponse = {
  results: PlaceSearchResult[]
  scope: 'country' | 'global' | 'none'
  usedQueries: string[]
  normalizedEnglish?: string
  effectiveCountry?: string
}

type NominatimItem = {
  place_id: number
  lat: string
  lon: string
  name?: string
  display_name: string
  class?: string
  type?: string
  address?: {
    country_code?: string
    country?: string
    city?: string
    town?: string
    village?: string
    municipality?: string
    county?: string
    state?: string
    suburb?: string
    borough?: string
    city_district?: string
    road?: string
    neighbourhood?: string
    quarter?: string
  }
  namedetails?: Record<string, string>
  extratags?: {
    wikidata?: string
  }
}

type PhotonFeature = {
  type: string
  geometry: { coordinates: [number, number] }
  properties: {
    osm_id?: number
    osm_key?: string
    osm_value?: string
    name?: string
    street?: string
    housenumber?: string
    city?: string
    district?: string
    locality?: string
    county?: string
    state?: string
    country?: string
    countrycode?: string
    postcode?: string
  }
}

const CAPITAL_EN: Record<string, string> = {
  KR: 'Seoul',
  JP: 'Tokyo',
  CN: 'Beijing',
  TW: 'Taipei',
  HK: 'Hong Kong',
  TH: 'Bangkok',
  VN: 'Hanoi',
  SG: 'Singapore',
  MY: 'Kuala Lumpur',
  ID: 'Jakarta',
  PH: 'Manila',
  US: 'Washington',
  CA: 'Ottawa',
  MX: 'Mexico City',
  GB: 'London',
  FR: 'Paris',
  IT: 'Rome',
  ES: 'Madrid',
  DE: 'Berlin',
  CH: 'Bern',
  NL: 'Amsterdam',
  PT: 'Lisbon',
  AU: 'Canberra',
  NZ: 'Wellington',
  AE: 'Abu Dhabi',
  TR: 'Ankara',
}

function inferCategory(osmClass?: string, osmType?: string): PlaceCategory {
  const c = (osmClass || '').toLowerCase()
  const t = (osmType || '').toLowerCase()

  if (
    ['hotel', 'motel', 'hostel', 'guest_house', 'apartment', 'chalet', 'resort'].includes(t) ||
    (c === 'tourism' && ['hotel', 'hostel', 'guest_house', 'apartment', 'motel'].includes(t))
  ) {
    return 'lodging'
  }
  if (['cafe', 'coffee_shop', 'internet_cafe'].includes(t)) return 'cafe'
  if (['restaurant', 'fast_food', 'food_court', 'biergarten', 'ice_cream'].includes(t)) {
    return 'restaurant'
  }
  if (
    c === 'shop' ||
    ['mall', 'supermarket', 'department_store', 'clothes', 'gift', 'marketplace'].includes(t)
  ) {
    return 'shopping'
  }
  if (['bar', 'pub', 'nightclub', 'stripclub'].includes(t)) {
    return 'nightlife'
  }
  if (
    c === 'tourism' ||
    c === 'historic' ||
    c === 'leisure' ||
    [
      'attraction',
      'museum',
      'gallery',
      'zoo',
      'theme_park',
      'viewpoint',
      'artwork',
      'monument',
      'memorial',
      'castle',
      'ruins',
      'temple',
      'shrine',
      'park',
      'nature_reserve',
      'hot_spring',
      'spa',
    ].includes(t)
  ) {
    return 'attraction'
  }
  return 'other'
}

function pickCity(address?: NominatimItem['address']): string {
  if (!address) return ''
  return (
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.city_district ||
    address.borough ||
    address.county ||
    address.state ||
    ''
  )
}

function buildAddress(item: NominatimItem): string {
  const a = item.address
  if (!a) return item.display_name
  const parts = [
    a.road,
    a.neighbourhood || a.quarter || a.suburb,
    pickCity(a),
    a.state,
    a.country,
  ].filter(Boolean)
  return parts.length >= 2 ? parts.join(', ') : item.display_name
}

function pickNames(item: NominatimItem): { name: string; nameEn: string } {
  const details = item.namedetails || {}
  const localName = item.name || details.name || item.display_name.split(',')[0]?.trim() || ''
  const nameEn =
    details['name:en'] ||
    details['name:en-US'] ||
    details['name:en-GB'] ||
    ''
  const nameKo = details['name:ko'] || details['name:ko-KR'] || ''
  // 한글 표기가 있으면 우선. 없으면 현지명(한자 등)을 두고 localize 단계에서 번역
  const name = nameKo || localName

  return {
    name,
    nameEn:
      nameEn ||
      (/^[A-Za-z0-9\s\-&'.,()]+$/.test(localName) ? localName : '') ||
      '',
  }
}

function fromNominatim(item: NominatimItem): PlaceSearchResult {
  const { name, nameEn } = pickNames(item)
  return {
    id: `osm-${item.place_id}`,
    label: item.display_name,
    name,
    nameEn,
    city: pickCity(item.address),
    countryCode: item.address?.country_code?.toUpperCase() || null,
    address: buildAddress(item),
    lat: Number(item.lat),
    lng: Number(item.lon),
    category: inferCategory(item.class, item.type),
    tags: [item.type, item.class].filter(Boolean) as string[],
    wikidata: item.extratags?.wikidata,
  }
}

function fromPhoton(feature: PhotonFeature): PlaceSearchResult {
  const p = feature.properties
  const [lng, lat] = feature.geometry.coordinates
  const city = p.city || p.district || p.locality || p.county || p.state || ''
  const address = [
    [p.street, p.housenumber].filter(Boolean).join(' '),
    city,
    p.state,
    p.country,
  ]
    .filter(Boolean)
    .join(', ')
  const name = p.name || address || 'Unknown'

  return {
    id: `photon-${p.osm_id ?? `${lat},${lng}`}`,
    label: address || name,
    name,
    nameEn: /^[A-Za-z0-9\s\-&'.,()]+$/.test(name) ? name : '',
    city,
    countryCode: p.countrycode?.toUpperCase() || null,
    address: address || name,
    lat,
    lng,
    category: inferCategory(p.osm_key, p.osm_value),
    tags: [p.osm_value, p.osm_key].filter(Boolean) as string[],
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function searchNominatim(
  query: string,
  options?: { countryCode?: string; signal?: AbortSignal },
): Promise<PlaceSearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    addressdetails: '1',
    namedetails: '1',
    extratags: '1',
    limit: '10',
    'accept-language': 'ko,en',
  })
  if (options?.countryCode) {
    params.set('countrycodes', options.countryCode.toLowerCase())
  }

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    signal: options?.signal,
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`Nominatim ${res.status}`)
  const data = (await res.json()) as NominatimItem[]
  return data.map(fromNominatim)
}

async function searchPhoton(
  query: string,
  options?: { countryCode?: string; signal?: AbortSignal },
): Promise<PlaceSearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    limit: '10',
    lang: 'en',
  })

  const res = await fetch(`https://photon.komoot.io/api/?${params}`, {
    signal: options?.signal,
  })
  if (!res.ok) throw new Error(`Photon ${res.status}`)
  const data = (await res.json()) as { features?: PhotonFeature[] }
  let results = (data.features || []).map(fromPhoton)

  if (options?.countryCode) {
    results = results.filter((r) => r.countryCode === options.countryCode!.toUpperCase())
  }
  return results
}

function dedupe(results: PlaceSearchResult[]): PlaceSearchResult[] {
  const seen = new Set<string>()
  const out: PlaceSearchResult[] = []
  for (const r of results) {
    const key = `${r.countryCode}|${r.name.toLowerCase()}|${r.lat.toFixed(4)}|${r.lng.toFixed(4)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(r)
  }
  return out
}

function isTransitResult(r: PlaceSearchResult): boolean {
  const hay = `${r.name} ${r.nameEn} ${r.label} ${r.tags.join(' ')}`.toLowerCase()
  if (/station|railway|rail|subway|tram|platform|halt|\bbus\s*stop\b|aerialway|역\b/.test(hay)) {
    return true
  }
  return r.tags.some((t) =>
    /^(station|stop|railway|rail|subway|tram|platform|halt|route|bus_stop|aerialway)$/i.test(
      t,
    ),
  )
}

function scoreResult(r: PlaceSearchResult, englishQuery: string, countryCode?: string): number {
  let score = 0
  const qTokens = englishQuery.toLowerCase().split(/\s+/).filter(Boolean)
  const hay = `${r.name} ${r.nameEn} ${r.label} ${r.tags.join(' ')}`.toLowerCase()
  const q = englishQuery.toLowerCase()
  const transit = isTransitResult(r)
  const famous = r.id.startsWith('famous-') || r.id.startsWith('wiki-')

  if (famous) score += 200
  if (countryCode && r.countryCode === countryCode.toUpperCase()) score += 80
  if (countryCode && r.countryCode && r.countryCode !== countryCode.toUpperCase()) score -= 100

  for (const t of qTokens) {
    if (t.length < 2) continue
    if (hay.includes(t)) score += 12
  }

  if (r.category === 'lodging') score += 10
  if (r.category === 'attraction') score += 6
  if (r.category === 'restaurant') score += 4
  if (r.category === 'nightlife') score += 5
  if (r.category === 'shopping') score += 3
  if (/baiyoke|hotel|tower/i.test(hay) && /baiyoke|sky|hotel/i.test(q)) score += 25
  if (/crazy\s*house/i.test(hay) && /crazy\s*house/i.test(q)) score += 30

  // 철도·버스·케이블카는 관광 검색에서 강하게 뒤로
  if (transit) score -= 120

  // 온천 검색: 실제 온천/관광지만 가산 (역 이름에 '온센' 들어가도 제외)
  if (/onsen|hot\s*spring|oncheon|温泉|온천/.test(q)) {
    if (!transit && /onsen|hot\s*spring|温泉|온천|온센/.test(hay)) score += 50
    if (!transit && (r.category === 'attraction' || r.category === 'lodging')) score += 20
  }

  if (/arima/.test(q) && /arima/.test(hay) && !transit) score += 35

  return score
}

function rankAndFilter(
  results: PlaceSearchResult[],
  englishQuery: string,
  countryCode?: string,
  strictCountry = false,
): PlaceSearchResult[] {
  let list = results
  if (strictCountry && countryCode) {
    list = list.filter((r) => r.countryCode === countryCode.toUpperCase())
  }

  const ranked = dedupe(list)
    .map((r) => ({
      ...r,
      inSelectedCountry: Boolean(countryCode && r.countryCode === countryCode.toUpperCase()),
    }))
    .sort(
      (a, b) =>
        scoreResult(b, englishQuery, countryCode) - scoreResult(a, englishQuery, countryCode),
    )
    .filter((r) => scoreResult(r, englishQuery, countryCode) > -50)

  // 관광 검색인데 비교통 결과가 있으면 역·정류장만 있는 항목은 숨김
  const tourismQuery = /onsen|hot\s*spring|oncheon|temple|shrine|tower|palace|museum|아리마|온천/i.test(
    englishQuery,
  )
  const hasNonTransit = ranked.some((r) => !isTransitResult(r))
  if (tourismQuery && hasNonTransit) {
    return ranked.filter((r) => !isTransitResult(r)).slice(0, 8)
  }

  return ranked.slice(0, 8)
}

async function searchQueries(
  queries: string[],
  options: { countryCode?: string; signal?: AbortSignal },
): Promise<PlaceSearchResult[]> {
  const collected: PlaceSearchResult[] = []

  for (let i = 0; i < queries.length; i++) {
    if (options.signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    const q = queries[i]
    if (i > 0) await sleep(250)

    try {
      const hits = await searchNominatim(q, options)
      collected.push(...hits)
      // 역만 잡히면 다음 쿼리도 시도 (조기 종료하지 않음)
      const useful = hits.some(
        (h) =>
          (!options.countryCode ||
            h.countryCode === options.countryCode.toUpperCase()) &&
          !isTransitResult(h),
      )
      if (useful) break
      if (!options.countryCode && hits.filter((h) => !isTransitResult(h)).length >= 3) {
        break
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') throw err
    }

    try {
      const photon = await searchPhoton(q, options)
      collected.push(...photon)
    } catch (err) {
      if ((err as Error).name === 'AbortError') throw err
    }

    if (collected.filter((h) => !isTransitResult(h)).length >= 8) break
  }

  return dedupe(collected)
}

/** Wikipedia REST: OSM에 관광 POI가 없을 때 좌표·이름 보강 */
async function fetchWikipediaPlace(
  title: string,
  options?: { countryCode?: string; signal?: AbortSignal },
): Promise<PlaceSearchResult | null> {
  const slug = title.trim().replace(/\s+/g, '_')
  if (slug.length < 2) return null
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`,
      {
        signal: options?.signal,
        headers: { Accept: 'application/json' },
      },
    )
    if (!res.ok) return null
    const data = (await res.json()) as {
      type?: string
      title?: string
      displaytitle?: string
      description?: string
      wikibase_item?: string
      coordinates?: { lat: number; lon: number }
      extract?: string
    }
    if (data.type === 'disambiguation' || !data.coordinates) return null

    let name = data.title || title
    if (data.wikibase_item) {
      const ko = await fetchWikidataKoLabel(data.wikibase_item, options?.signal)
      if (ko) name = ko
    } else if (!hasHangul(name)) {
      const tr = await translateToKorean(name, {
        signal: options?.signal,
        sourceHint: 'en',
      })
      if (tr) name = tr
    }

    return {
      id: `wiki-${data.wikibase_item || slug}`,
      label: [name, options?.countryCode].filter(Boolean).join(' · '),
      name,
      nameEn: data.title || title,
      city: '',
      countryCode: options?.countryCode?.toUpperCase() || null,
      address: data.description || data.extract?.slice(0, 120) || '',
      lat: data.coordinates.lat,
      lng: data.coordinates.lon,
      category: 'attraction',
      tags: ['wikipedia', 'tourism'],
      wikidata: data.wikibase_item,
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    return null
  }
}

/** OSM ko / Wikidata ko / 번역 API 순으로 한글 이름·도시·주소 보강 */
async function localizeResults(
  results: PlaceSearchResult[],
  signal?: AbortSignal,
): Promise<PlaceSearchResult[]> {
  return Promise.all(
    results.map(async (r) => {
      const hint = sourceHintForCountry(r.countryCode)
      const englishName =
        r.nameEn ||
        (/^[A-Za-z0-9\s\-&'.,()]+$/.test(r.name) ? r.name : '') ||
        ''

      let name = r.name
      if (!hasHangul(name)) {
        if (r.wikidata) {
          const wd = await fetchWikidataKoLabel(r.wikidata, signal)
          if (wd) name = wd
        }
        // 영문명 → 한글 우선 (고유명사 품질이 더 나은 경우가 많음)
        if (!hasHangul(name) && englishName) {
          const tr = await translateToKorean(englishName, {
            signal,
            sourceHint: 'en',
          })
          if (tr) name = tr
        }
        // 한자·가나 등 현지명 직접 번역
        if (!hasHangul(name) && r.name) {
          const tr = await translateToKorean(r.name, { signal, sourceHint: hint })
          if (tr) name = tr
        }
      }

      let city = r.city
      if (city && !hasHangul(city) && r.countryCode !== 'KR') {
        const cityKo = await translateToKorean(city, {
          signal,
          sourceHint: /^[A-Za-z]/.test(city) ? 'en' : hint,
        })
        if (cityKo) city = cityKo
      }

      let address = r.address
      if (address && !hasHangul(address) && r.countryCode !== 'KR') {
        const addrKo = await translateToKorean(address, {
          signal,
          sourceHint: hint,
        })
        if (addrKo) address = addrKo
      }

      const nameEn =
        englishName ||
        (r.nameEn && !hasHangul(r.nameEn) ? r.nameEn : '') ||
        ''
      const labelParts = [name, city, r.countryCode].filter(Boolean)

      return {
        ...r,
        name,
        nameEn: nameEn && nameEn !== name ? nameEn : r.nameEn,
        city,
        address,
        label: labelParts.length ? labelParts.join(' · ') : r.label,
      }
    }),
  )
}

/**
 * 1) 한글→영문 정규화 (방콕→Bangkok, 바이욕→Baiyoke …)
 * 2) 유명 장소 보정 (OSM에 역만 있는 아리마 온천 등)
 * 3) 쿼리/폼에서 국가 결정 후 해당 국가만 검색
 * 4) 없을 때만 전 세계 확장 / Wikipedia 폴백
 * 5) 결과 이름을 한글로 보강
 */
export async function searchPlacesWeb(
  query: string,
  options?: { countryCode?: string; signal?: AbortSignal },
): Promise<PlaceSearchResponse> {
  const q = query.trim()
  if (q.length < 2) {
    return { results: [], scope: 'none', usedQueries: [] }
  }

  const normalized = normalizePlaceQuery(q)
  // 쿼리에서 감지한 국가가 있으면 폼 국가보다 우선 (방콕 검색 시 TH)
  const effectiveCountry =
    normalized.detectedCountry || options?.countryCode || undefined

  const country = effectiveCountry ? getCountry(effectiveCountry) : undefined
  const capitalEn = effectiveCountry ? CAPITAL_EN[effectiveCountry] : undefined

  const queries = buildEnglishSearchQueries(
    normalized,
    country?.nameEn,
    capitalEn,
  ).slice(0, 5)

  const englishFocus = normalized.english || q
  const famous = matchFamousPlaces(q, englishFocus)

  async function finalize(
    hits: PlaceSearchResult[],
    scope: PlaceSearchResponse['scope'],
    fromGlobal: boolean,
  ): Promise<PlaceSearchResponse> {
    let merged = dedupe([...famous, ...hits])

    // OSM이 역만 돌려주면 Wikipedia로 관광지 좌표 보강
    const onlyTransit =
      merged.length > 0 && merged.every((r) => isTransitResult(r) || r.id.startsWith('famous-'))
    const needWiki =
      famous.length === 0 &&
      (merged.length === 0 || merged.every((r) => isTransitResult(r)))

    if (needWiki || (onlyTransit && famous.length === 0)) {
      const wikiTitle = englishFocus
        .replace(/\b(station|stop|railway|line)\b/gi, '')
        .trim()
      const wiki = await fetchWikipediaPlace(wikiTitle, {
        countryCode: effectiveCountry,
        signal: options?.signal,
      })
      if (wiki) merged = dedupe([wiki, ...merged])
    }

    const ranked = rankAndFilter(merged, englishFocus, effectiveCountry, false)
    const localized = await localizeResults(
      ranked.map((r) => ({
        ...r,
        fromGlobal,
        // 이미 한글인 유명장소는 번역 스킵되도록 유지
      })),
      options?.signal,
    )

    return {
      results: localized,
      scope: localized.length > 0 ? scope : 'none',
      usedQueries: queries,
      normalizedEnglish: englishFocus,
      effectiveCountry,
    }
  }

  // 유명 장소만으로도 바로 반환 가능하지만, OSM 결과와 합치기 위해 검색 진행
  // Pass 1: 국가 한정 + 영문 쿼리
  if (effectiveCountry) {
    const countryHits = await searchQueries(queries, {
      countryCode: effectiveCountry,
      signal: options?.signal,
    })
    const ranked = rankAndFilter(
      [...famous, ...countryHits],
      englishFocus,
      effectiveCountry,
      true,
    )
    if (ranked.length > 0 || famous.length > 0) {
      return finalize([...famous, ...countryHits], 'country', false)
    }
  }

  // Pass 2: 전 세계 (영문 쿼리). 국가 힌트가 있으면 그 국가 결과만 남김
  await sleep(250)
  const globalRaw = await searchQueries(queries, { signal: options?.signal })
  const rankedGlobal = rankAndFilter(
    [...famous, ...globalRaw],
    englishFocus,
    effectiveCountry,
    Boolean(effectiveCountry),
  )

  if (rankedGlobal.length === 0 && effectiveCountry) {
    const loose = rankAndFilter(
      [...famous, ...globalRaw],
      englishFocus,
      effectiveCountry,
      false,
    )
      .filter(
        (r) =>
          r.countryCode === effectiveCountry.toUpperCase() ||
          scoreResult(r, englishFocus, effectiveCountry) >= 30,
      )
      .filter((r) => !r.countryCode || r.countryCode === effectiveCountry.toUpperCase())

    return finalize(loose, loose.length > 0 ? 'global' : 'none', true)
  }

  return finalize(
    rankedGlobal.length > 0 ? rankedGlobal : [...famous, ...globalRaw],
    rankedGlobal.length > 0 || famous.length > 0
      ? effectiveCountry
        ? 'country'
        : 'global'
      : 'none',
    true,
  )
}
