/**
 * Google AI 모드 등 “장소명 + 설명/메타 혼재” 텍스트에서
 * 장소명 후보만 휴리스틱으로 추출한다.
 */

const META_LINE =
  /(영업\s*중|영업\s*종료|리뷰|평점|관광\s*명소|쇼핑|먹거리|전망대|시내\s*중심|별점|오픈|closed|open now|photos?|reviews?|\+\d+|호텔스|hotels\.com|tripadvisor)/i

const SECTION_HEADER =
  /(중심지|전망대|야경|추천|명소|코스|리스트|개요|요약|결과|검색)/

const NOISE_ONLY =
  /^[\d\s.,·•\-–—~/|()[\]★☆❤♥]+$/

function collapse(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

function hasHangul(s: string): boolean {
  return /[가-힣]/.test(s)
}

function looksLikeSentence(s: string): boolean {
  // 긴 설명문 / 조사·어미 위주
  if (s.length >= 28) return true
  if ((s.match(/\s/g) || []).length >= 4) return true
  if (/습니다|입니다|해요|예요|이에요|있으며|위한|있는|되는|같은|대표적|유명|즐길|볼\s*수/.test(s)) {
    return true
  }
  return false
}

function looksLikeRatingBlob(s: string): boolean {
  if (/^\d\.\d/.test(s)) return true
  if (/\d+\.\d\s*\(/.test(s)) return true
  if (/\d+(\.\d+)?만/.test(s)) return true
  if (/^\(?\d+(\.\d+)?[만kKmM]?\)?$/.test(s)) return true
  return false
}

/**
 * OCR/붙여넣기 원문 → 장소명 후보 (중복 제거, 순서 유지)
 */
export function extractPlaceNameCandidates(raw: string): string[] {
  const lines = raw
    .split(/\r?\n/)
    .map(collapse)
    .filter(Boolean)

  const out: string[] = []
  const seen = new Set<string>()

  for (const line of lines) {
    if (line.length < 2 || line.length > 24) continue
    if (NOISE_ONLY.test(line)) continue
    if (META_LINE.test(line)) continue
    if (SECTION_HEADER.test(line) && line.length <= 16) continue
    if (looksLikeRatingBlob(line)) continue
    if (looksLikeSentence(line)) continue
    // 순수 영문 소문장 스킵 (URL 조각 등)
    if (/^https?:/i.test(line)) continue
    if (/^[a-z0-9._/-]+$/i.test(line) && !/[A-Z]/.test(line) && line.length > 12) continue

    // 장소명은 보통 한글이거나 Title Case / 고유명사
    const okScript =
      hasHangul(line) ||
      /^[A-Z0-9][A-Za-z0-9\s'&.-]*$/.test(line) ||
      /[一-龯ぁ-んァ-ン]/.test(line)
    if (!okScript) continue

    // "도톤보리 4.4" 같은 형태 → 앞만
    const stripped = collapse(
      line
        .replace(/\s*\d\.\d.*$/, '')
        .replace(/\s*\(\d.*$/, '')
        .replace(/\s*영업.*$/, ''),
    )
    if (stripped.length < 2 || stripped.length > 20) continue
    if (META_LINE.test(stripped) || looksLikeSentence(stripped)) continue

    const key = stripped.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(stripped)
  }

  return out
}

/** 사용자가 한 줄에 하나씩 넣은 목록도 동일 필터로 정리 */
export function normalizePastedNameList(raw: string): string[] {
  // 줄바꿈이 없으면 쉼표 구분도 허용
  const normalized = raw.includes('\n')
    ? raw
    : raw.replace(/[,，、]/g, '\n')
  return extractPlaceNameCandidates(normalized)
}
