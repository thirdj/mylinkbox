# MyLinkBox 🛍

링크를 한 곳에 모아두는 나만의 위시리스트 앱.

## 기술 스택

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes (서버사이드)
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **배포**: Vercel

## 기능

- 링크 붙여넣기 → 썸네일·타이틀 자동 파싱 (Open Graph)
- 중복 URL 자동 감지
- 위시 / 구매완료 / 보관함 상태 관리
- 카테고리 직접 생성 및 관리
- 2열 / 3열 / 목록 뷰 전환
- 제목·가격·메모 수정
- 이메일+비밀번호 / Google 로그인
- 본인 데이터만 접근 (RLS 적용)

---

## 시작하기

### 1. 프로젝트 클론 & 패키지 설치

```bash
git clone <your-repo-url>
cd mylinkbox
npm install
```

### 2. Supabase 프로젝트 생성

1. https://supabase.com 접속 → 새 프로젝트 생성
2. **SQL Editor** → `supabase-schema.sql` 파일 내용 전체 붙여넣고 실행
3. **Authentication → Providers** → Google 활성화 (선택사항)
4. **Settings → API** → URL과 anon key 복사

### 3. 환경변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local` 파일 편집:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. 로컬 실행

```bash
npm run dev
# → http://localhost:3000
```

---

## Vercel 배포 & 도메인 연결

### 배포

```bash
npm install -g vercel
vercel
```

또는 GitHub에 푸시 후 Vercel에서 Import.

### 환경변수 (Vercel 대시보드)

Vercel → Settings → Environment Variables에 아래 3개 추가:
```
NEXT_PUBLIC_SUPABASE_URL     = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
NEXT_PUBLIC_SITE_URL          = https://yourdomain.com
```

### 커스텀 도메인 연결

1. Vercel → 프로젝트 → Settings → Domains → 도메인 입력
2. DNS 설정 (도메인 구매처):
   - **A 레코드**: `@` → `76.76.21.21`
   - **CNAME**: `www` → `cname.vercel-dns.com`
3. 5~10분 후 HTTPS 자동 적용

### Supabase Auth Redirect URL 설정

Supabase → Authentication → URL Configuration:
```
Site URL: https://yourdomain.com
Redirect URLs: https://yourdomain.com/auth/callback
```

---

## 프로젝트 구조

```
mylinkbox/
├── app/
│   ├── api/
│   │   ├── og-parse/route.ts     # OG 태그 파싱 API
│   │   ├── links/route.ts        # 링크 목록 조회·추가
│   │   ├── links/[id]/route.ts   # 링크 수정·삭제
│   │   └── categories/route.ts   # 카테고리 관리
│   ├── auth/
│   │   ├── page.tsx              # 로그인·회원가입
│   │   └── callback/route.ts     # OAuth 콜백
│   ├── dashboard/page.tsx        # 메인 대시보드
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── AddLinkBar.tsx            # 링크 추가 입력창
│   ├── LinkCard.tsx              # 링크 카드 (그리드/목록)
│   ├── EditModal.tsx             # 수정 모달
│   └── Toolbar.tsx               # 필터·뷰 전환 툴바
├── lib/
│   ├── supabase.ts               # 클라이언트 Supabase
│   ├── supabase-server.ts        # 서버 Supabase
│   └── utils.ts                  # 유틸 함수
├── types/index.ts                # TypeScript 타입
├── middleware.ts                  # 인증 미들웨어
├── supabase-schema.sql            # DB 스키마 (Supabase에서 실행)
└── .env.local.example
```

## 향후 추가 기능 아이디어

- [ ] 브라우저 익스텐션 (1클릭 저장)
- [ ] 가격 변동 알림 (크롤러 + 이메일)
- [ ] 컬렉션 공유 링크
- [ ] 구매 예산 합산 대시보드
- [ ] 태그 검색
