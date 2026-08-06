const CHO = [
  'g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h',
]

const JUNG = [
  'a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i',
]

const JONG = [
  '', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'l', 'l', 'l', 'l', 'l', 'l', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't',
]

export function hasHangul(text: string): boolean {
  return /[가-힣]/.test(text)
}

/** 한글 음절 → 개정 로마자 近似. 비한글은 그대로 유지 */
export function romanizeHangul(text: string): string {
  let out = ''
  for (const ch of text) {
    const code = ch.codePointAt(0)!
    if (code < 0xac00 || code > 0xd7a3) {
      out += ch
      continue
    }
    const offset = code - 0xac00
    const cho = Math.floor(offset / 588)
    const jung = Math.floor((offset % 588) / 28)
    const jong = offset % 28
    out += `${CHO[cho]}${JUNG[jung]}${JONG[jong]}`
  }
  return out.replace(/\s+/g, ' ').trim()
}
