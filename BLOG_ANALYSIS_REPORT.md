# AndySec 블로그 시스템 분석 및 아키텍처 개편 완료 보고서

본 문서는 GitHub Pages 기반의 `andy250406.github.io/andysec` 블로그의 기존 시스템 분석 내용 및 **Google Apps Script(GAS) + Google Sheets NoSQL DB와 비밀번호 기반 관리자 인증 체계**로의 전면 개편 및 원격 저장소 푸시/배포 완료 내역을 정리한 최종 보고서입니다.

---

## 1. 아키텍처 개편 전/후 비교

| 항목 | 개편 전 (Legacy) | 개편 후 (Current Architecture) |
| :--- | :--- | :--- |
| **호스팅 & 렌더링** | GitHub Pages + Actions 빌드 | GitHub Pages (정적 리소스 SPA 호스팅 전담) |
| **데이터베이스 & API** | 정적 파일(`posts.json` + `*.md`) | **Google Sheets (`Posts` 시트) + Google Apps Script (REST API)** |
| **실서비스 반영 속도** | Git Commit/Push 후 Actions 배포 대기 (1~3분) | **GAS API 즉각 호출 및 시트 행 업데이트 (1~2초 내 실시간 반영)** |
| **관리자 인증** | 보안상 취약한 GitHub PAT 토큰 브라우저 입력 | **상단 바 🔑(열쇠) 버튼 + 비밀번호 캐싱(`pp0406hh`) & 백엔드 교차 검증** |
| **외부 연동성** | Notion API 종속 스크립트 존재 | **Notion 의존성 완전 제거, 구글 시트 기반 단일 파이프라인** |
| **이미지 렌더링** | 마크다운 직접 기입 | **`{{img_1}}`, `{{img_2}}` 플레이스홀더 ➔ 시트 셀 이미지/링크 자동 치환** |

---

## 2. 개편된 시스템 아키텍처 구조

```
[클라이언트 브라우저 (andy250406.github.io/andysec)]
       │
       ├─ (1) 정적 리소스 로딩: Vite 정적 빌드 산출물 (HTML, CSS, JS, Marked.js)
       │
       ├─ (2) 관리자 인증:
       │      우측 상단 🔑 버튼 클릭 ➔ 비밀번호(pp0406hh) 입력 ➔ localStorage 캐싱
       │      ➔ 쓰기/수정/삭제 UI 즉시 활성화
       │
       ├─ (3) 데이터 조회 (GET):
       │      fetch(GAS_API_URL?action=getPosts)
       │      - 본문 텍스트 내 {{img_1}}, {{img_2}} 태그를 F열 이후의 실제 이미지 URL로 정규식 자동 치환
       │      - Marked.js로 마크다운 변환 후 브라우저에 즉각 렌더링
       │      - 오프라인 또는 네트워크 장애 시 posts.json / localStorage 폴백
       │
       └─ (4) 데이터 등록/수정/삭제 (POST):
              fetch(GAS_API_URL, { method: 'POST', body: { password, action, data } })
              - GAS 백엔드에서 비밀번호 검증 수행
              - Google Sheets 행(Row) 추가/수정/삭제 즉각 반영 (배포 빌드 대기 시간 0초)
```

---

## 3. Google Sheets DB & GAS 백엔드 명세

* **실제 배포된 GAS Web App URL**:
  `https://script.google.com/macros/s/AKfycby_5htUVodm_M16r25fUOyNAkNG7cpx3L1X098TYGtvS6KYN4nv8h8N5-wnNsveytLz8Q/exec`
* **관리자 비밀번호**: `pp0406hh`
* **GAS 백엔드 코드 파일**: [gas_backend_code.gs](file:///c:/Users/pp040/OneDrive/SK쉴더스/Antigravity/andysec/gas_backend_code.gs)
* **구글 시트 구조 (`Posts` 시트)**:
  * **A열 (`id`)**: 글 고유 식별자 (`study-[timestamp]` 또는 `news-[timestamp]`)
  * **B열 (`category`)**: 카테고리 (`CertAnalysis`, `Cert`, `Shieldus`, `News`, `Project` 등)
  * **C열 (`title`)**: 제목
  * **D열 (`date`)**: 작성일 (`YYYY-MM-DD`)
  * **E열 (`content`)**: 마크다운 본문 전체 텍스트 (이미지 삽입 위치는 `{{img_1}}`, `{{img_2}}` 태그 사용)
  * **F열 이후 (`image_1`, `image_2`, ...)**: 구글 시트의 셀 내 삽입 이미지 객체(`getCellImages()`) 또는 이미지 외부 URL

---

## 4. 수행된 주요 작업 및 배포 내역

1. **레거시 GitHub PAT 스크립트 및 Notion 연동 제거**:
   * `push_to_github.js`, `pull_from_github.js`, `generate_push_args.js`, `sync_notion_news.js` 완전 제거
   * `package.json`의 불필요한 스크립트 명령어 정리
2. **[index.html](file:///c:/Users/pp040/OneDrive/SK쉴더스/Antigravity/andysec/index.html)**:
   * 사이드바 하단 GitHub PAT 동기화 버튼 제거
   * 상단 바 우측에 **🔑 관리자 인증 버튼 (`admin-auth-btn`)** 및 모달 신설
   * 마크다운 작성 가이드에 `{{img_1}}`, `{{img_2}}` 시트 이미지 플레이스홀더 안내 추가
3. **[style.css](file:///c:/Users/pp040/OneDrive/SK쉴더스/Antigravity/andysec/style.css)**:
   * 관리자 인증 시 🔑 버튼에 빛나는 강조 스타일(`.action-btn.admin-unlocked`) 적용
4. **[main.js](file:///c:/Users/pp040/OneDrive/SK쉴더스/Antigravity/andysec/main.js)**:
   * 실제 구글 웹 앱 URL(`AKfycby_...`) 연동
   * `loadAdminAuth()`, `updateAdminUI()`, `applyAdminPermissions()` 구현
   * `sendToGasApi()` 함수를 통해 GAS Web App과 POST 실시간 통신
   * `replaceImagePlaceholders()` 함수로 `{{img_n}}` 플레이스홀더 자동 치환
   * 글 등록/수정/삭제 시 1~2초 내에 Google Sheets 행을 즉시 조작하도록 전환
5. **기존 게시글 107건 DB 마이그레이션 파일 생성**:
   * [posts_migration.csv](file:///c:/Users/pp040/OneDrive/SK쉴더스/Antigravity/andysec/posts_migration.csv) 생성 (구글 시트의 `Posts` 탭으로 가져오기 완료)
6. **실서비스 배포 (GitHub Pages 개시)**:
   * 원격 저장소(`origin/master`)와 변경 사항 병합 후 `git push origin master` 전송 완료
   * GitHub Actions 자동 배포 트리거 완료 (`https://andy250406.github.io/andysec/`에 실시간 적용됨)
7. **추가 개선 및 버그 수정 (2026-09-08)**:
   * **모바일/세로 화면 상단 바 UI 개선**: `@media (max-width: 600px)`에서 검색창과 액션 버튼 묶음(`.topbar-actions`)의 정렬을 개선하여, 모바일/태블릿에서도 열쇠(🔑) 버튼과 테마 토글 버튼이 우측 상단에 선명하게 노출되도록 보정
   * **프로젝트 진행률 정상화**: `main.js`의 하드코딩된 과거 가상 기준일(`2026-06-21`)을 실제 오늘 날짜(`new Date()`)로 변경하여, 0% 고정 문제를 해결하고 실시간 일정 경과율이 정상 계산되도록 수정
   * **스터디 노트 카테고리 관리자 직접 수정/입력 지원**: 작성 및 수정 모달에 `+ 직접 입력 (새 카테고리)` 옵션 및 동적 텍스트 인풋을 신설하여, 관리자가 원하는 새 카테고리를 자유롭게 기입 및 수정할 수 있도록 프론트엔드/렌더링 로직 확장
