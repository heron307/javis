# 장소 목록 Import (OCR) 원상복구 안내

이 기능은 **실험용**입니다. 마음에 안 들면 아래 중 하나로 되돌리세요.

## 가장 빠른 끄기 (코드 1줄)

`src/config/features.ts`

```ts
export const FEATURE_PLACE_IMPORT = false
```

→ Geo 화면의 **Import List** 버튼이 사라집니다.  
(의존성 `tesseract.js`는 남아 있지만 UI에서는 안 보입니다.)

## 완전 제거

### 1) 추가/수정된 파일 삭제

- `src/config/features.ts`
- `src/lib/extractPlaceNames.ts`
- `src/lib/ocrPlaceImage.ts`
- `src/lib/enrichImportedPlace.ts`
- `src/components/geo/PlaceImportModal.tsx`
- `docs/REVERT_PLACE_IMPORT.md` (이 파일)

### 2) 수정 되돌리기

- `src/pages/GeoCountryPage.tsx`  
  - `PlaceImportModal` / `FEATURE_PLACE_IMPORT` / `importOpen` / `handleImportPlaces` / Import 버튼 관련 코드 제거
- `src/index.css`  
  - `/* —— Place Import (OCR) —— */` 이하 스타일 블록 삭제
- `package.json` / `package-lock.json`  
  - `tesseract.js` 제거 후 `npm uninstall tesseract.js`

### 3) Git을 쓰는 경우

이 기능만 커밋했다면:

```bash
git revert <commit>
# 또는
git checkout -- src/pages/GeoCountryPage.tsx src/index.css
# 위 삭제 파일들 제거
```

## 등록된 데이터

Import로 넣은 장소는 localStorage `javis.geo.places.v1`에 남습니다.  
태그 `import` / 메모 `이미지/목록에서 반자동 등록`으로 구분할 수 있습니다.  
원치 않으면 Geo에서 해당 장소를 삭제하세요.
