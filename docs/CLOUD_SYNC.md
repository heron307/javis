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

## 3. GitHub 로그인 (선택)
1. GitHub → Settings → Developer settings → OAuth Apps → New
2. Authorization callback URL: Supabase GitHub Callback URL
3. Supabase → Authentication → Providers → GitHub 에 Client ID / Secret 입력

## 4. 앱 실행
```bash
npm run dev
```

상단 **ARCHIVE** → **Google로 로그인** (또는 GitHub) → **클라우드에 저장** / **불러오기**

로그인 시 클라우드에 기존 데이터가 있으면 자동으로 불러오고(페이지 새로고침), 없으면 현재 로컬 데이터를 업로드합니다.
