/** 카테고리 id (동적 확장 가능) */
export type PlaceCategory = string

export type PlaceCategoryDef = {
  id: PlaceCategory
  label: string
  labelKo: string
  /** 기본 제공 카테고리. `other`는 삭제 불가 */
  builtin?: boolean
}

export type GeoPlace = {
  id: string
  countryCode: string
  city: string
  name: string
  nameEn: string
  category: PlaceCategory
  address: string
  lat: number | null
  lng: number | null
  rating: number
  /** 방문 여부 */
  visited: boolean
  notes: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type PlaceFormData = {
  countryCode: string
  city: string
  name: string
  nameEn: string
  category: PlaceCategory
  address: string
  lat: string
  lng: string
  rating: number
  notes: string
  tags: string
}

export type CitySummary = {
  city: string
  countryCode: string
  placeCount: number
  categories: Record<string, number>
}

export const PLACE_CATEGORIES: PlaceCategoryDef[] = [
  { id: 'attraction', label: 'Attraction', labelKo: '관광지', builtin: true },
  { id: 'restaurant', label: 'Restaurant', labelKo: '맛집', builtin: true },
  { id: 'cafe', label: 'Cafe', labelKo: '카페', builtin: true },
  { id: 'lodging', label: 'Lodging', labelKo: '숙소', builtin: true },
  { id: 'shopping', label: 'Shopping', labelKo: '쇼핑', builtin: true },
  { id: 'nightlife', label: 'Nightlife', labelKo: '나이트', builtin: true },
  { id: 'other', label: 'Other', labelKo: '기타', builtin: true },
]

export function categoryLabel(cat: PlaceCategory): string {
  return PLACE_CATEGORIES.find((c) => c.id === cat)?.labelKo ?? cat
}
