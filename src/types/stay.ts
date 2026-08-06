export type StayType = 'hotel' | 'hostel' | 'apartment' | 'any'

export type StayScanQuery = {
  destination: string
  /** 영문/검색용 (비우면 destination 사용) */
  destinationEn: string
  checkIn: string
  checkOut: string
  adults: number
  rooms: number
  stayType: StayType
}

export type StayScanRecord = StayScanQuery & {
  id: string
  createdAt: string
  pinned?: boolean
}

export type StayLink = {
  id: string
  label: string
  labelKo: string
  href: string
  kind: 'meta' | 'ota'
}

export const STAY_TYPES: { value: StayType; label: string; labelKo: string }[] = [
  { value: 'any', label: 'Any', labelKo: '전체' },
  { value: 'hotel', label: 'Hotel', labelKo: '호텔' },
  { value: 'hostel', label: 'Hostel', labelKo: '호스텔' },
  { value: 'apartment', label: 'Apartment', labelKo: '아파트' },
]
