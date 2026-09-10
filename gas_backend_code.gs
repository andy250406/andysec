/**
 * AndySec 블로그 Google Apps Script (GAS) 백엔드 API
 * 
 * 구글 시트 구조 (시트명: 'Posts')
 * 1행(헤더): id | category | title | date | content | importance | source | newsLink | type | image_1 | image_2 | image_3 ...
 * A열(1): id (예: study-1783753819893, news-36c25a92-...)
 * B열(2): category (예: CertAnalysis, News, Project)
 * C열(3): title (게시글 제목)
 * D열(4): date (YYYY-MM-DD)
 * E열(5): content (마크다운 전체 텍스트, 이미지 위치는 {{img_1}}, {{img_2}} 등)
 * F열(6): importance (보안 뉴스 중요도 별점, 예: ⭐⭐⭐)
 * G열(7): source (보안 뉴스 출처 언론사, 예: 보안뉴스)
 * H열(8): newsLink (보안 뉴스 원문 링크)
 * I열(9): type (글 유형/자격증 구분, 예: 교육, 주요정보통신기반시설, ISMS-P, CPPG, 취약점진단, AWS CCP)
 * J열(10) 이후: 셀 내 삽입된 이미지 또는 이미지 URL 링크
 */

// 관리자 인증 비밀번호 (기본값 설정 또는 스크립트 속성 ADMIN_PASSWORD 사용)
function getAdminPassword() {
  const prop = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  return prop || 'pp0406hh';
}

// 초고속 ISO 날짜 포맷터 (Session.getScriptTimeZone API 오버헤드 0ms)
function formatIsoDate(d) {
  if (!d) return '';
  if (d instanceof Date) {
    const y = d.getFullYear();
    const m = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return y + '-' + m + '-' + day;
  }
  return String(d).trim();
}

const POSTS_SHEET_NAME = 'Posts';
const PROJECTS_SHEET_NAME = 'Projects';
const PROJECT_NOTES_SHEET_NAME = 'ProjectNotes';
const PROFILE_SHEET_NAME = 'Profile';
const PORTFOLIO_SHEET_NAME = 'Portfolio';

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getPostsSheet(ss = null) {
  const spreadsheet = ss || getSpreadsheet();
  let sheet = spreadsheet.getSheetByName(POSTS_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(POSTS_SHEET_NAME);
    sheet.appendRow(['id', 'category', 'title', 'date', 'content', 'importance', 'source', 'newsLink', 'type', 'image_1', 'image_2', 'image_3']);
  }
  return sheet;
}

function getProjectsSheet(ss = null) {
  const spreadsheet = ss || getSpreadsheet();
  let sheet = spreadsheet.getSheetByName(PROJECTS_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(PROJECTS_SHEET_NAME);
    sheet.appendRow(['id', 'name', 'client', 'startDate', 'endDate', 'details', 'diagnostics']);
  }
  return sheet;
}

function getProjectNotesSheet(ss = null) {
  const spreadsheet = ss || getSpreadsheet();
  let sheet = spreadsheet.getSheetByName(PROJECT_NOTES_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(PROJECT_NOTES_SHEET_NAME);
    sheet.appendRow(['id', 'projectId', 'title', 'date', 'content']);
  }
  return sheet;
}

function getProfileSheet(ss = null) {
  const spreadsheet = ss || getSpreadsheet();
  let sheet = spreadsheet.getSheetByName(PROFILE_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(PROFILE_SHEET_NAME);
    sheet.appendRow(['id', 'name', 'title', 'company', 'bio', 'email', 'phone', 'avatarUrl']);
    sheet.appendRow([
      'profile-main',
      '안태경',
      '보안 컨설턴트',
      'SK쉴더스 기업컨설팅 2팀',
      'SK쉴더스 기업컨설팅 2팀 보안 컨설턴트 안태경',
      'pp0406hh@gmail.com',
      '010-2224-1060',
      './profile.jpg'
    ]);
  }
  return sheet;
}

function getPortfolioSheet(ss = null) {
  const spreadsheet = ss || getSpreadsheet();
  let sheet = spreadsheet.getSheetByName(PORTFOLIO_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(PORTFOLIO_SHEET_NAME);
    sheet.appendRow(['id', 'type', 'title', 'date', 'description', 'category', 'level', 'percent', 'sortOrder']);
    const defaultRows = [
      ['cert-1', 'cert', 'CPPG (개인정보관리사) 취득', '2026.04', '개인정보보호법 및 망법 등 관련 규정 준수 요건 검토 지식 보유', '', '', '', 1],
      ['cert-2', 'cert', 'AWS Certified Cloud Practitioner 취득', '2026.03', 'AWS 핵심 클라우드 아키텍처 및 클라우드 보안 공동 책임 모델 지식 검증', '', '', '', 2],
      ['cert-3', 'cert', '빅데이터분석기사 필기 합격', '2025.10', '대용량 보안 모니터링 로그 및 시계열 기상/재해 데이터 처리 분석 역량', '', '', '', 3],
      ['cert-4', 'cert', '정보처리기사 취득', '2025.09', '시스템 아키텍처 설계, 네트워크 및 운영체제 전반에 대한 기본 지식 검증', '', '', '', 4],
      ['proj-1', 'project', '개인정보 보안 컨설팅 수탁사 점검 프로젝트', '2026.04', 'SK Shieldus Rookies 28기 최종 프로젝트로 모의 수탁기업 점검서 수립 및 가이드라인 제시', '', '', '', 1],
      ['proj-2', 'project', '의료 데이터를 위한 웹 취약점 자동 진단 시스템', '2026.01', '병원 데이터 대상 웹 취약점 자동 스캔 프로그램 및 대응 소스코드 리포트 연동 시스템', '', '', '', 2],
      ['proj-3', 'project', '산불 발생 데이터 분석 대시보드 구축', '2025.11', 'Streamlit을 활용하여 기온, 풍속 및 산불 발생 피해 면적 연계 시각화 및 예측 인자 분석', '', '', '', 3],
      ['proj-4', 'project', 'AI를 활용한 자동 틀린 그림 찾기 프로그램', '2021.12', '대학교 졸업 작품으로 OpenCV와 머신러닝 비교 검출 알고리즘 적용', '', '', '', 4],
      ['career-1', 'career', '여단 통신중대 정보체계운용/정비병 복무', '2023.11 ~ 2025.05', '인트라넷 네트워크 서버 구축 지원 및 군 내부 정보체계 장애 처리/유지보수 담당', '', '', '', 1],
      ['skill-1', 'skill', '개인정보보호 및 법률 점검', '', '', '보안 & 컨설팅', '중하 (⭐⭐)', 40, 1],
      ['skill-2', 'skill', '취약점 진단 (Web/System)', '', '', '보안 & 컨설팅', '하 (⭐)', 20, 2],
      ['skill-3', 'skill', 'ISMS-P 인증 기준 분석', '', '', '보안 & 컨설팅', '하 (⭐)', 20, 3],
      ['skill-4', 'skill', 'Python', '', '', '개발 & 데이터', '상 (⭐⭐⭐⭐)', 85, 4],
      ['skill-5', 'skill', 'JAVA, C', '', '', '개발 & 데이터', '중 (⭐⭐⭐)', 60, 5],
      ['skill-6', 'skill', '클라우드 인프라 (AWS)', '', '', '개발 & 데이터', '하 (⭐)', 20, 6],
      ['skill-7', 'skill', 'HTML/CSS/JS', '', '', '개발 & 데이터', '중하 (⭐⭐)', 40, 7]
    ];
    defaultRows.forEach(function(row) { sheet.appendRow(row); });
  }
  return sheet;
}

// JSON 응답 헬퍼
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// =========================================================================
// 데이터 추출 함수군
// =========================================================================

// 1. Posts (스터디 노트 & 보안 뉴스) 데이터 추출 (초고속 단일 배치 조회)
function getPostsData(ss = null) {
  const sheet = getPostsSheet(ss);
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return [];

  const maxCol = Math.max(lastCol, 9);
  const allRows = sheet.getRange(1, 1, lastRow, maxCol).getValues();
  const headers = allRows[0];
  const hasMetaCols = (headers[5] === 'importance');
  const hasTypeCol = (headers[8] === 'type');

  const posts = [];
  for (let i = 1; i < allRows.length; i++) {
    const row = allRows[i];
    const id = String(row[0] || '').trim();
    if (!id) continue;

    const category = String(row[1] || 'General');
    const title = String(row[2] || '');
    const date = formatIsoDate(row[3]);
    const content = String(row[4] || '');

    let importance = '';
    let source = '';
    let newsLink = '';
    let type = '';
    let imageStartCol = 9;

    if (hasMetaCols) {
      importance = String(row[5] || '');
      source = String(row[6] || '');
      newsLink = String(row[7] || '');
      type = hasTypeCol ? String(row[8] || '') : (row[8] && !String(row[8]).startsWith('http') ? String(row[8]) : '');
      imageStartCol = 9;
    } else {
      const col5Val = String(row[5] || '').trim();
      if (col5Val.includes('⭐')) {
        importance = col5Val;
        source = String(row[6] || '');
        newsLink = String(row[7] || '');
        type = String(row[8] || '');
        imageStartCol = 9;
      } else {
        imageStartCol = 5;
      }
    }

    const images = [];
    for (let c = imageStartCol; c < row.length; c++) {
      if (row[c]) {
        const val = String(row[c]).trim();
        if (val.startsWith('http')) {
          images.push(val);
        }
      }
    }

    posts.push({
      id: id,
      category: category,
      title: title,
      date: date,
      content: content,
      importance: importance,
      source: source,
      newsLink: newsLink,
      type: type,
      images: images
    });
  }
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  return posts;
}

// 2. Projects (프로젝트 및 하위 세부 진단 일정) 데이터 추출
function getProjectsData(ss = null) {
  const sheet = getProjectsSheet(ss);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
  const projects = [];

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const id = String(row[0] || '').trim();
    if (!id) continue;

    const name = String(row[1] || '');
    const client = String(row[2] || '');
    const startDate = formatIsoDate(row[3]);
    const endDate = formatIsoDate(row[4]);
    const details = String(row[5] || '');
    let diagnostics = [];
    try {
      const rawDiag = String(row[6] || '').trim();
      if (rawDiag) {
        diagnostics = JSON.parse(rawDiag);
      }
    } catch (e) {
      diagnostics = [];
    }

    projects.push({
      id: id,
      name: name,
      client: client,
      startDate: startDate,
      endDate: endDate,
      details: details,
      diagnostics: Array.isArray(diagnostics) ? diagnostics : []
    });
  }

  projects.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  return projects;
}

// 3. ProjectNotes (프로젝트 내부 스터디 & 기록 게시물) 데이터 추출
function getProjectNotesData(ss = null) {
  const sheet = getProjectNotesSheet(ss);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  const notes = [];

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const id = String(row[0] || '').trim();
    if (!id) continue;

    const projectId = String(row[1] || '');
    const title = String(row[2] || '');
    const date = formatIsoDate(row[3]);
    const content = String(row[4] || '');

    notes.push({
      id: id,
      projectId: projectId,
      title: title,
      date: date,
      content: content
    });
  }

  notes.sort((a, b) => new Date(b.date) - new Date(a.date));
  return notes;
}

// 4. Profile (프로필 정보) 데이터 추출
function getProfileData(ss = null) {
  const sheet = getProfileSheet(ss);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return {
      id: 'profile-main',
      name: '안태경',
      title: '보안 컨설턴트',
      company: 'SK쉴더스 기업컨설팅 2팀',
      bio: 'SK쉴더스 기업컨설팅 2팀 보안 컨설턴트 안태경',
      email: 'pp0406hh@gmail.com',
      phone: '010-2224-1060',
      avatarUrl: './profile.jpg'
    };
  }

  const row = sheet.getRange(2, 1, 1, 8).getValues()[0];
  return {
    id: String(row[0] || 'profile-main'),
    name: String(row[1] || '안태경'),
    title: String(row[2] || '보안 컨설턴트'),
    company: String(row[3] || 'SK쉴더스 기업컨설팅 2팀'),
    bio: String(row[4] || ''),
    email: String(row[5] || 'pp0406hh@gmail.com'),
    phone: String(row[6] || '010-2224-1060'),
    avatarUrl: String(row[7] || './profile.jpg')
  };
}

// 5. Portfolio (포트폴리오 자격증, 프로젝트, 경력, 스킬) 데이터 추출
function getPortfolioData(ss = null) {
  const sheet = getPortfolioSheet(ss);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
  const items = [];

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const id = String(row[0] || '').trim();
    if (!id) continue;

    items.push({
      id: id,
      type: String(row[1] || 'cert'),
      title: String(row[2] || ''),
      date: String(row[3] || ''),
      description: String(row[4] || ''),
      category: String(row[5] || ''),
      level: String(row[6] || ''),
      percent: Number(row[7]) || 0,
      sortOrder: Number(row[8]) || (i + 1)
    });
  }

  items.sort((a, b) => a.sortOrder - b.sortOrder);
  return items;
}

// =========================================================================
// GET 요청 처리 (조회 API)
// =========================================================================
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'getPosts';
    const ss = getSpreadsheet();

    if (action === 'getProjects') {
      return createJsonResponse({ success: true, projects: getProjectsData(ss) });
    } else if (action === 'getProjectNotes') {
      return createJsonResponse({ success: true, projectNotes: getProjectNotesData(ss) });
    } else if (action === 'getProfile') {
      return createJsonResponse({ success: true, profile: getProfileData(ss) });
    } else if (action === 'getPortfolio') {
      return createJsonResponse({ success: true, portfolio: getPortfolioData(ss) });
    } else if (action === 'getAllData') {
      return createJsonResponse({
        success: true,
        posts: getPostsData(ss),
        projects: getProjectsData(ss),
        projectNotes: getProjectNotesData(ss),
        profile: getProfileData(ss),
        portfolio: getPortfolioData(ss)
      });
    } else if (action === 'deletePost') {
      const password = (e && e.parameter && e.parameter.password) || '';
      if (password !== getAdminPassword()) {
        return createJsonResponse({ success: false, error: '인증 실패: 관리자 비밀번호가 일치하지 않습니다.' });
      }
      const postId = (e && e.parameter && e.parameter.id) || '';
      if (!postId) {
        return createJsonResponse({ success: false, error: '삭제할 게시글 ID가 지정되지 않았습니다.' });
      }
      const sheet = getPostsSheet(ss);
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
        return createJsonResponse({ success: false, error: '삭제할 게시글이 존재하지 않습니다.' });
      }
      const idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      let deleteRow = -1;
      for (let r = 0; r < idValues.length; r++) {
        if (String(idValues[r][0]) === postId) {
          deleteRow = r + 2;
          break;
        }
      }
      if (deleteRow !== -1) {
        sheet.deleteRow(deleteRow);
        SpreadsheetApp.flush();
        return createJsonResponse({ success: true, message: '게시글이 삭제되었습니다.', id: postId });
      } else {
        return createJsonResponse({ success: false, error: '해당 ID의 게시글을 찾을 수 없습니다.' });
      }
    } else {
      // 기본값: getPosts
      return createJsonResponse({ success: true, posts: getPostsData(ss) });
    }
  } catch (err) {
    return createJsonResponse({
      success: false,
      error: err.toString()
    });
  }
}

// POST 요청 처리 (등록, 수정, 삭제)
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, error: '요청 본문(Payload)이 비어있습니다.' });
    }

    const payload = JSON.parse(e.postData.contents);
    const { password, action, data } = payload;

    // 관리자 비밀번호 검증
    if (password !== getAdminPassword()) {
      return createJsonResponse({ success: false, error: '인증 실패: 관리자 비밀번호가 일치하지 않습니다.' });
    }

    const sheet = getPostsSheet();
    const lastRow = sheet.getLastRow();

    if (action === 'savePost') {
      const { id, category, title, date, content, importance, source, newsLink, type, images } = data;
      if (!title) {
        return createJsonResponse({ success: false, error: '제목은 필수 입력 항목입니다.' });
      }

      const postId = id || ('post-' + Date.now());
      const postDate = date || Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Seoul', 'yyyy-MM-dd');
      const postCategory = category || 'General';
      const postContent = content || '';
      const postImportance = importance || '';
      const postSource = source || '';
      const postNewsLink = newsLink || '';
      const postType = type || '';
      const imgList = Array.isArray(images) ? images : [];

      // Ensure headers at F, G, H, I
      try {
        const headerCell = sheet.getRange(1, 6).getValue();
        if (headerCell !== 'importance') {
          sheet.getRange(1, 6, 1, 3).setValues([['importance', 'source', 'newsLink']]);
        }
        const typeHeader = sheet.getRange(1, 9).getValue();
        if (typeHeader !== 'type') {
          sheet.getRange(1, 9).setValue('type');
        }
      } catch (hErr) {}

      let foundRow = -1;
      if (lastRow > 1) {
        const idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let r = 0; r < idValues.length; r++) {
          if (String(idValues[r][0]) === postId) {
            foundRow = r + 2;
            break;
          }
        }
      }

      const rowData = [postId, postCategory, title, postDate, postContent, postImportance, postSource, postNewsLink, postType, ...imgList];

      if (foundRow !== -1) {
        // 수정 (Update)
        sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
      } else {
        // 신규 등록 (Append)
        sheet.appendRow(rowData);
      }

      return createJsonResponse({
        success: true,
        message: '게시글이 성공적으로 저장되었습니다.',
        post: {
          id: postId,
          category: postCategory,
          title: title,
          date: postDate,
          content: postContent,
          importance: postImportance,
          source: postSource,
          newsLink: postNewsLink,
          type: postType,
          images: imgList
        }
      });

    } else if (action === 'syncStudyTypes') {
      const { posts: studyTypeMap } = data;
      const curLastRow = sheet.getLastRow();
      let updatedCount = 0;
      try {
        sheet.getRange(1, 9).setValue('type');
      } catch (e) {}
      if (curLastRow > 1 && Array.isArray(studyTypeMap)) {
        const idValues = sheet.getRange(2, 1, curLastRow - 1, 1).getValues();
        studyTypeMap.forEach(item => {
          for (let r = 0; r < idValues.length; r++) {
            if (String(idValues[r][0]) === item.id) {
              sheet.getRange(r + 2, 9).setValue(item.type || '');
              updatedCount++;
              break;
            }
          }
        });
      }
      return createJsonResponse({
        success: true,
        message: updatedCount + '건의 게시글 유형(type)이 동기화되었습니다.'
      });

    } else if (action === 'deletePost') {
      const { id } = data;
      if (!id) {
        return createJsonResponse({ success: false, error: '삭제할 게시글 ID가 지정되지 않았습니다.' });
      }

      if (lastRow <= 1) {
        return createJsonResponse({ success: false, error: '삭제할 게시글이 존재하지 않습니다.' });
      }

      const idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      let deleteRow = -1;
      for (let r = 0; r < idValues.length; r++) {
        if (String(idValues[r][0]) === id) {
          deleteRow = r + 2;
          break;
        }
      }

      if (deleteRow !== -1) {
        sheet.deleteRow(deleteRow);
        SpreadsheetApp.flush();
        return createJsonResponse({ success: true, message: '게시글이 삭제되었습니다.', id: id });
      } else {
        return createJsonResponse({ success: false, error: '해당 ID의 게시글을 찾을 수 없습니다.' });
      }

    // 3. Projects (프로젝트 및 하위 세부 진단) 저장
    } else if (action === 'saveProject') {
      const sheet = getProjectsSheet();
      const lastRow = sheet.getLastRow();
      const { id, name, client, startDate, endDate, details, diagnostics } = data;
      if (!name) {
        return createJsonResponse({ success: false, error: '프로젝트 이름은 필수 입력 항목입니다.' });
      }

      const projId = id || ('project-' + Date.now());
      const projName = String(name).trim();
      const projClient = client ? String(client).trim() : '';
      const projStart = startDate || '';
      const projEnd = endDate || '';
      const projDetails = details || '';
      const diagJson = JSON.stringify(Array.isArray(diagnostics) ? diagnostics : []);

      let foundRow = -1;
      if (lastRow > 1) {
        const idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let r = 0; r < idValues.length; r++) {
          if (String(idValues[r][0]) === projId) {
            foundRow = r + 2;
            break;
          }
        }
      }

      const rowData = [projId, projName, projClient, projStart, projEnd, projDetails, diagJson];

      if (foundRow !== -1) {
        sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }

      return createJsonResponse({
        success: true,
        message: '프로젝트가 성공적으로 저장되었습니다.',
        project: {
          id: projId,
          name: projName,
          client: projClient,
          startDate: projStart,
          endDate: projEnd,
          details: projDetails,
          diagnostics: Array.isArray(diagnostics) ? diagnostics : []
        }
      });

    // 4. Projects 삭제
    } else if (action === 'deleteProject') {
      const sheet = getProjectsSheet();
      const lastRow = sheet.getLastRow();
      const { id } = data;
      if (!id) {
        return createJsonResponse({ success: false, error: '삭제할 프로젝트 ID가 지정되지 않았습니다.' });
      }

      let deleteRow = -1;
      if (lastRow > 1) {
        const idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let r = 0; r < idValues.length; r++) {
          if (String(idValues[r][0]) === id) {
            deleteRow = r + 2;
            break;
          }
        }
      }

      if (deleteRow !== -1) {
        sheet.deleteRow(deleteRow);

        // 프로젝트에 소속된 ProjectNotes도 함께 일괄 정리
        const notesSheet = getProjectNotesSheet();
        const notesLastRow = notesSheet.getLastRow();
        if (notesLastRow > 1) {
          const noteProjIds = notesSheet.getRange(2, 2, notesLastRow - 1, 1).getValues();
          for (let nr = noteProjIds.length - 1; nr >= 0; nr--) {
            if (String(noteProjIds[nr][0]) === id) {
              notesSheet.deleteRow(nr + 2);
            }
          }
        }

        return createJsonResponse({ success: true, message: '프로젝트 및 소속 기록이 삭제되었습니다.', id: id });
      } else {
        return createJsonResponse({ success: false, error: '해당 ID의 프로젝트를 찾을 수 없습니다.' });
      }

    // 5. ProjectNotes (프로젝트 기록 게시판) 저장
    } else if (action === 'saveProjectNote') {
      const sheet = getProjectNotesSheet();
      const lastRow = sheet.getLastRow();
      const { id, projectId, title, date, content } = data;
      if (!title || !projectId) {
        return createJsonResponse({ success: false, error: '제목과 소속 프로젝트 ID는 필수 입력 항목입니다.' });
      }

      const noteId = id || ('note-' + Date.now());
      const noteDate = date || Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Seoul', 'yyyy-MM-dd');
      const noteTitle = String(title).trim();
      const noteContent = content || '';

      let foundRow = -1;
      if (lastRow > 1) {
        const idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let r = 0; r < idValues.length; r++) {
          if (String(idValues[r][0]) === noteId) {
            foundRow = r + 2;
            break;
          }
        }
      }

      const rowData = [noteId, projectId, noteTitle, noteDate, noteContent];

      if (foundRow !== -1) {
        sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }

      return createJsonResponse({
        success: true,
        message: '프로젝트 기록이 성공적으로 저장되었습니다.',
        note: {
          id: noteId,
          projectId: projectId,
          title: noteTitle,
          date: noteDate,
          content: noteContent
        }
      });

    // 6. ProjectNotes 삭제
    } else if (action === 'deleteProjectNote') {
      const sheet = getProjectNotesSheet();
      const lastRow = sheet.getLastRow();
      const { id } = data;
      if (!id) {
        return createJsonResponse({ success: false, error: '삭제할 기록 ID가 지정되지 않았습니다.' });
      }

      let deleteRow = -1;
      if (lastRow > 1) {
        const idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let r = 0; r < idValues.length; r++) {
          if (String(idValues[r][0]) === id) {
            deleteRow = r + 2;
            break;
          }
        }
      }

      if (deleteRow !== -1) {
        sheet.deleteRow(deleteRow);
        return createJsonResponse({ success: true, message: '프로젝트 기록이 삭제되었습니다.', id: id });
      } else {
        return createJsonResponse({ success: false, error: '해당 ID의 프로젝트 기록을 찾을 수 없습니다.' });
      }

    // 7. Profile (프로필 정보) 저장
    } else if (action === 'saveProfile') {
      const sheet = getProfileSheet();
      const { id, name, title, company, bio, email, phone, avatarUrl } = data;
      const profId = id || 'profile-main';
      const profName = String(name || '').trim();
      const profTitle = String(title || '').trim();
      const profCompany = String(company || '').trim();
      const profBio = String(bio || '').trim();
      const profEmail = String(email || '').trim();
      const profPhone = String(phone || '').trim();
      const profAvatar = String(avatarUrl || './profile.jpg').trim();

      const rowData = [profId, profName, profTitle, profCompany, profBio, profEmail, profPhone, profAvatar];
      const lastRow = sheet.getLastRow();

      let foundRow = -1;
      if (lastRow > 1) {
        const idVals = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let r = 0; r < idVals.length; r++) {
          if (String(idVals[r][0]) === profId) {
            foundRow = r + 2;
            break;
          }
        }
      }

      if (foundRow !== -1) {
        sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }

      return createJsonResponse({
        success: true,
        message: '프로필 정보가 성공적으로 저장되었습니다.',
        profile: {
          id: profId,
          name: profName,
          title: profTitle,
          company: profCompany,
          bio: profBio,
          email: profEmail,
          phone: profPhone,
          avatarUrl: profAvatar
        }
      });

    // 8. Portfolio (포트폴리오 자격증, 프로젝트, 경력, 스킬) 일괄 저장
    } else if (action === 'savePortfolio') {
      const sheet = getPortfolioSheet();
      const { items } = data;
      if (!Array.isArray(items)) {
        return createJsonResponse({ success: false, error: '포트폴리오 items 배열이 유효하지 않습니다.' });
      }

      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }

      const rows = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const itemId = it.id || ('item-' + Date.now() + '-' + i);
        const itemType = String(it.type || 'cert').trim();
        const itemTitle = String(it.title || '').trim();
        const itemDate = String(it.date || '').trim();
        const itemDesc = String(it.description || '').trim();
        const itemCat = String(it.category || '').trim();
        const itemLevel = String(it.level || '').trim();
        const itemPercent = Number(it.percent) || 0;
        const itemOrder = Number(it.sortOrder) || (i + 1);

        rows.push([itemId, itemType, itemTitle, itemDate, itemDesc, itemCat, itemLevel, itemPercent, itemOrder]);
      }

      if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, 9).setValues(rows);
      }

      return createJsonResponse({
        success: true,
        message: '포트폴리오 항목이 성공적으로 저장되었습니다.',
        count: rows.length
      });

    } else if (action === 'verifyPassword') {
      // 비밀번호 검증 전용 액션
      return createJsonResponse({ success: true, message: '인증되었습니다.' });
    }

    return createJsonResponse({ success: false, error: '알 수 없는 액션입니다: ' + action });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}
