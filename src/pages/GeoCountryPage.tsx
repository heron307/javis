import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { CategoryManageModal } from '../components/geo/CategoryManageModal'
import { MapPanel } from '../components/geo/MapPanel'
import { PlaceFormModal } from '../components/geo/PlaceFormModal'
import { PlaceImportModal } from '../components/geo/PlaceImportModal'
import { VisitMarkIcon } from '../components/geo/VisitMarkIcon'
import { FEATURE_PLACE_IMPORT } from '../config/features'
import { flagEmoji, getCountry } from '../data/countries'
import { useGeoCategories } from '../hooks/useGeoCategories'
import { useGeoIntel } from '../hooks/useGeoIntel'
import { mapsSearchUrl } from '../lib/geoStorage'
import type { GeoPlace, PlaceCategory, PlaceFormData } from '../types/geo'

const KNOWN_CAT_CLASS = new Set([
  'attraction',
  'restaurant',
  'cafe',
  'lodging',
  'shopping',
  'nightlife',
  'other',
])

function catBadgeClass(id: string) {
  return KNOWN_CAT_CLASS.has(id) ? `cat-${id}` : 'cat-custom'
}

type ListViewMode = 'detailed' | 'compact'

const VIEW_KEY = 'javis.geo.listView'

/** 상세모드: 세로 최대 5행. 5–10 → 2단(폭 1/2), 11+ → 3단+(폭 1/3) */
const DETAILED_ITEM_H = 148
const DETAILED_GAP = 12 // = 0.75rem
const DETAILED_MAX_ROWS = 5
/** 가로 스크롤바가 카드와 겹치지 않도록 확보하는 하단 여백(px) */
const DETAILED_SCROLLBAR_ROOM = 16

function detailedContentHeight(rows: number) {
  return rows * DETAILED_ITEM_H + Math.max(0, rows - 1) * DETAILED_GAP
}

function loadViewMode(): ListViewMode {
  try {
    const v = localStorage.getItem(VIEW_KEY)
    return v === 'compact' ? 'compact' : 'detailed'
  } catch {
    return 'detailed'
  }
}

export function GeoCountryPage() {
  const { code = '' } = useParams()
  const country = getCountry(code.toUpperCase())
  const {
    getPlacesByCountry,
    getCitiesByCountry,
    countrySummaries,
    addPlace,
    updatePlace,
    updatePlaceCategory,
    togglePlaceVisited,
    deletePlace,
  } = useGeoIntel()
  const { categories, filterCategories, labelOf } = useGeoCategories()

  const [cityFilter, setCityFilter] = useState<string>('All')
  const [categoryFilter, setCategoryFilter] = useState<PlaceCategory | 'All'>('All')
  const [tagFilter, setTagFilter] = useState<string>('All')
  const [visitedOnly, setVisitedOnly] = useState(false)
  const [listView, setListView] = useState<ListViewMode>(loadViewMode)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editing, setEditing] = useState<GeoPlace | null>(null)
  const [isWideLayout, setIsWideLayout] = useState(true)
  /**
   * 상세모드: place ≥ 5 이면 다단
   * 5–10: 2단·폭 1/2 / 11+: 3단+·폭 1/3 (열 수 > 표시폭이면 가로 스크롤)
   */
  const [detailedMultiCol, setDetailedMultiCol] = useState(false)
  const [detailedScrollerH, setDetailedScrollerH] = useState<number | undefined>()
  const [detailedRows, setDetailedRows] = useState(DETAILED_MAX_ROWS)
  const [detailedNeedsHScroll, setDetailedNeedsHScroll] = useState(false)
  /** 간단모드: 세로 우선, 높이 초과 시 2·3단… 다단 */
  const [compactMultiCol, setCompactMultiCol] = useState(false)
  const [compactScrollerH, setCompactScrollerH] = useState<number | undefined>()
  const [compactRows, setCompactRows] = useState(1)
  /** 다단일 때 1열 폭 = 목록 스크롤러 전체 폭 (축소하지 않음) */
  const [compactColW, setCompactColW] = useState<number | undefined>()
  const [detailedColW, setDetailedColW] = useState<number | undefined>()
  const detailRef = useRef<HTMLElement>(null)
  const listPanelRef = useRef<HTMLElement>(null)
  const listScrollerRef = useRef<HTMLDivElement>(null)

  const places = getPlacesByCountry(code.toUpperCase())
  const cities = getCitiesByCountry(code.toUpperCase())
  const summary = countrySummaries.find((s) => s.code === code.toUpperCase())

  const availableTags = useMemo(() => {
    const scoped = places.filter((p) => {
      if (cityFilter !== 'All' && p.city !== cityFilter) return false
      if (categoryFilter !== 'All' && p.category !== categoryFilter) return false
      return true
    })
    const counts = new Map<string, number>()
    for (const p of scoped) {
      for (const tag of p.tags) {
        const key = tag.trim()
        if (!key) continue
        counts.set(key, (counts.get(key) || 0) + 1)
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'))
      .map(([tag, count]) => ({ tag, count }))
  }, [places, cityFilter, categoryFilter])

  const filtered = useMemo(() => {
    return places.filter((p) => {
      if (visitedOnly && !p.visited) return false
      if (cityFilter !== 'All' && p.city !== cityFilter) return false
      if (categoryFilter !== 'All' && p.category !== categoryFilter) return false
      if (tagFilter !== 'All' && !p.tags.includes(tagFilter)) return false
      return true
    })
  }, [places, cityFilter, categoryFilter, tagFilter, visitedOnly])

  const selected =
    filtered.find((p) => p.id === selectedId) ?? filtered[0] ?? null

  // 도시/필터 변경 시 선택도 필터 목록 안으로만 유지 (잘못된 active 하이라이트 방지)
  useEffect(() => {
    if (filtered.length === 0) {
      if (selectedId !== null) setSelectedId(null)
      return
    }
    if (!filtered.some((p) => p.id === selectedId)) {
      setSelectedId(filtered[0].id)
    }
  }, [filtered, selectedId])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 961px)')
    const syncLayout = () => setIsWideLayout(mq.matches)
    syncLayout()
    mq.addEventListener('change', syncLayout)
    return () => mq.removeEventListener('change', syncLayout)
  }, [])

  useEffect(() => {
    if (
      categoryFilter !== 'All' &&
      !categories.some((c) => c.id === categoryFilter)
    ) {
      setCategoryFilter('All')
    }
  }, [categories, categoryFilter])

  // 상세모드: ≥5 → 다단. 5–10 폭1/2, 11+ 폭1/3. 스크롤바는 카드 아래 여백에 배치
  useLayoutEffect(() => {
    const panel = listPanelRef.current
    if (!panel) return

    const measure = () => {
      if (listView !== 'detailed' || !window.matchMedia('(min-width: 961px)').matches) {
        setDetailedMultiCol(false)
        setDetailedScrollerH(undefined)
        setDetailedRows(DETAILED_MAX_ROWS)
        setDetailedColW(undefined)
        setDetailedNeedsHScroll(false)
        return
      }

      const count = filtered.length
      if (count < 5) {
        setDetailedMultiCol(false)
        setDetailedScrollerH(undefined)
        setDetailedRows(DETAILED_MAX_ROWS)
        setDetailedColW(undefined)
        setDetailedNeedsHScroll(false)
        return
      }

      const scroller = listScrollerRef.current
      const panelW = Math.max(200, Math.round(scroller?.clientWidth || panel.clientWidth))
      // 5–10: 한 화면에 2열 / 11+: 한 화면에 3열
      const fitCols = count <= 10 ? 2 : 3
      const rows = Math.min(DETAILED_MAX_ROWS, Math.ceil(count / fitCols))
      const totalCols = Math.ceil(count / rows)
      const colW = Math.max(
        120,
        Math.floor((panelW - DETAILED_GAP * (fitCols - 1)) / fitCols),
      )
      const contentH = detailedContentHeight(rows)
      const needsHScroll = totalCols > fitCols
      const scrollerH = contentH + (needsHScroll ? DETAILED_SCROLLBAR_ROOM : 0)

      setDetailedRows(rows)
      setDetailedColW(colW)
      setDetailedScrollerH(scrollerH)
      setDetailedNeedsHScroll(needsHScroll)
      setDetailedMultiCol(true)
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(panel)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [
    filtered.length,
    listView,
    isWideLayout,
    tagFilter,
    categoryFilter,
    cityFilter,
  ])

  // 간단모드: 세로 우선 → 높이 초과 시 다단(2·3…) + 가로 스크롤 (열 폭 = 패널 1/3)
  useLayoutEffect(() => {
    const panel = listPanelRef.current
    const detail = detailRef.current
    if (!panel || !detail) return

    const ITEM_H = 52
    const GAP = 9 // ~0.55rem
    const measure = () => {
      if (listView !== 'compact' || !window.matchMedia('(min-width: 961px)').matches) {
        setCompactMultiCol(false)
        setCompactScrollerH(undefined)
        setCompactRows(1)
        setCompactColW(undefined)
        return
      }

      const detailH = Math.round(detail.getBoundingClientRect().height)
      const toolbar = panel.querySelector('.geo-list-toolbar') as HTMLElement | null
      const toolbarH = toolbar?.getBoundingClientRect().height ?? 0
      const available = Math.max(80, detailH - toolbarH - 8)
      const scroller = listScrollerRef.current
      const panelW = Math.max(180, Math.round(scroller?.clientWidth || panel.clientWidth))
      // 다단(2열+)일 때 카드 폭 = 목록 폭의 1/3 (gap 반영)
      const colW = Math.max(120, Math.floor((panelW - GAP * 2) / 3))

      const count = filtered.length
      // gap 반영해 스크롤러 안에 실제로 들어가는 행 수만 사용 (하단 잘림 방지)
      const rows = Math.max(1, Math.floor((available + GAP) / (ITEM_H + GAP)))
      const overflows = count > rows

      setCompactScrollerH(available)
      setCompactRows(rows)
      setCompactColW(colW)
      setCompactMultiCol((prev) => (prev === overflows ? prev : overflows))
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(panel)
    ro.observe(detail)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [
    filtered.length,
    listView,
    isWideLayout,
    selected?.id,
    tagFilter,
    categoryFilter,
    cityFilter,
  ])

  if (!country) {
    return <Navigate to="/geo" replace />
  }

  function changeListView(mode: ListViewMode) {
    setListView(mode)
    localStorage.setItem(VIEW_KEY, mode)
  }

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(place: GeoPlace) {
    setEditing(place)
    setModalOpen(true)
  }

  function handleSubmit(data: PlaceFormData): boolean {
    if (editing) {
      const result = updatePlace(editing.id, data)
      if (!result.ok) {
        if (result.reason === 'duplicate') {
          window.alert(
            `이미 등록된 장소입니다: 「${result.existing?.name || data.name}」`,
          )
        }
        return false
      }
      setSelectedId(result.place.id)
      return true
    }

    const result = addPlace(data)
    if (!result.ok) {
      if (result.reason === 'duplicate') {
        window.alert(
          `이미 등록된 장소입니다: 「${result.existing?.name || data.name}」`,
        )
      }
      return false
    }
    setSelectedId(result.place.id)
    return true
  }

  function handleDelete(place: GeoPlace) {
    if (window.confirm(`「${place.name}」 정보를 삭제할까요?`)) {
      deletePlace(place.id)
      if (selectedId === place.id) setSelectedId(null)
    }
  }

  function handleImportPlaces(items: PlaceFormData[]) {
    let added = 0
    let skipped = 0
    let lastId: string | null = null
    for (const item of items) {
      const result = addPlace(item)
      if (result.ok) {
        added += 1
        lastId = result.place.id
      } else if (result.reason === 'duplicate') {
        skipped += 1
      }
    }
    if (lastId) setSelectedId(lastId)
    if (skipped > 0) {
      window.alert(
        `등록 ${added}개 · 중복 건너뜀 ${skipped}개`,
      )
    }
  }

  return (
    <AppShell statusLabel={`${country.code} GEO`}>
      <main className="page-main">
        <div className="container">
          <div className="breadcrumb font-mono">
            <Link to="/geo">GEO INTEL</Link>
            <span>/</span>
            <span>{country.code}</span>
          </div>

          <header className="page-header country-detail-header">
            <div className="country-detail-identity">
              <span className="country-detail-flag">{flagEmoji(country.code)}</span>
              <div>
                <p className="section-code">
                  // {country.region.toUpperCase()} · LOCAL INTEL
                </p>
                <h1 className="page-title glow-text">{country.nameKo}</h1>
                <p className="page-desc">
                  {country.nameEn} · {summary?.cityCount ?? 0} cities ·{' '}
                  {summary?.placeCount ?? 0} places
                </p>
              </div>
            </div>
            <div className="visit-actions">
              {FEATURE_PLACE_IMPORT && (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setImportOpen(true)}
                >
                  Import List
                </button>
              )}
              <button type="button" className="btn-primary" onClick={openCreate}>
                + Add Place
              </button>
            </div>
          </header>

          <div className="stats-row geo-cat-stats">
            {filterCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`stat-chip hud-panel geo-cat-chip${
                  categoryFilter === cat.id ? ' active' : ''
                }`}
                onClick={() => {
                  setCategoryFilter((prev) => (prev === cat.id ? 'All' : cat.id))
                  setTagFilter('All')
                }}
              >
                <span className="stat-chip-label">{cat.label}</span>
                <span className="stat-chip-value">
                  {summary?.byCat[cat.id] ?? 0}
                </span>
              </button>
            ))}
            <button
              type="button"
              className="stat-chip hud-panel geo-cat-manage"
              onClick={() => setCategoryModalOpen(true)}
            >
              <span className="stat-chip-label">Manage</span>
              <span className="stat-chip-value">+</span>
            </button>
          </div>

          <div className="geo-city-bar">
            <button
              type="button"
              className={`filter-chip${cityFilter === 'All' ? ' active' : ''}`}
              onClick={() => {
                setCityFilter('All')
                setTagFilter('All')
              }}
            >
              All Cities
            </button>
            {cities.map((c) => (
              <button
                key={c.city}
                type="button"
                className={`filter-chip${cityFilter === c.city ? ' active' : ''}`}
                onClick={() => {
                  setCityFilter(c.city)
                  setTagFilter('All')
                }}
              >
                {c.city} · {c.placeCount}
              </button>
            ))}
          </div>

          {availableTags.length > 0 && (
            <div className="geo-tag-bar">
              <span className="field-label">TAG FILTER</span>
              <div className="geo-tag-chips">
                <button
                  type="button"
                  className={`filter-chip${tagFilter === 'All' ? ' active' : ''}`}
                  onClick={() => setTagFilter('All')}
                >
                  All Tags
                </button>
                {availableTags.map(({ tag, count }) => (
                  <button
                    key={tag}
                    type="button"
                    className={`filter-chip${tagFilter === tag ? ' active' : ''}`}
                    onClick={() => setTagFilter((prev) => (prev === tag ? 'All' : tag))}
                  >
                    {tag} · {count}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="geo-layout">
            <section
              ref={listPanelRef}
              className={`geo-list-panel view-${listView}${
                detailedMultiCol && isWideLayout && listView === 'detailed'
                  ? ' is-multi-col'
                  : ''
              }${
                compactMultiCol && isWideLayout && listView === 'compact'
                  ? ' is-multi-col'
                  : ''
              }`}
            >
              <div className="geo-list-toolbar">
                <p className="mini-panel-title" style={{ marginBottom: 0 }}>
                  Place Nodes · {filtered.length}
                  {categoryFilter !== 'All' ? ` · ${labelOf(categoryFilter)}` : ''}
                  {tagFilter !== 'All' ? ` · #${tagFilter}` : ''}
                  {visitedOnly ? ' · 방문' : ''}
                </p>
                <div className="geo-list-toolbar-right">
                  <label className="toggle-visited geo-visited-filter">
                    <input
                      type="checkbox"
                      checked={visitedOnly}
                      onChange={(e) => setVisitedOnly(e.target.checked)}
                    />
                    <span>방문한 곳만</span>
                  </label>
                  <div className="geo-view-toggle" role="group" aria-label="목록 보기 방식">
                    <button
                      type="button"
                      className={`filter-chip${listView === 'detailed' ? ' active' : ''}`}
                      onClick={() => changeListView('detailed')}
                    >
                      상세
                    </button>
                    <button
                      type="button"
                      className={`filter-chip${listView === 'compact' ? ' active' : ''}`}
                      onClick={() => changeListView('compact')}
                    >
                      간단
                    </button>
                  </div>
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="empty-state hud-panel">
                  <p className="section-code">// NO NODES</p>
                  <p>조건에 맞는 장소가 없습니다.</p>
                  <button type="button" className="btn-primary" onClick={openCreate}>
                    장소 추가
                  </button>
                </div>
              ) : (
                <div
                  ref={listScrollerRef}
                  className={`geo-place-scroller view-${listView}${
                    (
                      (detailedMultiCol && listView === 'detailed') ||
                      (compactMultiCol && listView === 'compact')
                    ) && isWideLayout
                      ? ' is-multi-col'
                      : ''
                  }${
                    detailedMultiCol &&
                    detailedNeedsHScroll &&
                    listView === 'detailed' &&
                    isWideLayout
                      ? ' needs-h-scroll'
                      : ''
                  }`}
                  style={
                    (
                      (detailedMultiCol && listView === 'detailed' && detailedScrollerH) ||
                      (compactMultiCol && listView === 'compact' && compactScrollerH)
                    ) && isWideLayout
                      ? {
                          height:
                            listView === 'detailed' ? detailedScrollerH : compactScrollerH,
                        }
                      : undefined
                  }
                  aria-label="장소 목록"
                >
                  <div
                    className={`geo-place-list view-${listView}${
                      (
                        (detailedMultiCol && listView === 'detailed') ||
                        (compactMultiCol && listView === 'compact')
                      ) && isWideLayout
                        ? ' is-multi-col'
                        : ''
                    }`}
                    style={
                      detailedMultiCol && isWideLayout && listView === 'detailed'
                        ? {
                            gridTemplateRows: `repeat(${detailedRows}, ${DETAILED_ITEM_H}px)`,
                            gridAutoColumns: detailedColW
                              ? `${detailedColW}px`
                              : '100%',
                          }
                        : compactMultiCol && isWideLayout && listView === 'compact'
                          ? {
                              gridTemplateRows: `repeat(${compactRows}, 52px)`,
                              gridAutoColumns: compactColW
                                ? `${compactColW}px`
                                : '100%',
                            }
                          : undefined
                    }
                  >
                    {filtered.map((p) =>
                      listView === 'compact' ? (
                        <div
                          key={p.id}
                          role="button"
                          tabIndex={0}
                          className={`geo-place-item compact hud-panel${
                            selected?.id === p.id ? ' active' : ''
                          }${p.visited ? ' is-visited' : ''}`}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => setSelectedId(p.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              setSelectedId(p.id)
                            }
                          }}
                        >
                          <h3 className="geo-place-name">{p.name}</h3>
                          <div className="geo-place-rating-row">
                            <span
                              role="checkbox"
                              aria-checked={p.visited}
                              aria-label={p.visited ? '방문함 · 클릭하여 미방문' : '미방문 · 클릭하여 방문 표시'}
                              tabIndex={0}
                              className={`geo-visit-toggle${p.visited ? ' visited' : ''}`}
                              title={p.visited ? '방문함' : '미방문'}
                              onClick={(e) => {
                                e.stopPropagation()
                                togglePlaceVisited(p.id)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  togglePlaceVisited(p.id)
                                }
                              }}
                            >
                              <VisitMarkIcon visited={p.visited} />
                            </span>
                            <span className="visit-rating geo-compact-rating">
                              {'★'.repeat(p.rating)}
                              {'☆'.repeat(5 - p.rating)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div
                          key={p.id}
                          role="button"
                          tabIndex={0}
                          className={`geo-place-item detailed hud-panel${
                            selected?.id === p.id ? ' active' : ''
                          }${p.visited ? ' is-visited' : ''}`}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => setSelectedId(p.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              setSelectedId(p.id)
                            }
                          }}
                        >
                          <div className="geo-place-top">
                            <span className={`geo-cat-badge ${catBadgeClass(p.category)}`}>
                              {labelOf(p.category)}
                            </span>
                            <div className="geo-place-rating-row">
                              <span
                                role="checkbox"
                                aria-checked={p.visited}
                                aria-label={
                                  p.visited ? '방문함 · 클릭하여 미방문' : '미방문 · 클릭하여 방문 표시'
                                }
                                tabIndex={0}
                                className={`geo-visit-toggle${p.visited ? ' visited' : ''}`}
                                title={p.visited ? '방문함' : '미방문'}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  togglePlaceVisited(p.id)
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    togglePlaceVisited(p.id)
                                  }
                                }}
                              >
                                <VisitMarkIcon visited={p.visited} />
                              </span>
                              <span className="visit-rating">
                                {'★'.repeat(p.rating)}
                                {'☆'.repeat(5 - p.rating)}
                              </span>
                            </div>
                          </div>
                          <h3 className="geo-place-name">{p.name}</h3>
                          <p className="geo-place-sub font-mono">
                            {p.city}
                            {p.nameEn ? ` · ${p.nameEn}` : ''}
                          </p>
                          {p.tags.length > 0 && (
                            <div className="feature-tags">
                              {p.tags.slice(0, 3).map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  className={`feature-tag tag-filter-btn${
                                    tagFilter === t ? ' active' : ''
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setTagFilter((prev) => (prev === t ? 'All' : t))
                                  }}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </section>

            <aside ref={detailRef} className="geo-detail-panel hud-panel">
              <span className="hud-corner tl" />
              <span className="hud-corner tr" />
              <span className="hud-corner bl" />
              <span className="hud-corner br" />

              {selected ? (
                <>
                  <p className="mini-panel-title">
                    TARGET · {selected.category.toUpperCase()}
                  </p>
                  <h2 className="geo-detail-title glow-text">{selected.name}</h2>
                  {selected.nameEn && (
                    <p className="geo-detail-en">{selected.nameEn}</p>
                  )}

                  <div className="geo-detail-meta font-mono">
                    <span>{selected.city}</span>
                    <label className="geo-detail-cat-edit">
                      <span className="sr-only">카테고리</span>
                      <select
                        value={selected.category}
                        onChange={(e) => {
                          updatePlaceCategory(selected.id, e.target.value)
                        }}
                        aria-label="카테고리 변경"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.labelKo}
                          </option>
                        ))}
                      </select>
                    </label>
                    {selected.lat != null && selected.lng != null && (
                      <span>
                        {selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}
                      </span>
                    )}
                  </div>

                  {selected.address && (
                    <p className="geo-detail-address">{selected.address}</p>
                  )}

                  {selected.notes && <p className="visit-notes">{selected.notes}</p>}

                  {selected.tags.length > 0 && (
                    <div className="feature-tags" style={{ marginTop: '0.75rem' }}>
                      {selected.tags.map((t) => (
                        <button
                          key={t}
                          type="button"
                          className={`feature-tag tag-filter-btn${
                            tagFilter === t ? ' active' : ''
                          }`}
                          onClick={() => setTagFilter((prev) => (prev === t ? 'All' : t))}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}

                  <MapPanel place={selected} />

                  <div className="visit-actions">
                    <a
                      className="btn-ghost"
                      href={mapsSearchUrl(selected)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Google Maps
                    </a>
                    <button type="button" className="btn-ghost" onClick={() => openEdit(selected)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => handleDelete(selected)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              ) : (
                <div className="empty-state" style={{ border: 'none', padding: '2rem 0' }}>
                  <p className="section-code">// AWAITING TARGET</p>
                  <p>목록에서 장소를 선택하거나 새 노드를 추가하세요.</p>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>

      <PlaceFormModal
        open={modalOpen}
        mode={editing ? 'edit' : 'create'}
        initial={editing}
        defaultCountryCode={country.code}
        defaultCity={cityFilter !== 'All' ? cityFilter : cities[0]?.city}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSubmit={handleSubmit}
      />

      <CategoryManageModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
      />

      {FEATURE_PLACE_IMPORT && (
        <PlaceImportModal
          open={importOpen}
          countryCode={country.code}
          defaultCity={cityFilter !== 'All' ? cityFilter : cities[0]?.city || country.capital}
          onClose={() => setImportOpen(false)}
          onImport={handleImportPlaces}
        />
      )}
    </AppShell>
  )
}
