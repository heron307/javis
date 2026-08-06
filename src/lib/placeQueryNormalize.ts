import { hasHangul, romanizeHangul } from './hangulRomanize'

/** 한국어 지명/통용 표기 → 영문 (긴 토큰 우선 치환) */
const KO_EN_TOKENS: Record<string, string> = {
  // 유명 장소
  바이욕스카이: 'Baiyoke Sky',
  바이욕: 'Baiyoke',
  크레이지하우스: 'Crazy House',
  크레이지: 'Crazy',
  왕궁: 'Grand Palace',
  왓아룬: 'Wat Arun',
  센소지: 'Senso-ji',
  후시미이나리: 'Fushimi Inari',
  아리마온천: 'Arima Onsen',
  아리마온센: 'Arima Onsen',
  아리마: 'Arima Onsen',
  에펠탑: 'Eiffel Tower',
  루브르: 'Louvre',
  북촌한옥마을: 'Bukchon Hanok Village',
  북촌: 'Bukchon',
  수쿰빗: 'Sukhumvit',
  아속: 'Asok',
  카우보이: 'Cowboy',
  소이카우보이: 'Soi Cowboy',

  // 도시
  방콕: 'Bangkok',
  치앙마이: 'Chiang Mai',
  푸켓: 'Phuket',
  파타야: 'Pattaya',
  도쿄: 'Tokyo',
  오사카: 'Osaka',
  교토: 'Kyoto',
  고베: 'Kobe',
  후쿠오카: 'Fukuoka',
  삿포로: 'Sapporo',
  오키나와: 'Okinawa',
  서울: 'Seoul',
  부산: 'Busan',
  제주: 'Jeju',
  타이베이: 'Taipei',
  홍콩: 'Hong Kong',
  싱가포르: 'Singapore',
  쿠알라룸푸르: 'Kuala Lumpur',
  하노이: 'Hanoi',
  호치민: 'Ho Chi Minh City',
  다낭: 'Da Nang',
  마닐라: 'Manila',
  자카르타: 'Jakarta',
  발리: 'Bali',
  파리: 'Paris',
  런던: 'London',
  로마: 'Rome',
  바르셀로나: 'Barcelona',
  마드리드: 'Madrid',
  베를린: 'Berlin',
  암스테르담: 'Amsterdam',
  프라하: 'Prague',
  빈: 'Vienna',
  뉴욕: 'New York',
  로스앤젤레스: 'Los Angeles',
  샌프란시스코: 'San Francisco',
  시드니: 'Sydney',
  멜버른: 'Melbourne',
  두바이: 'Dubai',
  이스탄불: 'Istanbul',

  // 국가
  태국: 'Thailand',
  일본: 'Japan',
  중국: 'China',
  대만: 'Taiwan',
  베트남: 'Vietnam',
  말레이시아: 'Malaysia',
  인도네시아: 'Indonesia',
  필리핀: 'Philippines',
  미국: 'United States',
  영국: 'United Kingdom',
  프랑스: 'France',
  이탈리아: 'Italy',
  스페인: 'Spain',
  독일: 'Germany',
  호주: 'Australia',
  대한민국: 'South Korea',
  한국: 'South Korea',

  // 일반 키워드 · 콩글리시 (로마자화 전에 영문으로 치환)
  온천: 'Onsen',
  온센: 'Onsen',
  호텔: 'Hotel',
  리조트: 'Resort',
  타워: 'Tower',
  스카이: 'Sky',
  카페: 'Cafe',
  박물관: 'Museum',
  사원: 'Temple',
  신사: 'Shrine',
  시장: 'Market',
  공항: 'Airport',
  역: 'Station',
  하우스: 'House',
  파크: 'Park',
  비치: 'Beach',
  플라자: 'Plaza',
  센터: 'Center',
  가든: 'Garden',
  빌딩: 'Building',
  스퀘어: 'Square',
  빌리지: 'Village',
  아일랜드: 'Island',
  클럽: 'Club',
  라운지: 'Lounge',
  펍: 'Pub',
  몰: 'Mall',
  월드: 'World',
  그랜드: 'Grand',
  골든: 'Golden',
  로얄: 'Royal',
  인터내셔널: 'International',
  스테이션: 'Station',
  스트리트: 'Street',
  애비뉴: 'Avenue',
  소이: 'Soi',
}

/** 한국어 도시/국가 토큰 → ISO 국가코드 */
const KO_COUNTRY_HINT: Record<string, string> = {
  방콕: 'TH',
  치앙마이: 'TH',
  푸켓: 'TH',
  파타야: 'TH',
  태국: 'TH',
  도쿄: 'JP',
  오사카: 'JP',
  교토: 'JP',
  고베: 'JP',
  후쿠오카: 'JP',
  삿포로: 'JP',
  오키나와: 'JP',
  아리마온천: 'JP',
  아리마온센: 'JP',
  아리마: 'JP',
  일본: 'JP',
  서울: 'KR',
  부산: 'KR',
  제주: 'KR',
  한국: 'KR',
  대한민국: 'KR',
  타이베이: 'TW',
  대만: 'TW',
  홍콩: 'HK',
  싱가포르: 'SG',
  하노이: 'VN',
  호치민: 'VN',
  다낭: 'VN',
  베트남: 'VN',
  쿠알라룸푸르: 'MY',
  말레이시아: 'MY',
  자카르타: 'ID',
  발리: 'ID',
  인도네시아: 'ID',
  마닐라: 'PH',
  필리핀: 'PH',
  파리: 'FR',
  프랑스: 'FR',
  런던: 'GB',
  영국: 'GB',
  로마: 'IT',
  이탈리아: 'IT',
  바르셀로나: 'ES',
  마드리드: 'ES',
  스페인: 'ES',
  베를린: 'DE',
  독일: 'DE',
  암스테르담: 'NL',
  뉴욕: 'US',
  로스앤젤레스: 'US',
  샌프란시스코: 'US',
  미국: 'US',
  시드니: 'AU',
  멜버른: 'AU',
  호주: 'AU',
  두바이: 'AE',
  이스탄불: 'TR',
}

const EN_COUNTRY_HINT: Record<string, string> = {
  bangkok: 'TH',
  thailand: 'TH',
  'chiang mai': 'TH',
  phuket: 'TH',
  tokyo: 'JP',
  osaka: 'JP',
  kyoto: 'JP',
  kobe: 'JP',
  'arima onsen': 'JP',
  arima: 'JP',
  japan: 'JP',
  seoul: 'KR',
  busan: 'KR',
  korea: 'KR',
  paris: 'FR',
  france: 'FR',
  london: 'GB',
  rome: 'IT',
}

export type NormalizedQuery = {
  original: string
  /** OSM 검색에 쓸 영문 중심 쿼리 */
  english: string
  /** 쿼리에서 감지한 국가 코드 */
  detectedCountry?: string
  /** 치환에 사용된 토큰들 */
  replaced: string[]
}

function collapseSpaces(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

/** 한글 여행 검색어를 영문 OSM 친화 쿼리로 변환 */
export function normalizePlaceQuery(raw: string): NormalizedQuery {
  const original = collapseSpaces(raw)
  if (!original) {
    return { original: '', english: '', replaced: [] }
  }

  let text = original
  const replaced: string[] = []
  let detectedCountry: string | undefined

  // 공백 없는 붙여쓰기 대응 (바이욕스카이 등)
  const keys = Object.keys(KO_EN_TOKENS).sort((a, b) => b.length - a.length)

  for (const ko of keys) {
    if (!text.includes(ko)) continue
    text = text.split(ko).join(` ${KO_EN_TOKENS[ko]} `)
    replaced.push(ko)
    if (KO_COUNTRY_HINT[ko]) detectedCountry = KO_COUNTRY_HINT[ko]
  }

  text = collapseSpaces(text)

  // 남은 한글은 로마자화
  if (hasHangul(text)) {
    text = text.replace(/[가-힣]+/g, (chunk) => romanizeHangul(chunk))
    text = collapseSpaces(text)
  }

  // 영문 쿼리에서도 도시/국가 힌트 감지
  const lower = text.toLowerCase()
  if (!detectedCountry) {
    for (const [token, code] of Object.entries(EN_COUNTRY_HINT)) {
      if (lower.includes(token)) {
        detectedCountry = code
        break
      }
    }
  }

  // 호텔성 키워드가 없고 랜드마크성 이름이면 Hotel 보조 쿼리는 호출측에서 추가
  return {
    original,
    english: text,
    detectedCountry,
    replaced,
  }
}

/** OSM용 쿼리 후보 (영문 우선) */
export function buildEnglishSearchQueries(
  normalized: NormalizedQuery,
  countryNameEn?: string,
  capitalEn?: string,
): string[] {
  const base = normalized.english || normalized.original
  if (!base) return []

  const list: string[] = [base]

  // Baiyoke Sky → Baiyoke Sky Hotel 보강
  if (!/hotel|resort|temple|museum|cafe|tower|onsen/i.test(base)) {
    if (/baiyoke|sky|plaza|palace|inn|suite/i.test(base)) {
      list.push(`${base} Hotel`)
    }
  }

  // 온천: OSM은 Onsen 표기를 씀 (한글 로마자 oncheon 보정)
  if (/oncheon/i.test(base)) {
    list.unshift(base.replace(/oncheon/gi, 'Onsen'))
  }
  if (/onsen/i.test(base)) {
    list.push(base)
    if (!/kobe|hyogo|japan/i.test(base)) {
      list.push(`${base} Kobe`)
      list.push(`${base} Japan`)
    }
  }

  if (/arima\s*onsen/i.test(base)) {
    list.unshift('Arima Onsen')
    list.push('Arima Onsen Kobe')
    list.push('Arima Onsen Hyogo')
  }

  if (capitalEn && !base.toLowerCase().includes(capitalEn.toLowerCase())) {
    // 아리마 온천은 도쿄가 아니라 고베 권역
    if (!/arima/i.test(base)) {
      list.push(`${base} ${capitalEn}`)
      list.push(`${base} Hotel ${capitalEn}`)
    }
  }

  if (countryNameEn && !base.toLowerCase().includes(countryNameEn.toLowerCase())) {
    list.push(`${base} ${countryNameEn}`)
  }

  // 원문도 마지막 후보로 유지
  if (normalized.original !== base) {
    list.push(normalized.original)
  }

  return [...new Set(list.map(collapseSpaces).filter(Boolean))]
}
