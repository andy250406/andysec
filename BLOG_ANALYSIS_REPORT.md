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
8. **전문 에디터 개편 및 카테고리 안전 관리 체계 구축 (2026-09-08 2차 배포)**:
   * **카테고리 안전 삭제 검증 로직 탑재 (`deleteCategory`)**:
     * 관리자가 스터디 노트 카테고리 삭제를 시도할 때, 해당 카테고리로 작성된 게시글 수를 실시간 검사.
     * 작성된 글이 1건 이상 존재하는 경우 **삭제를 원천 차단하고 경고 팝업**을 출력하여 데이터 무결성 보장.
     * 게시글이 0건인 안전한 상태에서만 최종 확인 후 카테고리 목록에서 제거 및 필터 탭 동기화.
   * **팝업 모달 배경 테마 연동 버그 완벽 수정**:
     * `.modal-content`에 하드코딩되어 있던 짙은 남색(`#0d121f`)을 CSS 변수(`var(--bg-sidebar)`, `var(--bg-card)`, `var(--text-main)`)로 전환.
     * 라이트 모드 전환 시 신규 프로젝트 등록 팝업 및 관리자 팝업 배경이 화이트/그레이 톤으로 자연스럽게 어우러지도록 시각적 일체감 확보.
     * 신규 프로젝트 등록 팝업은 기존 요구사항대로 모달 팝업 형태 그대로 유지.
   * **풀페이지(Full-page) 전문 마크다운 에디터 뷰 도입 (`#note-editor-pane`)**:
     * 기존의 좁고 답답했던 팝업 모달 형태에서, 실제 게시글 상세 화면(`.article-detail-pane`)과 같이 넓고 시원한 전용 풀페이지 뷰로 전면 개편.
     * **슬림 마크다운 가이드 바**: 제목/분류 입력란 하단과 본문 작성란 상단 사이에 접이식 컴팩트 배너로 배치하여 공간 낭비 최소화.
     * **마크다운 서식 툴바**: 제목(H1~H3), 굵게, 기울임, 취소선, 인용, 코드블록, 글머리/순서 목록, 링크, 시트 이미지(`{{img_n}}`) 원클릭 삽입 지원.
     * **인터랙티브 마크다운 표(Table) 생성기 도구**: 원하는 행(Row) 및 열(Column) 개수를 선택하면 에디터 본문에 표(Table) 구조를 즉시 자동 생성.
9. **대시보드 에러 수정, 카테고리 영구 삭제 및 인라인 즉시 변환(WYSIWYG) 에디터 고도화 (2026-09-08 3차 배포)**:
   * **`applySyncPermissions` 미정의 런타임 오류 완벽 해결**:
     * GitHub PAT 제거 후 `main.js`의 `renderAll()`에서 남아있던 레거시 호출 함수(`applySyncPermissions()`)를 신규 권한 관리 함수인 `applyAdminPermissions()`로 교체하여 대시보드 로드 오류 완벽 해소.
   * **스터디 노트 카테고리 삭제 영구 보존 (`hidden_default_cats` 동기화)**:
     * 기본 카테고리('Shieldus / 쉴더스 교육' 등) 삭제 시 `localStorage`의 `hidden_default_cats`에 영구 기록되도록 보완.
     * `getAllStudyCategories()`에서 숨김 목록을 필터링하도록 수정하고, `index.html`에 하드코딩되어 있던 필터 버튼들을 완전히 정리하여 새로고침 후에도 삭제된 카테고리가 다시 나타나지 않도록 완벽 보장.
   * **마크다운 인라인 즉시 렌더링(WYSIWYG) 단일 에디터 전면 구현**:
     * 좌우 분할 창(Textarea + 미리보기) 방식을 전면 폐기하고, 사용자가 입력하는 본문 영역 자체가 크고 시원한 단일 마크다운 렌더링 캔버스(`contenteditable`)로 동작하도록 구축.
     * **실시간 인라인 문법 치환**:
       * `- 강아지` 또는 `* 강아지` 입력 시 ➔ 스페이스를 누르는 즉시 자동으로 불릿 목록(`● 강아지`)으로 전환.
       * `1. 첫째` 입력 시 ➔ 스페이스를 누르는 즉시 번호 목록으로 변환.
       * `# 제목`, `## 소제목`, `### 소제목`, `> 인용` 입력 시 ➔ 스페이스를 누르는 즉시 H1, H2, H3, Blockquote 서식으로 실시간 변환.
       * `---` 입력 후 Enter 시 ➔ 즉시 가로 구분선(`hr`) 삽입.
     * **상단 툴바 및 서식 지원**: 굵게, 기울임, 취소선, 인용, 코드블록, 표 생성기 등이 에디터 화면에 즉시 시각적으로 반영됨.
     * **HTML ➔ 마크다운 양방향 직렬화 (Serialization)**: WYSIWYG 캔버스에서 작성된 내용을 Google Sheets DB로 전송할 때에는 순수 마크다운으로 자동 직렬화하여 저장되므로, 기존 구글 시트 백엔드 및 게시글 상세 뷰와의 100% 호환성 유지.
10. **카테고리 분리, 줄 단위 제목 변환 정밀화, 백스페이스 일반글 복귀, 인라인 서식 및 URL 스마트 말풍선/이미지 자동 렌더링 (2026-09-09 4차 배포)**:
   * **스터디 노트 카테고리에서 '보안 뉴스' 분리**:
     * 보안 뉴스는 별도의 탭과 전용 아카이브 테이블 체계로 관리되므로, 스터디 노트 작성 드롭다운에서 불필요하게 노출되던 '보안 뉴스' 옵션을 완전히 제거하여 스터디 노트와 메뉴 역할 분리.
   * **제목(#) 인라인 변환 시 상단 텍스트 오적용 버그 해결**:
     * 제목 기호(`#`, `##`, `###`)를 입력 후 공백 입력 시 이전 일반 문단 전체가 제목으로 오인되어 올라가는 현상을 차단하고, 커서가 위치한 행/블록의 선두 기호만을 인식하여 해당 줄만 단독 제목(H1/H2/H3)으로 정확히 전환되도록 보정.
   * **목록/인용구 빈 항목에서 백스페이스 시 상단 이동 없이 일반 텍스트로 자연스러운 복귀**:
     * 목록(`- `, `1. `)이나 인용구(`> `) 작성 중 엔터로 새 항목이 생성되었을 때, 백스페이스를 누르면 상단 줄로 점프하여 이전 글을 지우는 대신, 해당 항목의 서식만 취소(`outdent` / `formatBlock: p`)하고 그 자리에서 바로 일반 텍스트를 작성할 수 있도록 이벤트 인터셉트 제어 로직 탑재.
   * **전체 마크다운 인라인 즉시 서식 확장 및 Ctrl+B 지원**:
     * **단축키**: `Ctrl + B` (또는 Mac `Cmd + B`)로 선택 영역 또는 커서 위치 굵게(Bold) 즉시 토글 지원.
     * **인라인 마크다운 즉시 변환**: `**굵게**`, `*기울임*`, `~~취소선~~`, `` `코드` `` 작성 후 스페이스바 입력 시 즉시 서식 태그로 실시간 치환.
     * **코드 블록**: ` ``` ` 입력 후 엔터 시 즉시 코드 블록 영역 자동 삽입.
   * **스마트 URL 감지, 제목/헤드라인 말풍선 팝오버 및 이미지 URL 자동 사진화**:
     * **일반 웹 URL**: URL을 입력하거나 붙여넣으면 즉시 링크로 변환되며, 해당 링크 위치에 **[제목/헤드라인 입력 말풍선 팝오버]**가 부유형으로 표시됨.
       * 말풍선에 제목을 입력하고 적용하면 URL 대신 입력한 텍스트로 치환되어 깔끔하게 링크 표시.
       * 미입력 또는 'URL 유지' 선택 시 원본 URL 형태 그대로 링크 유지.
       * 본문 내 링크 클릭 시 언제든지 말풍선을 다시 띄워 제목 수정 가능.
     * **이미지 URL**: `jpg`, `png`, `gif`, `webp`, `svg` 등 이미지 주소를 입력하거나 붙여넣으면 즉시 이미지인지 스스로 판별하여 본문 상에 사진(Image Card)으로 실시간 렌더링.
       * 마우스를 올리면 원본 URL 툴팁이 안내되며, 클릭 시 새 창에서 원본 이미지를 바로 확인할 수 있도록 편의성 제공.
       * Google Sheets DB로 저장될 때에는 `![이미지](URL)` 표준 마크다운 문법으로 자동 직렬화 보장.
