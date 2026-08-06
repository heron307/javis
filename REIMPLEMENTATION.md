# J.A.V.I.S. 재구현 가이드

이 문서는 **현재까지 구현된 J.A.V.I.S. 여행 커맨드 인터페이스**를 다른 환경에서 다시 구현할 수 있도록 정리한 스펙입니다.

- 브랜드: **J.A.V.I.S.** (Journey Assistant Virtual Intelligence System)
- 슬로건: Travel Command Interface
- 성격: 개인용 여행 어시스턴트 (비상업, 브라우저 localStorage 기반)
- 기준일: 2026-08

---

## 1. 제품 한눈에 보기

| 모듈 | 경로 | 상태 | 역할 |
|------|------|------|------|
| Landing | `/` | 구현 | HUD 랜딩, 모듈 소개 |
| Travel Log | `/logs`, `/logs/:code` | 구현 | 국가별 여행 기록 CRUD |
| Mission Plan | `/missions`, `/missions/:id` | 구현 | 일정·동선·예산 계획 |
| Flight Scan | `/flights` | 구현 | 항공권 외부 검색 링크 + 히스토리 |
| Stay Scan | `/stays` | 구현 | 숙소 외부 검색 링크 + 히스토리 |
| Geo Intel | `/geo`, `/geo/:code` | 구현 | 장소 인텔 CRUD + OSM 검색 + 지도 |
| Currency Feed | — | **미구현** | 환율 (카드만 존재) |

**의도적으로 넣지 않은 것**
- 서버/DB (전부 localStorage)
- Google Places API (장소 검색은 OSM Nominatim + Photon)
- 항공/숙소 요금 자체 크롤링·API 비교 (딥링크만)
- PWA / APK

---

## 2. 기술 스택

```text
Vite + React 19 + TypeScript
react-router-dom 7
framer-motion (랜딩 모션)
CSS (단일 src/index.css, CSS 변수 디자인 시스템)
데이터: localStorage only
```

### 권장 생성 명령

```bash
npm create vite@latest javis -- --template react-ts
cd javis
npm i react-router-dom framer-motion
npm run dev
```

### package.json 핵심

- `react`, `react-dom`, `react-router-dom`, `framer-motion`
- `vite`, `@vitejs/plugin-react`, `typescript`

---

## 3. 디자인 시스템 (HUD)

### 시각 방향

- 다크 시안 HUD / 홀로그램 톤
- **브랜드가 히어로 최상단** (`J.A.V.I.S.`)
- 패널은 각진 clip-path + 코너 장식 (`hud-corner`)
- 스캔라인(고정 가로줄)은 유지 가능
- **아래로 흘러내리는 scan-beam 애니메이션은 제거** (현재 제품 기준)

### CSS 변수 (요약)

```css
:root {
  --bg-void: #02060c;
  --bg-deep: #040c18;
  --cyan: #00e5ff;
  --cyan-dim: #00a8b8;
  --amber: #ff8c22;
  --red: #ff3355;
  --white: #e8f7ff;
  --muted: #6a8fa8;
  --font-display: 'Orbitron', sans-serif;
  --font-body: 'Rajdhani', sans-serif;
  --font-mono: 'Share Tech Mono', monospace;
}
```

Google Fonts로 Orbitron / Rajdhani / Share Tech Mono 로드.

### 공통 UI 패턴

- `AppShell`: 상단 네비 + scanlines + children
- `hud-panel`, `btn-primary`, `btn-ghost`, `btn-danger`
- `stat-chip`, `filter-chip`, `modal-backdrop` / `modal-panel`
- `section-code` (`// MODULE …`), `glow-text`

---

## 4. 디렉터리 구조

```text
src/
  App.tsx                 # 라우트
  main.tsx
  index.css               # 전역 스타일
  components/
    AppShell.tsx
    Features.tsx          # 랜딩 모듈 카드
    HudRing.tsx / Preview.tsx / Ticker.tsx
    travel/VisitFormModal.tsx
    mission/{Mission,Day,Expense}FormModal.tsx
    flight/AirportPicker.tsx
    stay/DestinationPicker.tsx
    geo/{PlaceFormModal,PlaceWebSearch,MapPanel,CategoryManageModal}.tsx
  pages/
    LandingPage.tsx
    TravelLogPage.tsx / CountryDetailPage.tsx
    MissionPlanPage.tsx / MissionDetailPage.tsx
    FlightScanPage.tsx
    StayScanPage.tsx
    GeoIntelPage.tsx / GeoCountryPage.tsx
  hooks/
    useTravelLogs.ts / useMissions.ts
    useFlightScans.ts / useStayScans.ts
    useGeoIntel.ts / useGeoCategories.ts
  lib/
    travelStorage.ts / missionStorage.ts
    flightStorage.ts / flightLinks.ts
    stayStorage.ts / stayLinks.ts
    geoStorage.ts / categoryStorage.ts
    placeSearch.ts / placeQueryNormalize.ts
    hangulRomanize.ts / translateToKorean.ts
  data/
    countries.ts / airports.ts / stayDestinations.ts
    geoSeed.ts / missionSeed.ts (+ travel seed in travelStorage)
  types/
    travel.ts / mission.ts / flight.ts / stay.ts / geo.ts
```

---

## 5. 라우팅

```tsx
/                      LandingPage
/logs                  TravelLogPage
/logs/:code            CountryDetailPage   // ISO country code
/missions              MissionPlanPage
/missions/:id          MissionDetailPage
/flights               FlightScanPage
/stays                 StayScanPage
/geo                   GeoIntelPage
/geo/:code             GeoCountryPage
*                      Navigate → /
```

네비 링크: Home · Travel Log · Mission Plan · Flight Scan · Stay Scan · Geo Intel

---

## 6. 공통 데이터: 국가

`src/data/countries.ts`

- `CountryProfile`: `{ code, nameKo, nameEn, region, capital, currency }`
- 아시아/유럽/미주/오세아니아/중동 주요국 (KR, JP, TH, VN, …)
- `flagEmoji(code)`, `getCountry(code)`, `REGIONS`

여러 모듈이 이 목록을 공유한다.

---

## 7. localStorage 키

| 키 | 내용 |
|----|------|
| `javis.travel.visits.v1` | 여행 방문 기록 |
| `javis.missions.v1` | 미션 계획 |
| `javis.flight.scans.v1` | 항공 검색 히스토리 |
| `javis.stay.scans.v1` | 숙소 검색 히스토리 |
| `javis.geo.places.v1` | 장소 인텔 |
| `javis.geo.categories.v1` | 장소 카테고리 정의 |
| `javis.geo.listView` | Geo 목록 `detailed` \| `compact` |

### 스토어 패턴

각 도메인마다:

1. `load*()` / `save*()` in `lib/*Storage.ts`
2. 모듈 레벨 캐시 + `Set` listeners
3. `useSyncExternalStore` 훅으로 UI 구독
4. CRUD는 캐시 갱신 → save → emit

Seed가 있으면 **키가 없을 때만** seed 저장.

---

## 8. 모듈별 스펙

### 8.1 Landing

- 히어로: 브랜드 `J.A.V.I.S.` + 짧은 설명 + CTA
- HUD 링 애니메이션 (`HudRing`)
- `Features` 모듈 그리드 (구현된 모듈만 `href` 연결, `ENTER →` 표시)
- `Preview`, `Ticker` 장식 섹션
- framer-motion fade-up

### 8.2 Travel Log

**목적:** 국가별 과거 여행 기록

**모델 (`TravelVisit` + countryCode)**

```ts
{
  id, countryCode, title, cities: string[],
  startDate, endDate, notes, rating: 1-5,
  companions, budget: number | null,
  createdAt, updatedAt
}
```

**화면**
- `/logs`: 국가 카드 목록, 검색/지역 필터, 방문 국가만, 통계(COUNTRIES/TRIPS/DAYS)
- `/logs/:code`: 해당 국가 방문 목록 CRUD
- `VisitFormModal`로 생성/수정

### 8.3 Mission Plan

**목적:** 미래 여행의 일정·동선·예산

**모델**

```ts
Mission {
  id, title, countryCode, cities[], startDate, endDate,
  currency, budgetTotal, status: 'draft'|'active'|'done', notes,
  days: MissionDay[], expenses: MissionExpense[],
  createdAt, updatedAt
}
MissionDay { id, day, date, city, title, notes, stops: MissionStop[] }
MissionStop { id, title, notes, estCost }
MissionExpense {
  id, category: flight|lodging|food|transport|activity|other,
  label, amount, day: number|null, paid: boolean
}
```

**화면**
- `/missions`: 미션 카드(예산 바, 상태 필터)
- `/missions/:id`: ROUTE TIMELINE(+ Day) · BUDGET TRACK(+ Item, paid 토글)
- 예산 합계 / 배정 / 결제완료 / 잔여 표시

### 8.4 Flight Scan

**목적:** 조건 입력 → 외부 항공 검색 사이트 딥링크 (앱 내 요금 수집 없음)

**모델**

```ts
FlightScanQuery {
  origin, destination, // IATA
  departDate, returnDate, tripType: 'round'|'oneway',
  cabin, adults
}
```

**링크 대상**
- Meta: Google Flights, Skyscanner, Kayak
- Airline: 대한항공, 아시아나, 제주항공, 진에어, 티웨이, 에어부산 (일부는 홈만)

**부가**
- `airports.ts` 주요 공항 + `AirportPicker`
- 히스토리 pin / clear (최대 ~40)

### 8.5 Stay Scan

**목적:** 숙소 외부 검색 딥링크 (Flight Scan과 동일 패턴)

**모델**

```ts
StayScanQuery {
  destination, destinationEn,
  checkIn, checkOut, adults, rooms,
  stayType: 'any'|'hotel'|'hostel'|'apartment'
}
```

**링크 대상**
- Meta: Google Hotels, Tripadvisor
- OTA: Booking.com, Agoda, Hotels.com, Airbnb

**부가**
- `stayDestinations.ts` 도시 목록 + `DestinationPicker`
- 히스토리 pin / clear

### 8.6 Geo Intel

**목적:** 국가·도시별 장소 메모 + 지도 + 웹 검색 자동입력

**카테고리 (동적)**

```ts
PlaceCategoryDef { id, label, labelKo, builtin? }
// 기본: attraction, restaurant, cafe, lodging, shopping, nightlife, other
// other는 삭제 불가. 삭제 시 해당 place → other로 이동
```

**장소 모델**

```ts
GeoPlace {
  id, countryCode, city, name, nameEn, category,
  address, lat, lng, rating, notes, tags[],
  createdAt, updatedAt
}
```

**화면**
- `/geo`: 국가 목록 + 장소 수
- `/geo/:code`:
  - 상단 카테고리 칩(카운트) + Manage Categories
  - 도시/태그 필터
  - 목록 상세/간단 뷰 (세로 초과 시 가로 스크롤/다단)
  - TARGET 패널: 상세, 지도, **카테고리 select 즉시 변경**, Edit/Delete
- Place 폼: OSM 웹 검색 → 필드 자동입력

**장소 웹 검색 파이프라인**

1. 한글 쿼리 → `placeQueryNormalize` (콩글리시/도시 토큰 → 영문, 국가 힌트)
2. Nominatim (`namedetails`, `extratags`, `accept-language: ko,en`) + Photon fallback
3. 국가 우선 검색 후 전역
4. `inferCategory` (OSM class/type → lodging/cafe/restaurant/shopping/nightlife/attraction/other)
5. 한글 표시 보강: OSM `name:ko` → Wikidata ko → MyMemory 번역
6. 결과 선택 시 폼 채움

**지도**
- Google Maps 검색/임베드/길찾기 URL (`maps.google.com` query 또는 lat,lng)
- API 키 없이 embed/search 링크 방식

---

## 9. 외부 API / URL (키 없음)

| 용도 | 엔드포인트 |
|------|------------|
| 장소 검색 | `https://nominatim.openstreetmap.org/search` |
| 장소 fallback | `https://photon.komoot.io/api/` |
| 번역 | `https://api.mymemory.translated.net/get` |
| Wikidata 라벨 | `https://www.wikidata.org/w/api.php` |
| 항공 | Google Flights / Skyscanner / Kayak 딥링크 |
| 숙소 | Google Hotels / Booking / Agoda / Hotels.com / Airbnb |

Nominatim 사용 시 User-Agent/이용정책 준수 권장. 요청 간 짧은 delay.

---

## 10. 구현 순서 (재구축 체크리스트)

1. Vite React-TS 프로젝트 + Router + 디자인 토큰/CSS
2. `AppShell`, Landing, Features 골격
3. `countries.ts`
4. Travel Log (storage → hook → pages → modal)
5. Geo Intel (places + categories + OSM search + map)
6. Flight Scan (airports → links → page)
7. Stay Scan (destinations → links → page)
8. Mission Plan (mission/day/expense CRUD)
9. Features/네비 `href` 연결, seed 데이터
10. (선택) Currency Feed, PWA, DB 이전

---

## 11. UX / 제품 규칙

- 민감정보(여권·카드) 저장 금지
- 항공·숙소는 **비교 결과 자체를 앱에 표시하지 않음** — 외부로 보냄
- 데이터는 **기기·브라우저 로컬**. PC↔폰 자동 동기화 없음
- Geo 카테고리는 UI에서 추가/이름변경/삭제 가능
- 한글 장소명 검색을 위해 정규화·번역 레이어 유지

---

## 12. 미구현 / 향후 후보

- Currency Feed (실시간 환율)
- Google Places API
- 항공/숙소 공식 API로 앱 내 최저가 비교
- DB·계정 동기화
- PWA / Capacitor APK
- Mission ↔ Flight/Stay/Geo 데이터 연동

---

## 13. 파일별 책임 빠른 참조

| 파일 | 책임 |
|------|------|
| `lib/placeSearch.ts` | OSM/Photon 검색 + 랭킹 + 한글 로컬라이즈 오케스트레이션 |
| `lib/placeQueryNormalize.ts` | 한글→영문 토큰, 국가 감지, 쿼리 후보 |
| `lib/flightLinks.ts` / `stayLinks.ts` | 외부 검색 URL 생성 + 유효성 |
| `hooks/use*.ts` | localStorage 구독형 도메인 상태 |
| `components/Features.tsx` | 모듈 카탈로그 (href null = 잠금) |

---

## 14. 검증 시나리오

1. Travel Log: JP 방문 추가 → `/logs/JP`에서 수정/삭제
2. Mission: 미션 생성 → Day/예산 추가 → paid 토글 → 잔여 예산 변화
3. Flight: ICN→BKK 왕복 SCAN → Google Flights 새 탭 → 히스토리 Pin
4. Stay: 방콕 3박 SCAN → Booking/Agoda 링크 → Clear History
5. Geo TH: “크레이지 하우스” 검색 → Crazy House Bangkok 매칭 → 카테고리 nightlife 가능
6. Geo: Manage로 카테고리 추가 → TARGET에서 카테고리 즉시 변경
7. 새로고침 후에도 localStorage 데이터 유지

---

이 문서만으로 동일 제품 범위를 재구현할 수 있다. UI 세부 픽셀은 `src/index.css`와 기존 페이지를 참고하되, **도메인 모델·라우트·스토리지 키·외부 연동 방식**은 위 스펙을 우선한다.
