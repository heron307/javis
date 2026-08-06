import type { PlaceCategory } from '../types/geo'
import type { PlaceSearchResult } from './placeSearch'

/** OSM에 관광 POI가 약하거나 역만 잡히는 유명 장소 보정 */
type FamousPlace = {
  keys: string[]
  name: string
  nameEn: string
  city: string
  countryCode: string
  address: string
  lat: number
  lng: number
  category: PlaceCategory
  tags: string[]
  wikidata?: string
}

const FAMOUS_PLACES: FamousPlace[] = [
  {
    keys: [
      'arima onsen',
      'arimaonsen',
      '아리마',
      '아리마온천',
      '아리마 온천',
      '아리마온센',
      '아리마 온센',
      '有馬温泉',
      '有马温泉',
    ],
    name: '아리마 온천',
    nameEn: 'Arima Onsen',
    city: '고베',
    countryCode: 'JP',
    address: 'Arimachō, Kita-ku, Kobe, Hyogo, Japan',
    lat: 34.79805556,
    lng: 135.2475,
    category: 'attraction',
    tags: ['onsen', 'hot_spring', 'tourism'],
    wikidata: 'Q4790673',
  },
]

function normKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

function queryHitsPlace(needles: string[], place: FamousPlace): boolean {
  return place.keys.some((k) => {
    const key = normKey(k)
    return needles.some((n) => n === key || n.includes(key) || (key.length >= 3 && key.includes(n)))
  })
}

/** 검색어와 맞는 유명 장소를 PlaceSearchResult로 반환 */
export function matchFamousPlaces(
  originalQuery: string,
  englishQuery?: string,
): PlaceSearchResult[] {
  const needles = [originalQuery, englishQuery || '']
    .map(normKey)
    .filter((n) => n.length >= 2)

  if (needles.length === 0) return []

  return FAMOUS_PLACES.filter((place) => queryHitsPlace(needles, place)).map((place) => ({
    id: `famous-${place.nameEn.toLowerCase().replace(/\s+/g, '-')}`,
    label: [place.name, place.city, place.countryCode].join(' · '),
    name: place.name,
    nameEn: place.nameEn,
    city: place.city,
    countryCode: place.countryCode,
    address: place.address,
    lat: place.lat,
    lng: place.lng,
    category: place.category,
    tags: [...place.tags],
    wikidata: place.wikidata,
    inSelectedCountry: true,
  }))
}
