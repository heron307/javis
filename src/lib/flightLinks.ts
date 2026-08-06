import { airportLabel, getAirport } from '../data/airports'
import type { CabinClass, FlightLink, FlightScanQuery } from '../types/flight'

function yymmdd(isoDate: string): string {
  const [y, m, d] = isoDate.split('-')
  if (!y || !m || !d) return ''
  return `${y.slice(2)}${m}${d}`
}

function cabinQuery(cabin: CabinClass): string {
  switch (cabin) {
    case 'premium':
      return 'premium economy'
    case 'business':
      return 'business class'
    case 'first':
      return 'first class'
    default:
      return 'economy'
  }
}

/** Google Flights 검색 (쿼리 기반 deep link) */
export function googleFlightsUrl(q: FlightScanQuery): string {
  const origin = q.origin.toUpperCase()
  const dest = q.destination.toUpperCase()
  const parts = [
    `Flights from ${origin} to ${dest}`,
    `on ${q.departDate}`,
  ]
  if (q.tripType === 'round' && q.returnDate) {
    parts.push(`through ${q.returnDate}`)
  } else {
    parts.push('one way')
  }
  if (q.adults > 1) parts.push(`${q.adults} adults`)
  if (q.cabin !== 'economy') parts.push(cabinQuery(q.cabin))

  const params = new URLSearchParams({
    hl: 'ko',
    curr: 'KRW',
    q: parts.join(' '),
  })
  return `https://www.google.com/travel/flights?${params}`
}

/** Skyscanner 검색 */
export function skyscannerUrl(q: FlightScanQuery): string {
  const o = q.origin.toLowerCase()
  const d = q.destination.toLowerCase()
  const out = yymmdd(q.departDate)
  const path =
    q.tripType === 'round' && q.returnDate
      ? `${o}/${d}/${out}/${yymmdd(q.returnDate)}`
      : `${o}/${d}/${out}`
  return `https://www.skyscanner.co.kr/transport/flights/${path}/?adults=${q.adults}&cabinclass=${q.cabin === 'premium' ? 'premiumeconomy' : q.cabin}`
}

/** Kayak 검색 */
export function kayakUrl(q: FlightScanQuery): string {
  const o = q.origin.toUpperCase()
  const d = q.destination.toUpperCase()
  const path =
    q.tripType === 'round' && q.returnDate
      ? `${o}-${d}/${q.departDate}/${q.returnDate}`
      : `${o}-${d}/${q.departDate}`
  return `https://www.kayak.com/flights/${path}?adults=${q.adults}`
}

type AirlineDef = {
  id: string
  label: string
  labelKo: string
  build: (q: FlightScanQuery) => string
}

const AIRLINES: AirlineDef[] = [
  {
    id: 'koreanair',
    label: 'Korean Air',
    labelKo: '대한항공',
    build: (q) =>
      `https://www.koreanair.com/booking/search?departure=${q.origin}&arrival=${q.destination}&departureDate=${q.departDate}${
        q.tripType === 'round' && q.returnDate ? `&returnDate=${q.returnDate}` : ''
      }&adult=${q.adults}`,
  },
  {
    id: 'asiana',
    label: 'Asiana',
    labelKo: '아시아나',
    build: () => 'https://flyasiana.com/C/KR/KO/index',
  },
  {
    id: 'jejuair',
    label: 'Jeju Air',
    labelKo: '제주항공',
    build: () => 'https://www.jejuair.net/ko/main/base/index.do',
  },
  {
    id: 'jinair',
    label: 'Jin Air',
    labelKo: '진에어',
    build: () => 'https://www.jinair.com/',
  },
  {
    id: 'tway',
    label: 'T\'way',
    labelKo: '티웨이',
    build: () => 'https://www.twayair.com/',
  },
  {
    id: 'airbusan',
    label: 'Air Busan',
    labelKo: '에어부산',
    build: () => 'https://www.airbusan.com/',
  },
]

export function buildFlightLinks(q: FlightScanQuery): FlightLink[] {
  const meta: FlightLink[] = [
    {
      id: 'google',
      label: 'Google Flights',
      labelKo: '구글 항공권',
      href: googleFlightsUrl(q),
      kind: 'meta',
    },
    {
      id: 'skyscanner',
      label: 'Skyscanner',
      labelKo: '스카이스캐너',
      href: skyscannerUrl(q),
      kind: 'meta',
    },
    {
      id: 'kayak',
      label: 'Kayak',
      labelKo: '카약',
      href: kayakUrl(q),
      kind: 'meta',
    },
  ]

  const airlines = AIRLINES.map((a) => ({
    id: a.id,
    label: a.label,
    labelKo: a.labelKo,
    href: a.build(q),
    kind: 'airline' as const,
  }))

  return [...meta, ...airlines]
}

export function describeScan(q: FlightScanQuery): string {
  const o = airportLabel(q.origin)
  const d = airportLabel(q.destination)
  if (q.tripType === 'round' && q.returnDate) {
    return `${o} → ${d} · ${q.departDate} / ${q.returnDate}`
  }
  return `${o} → ${d} · ${q.departDate} (편도)`
}

export function isValidScanQuery(q: FlightScanQuery): string | null {
  if (!q.origin || !q.destination) return '출발·도착 공항을 선택하세요.'
  if (q.origin.toUpperCase() === q.destination.toUpperCase()) {
    return '출발과 도착 공항이 같습니다.'
  }
  if (!q.departDate) return '출발일을 선택하세요.'
  if (q.tripType === 'round' && !q.returnDate) return '귀국일을 선택하세요.'
  if (q.tripType === 'round' && q.returnDate < q.departDate) {
    return '귀국일이 출발일보다 빠릅니다.'
  }
  if (!getAirport(q.origin) || !getAirport(q.destination)) {
    return '목록에 있는 공항 코드를 선택하세요.'
  }
  if (q.adults < 1 || q.adults > 9) return '인원은 1~9명까지 가능합니다.'
  return null
}
