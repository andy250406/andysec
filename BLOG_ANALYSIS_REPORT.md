# AndySec 블로그 시스템 분석 및 아키텍처 개편 완료 보고서

본 문서는 GitHub Pages 기반의 `andy250406.github.io/andysec` 블로그의 기존 시스템 분석 내용 및 **Google Apps Script(GAS) + Google Sheets NoSQL DB와 비밀번호 기반 관리자 인증 체계**로의 전면 개편 완료 내역을 정리한 최종 보고서입니다.

---

## 1. 아키텍처 개편 전/후 비교

| 항목 | 개편 전 (Legacy) | 개편 후 (Current Architecture) |
| :--- | :--- | :--- |
| **호스팅 & 렌더링** | GitHub Pages + Actions 빌드 | GitHub Pages (정적 리소스 SPA 호스팅 전담) |
| **데이터베이스 & API** | 정적 파일(`posts.json` + `*.md`) | **Google Sheets (`Posts` 시트) + Google Apps Script (REST API)** |
| **반영 속도** | Git Commit/Push 후 Actions 배포 대기 (1~3분) | **GAS API 즉각 호출 및 시트 행 업데이트 (1~2초 내 실시간)** |
| **관리자 인증** | 보안상 취약한 GitHub PAT 토큰 브라우저 입력 | **상단 바 🔑(열쇠) 버튼 + 비밀번호 캐싱 & 백엔드 교차 검증** |
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
       │      우측 상단 🔑 버튼 클릭 ➔ 비밀번호 입력 ➔ localStorage 캐싱
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

* **GAS 백엔드 코드 파일**: [gas_backend_code.gs](file:///c:/Users/pp040/OneDrive/SK쉴더스/Antigravity/andysec/gas_backend_code.gs)
* **구글 시트 구조 (`Posts` 시트)**:
  * **A열 (`id`)**: 글 고유 식별자 (`study-[timestamp]` 또는 `news-[timestamp]`)
  * **B열 (`category`)**: 카테고리 (`CertAnalysis`, `Cert`, `Shieldus`, `News`, `Project` 등)
  * **C열 (`title`)**: 제목
  * **D열 (`date`)**: 작성일 (`YYYY-MM-DD`)
  * **E열 (`content`)**: 마크다운 본문 전체 텍스트 (이미지 삽입 위치는 `{{img_1}}`, `{{img_2}}` 태그 사용)
  * **F열 이후 (`image_1`, `image_2`, ...)**: 구글 시트의 셀 내 삽입 이미지 객체(`getCellImages()`) 또는 이미지 외부 URL

---

## 4. 수행된 주요 파일 변경 내역

1. **레거시 GitHub PAT 스크립트 제거**:
   * `push_to_github.js`, `pull_from_github.js`, `generate_push_args.js` 영구 삭제
   * `package.json`에서 레거시 스크립트 명령어 정리
2. **[index.html](file:///c:/Users/pp040/OneDrive/SK쉴더스/Antigravity/andysec/index.html)**:
   * 사이드바 하단 GitHub 동기화 설정 버튼 및 PAT 모달 제거
   * 상단 바 우측에 **🔑 관리자 인증 버튼 (`admin-auth-btn`)** 신설
   * 관리자 인증 모달(`admin-auth-modal`) 신설 (비밀번호 입력, 잠금해제 상태 확인, 잠금/로그아웃 버튼)
   * 마크다운 작성 가이드(치트시트)에 `{{img_1}}`, `{{img_2}}` 구글 시트 이미지 태그 안내 추가
3. **[style.css](file:///c:/Users/pp040/OneDrive/SK쉴더스/Antigravity/andysec/style.css)**:
   * 관리자 잠금 해제 상태 표시 스타일(`.action-btn.admin-unlocked`) 추가
4. **[main.js](file:///c:/Users/pp040/OneDrive/SK쉴더스/Antigravity/andysec/main.js)**:
   * PAT 기반 연동 코드 전면 제거
   * `loadAdminAuth()`, `updateAdminUI()`, `applyAdminPermissions()` 구현으로 비밀번호 기반 UI 해금
   * `sendToGasApi()` 함수를 통해 GAS Web App과 POST 통신 구현
   * `loadData()`에서 GAS 실시간 GET 조회 연동 및 로컬 폴백 유지
   * `replaceImagePlaceholders()` 정규식 함수를 통해 본문 내 `{{img_n}}`을 실제 이미지 태그로 자동 치환 후 마크다운 파서로 전달
   * 글 등록/수정/삭제 폼 제출 시 1~2초 내에 Google Sheets 행을 즉시 조작하도록 로직 전환
5. **빌드 검증**:
   * `npm run build` 실행하여 무결성 및 정상 번들링(`dist/`) 확인 완료

---

## 5. 구글 시트 및 GAS 배포 가이드 (관리자용)

1. **구글 스프레드시트 생성**: 새 구글 시트를 만들고 시트 탭 이름을 `Posts`로 지정합니다.
2. **Apps Script 열기**: 메뉴의 `확장 프로그램` ➔ `Apps Script`를 클릭합니다.
3. **코드 붙여넣기**: 본 프로젝트의 [gas_backend_code.gs](file:///c:/Users/pp040/OneDrive/SK쉴더스/Antigravity/andysec/gas_backend_code.gs) 내용을 복사하여 붙여넣습니다. (비밀번호 변경 시 코드 내 `getAdminPassword()` 수정)
4. **웹 앱 배포**:
   * 우측 상단 `배포` ➔ `새 배포` 클릭
   * 유형: `웹 앱`
   * 다음 사용자 권한으로 실행: `나 (본인 구글 계정)`
   * 액세스 권한이 있는 사용자: `모든 사용자 (Anyone)`
   * 배포 완료 후 발급되는 **웹 앱 URL**을 복사합니다.
5. **프론트엔드 연동**:
   * 브라우저 콘솔에서 `localStorage.setItem('gas_api_url', '발급받은_GAS_웹앱_URL')`을 입력하거나, [main.js](file:///c:/Users/pp040/OneDrive/SK쉴더스/Antigravity/andysec/main.js)의 `GAS_API_URL` 상수에 기입하면 즉시 실서비스 연동됩니다.
