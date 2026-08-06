import { resolveDestinationEn } from '../data/stayDestinations'
import type { StayLink, StayScanQuery } from '../types/stay'

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn + 'T00:00:00')
  const b = new Date(checkOut + 'T00:00:00')
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000))
}

function searchPlace(q: StayScanQuery): string {
  return resolveDestinationEn(q.destination, q.destinationEn)
}

function typeHint(q: StayScanQuery): string {
  switch (q.stayType) {
    case 'hotel':
      return 'hotels'
    case 'hostel':
      return 'hostels'
    case 'apartment':
      return 'apartments'
    default:
      return 'hotels'
  }
}

export function googleHotelsUrl(q: StayScanQuery): string {
  const place = searchPlace(q)
  const params = new URLSearchParams({
    hl: 'ko',
    curr: 'KRW',
    q: `${typeHint(q)} in ${place}`,
  })
  // dates via query text for reliability
  const dates = `${q.checkIn} to ${q.checkOut}`
  params.set('q', `${typeHint(q)} in ${place} ${dates} ${q.adults} adults`)
  return `https://www.google.com/travel/hotels?${params}`
}

export function bookingUrl(q: StayScanQuery): string {
  const params = new URLSearchParams({
    ss: searchPlace(q),
    checkin: q.checkIn,
    checkout: q.checkOut,
    group_adults: String(q.adults),
    no_rooms: String(q.rooms),
    lang: 'ko',
    selected_currency: 'KRW',
  })
  if (q.stayType === 'hostel') params.set('nflt', 'ht_id=203')
  if (q.stayType === 'apartment') params.set('nflt', 'ht_id=201')
  return `https://www.booking.com/searchresults.html?${params}`
}

export function agodaUrl(q: StayScanQuery): string {
  const params = new URLSearchParams({
    city: searchPlace(q),
    checkIn: q.checkIn,
    checkOut: q.checkOut,
    adults: String(q.adults),
    rooms: String(q.rooms),
    locale: 'ko-kr',
    currencyCode: 'KRW',
    textToSearch: searchPlace(q),
  })
  return `https://www.agoda.com/search?${params}`
}

export function hotelsComUrl(q: StayScanQuery): string {
  const params = new URLSearchParams({
    destination: searchPlace(q),
    startDate: q.checkIn,
    endDate: q.checkOut,
    adults: String(q.adults),
    rooms: String(q.rooms),
  })
  return `https://www.hotels.com/Hotel-Search?${params}`
}

export function airbnbUrl(q: StayScanQuery): string {
  const place = encodeURIComponent(searchPlace(q))
  const params = new URLSearchParams({
    checkin: q.checkIn,
    checkout: q.checkOut,
    adults: String(q.adults),
  })
  return `https://www.airbnb.com/s/${place}/homes?${params}`
}

export function tripadvisorUrl(q: StayScanQuery): string {
  const params = new URLSearchParams({
    q: `${searchPlace(q)} hotels`,
    ss: 'hotels',
  })
  return `https://www.tripadvisor.com/Search?${params}`
}

export function buildStayLinks(q: StayScanQuery): StayLink[] {
  return [
    {
      id: 'google',
      label: 'Google Hotels',
      labelKo: '구글 호텔',
      href: googleHotelsUrl(q),
      kind: 'meta',
    },
    {
      id: 'booking',
      label: 'Booking.com',
      labelKo: '부킹닷컴',
      href: bookingUrl(q),
      kind: 'ota',
    },
    {
      id: 'agoda',
      label: 'Agoda',
      labelKo: '아고다',
      href: agodaUrl(q),
      kind: 'ota',
    },
    {
      id: 'hotels',
      label: 'Hotels.com',
      labelKo: '호텔스닷컴',
      href: hotelsComUrl(q),
      kind: 'ota',
    },
    {
      id: 'airbnb',
      label: 'Airbnb',
      labelKo: '에어비앤비',
      href: airbnbUrl(q),
      kind: 'ota',
    },
    {
      id: 'tripadvisor',
      label: 'Tripadvisor',
      labelKo: '트립어드바이저',
      href: tripadvisorUrl(q),
      kind: 'meta',
    },
  ]
}

export function describeStayScan(q: StayScanQuery): string {
  const n = nightsBetween(q.checkIn, q.checkOut)
  return `${q.destination} · ${q.checkIn} → ${q.checkOut} (${n}박) · 성인 ${q.adults} · 객실 ${q.rooms}`
}

export function isValidStayQuery(q: StayScanQuery): string | null {
  if (!q.destination.trim()) return '목적지를 입력하세요.'
  if (!q.checkIn || !q.checkOut) return '체크인·체크아웃 날짜를 선택하세요.'
  if (q.checkOut <= q.checkIn) return '체크아웃은 체크인 다음 날 이후여야 합니다.'
  if (q.adults < 1 || q.adults > 12) return '인원은 1~12명까지 가능합니다.'
  if (q.rooms < 1 || q.rooms > 8) return '객실은 1~8개까지 가능합니다.'
  return null
}
