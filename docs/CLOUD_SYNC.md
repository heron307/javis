# OAuth 로그인 + 클라우드 동기화 설정

## 1. Supabase 프로젝트
1. https://supabase.com 에서 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 전체 실행
3. Project Settings → API 에서 Project URL / anon public key 복사
4. 프로젝트 루트에 `.env` 생성 후 `.env.example` 내용 채우기

## 2. Google 로그인 (권장)
1. [Google Cloud Console](https://console.cloud.google.com/) → API 및 서비스 → 사용자 인증 정보
2. OAuth 클라이언트 ID 만들기 (웹 애플리케이션)
3. 승인된 리디렉션 URI에 Supabase Callback URL 추가  
   `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
4. Supabase → Authentication → Providers → **Google** Enable  
   Client ID / Client Secret 입력

### 필수: Redirect URL (로그인 후 ‘로그인 안 됨’일 때)
Supabase → **Authentication → URL Configuration**
- **Site URL**: `https://javis-nu.vercel.app` (배포 주소)
- **Redirect URLs**에 추가:
  - `https://javis-nu.vercel.app/**`
  - `https://javis-nu.vercel.app/`
  - 로컬 개발 시 `http://localhost:5173/**`

여기가 비어 있거나 localhost만 있으면 Google 동의 후에도 앱 세션이 안 생깁니다.

## 3. GitHub 로그인 (선택)
1. GitHub → Settings → Developer settings → OAuth Apps → New
2. Authorization callback URL: Supabase GitHub Callback URL
3. Supabase → Authentication → Providers → GitHub 에 Client ID / Secret 입력

## 4. 앱 실행
```bash
npm run dev
```

상단 네비에 로그인 상태(계정·제공자)가 표시됩니다. **ARCHIVE** → **Google/GitHub로 로그인** → **지금 동기화** / **클라우드에 저장** / **클라우드에서 불러오기**

로그인·탭 포커스 시 **마지막 저장 시각**이 더 최신인 쪽이 이깁니다(LWW). 삭제도 클라우드에 반영되면 다른 브라우저에서 사라집니다.
