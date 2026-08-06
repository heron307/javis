import { PLACE_CATEGORIES, type PlaceCategory, type PlaceCategoryDef } from '../types/geo'

const STORAGE_KEY = 'javis.geo.categories.v1'

export const DEFAULT_CATEGORIES: PlaceCategoryDef[] = [...PLACE_CATEGORIES]

function normalizeDef(raw: unknown): PlaceCategoryDef | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = typeof o.id === 'string' ? o.id.trim() : ''
  const label = typeof o.label === 'string' ? o.label.trim() : ''
  const labelKo = typeof o.labelKo === 'string' ? o.labelKo.trim() : ''
  if (!id || !label || !labelKo) return null
  return {
    id,
    label,
    labelKo,
    builtin: Boolean(o.builtin),
  }
}

export function loadCategories(): PlaceCategoryDef[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES))
      return [...DEFAULT_CATEGORIES]
    }
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return [...DEFAULT_CATEGORIES]
    const list = parsed.map(normalizeDef).filter(Boolean) as PlaceCategoryDef[]
    if (list.length === 0) return [...DEFAULT_CATEGORIES]
    if (!list.some((c) => c.id === 'other')) {
      const other = DEFAULT_CATEGORIES.find((c) => c.id === 'other')!
      list.push({ ...other })
    }
    return list
  } catch {
    return [...DEFAULT_CATEGORIES]
  }
}

export function saveCategories(categories: PlaceCategoryDef[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(categories))
}

export function slugifyCategoryId(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
  return base || `cat-${Date.now().toString(36)}`
}

export function uniqueCategoryId(label: string, existing: PlaceCategoryDef[]): string {
  let id = slugifyCategoryId(label)
  if (!/^[a-z]/.test(id)) id = `cat-${id}`
  let candidate = id
  let n = 2
  const ids = new Set(existing.map((c) => c.id))
  while (ids.has(candidate)) {
    candidate = `${id}-${n}`
    n += 1
  }
  return candidate
}

export function resolveCategoryLabel(
  cat: PlaceCategory,
  categories: PlaceCategoryDef[],
): string {
  return categories.find((c) => c.id === cat)?.labelKo ?? cat
}
