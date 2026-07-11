# iiiaha books

건축·인테리어 서적 53권 중고 판매 사이트. Next.js + Vercel.

## 구조

- `data/books.json` — 도서 53권 (판매가·상태는 관리자 페이지에서 입력)
- `data/sets.json` — 세트 상품 (전체 53권 / GARM 22권 / 애뉴얼 12권)
- `data/config.json` — 소개·공지·신청 마감 시각
- `data/applications.json` — 접수된 거래 신청 (사이트가 GitHub 커밋으로 저장)
- `/admin` — 관리자 페이지 (판매가·별점·판매상태·세트가격·공지 편집, 신청 목록 열람)

관리자 저장과 거래 신청은 GitHub API로 이 저장소의 `data/*.json`에 커밋됩니다.
공개 페이지는 이 데이터를 캐시해 서빙하고, 관리자 저장 시 캐시를 즉시 무효화하므로
재배포 없이 바로 반영됩니다. `data/`만 바뀐 커밋은 재배포를 건너뜁니다 (`vercel.json`).

## Vercel 환경변수 (필수)

| 이름 | 값 |
|---|---|
| `GITHUB_TOKEN` | 이 저장소 Contents 읽기/쓰기 권한이 있는 GitHub 토큰 |
| `ADMIN_PASSWORD` | 관리자 페이지 비밀번호 (직접 정하기) |

토큰 만들기: github.com → Settings → Developer settings → **Fine-grained personal access tokens** → Generate new token → Repository access: `iiiaha/iiiahabooks`만 선택 → Permissions: **Contents: Read and write** → 생성된 토큰을 Vercel에 등록.

## 로컬 개발

```bash
npm install
npm run dev
```

로컬에서는 GITHUB_TOKEN 없이 `data/` 폴더 파일에 직접 저장됩니다.
관리자 비밀번호 기본값: `dev-password`

<!-- 마지막 배포 확인: 2026-07-11 -->
