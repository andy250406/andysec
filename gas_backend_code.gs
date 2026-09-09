/**
 * AndySec 블로그 Google Apps Script (GAS) 백엔드 API
 * 
 * 구글 시트 구조 (시트명: 'Posts')
 * 1행(헤더): id | category | title | date | content | image_1 | image_2 | image_3 ...
 * A열: id (예: study-1783753819893, news-36c25a92-...)
 * B열: category (예: CertAnalysis, News, Project)
 * C열: title
 * D열: date (YYYY-MM-DD)
 * E열: content (마크다운 전체 텍스트, 이미지 위치는 {{img_1}}, {{img_2}} 등)
 * F열 이후: 셀 내 삽입된 이미지 또는 이미지 URL 링크
 */

// 관리자 인증 비밀번호 (기본값 설정 또는 스크립트 속성 ADMIN_PASSWORD 사용)
function getAdminPassword() {
  const prop = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  return prop || 'pp0406hh';
}

const POSTS_SHEET_NAME = 'Posts';
const PROJECTS_SHEET_NAME = 'Projects';
const PROJECT_NOTES_SHEET_NAME = 'ProjectNotes';

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getPostsSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(POSTS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(POSTS_SHEET_NAME);
    sheet.appendRow(['id', 'category', 'title', 'date', 'content', 'image_1', 'image_2', 'image_3']);
  }
  return sheet;
}

function getProjectsSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(PROJECTS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(PROJECTS_SHEET_NAME);
    sheet.appendRow(['id', 'name', 'client', 'startDate', 'endDate', 'details', 'diagnostics']);
  }
  return sheet;
}

function getProjectNotesSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(PROJECT_NOTES_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(PROJECT_NOTES_SHEET_NAME);
    sheet.appendRow(['id', 'projectId', 'title', 'date', 'content']);
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

// 1. Posts (스터디 노트 & 보안 뉴스) 데이터 추출
function getPostsData() {
  const sheet = getPostsSheet();
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return [];

  const range = sheet.getRange(2, 1, lastRow - 1, Math.max(lastCol, 5));
  const values = range.getValues();

  let cellImages = [];
  try {
    cellImages = range.getCellImages();
  } catch (err) {
    cellImages = [];
  }

  const posts = [];
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const id = String(row[0] || '').trim();
    if (!id) continue;

    const category = String(row[1] || 'General');
    const title = String(row[2] || '');
    const dateVal = row[3];
    let date = '';
    if (dateVal instanceof Date) {
      date = Utilities.formatDate(dateVal, Session.getScriptTimeZone() || 'Asia/Seoul', 'yyyy-MM-dd');
    } else {
      date = String(dateVal || '');
    }
    const content = String(row[4] || '');

    const images = [];
    const colLimit = Math.max(row.length, (cellImages[i] ? cellImages[i].length : 0));
    for (let c = 5; c < colLimit; c++) {
      let imgUrl = '';
      if (cellImages[i] && cellImages[i][c]) {
        try {
          imgUrl = cellImages[i][c].getContentUrl() || '';
        } catch (e) {
          imgUrl = '';
        }
      }
      if (!imgUrl && row[c]) {
        const val = String(row[c]).trim();
        if (val.startsWith('http')) {
          imgUrl = val;
        }
      }
      if (imgUrl) images.push(imgUrl);
    }

    posts.push({
      id: id,
      category: category,
      title: title,
      date: date,
      content: content,
      images: images
    });
  }
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  return posts;
}

// 2. Projects (프로젝트 및 하위 세부 진단 일정) 데이터 추출
function getProjectsData() {
  const sheet = getProjectsSheet();
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
    
    let startDate = row[3];
    if (startDate instanceof Date) {
      startDate = Utilities.formatDate(startDate, Session.getScriptTimeZone() || 'Asia/Seoul', 'yyyy-MM-dd');
    } else {
      startDate = String(startDate || '');
    }

    let endDate = row[4];
    if (endDate instanceof Date) {
      endDate = Utilities.formatDate(endDate, Session.getScriptTimeZone() || 'Asia/Seoul', 'yyyy-MM-dd');
    } else {
      endDate = String(endDate || '');
    }

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
function getProjectNotesData() {
  const sheet = getProjectNotesSheet();
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
    
    let date = row[3];
    if (date instanceof Date) {
      date = Utilities.formatDate(date, Session.getScriptTimeZone() || 'Asia/Seoul', 'yyyy-MM-dd');
    } else {
      date = String(date || '');
    }

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

// =========================================================================
// GET 요청 처리 (조회 API)
// =========================================================================
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'getPosts';

    if (action === 'getProjects') {
      return createJsonResponse({ success: true, projects: getProjectsData() });
    } else if (action === 'getProjectNotes') {
      return createJsonResponse({ success: true, projectNotes: getProjectNotesData() });
    } else if (action === 'getAllData') {
      return createJsonResponse({
        success: true,
        posts: getPostsData(),
        projects: getProjectsData(),
        projectNotes: getProjectNotesData()
      });
    } else {
      // 기본값: getPosts
      return createJsonResponse({ success: true, posts: getPostsData() });
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
      const { id, category, title, date, content, images } = data;
      if (!title) {
        return createJsonResponse({ success: false, error: '제목은 필수 입력 항목입니다.' });
      }

      const postId = id || ('post-' + Date.now());
      const postDate = date || Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Seoul', 'yyyy-MM-dd');
      const postCategory = category || 'General';
      const postContent = content || '';
      const imgList = Array.isArray(images) ? images : [];

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

      const rowData = [postId, postCategory, title, postDate, postContent, ...imgList];

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
          images: imgList
        }
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

    } else if (action === 'verifyPassword') {
      // 비밀번호 검증 전용 액션
      return createJsonResponse({ success: true, message: '인증되었습니다.' });
    }

    return createJsonResponse({ success: false, error: '알 수 없는 액션입니다: ' + action });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}
