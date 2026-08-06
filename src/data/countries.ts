import type { CountryProfile } from '../types/travel'

export const COUNTRIES: CountryProfile[] = [
  { code: 'KR', nameKo: '대한민국', nameEn: 'South Korea', region: 'Asia', capital: '서울', currency: 'KRW' },
  { code: 'JP', nameKo: '일본', nameEn: 'Japan', region: 'Asia', capital: '도쿄', currency: 'JPY' },
  { code: 'CN', nameKo: '중국', nameEn: 'China', region: 'Asia', capital: '베이징', currency: 'CNY' },
  { code: 'TW', nameKo: '대만', nameEn: 'Taiwan', region: 'Asia', capital: '타이베이', currency: 'TWD' },
  { code: 'HK', nameKo: '홍콩', nameEn: 'Hong Kong', region: 'Asia', capital: '홍콩', currency: 'HKD' },
  { code: 'TH', nameKo: '태국', nameEn: 'Thailand', region: 'Asia', capital: '방콕', currency: 'THB' },
  { code: 'VN', nameKo: '베트남', nameEn: 'Vietnam', region: 'Asia', capital: '하노이', currency: 'VND' },
  { code: 'SG', nameKo: '싱가포르', nameEn: 'Singapore', region: 'Asia', capital: '싱가포르', currency: 'SGD' },
  { code: 'MY', nameKo: '말레이시아', nameEn: 'Malaysia', region: 'Asia', capital: '쿠알라룸푸르', currency: 'MYR' },
  { code: 'ID', nameKo: '인도네시아', nameEn: 'Indonesia', region: 'Asia', capital: '자카르타', currency: 'IDR' },
  { code: 'PH', nameKo: '필리핀', nameEn: 'Philippines', region: 'Asia', capital: '마닐라', currency: 'PHP' },
  { code: 'US', nameKo: '미국', nameEn: 'United States', region: 'Americas', capital: '워싱턴 D.C.', currency: 'USD' },
  { code: 'CA', nameKo: '캐나다', nameEn: 'Canada', region: 'Americas', capital: '오타와', currency: 'CAD' },
  { code: 'MX', nameKo: '멕시코', nameEn: 'Mexico', region: 'Americas', capital: '멕시코시티', currency: 'MXN' },
  { code: 'GB', nameKo: '영국', nameEn: 'United Kingdom', region: 'Europe', capital: '런던', currency: 'GBP' },
  { code: 'FR', nameKo: '프랑스', nameEn: 'France', region: 'Europe', capital: '파리', currency: 'EUR' },
  { code: 'IT', nameKo: '이탈리아', nameEn: 'Italy', region: 'Europe', capital: '로마', currency: 'EUR' },
  { code: 'ES', nameKo: '스페인', nameEn: 'Spain', region: 'Europe', capital: '마드리드', currency: 'EUR' },
  { code: 'DE', nameKo: '독일', nameEn: 'Germany', region: 'Europe', capital: '베를린', currency: 'EUR' },
  { code: 'CH', nameKo: '스위스', nameEn: 'Switzerland', region: 'Europe', capital: '베른', currency: 'CHF' },
  { code: 'NL', nameKo: '네덜란드', nameEn: 'Netherlands', region: 'Europe', capital: '암스테르담', currency: 'EUR' },
  { code: 'PT', nameKo: '포르투갈', nameEn: 'Portugal', region: 'Europe', capital: '리스본', currency: 'EUR' },
  { code: 'AU', nameKo: '호주', nameEn: 'Australia', region: 'Oceania', capital: '캔버라', currency: 'AUD' },
  { code: 'NZ', nameKo: '뉴질랜드', nameEn: 'New Zealand', region: 'Oceania', capital: '웰링턴', currency: 'NZD' },
  { code: 'AE', nameKo: '아랍에미리트', nameEn: 'UAE', region: 'Middle East', capital: '아부다비', currency: 'AED' },
  { code: 'TR', nameKo: '튀르키예', nameEn: 'Turkey', region: 'Middle East', capital: '앙카라', currency: 'TRY' },
]

export const REGIONS = ['All', 'Asia', 'Europe', 'Americas', 'Oceania', 'Middle East'] as const

export function getCountry(code: string): CountryProfile | undefined {
  return COUNTRIES.find((c) => c.code === code)
}

export function flagEmoji(code: string): string {
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join('')
}
