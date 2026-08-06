import type { Airport } from '../types/flight'

/** 자주 쓰는 공항 (앱 국가 중심) */
export const AIRPORTS: Airport[] = [
  { code: 'ICN', nameKo: '인천국제공항', nameEn: 'Incheon Intl', cityKo: '서울/인천', countryCode: 'KR' },
  { code: 'GMP', nameKo: '김포국제공항', nameEn: 'Gimpo Intl', cityKo: '서울', countryCode: 'KR' },
  { code: 'PUS', nameKo: '김해국제공항', nameEn: 'Gimhae Intl', cityKo: '부산', countryCode: 'KR' },
  { code: 'CJU', nameKo: '제주국제공항', nameEn: 'Jeju Intl', cityKo: '제주', countryCode: 'KR' },
  { code: 'NRT', nameKo: '나리타 국제공항', nameEn: 'Narita Intl', cityKo: '도쿄', countryCode: 'JP' },
  { code: 'HND', nameKo: '하네다 공항', nameEn: 'Haneda', cityKo: '도쿄', countryCode: 'JP' },
  { code: 'KIX', nameKo: '간사이 국제공항', nameEn: 'Kansai Intl', cityKo: '오사카', countryCode: 'JP' },
  { code: 'CTS', nameKo: '신치토세 공항', nameEn: 'New Chitose', cityKo: '삿포로', countryCode: 'JP' },
  { code: 'FUK', nameKo: '후쿠오카 공항', nameEn: 'Fukuoka', cityKo: '후쿠오카', countryCode: 'JP' },
  { code: 'OKA', nameKo: '나하 공항', nameEn: 'Naha', cityKo: '오키나와', countryCode: 'JP' },
  { code: 'TPE', nameKo: '타오위안 국제공항', nameEn: 'Taoyuan Intl', cityKo: '타이베이', countryCode: 'TW' },
  { code: 'HKG', nameKo: '홍콩 국제공항', nameEn: 'Hong Kong Intl', cityKo: '홍콩', countryCode: 'HK' },
  { code: 'PVG', nameKo: '푸동 국제공항', nameEn: 'Pudong Intl', cityKo: '상하이', countryCode: 'CN' },
  { code: 'PEK', nameKo: '베이징 수도 국제공항', nameEn: 'Beijing Capital', cityKo: '베이징', countryCode: 'CN' },
  { code: 'BKK', nameKo: '수완나품 공항', nameEn: 'Suvarnabhumi', cityKo: '방콕', countryCode: 'TH' },
  { code: 'DMK', nameKo: '돈므앙 공항', nameEn: 'Don Mueang', cityKo: '방콕', countryCode: 'TH' },
  { code: 'HKT', nameKo: '푸켓 국제공항', nameEn: 'Phuket Intl', cityKo: '푸켓', countryCode: 'TH' },
  { code: 'CNX', nameKo: '치앙마이 국제공항', nameEn: 'Chiang Mai Intl', cityKo: '치앙마이', countryCode: 'TH' },
  { code: 'SGN', nameKo: '탄손녓 국제공항', nameEn: 'Tan Son Nhat', cityKo: '호치민', countryCode: 'VN' },
  { code: 'HAN', nameKo: '노이바이 국제공항', nameEn: 'Noi Bai Intl', cityKo: '하노이', countryCode: 'VN' },
  { code: 'DAD', nameKo: '다낭 국제공항', nameEn: 'Da Nang Intl', cityKo: '다낭', countryCode: 'VN' },
  { code: 'SIN', nameKo: '창이 국제공항', nameEn: 'Changi Intl', cityKo: '싱가포르', countryCode: 'SG' },
  { code: 'KUL', nameKo: '쿠알라룸푸르 국제공항', nameEn: 'Kuala Lumpur Intl', cityKo: '쿠알라룸푸르', countryCode: 'MY' },
  { code: 'CGK', nameKo: '수카르노하타 공항', nameEn: 'Soekarno-Hatta', cityKo: '자카르타', countryCode: 'ID' },
  { code: 'DPS', nameKo: '응우라라이 공항', nameEn: 'Ngurah Rai', cityKo: '발리', countryCode: 'ID' },
  { code: 'MNL', nameKo: '니노이 아키노 공항', nameEn: 'Ninoy Aquino', cityKo: '마닐라', countryCode: 'PH' },
  { code: 'LAX', nameKo: '로스앤젤레스 국제공항', nameEn: 'Los Angeles Intl', cityKo: 'LA', countryCode: 'US' },
  { code: 'JFK', nameKo: '존 F. 케네디 국제공항', nameEn: 'JFK Intl', cityKo: '뉴욕', countryCode: 'US' },
  { code: 'SFO', nameKo: '샌프란시스코 국제공항', nameEn: 'San Francisco Intl', cityKo: '샌프란시스코', countryCode: 'US' },
  { code: 'HNL', nameKo: '호놀룰루 국제공항', nameEn: 'Honolulu Intl', cityKo: '호놀룰루', countryCode: 'US' },
  { code: 'YVR', nameKo: '밴쿠버 국제공항', nameEn: 'Vancouver Intl', cityKo: '밴쿠버', countryCode: 'CA' },
  { code: 'LHR', nameKo: '히드로 공항', nameEn: 'Heathrow', cityKo: '런던', countryCode: 'GB' },
  { code: 'CDG', nameKo: '샤를 드골 공항', nameEn: 'Charles de Gaulle', cityKo: '파리', countryCode: 'FR' },
  { code: 'FCO', nameKo: '피우미치노 공항', nameEn: 'Fiumicino', cityKo: '로마', countryCode: 'IT' },
  { code: 'BCN', nameKo: '엘프라트 공항', nameEn: 'El Prat', cityKo: '바르셀로나', countryCode: 'ES' },
  { code: 'FRA', nameKo: '프랑크푸르트 공항', nameEn: 'Frankfurt', cityKo: '프랑크푸르트', countryCode: 'DE' },
  { code: 'AMS', nameKo: '스키폴 공항', nameEn: 'Schiphol', cityKo: '암스테르담', countryCode: 'NL' },
  { code: 'ZRH', nameKo: '취리히 공항', nameEn: 'Zurich', cityKo: '취리히', countryCode: 'CH' },
  { code: 'LIS', nameKo: '리스본 공항', nameEn: 'Lisbon', cityKo: '리스본', countryCode: 'PT' },
  { code: 'SYD', nameKo: '시드니 공항', nameEn: 'Sydney', cityKo: '시드니', countryCode: 'AU' },
  { code: 'MEL', nameKo: '멜버른 공항', nameEn: 'Melbourne', cityKo: '멜버른', countryCode: 'AU' },
  { code: 'AKL', nameKo: '오클랜드 공항', nameEn: 'Auckland', cityKo: '오클랜드', countryCode: 'NZ' },
  { code: 'DXB', nameKo: '두바이 국제공항', nameEn: 'Dubai Intl', cityKo: '두바이', countryCode: 'AE' },
  { code: 'IST', nameKo: '이스탄불 공항', nameEn: 'Istanbul', cityKo: '이스탄불', countryCode: 'TR' },
]

export function getAirport(code: string): Airport | undefined {
  return AIRPORTS.find((a) => a.code === code.toUpperCase())
}

export function airportLabel(code: string): string {
  const a = getAirport(code)
  if (!a) return code.toUpperCase()
  return `${a.cityKo} (${a.code})`
}

export function searchAirports(query: string, limit = 12): Airport[] {
  const q = query.trim().toLowerCase()
  if (!q) return AIRPORTS.slice(0, limit)
  return AIRPORTS.filter(
    (a) =>
      a.code.toLowerCase().includes(q) ||
      a.cityKo.includes(query.trim()) ||
      a.nameKo.includes(query.trim()) ||
      a.nameEn.toLowerCase().includes(q),
  ).slice(0, limit)
}
