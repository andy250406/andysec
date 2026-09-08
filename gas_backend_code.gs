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

const SHEET_NAME = 'Posts';

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getPostsSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['id', 'category', 'title', 'date', 'content', 'image_1', 'image_2', 'image_3']);
  }
  return sheet;
}

// JSON 응답 헬퍼
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// GET 요청 처리 (데이터 조회)
function doGet(e) {
  try {
    const sheet = getPostsSheet();
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    if (lastRow <= 1) {
      return createJsonResponse({ success: true, posts: [] });
    }

    // 2행부터 전체 데이터 읽기
    const range = sheet.getRange(2, 1, lastRow - 1, Math.max(lastCol, 5));
    const values = range.getValues();
    
    // 셀 내 이미지 객체 처리 (시트 셀 내 이미지 추출 지원)
    let cellImages = [];
    try {
      cellImages = range.getCellImages();
    } catch (err) {
      // getCellImages 미지원 환경 대비 fallback
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

      // F열(인덱스 5) 이후의 이미지들 수집
      const images = [];
      const colLimit = Math.max(row.length, (cellImages[i] ? cellImages[i].length : 0));
      for (let c = 5; c < colLimit; c++) {
        let imgUrl = '';
        // 1. 셀 내 이미지 객체가 있는 경우 getContentUrl() 추출
        if (cellImages[i] && cellImages[i][c]) {
          try {
            imgUrl = cellImages[i][c].getContentUrl() || '';
          } catch (e) {
            imgUrl = '';
          }
        }
        // 2. 텍스트 URL로 기입된 경우
        if (!imgUrl && row[c]) {
          const val = String(row[c]).trim();
          if (val.startsWith('http')) {
            imgUrl = val;
          }
        }

        if (imgUrl) {
          images.push(imgUrl);
        }
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

    // 날짜 기준 내림차순 정렬
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    return createJsonResponse({
      success: true,
      posts: posts
    });
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
    } else if (action === 'verifyPassword') {
      // 비밀번호 검증 전용 액션
      return createJsonResponse({ success: true, message: '인증되었습니다.' });
    }

    return createJsonResponse({ success: false, error: '알 수 없는 액션입니다: ' + action });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}
