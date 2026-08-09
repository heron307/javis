/** applyBackup 후 모듈 캐시를 localStorage에서 다시 읽음 (전체 새로고침 없이) */

export function hydrateAllStores(): void {
  void import('../hooks/useGeoIntel').then((m) => m.hydratePlacesFromStorage())
  void import('../hooks/useGeoCategories').then((m) =>
    m.hydrateCategoriesFromStorage(),
  )
  void import('../hooks/useTravelLogs').then((m) => m.hydrateVisitsFromStorage())
  void import('../hooks/useMissions').then((m) => m.hydrateMissionsFromStorage())
  void import('../hooks/useFlightScans').then((m) =>
    m.hydrateFlightScansFromStorage(),
  )
  void import('../hooks/useStayScans').then((m) => m.hydrateStayScansFromStorage())
}
