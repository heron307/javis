# GitHub 로그인 + 클라우드 동기화 설정

## 1. Supabase 프로젝트
1. https://supabase.com 에서 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 전체 실행
3. Project Settings → API 에서 Project URL / anon public key 복사
4. 프로젝트 루트에 `.env` 생성 후 `.env.example` 내용 채우기

## 2. GitHub OAuth App
1. GitHub → Settings → Developer settings → OAuth Apps → New
2. Homepage URL: 로컬은 `http://localhost:5173` (배포 시 실제 URL)
3. Authorization callback URL: Supabase 대시보드 Authentication → Providers → GitHub 에 표시된 Callback URL 사용
   (예: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`)
4. Client ID / Client Secret을 Supabase Authentication → Providers → GitHub 에 입력 후 Enable

## 3. 앱 실행
```bash
npm run dev
```

상단 **ARCHIVE** → **GitHub로 로그인** → 데이터 **클라우드에 저장** / **불러오기**

로그인 시 클라우드에 기존 데이터가 있으면 자동으로 불러오고(페이지 새로고침), 없으면 현재 로컬 데이터를 업로드합니다.
