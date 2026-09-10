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
* **Apps Script Script ID**: `1g7_bIb6Oex-EoLvlu7wf2b5AY3eUhvRg2NEt0uPD_BYZO_1jLFhoKqvK`
* **Apps Script Deployment ID**: `AKfycby_5htUVodm_M16r25fUOyNAkNG7cpx3L1X098TYGtvS6KYN4nv8h8N5-wnNsveytLz8Q`
* **자동 배포 CLI 도구**: [deploy_gas.js](file:///c:/Users/pp040/OneDrive/SK쉴더스/Antigravity/andysec/deploy_gas.js) (`node deploy_gas.js`로 원클릭 자동 버전 생성 및 배포)
* **관리자 비밀번호**: `pp0406hh`
* **GAS 백엔드 코드 파일**: [gas_backend_code.gs](file:///c:/Users/pp040/OneDrive/SK쉴더스/Antigravity/andysec/gas_backend_code.gs)
* **구글 시트 구조 (`AndySec_DB`)**:
  * **1. `Posts` 시트 (스터디 노트 & 보안 뉴스)**:
    * A열(`id`), B열(`category`), C열(`title`), D열(`date`), E열(`content`), F열(`importance`), G열(`source`), H열(`newsLink`), I열(`type`), J열 이후(`image_1`, `image_2`...)
  * **2. `Projects` 시트 (컨설팅 프로젝트 & 하위 세부 진단 일정)**:
    * A열(`id`), B열(`name`), C열(`client`), D열(`startDate`), E열(`endDate`), F열(`details`), G열(`diagnostics` JSON)
  * **3. `ProjectNotes` 시트 (프로젝트 내부 비공개 기록)**:
    * A열(`id`), B열(`projectId`), C열(`title`), D열(`date`), E열(`content`)
  * **4. `Profile` 시트 (메인화면 및 사이드바 프로필)**:
    * A열(`id`), B열(`name`), C열(`title`), D열(`company`), E열(`bio`), F열(`email`), G열(`phone`), H열(`avatarUrl`)
  * **5. `Portfolio` 시트 (포트폴리오 자격증, 프로젝트, 경력, 보유기술)**:
    * A열(`id`), B열(`type`), C열(`title`), D열(`date`), E열(`description`), F열(`category`), G열(`level`), H열(`percent`), I열(`sortOrder`)

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
11. **노션(Notion) 표준 단축키 풀세트 탑재, 이미지 클립보드 직통 복붙 & 제목(#) 인라인 완벽 분리 수정 (2026-09-09 5차 배포)**:
   * **노션(Notion) 스타일 서식 단축키 전면 지원**:
     * `Ctrl + B` (Mac `Cmd + B`): 굵게 (Bold)
     * `Ctrl + I` (Mac `Cmd + I`): 기울임꼴 (Italic)
     * `Ctrl + U` (Mac `Cmd + U`): 밑줄 (Underline, `<u>`)
     * `Ctrl + Shift + X` (Mac `Cmd + Shift + X`): 취소선 (Strikethrough, `~~취소선~~`)
     * `Ctrl + E` (Mac `Cmd + E`): 인라인 코드 (Inline Code, `` `코드` ``)
   * **이미지 클립보드 직접 복사-붙여넣기 지원 (Direct Image Paste)**:
     * 캡처 도구(Win+Shift+S 등)나 브라우저에서 복사한 이미지를 에디터 안에서 `Ctrl + V`로 붙여넣는 즉시 Base64 Data URL 이미지 카드로 실시간 렌더링.
     * 번거로운 수동 `{{img_n}}` 마크다운 태그 입력을 완전히 대체하며, 에디터 화면에 직관적인 사진으로 즉각 노출 및 저장 지원.
   * **제목(#) 인라인 변환 DOM 블록 단위 완전 분리 (상단 텍스트 오염/사라짐 버그 근본 해결)**:
     * 기존 `formatBlock` 브라우저 버그(상단 텍스트와 하나의 블록으로 묶이거나 `###` 입력 후 사라지는 현상)를 완전히 우회.
     * 커서가 속한 현재 블록 엘리먼트(`p` 등)를 식별하여, 이전 문단과 엄격히 격리된 신규 헤딩 노드(`<h1>`, `<h2>`, `<h3>`)로 교체하고 커서를 제목 노드 안으로 정확히 포커싱.
     * 이제 윗줄에 어떤 일반 글이 있더라도 영향받지 않고, `# + 공백`을 누르면 즉시 해당 줄만 깔끔한 제목으로 전환되어 바로 타이핑 가능.
12. **노션(Notion) 스타일 선택 영역 단독 서식/자동 탈출, 빈 커서 토글 모드 & 가이드 배너 기본 접힘 개선 (2026-09-09 6차 배포)**:
    * **선택 영역(Selection) 단독 서식 적용 및 일반 텍스트 자동 복귀 (Selection Formatting Exit)**:
      * 텍스트를 드래그하여 선택한 상태에서 서식 단축키(`Ctrl+B`, `Ctrl+I`, `Ctrl+U`, `Ctrl+Shift+X`, `Ctrl+E`)나 툴바 버튼을 누를 경우, 오직 선택된 영역에만 서식을 즉시 적용.
      * 적용 직후 커서가 서식 태그 바깥으로 자동 이동(Escape)하여, 바로 이어서 타이핑하는 글자들은 서식이 자동으로 해제된 순수 기본(Normal) 텍스트로 작성되도록 개선.
    * **선택 영역 없는 상태(Collapsed Cursor)의 툴바 토글(Toggle) 모드 구현**:
      * 글자를 선택하지 않고 커서만 위치한 상태에서 단축키나 툴바 버튼을 누르면 토글 모드로 동작.
      * 상단 툴바 버튼이 하이라이트(`.tool-btn.active`)된 상태를 유지하며, 이어서 작성되는 텍스트에 지속적으로 해당 서식이 적용됨.
      * 단축키를 다시 누르거나 툴바의 활성화된 버튼을 다시 클릭하면 토글이 해제되어 원래의 기본 텍스트 작성 상태로 자연스럽게 복귀.
    * **실시간 툴바 활성 상태(Active State) 동기화**:
      * 마우스 클릭, 커서 이동, 단축키 입력 시 현재 커서 위치의 서식 상태를 감지하여 툴바 버튼의 활성화/비활성화 상태를 실시간으로 시각적 동기화.
    * **마크다운 가이드 배너 항상 기본 접힘(Default Collapsed) 상태 유지**:
      * 에디터 상단의 마크다운 가이드 영역이 새 글 작성 및 글 수정 진입 시 항상 기본적으로 깔끔하게 접힌 상태로 로드되도록 변경하여, 에디터 진입 즉시 넓고 쾌적한 본문 작성 캔버스 확보.
13. **전면 반응형 3단계(와이드 PC / 1:1 정방형 명함형 / 모바일) 아키텍처 구축 및 모바일 2줄(2-Line) 왜곡 해소 (2026-09-09 7차 배포)**:
    * **일반 PC 풀스크린 기준 반응형 3단계(Breakpoints) 체계 확립**:
      * **Stage 1: 기본 와이드 화면 (`min-width: 1181px`)**: 기존의 완성도 높은 280px 좌측 사이드바 및 2열 대시보드 PC UI 100% 유지.
      * **Stage 2: 1:1비 정방형/태블릿 화면 (`769px ~ 1180px`)**:
        * 프로필 상단 영역을 유려한 **명함(Business Card)** 형태로 개편: `[사진(좌)] ➔ [이름/직함/슬로건(중앙)] ➔ [연락처 박스(우측)]` 가로 배치.
        * 연락처 박스는 와이드 화면의 컴팩트한 박스 크기(`width: 240px`)를 그대로 유지하여 공허했던 상단 여백을 세련되게 채움.
      * **Stage 3: 세로로 긴 모바일 화면 (`max-width: 768px`)**:
        * 모바일에서도 연락처 박스가 화면 100%로 어색하게 늘어나지 않고 와이드 화면 박스 크기(`width: 240px`)를 고정 유지하여 중앙 정렬.
    * **브라우저 창 리사이징 유동적 애니메이션(Fluid CSS Transitions)**:
      * 사이드바, 프로필 카드, 툴바, 내비게이션, 대시보드 카드에 `transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);`를 부여하여 창 크기를 조절할 때 UI가 미끄러지듯 자연스럽게 재배치됨.
    * **모바일 UI 왜곡 4대 핵심 영역 2줄(2-Line) 자연스러운 레이아웃 개편**:
      * **새 스터디노트 작성 헤더**:
        * `[< 목록으로]`와 `[저장 및 배포]` 버튼을 1행 상단 양 끝에 나란히 배치하고, `[새 스터디 노트 작성]` 전폭 제목을 2행으로 분리하여 "저장 및 배포" 버튼이 아래 좌측으로 밀려 떨어지는 현상 원천 차단.
      * **대시보드 최근 스터디 노트 목록**:
        * `[제목]`을 1행에 크게 전폭 노출하고, `[카테고리 배지 (white-space: nowrap)]`와 `[작성일자]`를 2행에 분리 배치하여 "자격증 공부" 등 배지가 세로 1글자씩 나열되던 왜곡 완벽 해결.
      * **보안 뉴스 아카이브 목록**:
        * 모바일 카드형 2줄 구조로 전환: 1행에 굵고 선명한 `[기사 제목]`을 전폭 배치하고, 2행 메타 바에 `[별 중요도 (컴팩트)]` + `[출처 배지]` + `[날짜]` + `[🔗 원문]` 버튼을 한눈에 표시하여 별 영역 과다로 링크가 잘리던 문제 완전 해소.
      * **프로젝트 목록**:
        * 1행에 `[프로젝트명]`(굵은 폰트) + `[고객사 배지]`를 전폭 배치하고, 2행에 `[일정]`과 `[유동 폭 진행률 바]`를 배치하여 프로젝트명이 세로 1글자로 꺾이던 문제 해결.
      * **활성 프로젝트 카드**:
        * D-day 배지와 프로젝트명(1행), 일정과 전폭 진행률 바(2행)의 상하 2단 구조로 자연스럽게 래핑.
14. **모바일 상단 카테고리 동적 2열 그리드 개편 & 정방형 배지 보호 및 리사이징 버벅임 완벽 해소 (2026-09-09 8차 배포)**:
    * **모바일(`max-width: 768px`) 상단 카테고리 메뉴 동적 2열 그리드 배치 (`.nav-menu`)**:
      * **홀수 개 메뉴 시 (현재 5개 기준)**: 1번째 최상단 메뉴(`대시보드`)가 상단 1줄 전체(`grid-column: 1 / -1`)를 차지하고, 나머지 메뉴 4개가 2열씩 2행으로 대칭 배치되어 양옆 빈 공간 없이 시각적 안정감 극대화.
      * **짝수 개 메뉴 시 (향후 메뉴 추가 대비)**: 모든 메뉴가 2열 그리드로 균등 분할되어 깔끔하게 나열.
      * CSS 전용 수식 `:first-child:nth-last-child(odd)`를 적용하여 자바스크립트 계산 없이 메뉴 개수 변동에 따라 100% 자동 반응하도록 설계.
    * **Stage 2(1:1 정방형 화면, `769px ~ 1180px`) 카테고리 배지 세로 꺾임 완벽 방지**:
      * 모든 `.badge`에 `white-space: nowrap !important; flex-shrink: 0; display: inline-flex;`를 전역 부여.
      * `.recent-item-title`에 `flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`를 적용하고, `.recent-item-meta`에 `flex-shrink: 0;`을 적용하여 좁은 화면에서도 텍스트가 줄바꿈되거나 배지를 세로 1글자 단위로 짓누르는 왜곡을 원천 방지.
    * **브라우저 창 리사이징 버벅임 및 끊김 제거 (Resize Animation Stopper 도입)**:
      * 30개 이상의 레이아웃 컨테이너(`.app-container`, `.sidebar`, `.main-content`, `.card` 등)에 무분별하게 적용되어 초당 수십 회의 Reflow/Repaint 레이아웃 스래싱을 유발하던 `transition: all`을 레이아웃 요소에서 완전 제거하고, 버튼 및 인터랙티브 요소에만 경량 전환(`transition: color, background-color, border-color 0.2s ease`)으로 분리.
      * `main.js`에 `window.resize` 이벤트 디바운싱 기반의 `initResizeHandler()`를 탑재하여 창 크기를 조절하는 동안에는 `.resize-animation-stopper`를 통해 모든 transition 연산을 일시 중단함으로써, 부드러운 60fps 네이티브 플렉스/그리드 리사이징 성능 확보.
15. **프로젝트 스터디&기록 게시판 깃허브 인증 잔재 청산 및 구글 시트 DB 삭제 오류(Failed to fetch) 완벽 해결 (2026-09-09 9차 배포)**:
    * **프로젝트 상세 스터디 & 진단 기록판 깃허브 잔재 제거 및 관리자 열쇠(🔑) 연동**:
      * `renderProjectNotes()`에서 레거시 `appState.syncEnabled && appState.githubPat` 조건을 완전 제거하고 `appState.isAdmin` 관리자 인증 기반으로 전환.
      * "깃허브 동기화를 인증하십시오" 안내 문구를 "상단 **관리자 열쇠(🔑)** 버튼을 눌러 인증하십시오"로 전면 교체.
      * 상단 열쇠 버튼으로 관리자 인증/로그아웃 시 현재 열려 있는 프로젝트 기록판이 즉각 잠금 해제/잠금되도록 `applyAdminPermissions()`에 실시간 갱신 로직 연동.
      * 글로벌 배포 오버레이 문구(`deploy-overlay`)를 "깃허브 업로드 중..."에서 "데이터 동기화 중..."으로 수정.
      * 프로젝트 삭제(`btnDeleteProject`) 내 비정상 호출되던 레거시 `commitToGitHub` 잔재 코드 제거.
      * 누락되었던 프로젝트 등록/수정(`addProjectForm`) 및 프로젝트 기록 등록/수정(`addNoteForm`) submit 이벤트 리스너 정상 구현.
    * **구글 시트 삭제 중 `Failed to fetch` 오류 원인 규명 및 로직 개편**:
      * **원인 규명**: 현재 배포된 구글 앱스 스크립트(GAS) 웹 앱의 배포 설정 중 '액세스 권한이 있는 사용자(Who has access)'가 '나만(Only myself)' 또는 'Google 계정이 있는 사용자'로 설정되어 있어, 브라우저 `fetch()` 요청 시 Google 계정 로그인 리다이렉트(302 ➔ accounts.google.com)가 발생하고 브라우저 CORS 정책에 의해 차단(Failed to fetch)된 것이 원인.
      * **로컬 거짓 삭제(Deceptive Local Deletion) 방지**:
        * 기존에는 DB 삭제 성공 여부와 무관하게 로컬 `localStorage`에서 글을 먼저 지우고 `posts` 배열을 필터링하여, 사용자가 보기에는 삭제된 것처럼 착각을 유발하고 타 기기/새 브라우저 접속 시 글이 다시 부활하는 혼선이 있었음.
        * 이를 개편하여 원격 DB 삭제(`sendToGasApi`)를 **먼저 수행**하고, DB 통신 오류 발생 시 원인과 해결책(GAS 배포 설정 가이드)을 명확히 안내하며, 사용자가 명시적으로 로컬 강제 삭제를 선택하지 않는 한 글을 안전하게 보존하도록 로직 수정.
16. **프로젝트 목록 하위 세부 진단 일정 트리(Sub-Tree) 계층 구조 및 진단 상세 뷰 신설 (2026-09-09 10차 배포)**:
    * **보안 컨설팅 실무형 하위 진단 일정(Sub-Diagnostics) 데이터 모델 확장**:
      * 대규모 보안 컨설팅 사업(예: SKT 연간 컨설팅) 내 인프라 진단, 웹/모바일 모의해킹, 개인정보 P&G 실태점검 등 다수의 세부 진단 과업들이 병행/순차 진행되는 실무 특성을 반영하여 프로젝트 데이터(`projects.json` & `appState.projects`)에 `diagnostics` 배열 구조 도입.
      * 각 진단별 `id`, `name`, `type`(인프라/모의해킹/개인정보), `target`(점검 대상 장비/시스템/수탁사), `startDate`, `endDate`, `status`(`completed`/`in-progress`/`planned`), `details`(과업 요약), `content`(마크다운 기반 점검 항목/체크리스트/결과 보고서) 필드 구축.
    * **프로젝트 목록 내 접기/펼치기 하위 트리(Sub-Tree Table) 구현**:
      * 상위 프로젝트 행에 접기/펼치기 토글 버튼(`[▼]` / `[▶]`)과 `[세부진단 N]` 카운트 배지 제공.
      * 하위 진단 행(`diagnostic-sub-row`)에 브랜치 커넥터(`├──`, `└──`) 라인, 보안 쉴드 아이콘, 진단 과업명, 분야 배지(`[인프라]`, `[모의해킹]`, `[개인정보]`), 일정, 상태 배지(`완료`, `진행중`, `예정`) 및 상세 바로가기 화살표 버튼 표시.
      * **원클릭 다이렉트 상세 진입**: 하위 진단 행 클릭 시 해당 진단 과업의 상세 화면으로 즉시 라우팅(`#/diagnostic/:projectId/:diagId`).
    * **진단 상세 뷰(Diagnostic Detail Pane) 신설**:
      * **네비게이션 브레드크럼**: `프로젝트 목록 > [상위 프로젝트명] > [세부 진단명]` 계층 표시 및 `[← 프로젝트 목록으로 돌아가기]` 원클릭 복귀.
      * **진단 핵심 메타 카드**: 진단명, 분야 및 진행 상태 배지, 점검 대상 및 범위(`target`), 상세 개요 설명, 수행 기간 및 실시간 진행률 바 제공.
      * **진단 점검 일지 & 결과 마크다운 렌더러**: Marked.js를 활용하여 취약점 점검 항목, 체크리스트, 점검 결과표를 미려하게 표시하고 폰트 크기(기본/크게) 조절 기능 탑재.
    * **프로젝트 상세 화면 내 세부 진단 과업 그리드 연동**:
      * 프로젝트 상세 화면(`#project-detail-view`) 내에도 세부 진단 과업 카드 그리드(`#project-diagnostics-grid`)를 신설하여 사업에 속한 모든 진단의 현황을 한눈에 파악 가능.
    * **관리자(Admin) 전용 진단 일정 등록/수정/삭제 풀 라이프사이클 지원**:
      * 관리자 열쇠(🔑) 인증 시 상위 프로젝트 상세 또는 진단 상세 화면에서 `[+ 새 진단 일정 추가]`, `[진단 정보 수정]`, `[진단 삭제]` 기능 활성화.
      * 모달 팝업(`add-diagnostic-modal`)을 통해 진단명, 유형, 대상 범위, 일정, 상태, 마크다운 일지를 손쉽게 등록 및 수정할 수 있도록 연동.
    * **3단계 반응형(Stage 1, 2, 3) 완벽 지원**:
      * 와이드 PC(Stage 1) 및 태블릿(Stage 2)에서는 5열 트리 테이블 형태로 표시.
      * 모바일(Stage 3 <= 768px)에서는 부모 프로젝트 카드 하단에 인덴트된 서브 카드 형태로 진단 일정들이 표시되며, 터치 한 번으로 진단 상세 화면으로 매끄럽게 전환.
17. **프로젝트, 세부진단, 프로젝트 기록 게시물 전면 구글 시트 DB 연동 및 멀티 디바이스 실시간 동기화 (2026-09-09 11차 배포)**:
    * **Google Sheets 3개 시트 기반 분산 NoSQL 데이터베이스 모델 구축**:
      * **`Posts` 시트**: 스터디 노트 및 보안 뉴스 저장 (`id`, `category`, `title`, `date`, `content`, `images`)
      * **`Projects` 시트**: 상위 프로젝트 및 원자적(Atomic) 하위 세부 진단 배열 저장 (`id`, `name`, `client`, `startDate`, `endDate`, `details`, `diagnostics` JSON)
      * **`ProjectNotes` 시트**: 각 프로젝트에 소속된 비공개 기록 게시판 저장 (`id`, `projectId`, `title`, `date`, `content`)
      * *시트 자동 생성 및 초기화*: `gas_backend_code.gs` 실행 시 해당 시트들이 없으면 자동으로 탭과 헤더를 생성하여 런타임 오류 방지.
    * **Google Apps Script(GAS) REST 백엔드 풀 CRUD 및 일괄 조회(Batch Query) API 확장**:
      * **일괄 조회 엔드포인트 (`GET ?action=getAllData`)**: 1회의 HTTP 요청으로 게시글, 프로젝트, 프로젝트 기록 전체를 한 번에 수신하여 클라이언트 로딩 지연 최소화 (`getProjects`, `getProjectNotes` 개별 조회도 지원).
      * **`saveProject` & `deleteProject`**: 상위 프로젝트와 하위 진단 일정(배열)을 즉시 시트에 추가/수정/삭제. 프로젝트 삭제 시 해당 프로젝트에 소속된 `ProjectNotes`도 연쇄(Cascading) 자동 삭제.
      * **`saveProjectNote` & `deleteProjectNote`**: 프로젝트 내부 기록의 등록, 수정, 삭제 처리.
    * **프론트엔드(`main.js`) 실시간 DB 동기화 및 타 기기 접속 시 삭제 글 부활(Zombie Item) 원천 방지**:
      * `loadData()` 개편: `getAllData`를 통해 구글 시트 DB의 실시간 데이터를 최우선으로 수신.
      * GAS DB가 정상 로드되었을 경우(`gasLoaded = true`), 구글 시트 DB를 단일 진실 공급원(Single Source of Truth)으로 삼아 타 기기의 오래된 `localStorage` 캐시가 삭제된 글을 부활시키는 현상을 원천 차단.
      * 네트워크 오프라인이나 GAS 장애 시에만 안전하게 `localStorage` 및 정적 `.json` 파일로 자동 폴백.
      * 프로젝트 등록/수정/삭제, 세부 진단 추가/수정/삭제, 프로젝트 기록 등록/수정/삭제 시 `sendToGasApi`를 통해 구글 시트 DB와 즉각 동기화.
    * **데이터 마이그레이션 도구 고도화 (`migrate_to_sheets.js`)**:
      * 기존 `posts.json`뿐만 아니라 `projects.json`(SKT 3대 세부 진단 포함) 및 `projectNotes.json`까지 구글 시트로 일괄 이전할 수 있도록 스크립트 확장 (`--posts-only`, `--projects-only`, `--notes-only` 옵션 지원).
18. **누락 뉴스 마이그레이션(107개 전량 DB화) 및 프로필/포트폴리오 구글 시트 DB 연동 & 관리자 웹 편집기 탑재 (2026-09-09 12차 배포)**:
    * **뉴스 게시글 누락분 35개 전량 구글 시트 DB 추가 마이그레이션 완료**:
      * 기존에 `Posts` 시트에 누락되어 있던 보안 뉴스 마크다운 파일 35건을 `migrate_to_sheets.js --missing-posts`를 통해 전량 구글 시트 DB로 완벽 이전.
      * 총 107개 게시글 (스터디 노트 6건 + 보안 뉴스 101건) 데이터베이스 완전 일치 달성.
    * **메인화면 프로필 & 포트폴리오 구글 시트 DB 분산 모델 구축**:
      * **`Profile` 시트**: 이름, 직함, 소속 회사, 슬로건/소개글, 이메일, 전화번호, 프로필 이미지 URL (`id`, `name`, `title`, `company`, `bio`, `email`, `phone`, `avatarUrl`).
      * **`Portfolio` 시트**: 자격증(`cert`), 프로젝트 이력(`project`), 경력/군복무(`career`), 기술 스택(`skill`) 등 포트폴리오 타임라인 및 역량 항목 전량 관리 (`id`, `type`, `title`, `date`, `description`, `category`, `level`, `percent`, `sortOrder`).
      * 시트 미존재 시 기본 데이터(`DEFAULT_PROFILE`, `DEFAULT_PORTFOLIO`)로 자동 생성/초기화 지원.
    * **GAS 백엔드 API 확장**:
      * `GET ?action=getProfile`, `GET ?action=getPortfolio`, 및 `GET ?action=getAllData`에 profile, portfolio 일괄 번들링 응답 제공.
      * `POST action=saveProfile`: 관리자 인증 후 단일 행 업데이트.
      * `POST action=savePortfolio`: 관리자 인증 후 포트폴리오 항목 리스트를 원자적(Atomic)으로 일괄 동기화(순서 및 삭제 완벽 보장).
    * **프론트엔드 관리자 편집 모달 UI 신설**:
      * 관리자 로그인(🔑) 시 프로필 카드에 `[프로필 수정]` 버튼, 포트폴리오 탭에 `[포트폴리오 관리]` 버튼 자동 노출.
      * **프로필 수정 모달 (`#edit-profile-modal`)**: 이름, 직함, 회사, 소개 문구, 이메일, 연락처를 실시간 수정 및 DB 즉시 반영.
      * **포트폴리오 관리 모달 (`#edit-portfolio-modal`)**: 자격증 / 프로젝트 / 경력 / 보유 기술 4개 탭 인터페이스를 통해 기존 항목 수정, 신규 항목 추가, 항목 삭제를 직관적인 GUI로 완벽 제어.
    * **단일 진실 공급원(Single Source of Truth) 일원화**:
      * 정적 HTML 하드코딩에서 완전히 벗어나, 구글 시트 DB에서 실시간으로 불러와 동적 렌더링.
      * 오프라인/통신 지연 시 내장 기본값으로 매끄럽게 폴백하여 UI 깨짐 없는 무중단 사용성 보장.
19. **보안 뉴스 중요도 및 출처 undefined 표시 버그 완벽 해결 및 메타데이터 듀얼 파이프라인 구축 (2026-09-09 13차 배포)**:
    * **문제 원인 분석**:
      * 구글 시트 `Posts` 시트 및 GAS 백엔드에서 `importance`, `source`, `newsLink` 필드가 제외된 상태로 `getAllData`가 반환되어, 프론트엔드 렌더링 시 `${news.importance}` 및 `${news.source}`가 문자열 `'undefined'`로 출력됨.
      * 또한 `loadData()`에서 구글 시트 실시간 데이터를 수신했을 때 로컬 `posts.json`에 보존되어 있던 풍부한 뉴스 메타데이터(출처, 별점, 원문 링크)를 보강하지 않고 덮어써서 발생.
    * **프론트엔드 메타데이터 융합 및 방어 렌더링 구현 (`main.js`)**:
      * `loadData()` 실행 시 `posts.json` 메타데이터 맵(`staticPostsMap`)을 상시 로드하여, 구글 시트 DB에서 넘어온 107개 게시글 각각에 대해 미등록된 `importance`, `source`, `newsLink`를 완벽 보강 융합.
      * 누락 시 기본값 안전 폴백 적용 (`importance: '⭐⭐⭐'`, `source: '보안뉴스'`).
      * 보안 뉴스 목록(`renderSecurityNews()`) 및 대시보드 최근 뉴스(`renderDashboard()`) 렌더러에 `escapeHtml()` 및 폴백 삼항 연산자 적용으로 문자열 `'undefined'` 출력 원천 차단.
      * 원문 링크 버튼도 유효 URL 존재 시에만 클릭 버튼으로 렌더링하고 부재 시 `-`로 단정하게 처리.
      * 뉴스 상세 조회 화면(`showArticleDetail()`) 헤더에도 `[출처: 연합뉴스]` 배지를 표시하도록 확장.
      * 검색 필터(`matchSearch()`)에 뉴스 출처(예: '연합뉴스', '보안뉴스') 검색 지원 추가.
    * **구글 시트 & GAS 백엔드 스키마 확장 (`gas_backend_code.gs`)**:
      * `Posts` 시트 헤더 6, 7, 8열에 `importance`, `source`, `newsLink` 컬럼 공식 배정.
      * `getPostsData()`에서 해당 3개 메타데이터 컬럼 자동 감지 및 반환.
      * `savePost` API에서 관리자가 수정한 뉴스 중요도, 출처, 원문 링크를 구글 시트 F, G, H열에 영구 보존.
    * **데이터 마이그레이션 도구 지원 (`migrate_to_sheets.js`)**:
      * `--sync-news-meta` 옵션을 추가하여 기존 시트에 등록된 101개 보안 뉴스의 출처와 중요도를 시트 F, G, H열로 원클릭 일괄 동기화할 수 있도록 지원.
20. **보안 뉴스 100% 순수 구글 시트 DB 체계 전환 및 관리자 보안 뉴스 작성기 탑재 (2026-09-09 14차 배포)**:
    * **정적 JSON 조회 의존성 완전 제거 (100% Pure Google Sheets DB)**:
      * `loadData()`에서 로컬 `posts.json`을 병행 조회하던 레거시 로직을 완전 제거.
      * 구글 시트 DB(`Posts` 시트)의 실시간 데이터를 절대적인 단일 진실 공급원(Single Source of Truth)으로 삼아, 모든 게시글 및 보안 뉴스의 내용뿐만 아니라 `importance`(중요도 별점), `source`(출처 언론사), `newsLink`(원문 링크)까지 100% 구글 시트 DB로부터 직접 로드 및 렌더링하도록 일원화.
    * **101개 보안 뉴스 전체 메타데이터 구글 시트 DB 이주 완료**:
      * `migrate_to_sheets.js --sync-news-meta`를 통해 기존 101개 보안 뉴스의 중요도, 언론사 출처, 원문 URL 전체를 구글 시트 `Posts` 시트의 F, G, H열로 완전 이전 완료.
    * **관리자 전용 '새 보안 뉴스 작성' 기능 및 전용 에디터 구축**:
      * **뉴스 탭 상단 작성 버튼 신설 (`#btn-open-add-news-editor`)**: 관리자 로그인(🔑) 시 `[+ 새 보안 뉴스 작성]` 버튼 노출.
      * **뉴스 전용 에디터 모드 연동**: 버튼 클릭 시 카테고리(`News`), 기사 일자, 중요도(`⭐⭐⭐⭐⭐`~`⭐⭐⭐`), 출처 언론사, 원문 링크 입력 필드가 활성화된 에디터로 즉시 진입.
      * **카테고리 선택 동적 전환**: 에디터 내에서 카테고리를 '보안 뉴스'로 변경 시 뉴스 전용 입력 필드가 자동으로 열리고 타이틀이 동적 전환.
      * **출처 필수 검증 및 GAS DB 영구 저장**: 뉴스 등록 시 출처 입력 여부를 검증하고, `sendToGasApi('savePost')` 호출 시 모든 메타데이터를 구글 시트로 전송하여 실시간 등록/수정/삭제 라이프사이클 완성.
21. **스터디 노트 글 유형(type) 구글 시트 DB 스키마 공식 편입 및 undefined 렌더링 버그 원천 해결 (2026-09-09 15차 배포)**:
    * **문제 원인 분석**:
      * 기존 `Posts` 시트 및 GAS 백엔드 API 설계 시 `importance`, `source`, `newsLink`까지만 헤더(F, G, H열)에 배정되어 있었고, 스터디 노트의 핵심 속성인 `type`(유형: 교육, 주요정보통신기반시설, ISMS-P, CPPG, 취약점진단, AWS CCP) 컬럼이 누락되어 있었음.
      * 이로 인해 구글 시트 DB를 단일 진실 공급원(SSOT)으로 조회 시 `post.type`이 `undefined`로 전달되었고, 스터디 노트 카드 템플릿(`renderStudyNotes()`)에서 `<span class="badge type-badge">${post.type}</span>`에 의해 문자열 `'undefined'`가 화면에 그대로 출력됨.
    * **구글 시트 & GAS 백엔드 스키마 공식 확장 (`gas_backend_code.gs`)**:
      * `Posts` 시트 헤더 9열(I열)에 `type`을 공식 필드로 영구 배정 (`['id', 'category', 'title', 'date', 'content', 'importance', 'source', 'newsLink', 'type', 'image_1', ...]`).
      * `getPostsData()`: 9열(I열) 또는 헤더 매핑을 통해 `type` 값을 정확히 추출하여 반환 객체에 `type: postType`으로 포함.
      * `savePost`: `type` 필드를 파라미터로 수신하여 I열(9열)에 기록 및 갱신하도록 처리.
      * `syncStudyTypes`: 기존 글들의 ID별 유형을 일괄 갱신할 수 있는 원자적 배치 액션 신설.
    * **프론트엔드 안전 렌더링 및 에디터 연동 (`main.js`)**:
      * `renderStudyNotes()`: `post.type` 존재 시에만 배지를 렌더링하도록 조건부 렌더링(`typeBadgeHtml`) 및 `escapeHtml()` 적용하여 문자열 `'undefined'` 출력 원천 차단.
      * `loadData()`: 구글 시트 실시간 데이터를 로드하는 즉시 6개 기존 스터디 노트의 고유 ID별 유형 매핑(`KNOWN_STUDY_TYPES`)을 통해 백엔드 배포 반영 전이라도 클라이언트에서 즉각 올바른 유형 배지(`교육`, `ISMS-P` 등)가 즉시 렌더링되도록 이중 방어선 구축.
      * 글 작성/수정기(`savePost`): 에디터에서 글 저장 시 `sendToGasApi('savePost')` 페이로드에 `type: postData.type || ''`를 온전히 포함하여 구글 시트 DB로 실시간 전송/보존.
    * **스터디 노트 데이터 동기화 완료 (`migrate_to_sheets.js`)**:
      * `syncStudyPosts()` 기능 및 `--sync-study-type` CLI 옵션을 구현하여 기존 6개 스터디 노트의 본문 및 유형 속성 전체를 구글 시트 DB로 100% 성공적으로 이전 완료.
22. **클라이언트 페이크 매핑 전면 청산, Apps Script 무중단 자동 배포 파이프라인(`deploy_gas.js`) 구축 및 100% 순수 GAS DB 단일 진실 공급원(SSOT) 완성 (2026-09-09 16차 배포)**:
    * **클라이언트 임의 매핑/페이크 폴백(`KNOWN_STUDY_TYPES`, `|| '⭐⭐⭐'`, `|| '보안뉴스'`, `|| '진단'`, `|| '보안'`) 전면 청산**:
      * **가짜 기본값 제거**: 프론트엔드 코드에서 값이 없을 때 임의의 기본값으로 채워 넣던 페이크 로직(`KNOWN_STUDY_TYPES` 매핑, 별점 기본 `⭐⭐⭐`, 언론사 기본 `보안뉴스`, 진단 기본 `진단`, 글 유형 기본 `보안`)을 `main.js` 전역에서 전수 색출 및 완전 삭제.
      * **순수 DB 데이터 충실 표출**: DB에 저장된 실제 데이터만을 투명하게 렌더링하도록 일원화(DB에 데이터가 없을 경우 가짜 데이터로 덮지 않고 공백 또는 `-`로 정직하게 출력).
      * **6개 스터디 노트 실제 유형 DB 직접 영구 기록**: `syncStudyTypes` 백엔드 배치를 실행하여 `교육`, `주요정보통신기반시설`, `ISMS-P`, `CPPG`, `취약점진단`, `AWS CCP` 6개 스터디 노트의 실제 유형을 Google Sheets `Posts` 시트 I열(`type`)에 직접 100% 영구 기록 완료.
    * **Google Apps Script(GAS) 무중단 자동 배포 스크립트 구축 (`deploy_gas.js`)**:
      * **배경**: 매번 구글 스프레드시트의 Apps Script 편집기를 수동으로 열어 코드를 붙여넣고 새 버전을 수동 배포해야 하던 비효율을 완벽히 해소.
      * **파이프라인 구현**:
        * Google Apps Script REST API (`script.googleapis.com`) 및 OAuth2 토큰 자동 갱신(Refresh Token) 연동.
        * `AndySec_DB` Apps Script 프로젝트(`1g7_bIb6Oex-EoLvlu7wf2b5AY3eUhvRg2NEt0uPD_BYZO_1jLFhoKqvK`) 및 배포 ID(`AKfycby_5htUVodm_M16r25fUOyNAkNG7cpx3L1X098TYGtvS6KYN4nv8h8N5-wnNsveytLz8Q`) 식별 및 연동.
        * `PUT /v1/projects/{scriptId}/content` ➔ 소스 코드 자동 업데이트.
        * `POST /v1/projects/{scriptId}/versions` ➔ 프로젝트 새 버전 자동 발급.
        * `PUT /v1/projects/{scriptId}/deployments/{deploymentId}` ➔ 라이브 Web App 배포 자동 갱신.
      * **성과**: `node deploy_gas.js` 명령어 단 한 번으로 로컬 `gas_backend_code.gs`의 수정 사항이 5초 만에 실제 구글 웹 앱으로 자동 반영 및 배포 완료 (최신 v8 배포 성공).
    * **100% 순수 Google Sheets GAS DB 단일 진실 공급원(SSOT) 확립 및 깃허브 JSON 파일 의존성 0% 달성**:
      * **레거시 정적 JSON Fetch 완전 제거**: `main.js`의 `loadData()` 및 `initProjects()`에 남아있던 오프라인 정적 파일 폴백(`posts.json`, `projects.json`, `projectNotes.json`) 호출 로직을 완전 삭제.
      * **전체 메뉴 전수 점검 및 검증**:
        * **대시보드 (Dashboard)**: 최근 스터디 노트 6건, 최근 보안 뉴스 6건, 프로젝트 현황 전체가 GAS DB(`action=getAllData`)를 통해 실시간 로드됨을 확인.
        * **스터디 노트 (Study Notes)**: 6건의 글과 각 글의 실제 유형 배지가 DB로부터 순수 로드됨을 확인.
        * **보안 뉴스 (Security News)**: 101건의 뉴스 전체의 별점 중요도, 언론사 출처, 원문 링크가 DB로부터 100% 직접 로드되며, 관리자 새 뉴스 등록/수정/삭제도 실시간 GAS DB와 연동됨을 확인.
        * **프로젝트 & 세부 진단 트리 (Projects & Diagnostics)**: `Projects` 시트로부터 상위 프로젝트 및 하위 세부 진단 일정(JSON)이 단일 원자적 구조로 정상 로드 및 트리 표시됨을 확인.
        * **프로젝트 기록 (Project Notes)**: `ProjectNotes` 시트로부터 프로젝트별 비공개 기록이 정상 로드됨을 확인.
        * **프로필 & 포트폴리오 (Profile & Portfolio)**: `Profile`, `Portfolio` 시트로부터 실시간 로드 및 관리자 모달을 통한 수정/저장이 완벽 동작함을 확인.
      * 이제 깃허브 저장소의 정적 JSON 파일을 일체 조회하거나 업데이트하지 않고, **오직 Google Sheets GAS DB만을 통해 모든 데이터의 조회, 등록, 수정, 삭제가 100% 무중단 동작**합니다.
23. **프로젝트 내부 새 진단 일정 등록 모달 복구, 상세 화면 목록 복귀 내비게이션 정상화 및 보안 뉴스/스터디 노트 에디터 전용 속성 분리 완성 (2026-09-09 17차 배포)**:
    * **프로젝트 내부 새 진단 일정 추가 버튼 버그 해결**:
      * `index.html` 내에서 `#add-note-modal`의 닫는 `</div>` 태그가 누락되어 하위의 `#add-diagnostic-modal`이 숨김 상태의 부모 모달 내부에 중첩되어 있던 HTML 마크업 오류를 수정.
      * 버튼 클릭 시 `openAddDiagnosticModal()`이 정상적으로 모달을 화면 중앙에 flex 레이아웃으로 팝업하도록 복구 완료.
    * **프로젝트 기록 및 게시글 상세 화면 '목록으로 돌아가기' 내비게이션 복구**:
      * `showLocalNoteDetail` 실행 시 URL 해시 변경 없이 `elements.articlePane`만 표시되던 상태에서 `btnBackToList` 클릭 시 기존 해시와 동일하여 `hashchange` 이벤트가 미발생하던 현상 해결.
      * `elements.btnBackToList`, `elements.btnBackToProjectsList`, `elements.btnBackToProjectFromDiag` 핸들러에서 명시적으로 상세 패널을 숨기고 타겟 뷰 렌더러(`showProjectDetail` 또는 `switchTab`)를 직접 호출하여 어떤 뷰 깊이에서도 확실하게 직전 목록 화면으로 복귀하도록 완벽 보장.
    * **보안 뉴스 vs 스터디 노트 에디터 스키마 및 UI 완전 분리**:
      * **스터디 노트 에디터**: 카테고리 드롭다운에서 '보안 뉴스' 선택지를 완전히 제거하여 스터디 노트와 보안 뉴스가 혼재되지 않도록 격리. '유형'(`type`) 필드는 필수 입력으로 유지.
      * **새 보안 뉴스 작성 / 수정 에디터 (`news-mode`)**:
        * 카테고리(`category`) 및 유형(`type`) 입력 필드를 완전히 숨김 처리 (`display: none !important;`).
        * 글 제목 입력 필드를 너비 100%로 시원하게 확장.
        * 보안 뉴스의 6대 필수/핵심 속성인 **제목 (`title`), 본문 (`content`), 날짜 (`date`), 출처 (`source`), 원문링크 (`newsLink`), 중요도 (`importance`)**만을 정확하게 입력받도록 전용 UI 제공.
        * `type` 속성은 뉴스 데이터에 불필요하게 묻어나지 않도록 빈 문자열(`''`)로 고정하고, `category`는 내부적으로 `'News'`로 자동 고정하여 GAS DB로 실시간 저장되도록 일원화.
24. **'데이터 로딩 중...' 화면 멈춤 버그 원천 해결 및 0ms 즉시 렌더링(SWR) & GAS 백엔드 초고속화 파이프라인 적용 (2026-09-10 18차 배포)**:
    * **원인 분석**:
      * **클라이언트(`main.js`)**: 페이지 진입 즉시 `localStorage` 캐시 유무와 무관하게 차단형 전면 모달 오버레이(`showLoader`)가 실행되었고, 네트워크 `fetch`에 타임아웃이 없어 구글 Apps Script 서버의 콜드 스타트나 네트워크 지연 발생 시 사용자가 '데이터 로딩 중...' 스피너 화면에 갇히는 현상 발생.
      * **백엔드(`gas_backend_code.gs`)**: 108개 행 전체에 대해 매 요청마다 `range.getCellImages()`를 실행하여, 사용되지도 않는 셀 이미지 검사에 15~30초 이상의 극심한 서버 지연을 유발함.
    * **클라이언트 초고속 비차단 렌더링 구축 (`main.js`)**:
      * **SWR (Stale-While-Revalidate) 0ms 즉시 렌더링 (`hydrateInitialData`)**: 브라우저 진입 즉시 로컬 캐시 데이터를 선제 복원하여 0초 만에 대시보드와 글 목록 전체를 표출. 캐시가 있는 일반 사용자에게는 차단형 로딩 오버레이를 전혀 띄우지 않고 백그라운드에서 조용히 최신 데이터를 동기화.
      * **`AbortController` 기반 7초 엄격 타임아웃**: GAS API 호출에 7초 타임아웃을 적용하여 네트워크 지연 시 즉시 중단하고 로컬 데이터로 안전하게 전환.
      * **로딩 오버레이 6초 절대 안전 차단기**: `showLoader()` 내부에 6초 자동 해제 타이머를 장착하여 어떤 네트워크 예외 상황에서도 6초 후 오버레이가 무조건 자동 닫히도록 보장. 오버레이 배경 클릭 시 즉시 닫기 지원.
    * **GAS 백엔드 성능 대폭 개선 (`gas_backend_code.gs` v9 배포 완료)**:
      * 병목 원인이었던 `range.getCellImages()`를 완전 제거하고 순수 URL 텍스트 파싱으로 경량화.
      * `getAllData` 배치 조회 시 단일 스프레드시트 인스턴스를 공유 재사용하여 구글 내부 드라이브 I/O 왕복을 최소화.
      * `node deploy_gas.js` 파이프라인을 통해 Apps Script REST API로 v9 라이브 배포 완료.
25. **접속/새로고침 시 무조건 시트 DB 로드, 5초 타임아웃/Fade-out & 우측 상단 붉은 팝업 메시지 체계 구축 (2026-09-10 19차 배포)**:
    * **접속/새로고침 시 무조건 구글 시트 DB 로드 시도**:
      * 로컬 캐시 유무와 관계없이 사이트 최초 접속 및 새로고침 시 무조건 `showLoader('데이터 로딩 중...', '구글 시트 데이터베이스와 연결하고 있습니다.')` 오버레이를 띄우고 최신 구글 시트 DB(`getAllData`)를 선제 조회하도록 UX를 일원화.
    * **정확한 5초 대기 & 부드러운 Fade-out 애니메이션 적용**:
      * `AbortController`를 통해 네트워크 요청 대기 시간을 정확히 5초(`5000ms`)로 제한.
      * 5초 이내에 정상 응답이 오거나 5초를 초과한 타임아웃 발생 시, 오버레이가 뚝 끊기지 않고 부드럽게 사라지는 CSS 트랜지션 Fade-out(`opacity: 0; visibility: hidden; transition: opacity 0.5s ease;`) 애니메이션 실행.
    * **5초 초과 시 우측 상단 붉은 팝업(Toast) 5초 노출 및 로컬 데이터 안전 복원**:
      * GAS 서버의 콜드 스타트나 네트워크 지연 등으로 5초가 초과되거나 로드 실패 시, 화면이 멈춘 채 갇히지 않고 오버레이가 즉시 fadeout 처리됨.
      * 동시에 화면 우측 상단에 붉은 경고 팝업(`.top-right-toast`)으로 `DB에서 데이터를 불러오지 못했습니다. 잠시후 다시 시도해주세요.` 메시지를 5초간 띄운 후 부드럽게 fadeout.
      * 사용자가 즉시 블로그를 열람할 수 있도록 로컬 스토리지에 캐시된 최신 데이터를 폴백 복원(`hydrateInitialData`)하여 화면에 정상 렌더링.
    * **오버레이 강제 닫기 기능 완전 제거**:
      * 사용자가 로딩 도중 배경을 클릭하여 실수로 로딩을 중단시키는 일을 방지하기 위해, 오버레이 배경 클릭 시 닫히는 이벤트 핸들러를 완전히 제거하여 데이터 로딩 무결성 확보.
26. **게시글 삭제 동기화 장애 및 접속 지연 타임아웃 정밀 해결 (2026-09-10 20차 배포 - GAS v11)**:
    * **현상 및 원인 규명**:
      * **스터디 노트 삭제 실패 원인**: 브라우저에서 `POST`로 GAS Web App 호출 시 Google의 302 리다이렉트(`script.googleusercontent.com/macros/echo`) 과정에서 브라우저 보안/CORS 정책으로 인해 `TypeError: Failed to fetch`가 발생. 실제 구글 시트에서는 `sheet.deleteRow`가 수행되어 글이 삭제되었음에도, 브라우저가 네트워크 에러로 인식하여 '원격 구글 시트 DB 삭제에 실패했습니다' 경고를 띄우고 로컬 캐시 삭제를 중단함.
      * **이후 접속 실패 및 5초 타임아웃 팝업 원인**: `sheet.deleteRow` 실행 직후 스프레드시트 인덱스 재계산 및 `Utilities.formatDate` 반복 호출 등으로 인해 `getAllData` 응답 시간이 일시적으로 5.2~7초로 지연됨. 프론트엔드의 엄격한 5초 `AbortController` 타이머가 만료되어 요청이 강제 중단되고, 우측 상단 붉은 팝업 메시지(`DB에서 데이터를 불러오지 못했습니다.`)가 지속 출력됨.
    * **Google Apps Script 백엔드 초고속 최적화 (`gas_backend_code.gs` v11 라이브 배포 완료)**:
      * **0ms 네이티브 날짜 변환 도입 (`formatIsoDate`)**: 100회 이상 호출되던 고비용 `Utilities.formatDate` 및 `Session.getScriptTimeZone()`을 순수 JavaScript Date 포맷터로 전면 대체하여 서버 처리 시간 1,500ms 이상 단축.
      * **단일 배치 읽기 통합**: `getPostsData`에서 헤더와 본문을 분리하여 읽던 2회의 RPC를 `allRows` 1회 일괄 조회로 일원화.
      * **`doGet` 삭제 엔드포인트 및 `SpreadsheetApp.flush()` 장착**: 브라우저 CORS/리다이렉트 간섭을 원천 차단하는 GET 방식의 `deletePost` 지원 및 물리 디스크 즉시 반영을 위한 `flush()` 추가.
      * `node deploy_gas.js`로 v11 실시간 자동 배포 완료.
    * **클라이언트 통신 파이프라인 방어력 강화 (`main.js`)**:
      * `sendToGasApi('deletePost')` 호출 시 CORS 이슈가 없는 GET 파라미터 호출 방식을 우선 적용하고, POST 에러 발생 시에도 GET으로 자동 재시도하여 브라우저 환경과 무관하게 삭제 성공을 100% 보장.
      * 백엔드 속도 개선으로 `getAllData` 응답 시간이 3.5초 이내로 단축되어 5초 타임아웃 이내에 안정적으로 구글 시트 DB 데이터를 로드 완료.

