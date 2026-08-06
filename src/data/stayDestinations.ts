export type StayDestination = {
  id: string
  nameKo: string
  nameEn: string
  countryCode: string
}

/** 숙소 검색용 주요 도시 */
export const STAY_DESTINATIONS: StayDestination[] = [
  { id: 'seoul', nameKo: '서울', nameEn: 'Seoul', countryCode: 'KR' },
  { id: 'busan', nameKo: '부산', nameEn: 'Busan', countryCode: 'KR' },
  { id: 'jeju', nameKo: '제주', nameEn: 'Jeju', countryCode: 'KR' },
  { id: 'tokyo', nameKo: '도쿄', nameEn: 'Tokyo', countryCode: 'JP' },
  { id: 'osaka', nameKo: '오사카', nameEn: 'Osaka', countryCode: 'JP' },
  { id: 'kyoto', nameKo: '교토', nameEn: 'Kyoto', countryCode: 'JP' },
  { id: 'fukuoka', nameKo: '후쿠오카', nameEn: 'Fukuoka', countryCode: 'JP' },
  { id: 'sapporo', nameKo: '삿포로', nameEn: 'Sapporo', countryCode: 'JP' },
  { id: 'okinawa', nameKo: '오키나와', nameEn: 'Okinawa', countryCode: 'JP' },
  { id: 'taipei', nameKo: '타이베이', nameEn: 'Taipei', countryCode: 'TW' },
  { id: 'hongkong', nameKo: '홍콩', nameEn: 'Hong Kong', countryCode: 'HK' },
  { id: 'bangkok', nameKo: '방콕', nameEn: 'Bangkok', countryCode: 'TH' },
  { id: 'chiangmai', nameKo: '치앙마이', nameEn: 'Chiang Mai', countryCode: 'TH' },
  { id: 'phuket', nameKo: '푸켓', nameEn: 'Phuket', countryCode: 'TH' },
  { id: 'pattaya', nameKo: '파타야', nameEn: 'Pattaya', countryCode: 'TH' },
  { id: 'hanoi', nameKo: '하노이', nameEn: 'Hanoi', countryCode: 'VN' },
  { id: 'hochiminh', nameKo: '호치민', nameEn: 'Ho Chi Minh City', countryCode: 'VN' },
  { id: 'danang', nameKo: '다낭', nameEn: 'Da Nang', countryCode: 'VN' },
  { id: 'singapore', nameKo: '싱가포르', nameEn: 'Singapore', countryCode: 'SG' },
  { id: 'kualalumpur', nameKo: '쿠알라룸푸르', nameEn: 'Kuala Lumpur', countryCode: 'MY' },
  { id: 'bali', nameKo: '발리', nameEn: 'Bali', countryCode: 'ID' },
  { id: 'jakarta', nameKo: '자카르타', nameEn: 'Jakarta', countryCode: 'ID' },
  { id: 'manila', nameKo: '마닐라', nameEn: 'Manila', countryCode: 'PH' },
  { id: 'paris', nameKo: '파리', nameEn: 'Paris', countryCode: 'FR' },
  { id: 'london', nameKo: '런던', nameEn: 'London', countryCode: 'GB' },
  { id: 'rome', nameKo: '로마', nameEn: 'Rome', countryCode: 'IT' },
  { id: 'barcelona', nameKo: '바르셀로나', nameEn: 'Barcelona', countryCode: 'ES' },
  { id: 'berlin', nameKo: '베를린', nameEn: 'Berlin', countryCode: 'DE' },
  { id: 'amsterdam', nameKo: '암스테르담', nameEn: 'Amsterdam', countryCode: 'NL' },
  { id: 'newyork', nameKo: '뉴욕', nameEn: 'New York', countryCode: 'US' },
  { id: 'losangeles', nameKo: '로스앤젤레스', nameEn: 'Los Angeles', countryCode: 'US' },
  { id: 'sanfrancisco', nameKo: '샌프란시스코', nameEn: 'San Francisco', countryCode: 'US' },
  { id: 'hawaii', nameKo: '하와이', nameEn: 'Hawaii', countryCode: 'US' },
  { id: 'sydney', nameKo: '시드니', nameEn: 'Sydney', countryCode: 'AU' },
  { id: 'melbourne', nameKo: '멜버른', nameEn: 'Melbourne', countryCode: 'AU' },
  { id: 'dubai', nameKo: '두바이', nameEn: 'Dubai', countryCode: 'AE' },
  { id: 'istanbul', nameKo: '이스탄불', nameEn: 'Istanbul', countryCode: 'TR' },
]

export function searchDestinations(query: string, limit = 12): StayDestination[] {
  const q = query.trim().toLowerCase()
  if (!q) return STAY_DESTINATIONS.slice(0, limit)
  return STAY_DESTINATIONS.filter(
    (d) =>
      d.nameKo.includes(query.trim()) ||
      d.nameEn.toLowerCase().includes(q) ||
      d.countryCode.toLowerCase().includes(q) ||
      d.id.includes(q),
  ).slice(0, limit)
}

export function resolveDestinationEn(destination: string, destinationEn?: string): string {
  if (destinationEn?.trim()) return destinationEn.trim()
  const hit = STAY_DESTINATIONS.find(
    (d) =>
      d.nameKo === destination.trim() ||
      d.nameEn.toLowerCase() === destination.trim().toLowerCase(),
  )
  return hit?.nameEn ?? destination.trim()
}
