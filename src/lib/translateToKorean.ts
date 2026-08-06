const cache = new Map<string, string>()

export function hasHangul(text: string): boolean {
  return /[\uAC00-\uD7A3]/.test(text)
}

/** 히라가나·가타카나·한자(CJK) */
export function hasCjk(text: string): boolean {
  return /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/.test(text)
}

function looksTranslatable(text: string): boolean {
  const t = text.trim()
  if (t.length < 2 || t.length > 120) return false
  if (hasHangul(t)) return false
  // 영문 또는 일본어/중국어 문자
  if (!/[A-Za-z\u00C0-\u024F\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/.test(t)) {
    return false
  }
  return true
}

export type TranslateSourceHint = 'en' | 'ja' | 'zh' | 'auto'

function resolveLangPairs(
  text: string,
  hint: TranslateSourceHint = 'auto',
): string[] {
  if (hint === 'en') return ['en|ko']
  if (hint === 'ja') return ['ja|ko', 'en|ko']
  if (hint === 'zh') return ['zh-CN|ko', 'zh|ko', 'en|ko']

  const hasLatin = /[A-Za-z]/.test(text)
  const hasKana = /[\u3040-\u30ff]/.test(text)
  const hasHan = /[\u3400-\u9fff\uf900-\ufaff]/.test(text)

  if (hasLatin && !hasKana && !hasHan) return ['en|ko']
  if (hasKana) return ['ja|ko', 'en|ko']
  if (hasHan) return ['ja|ko', 'zh-CN|ko', 'zh|ko', 'en|ko']
  return ['en|ko']
}

async function translateMyMemory(
  text: string,
  langpair: string,
  signal?: AbortSignal,
): Promise<string | null> {
  const url =
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}` +
    `&langpair=${encodeURIComponent(langpair)}`
  const res = await fetch(url, { signal })
  if (!res.ok) return null
  const data = (await res.json()) as {
    responseStatus?: number
    responseData?: { translatedText?: string }
  }
  if (data.responseStatus !== 200) return null
  const out = data.responseData?.translatedText?.trim()
  if (!out || out.toUpperCase() === 'INVALID QUERY' || out === text) return null
  return out
}

export type TranslateToKoreanOptions = {
  signal?: AbortSignal
  /** 국가·출처에 맞춘 원문 언어 힌트 */
  sourceHint?: TranslateSourceHint
}

/** 영문·일본어·중국어 등 비한글 텍스트를 한글로 번역. 실패 시 null */
export async function translateToKorean(
  text: string,
  signalOrOpts?: AbortSignal | TranslateToKoreanOptions,
): Promise<string | null> {
  const opts: TranslateToKoreanOptions =
    signalOrOpts instanceof AbortSignal || signalOrOpts === undefined
      ? { signal: signalOrOpts }
      : signalOrOpts

  const key = text.trim()
  if (!looksTranslatable(key)) return null

  const pairs = resolveLangPairs(key, opts.sourceHint)
  const cacheKey = `${opts.sourceHint || 'auto'}::${key.toLowerCase()}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  try {
    for (const pair of pairs) {
      const translated = await translateMyMemory(key, pair, opts.signal)
      if (translated && hasHangul(translated)) {
        cache.set(cacheKey, translated)
        return translated
      }
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
  }
  return null
}

/** 국가 코드 → 번역 원문 언어 힌트 */
export function sourceHintForCountry(countryCode?: string | null): TranslateSourceHint {
  const cc = (countryCode || '').toUpperCase()
  if (cc === 'JP') return 'ja'
  if (cc === 'CN' || cc === 'TW' || cc === 'HK' || cc === 'MO') return 'zh'
  return 'auto'
}

/** Wikidata QID → 한국어 라벨 */
export async function fetchWikidataKoLabel(
  qid: string,
  signal?: AbortSignal,
): Promise<string | null> {
  if (!/^Q\d+$/i.test(qid)) return null
  const cacheKey = `wd:${qid.toUpperCase()}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  try {
    const url =
      `https://www.wikidata.org/w/api.php?action=wbgetentities` +
      `&ids=${encodeURIComponent(qid.toUpperCase())}` +
      `&props=labels&languages=ko&format=json&origin=*`
    const res = await fetch(url, { signal })
    if (!res.ok) return null
    const data = (await res.json()) as {
      entities?: Record<string, { labels?: { ko?: { value?: string } } }>
    }
    const label = data.entities?.[qid.toUpperCase()]?.labels?.ko?.value?.trim()
    if (label && hasHangul(label)) {
      cache.set(cacheKey, label)
      return label
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
  }
  return null
}
