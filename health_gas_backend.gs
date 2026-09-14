/**
 * AndySec Health & Fitness Google Apps Script (GAS) Backend API
 * 
 * 스프레드시트 5대 시트 구조:
 * 1. DB: id, category(Diet/Workout), date, time, title, subType, calories, carbs, protein, fat, imageUrl, content, created_at
 * 2. Body: id, date, weight, muscleMass, bodyFatPercent, bmi, bmr, notes, created_at
 * 3. Activity: date, steps, distanceKm, activeCalories, activeMinutes, totalCalories, updated_at (삼성헬스 연동)
 * 4. sleep: date, startTime, endTime, durationMinutes, deepSleepMinutes, sleepScore, updated_at (삼성헬스 연동)
 * 5. vitals: date, time, heartRate, bloodPressureSys, bloodPressureDia, oxygenPercent, updated_at (삼성헬스 연동)
 * 6. Meta: key, value (last_modified 타임스탬프)
 */

const SPREADSHEET_ID = '1ELq_V5xmMfCtvgEnRQPA4I6EPHZ6UBtJFkjjOdsY0YQ';

function getAdminPassword() {
  const prop = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  return prop || 'pp0406hh';
}

function getSpreadsheet() {
  try {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (e) {
    return SpreadsheetApp.getActiveSpreadsheet();
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

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

function initHealthSheetsIfNeeded(ss = null) {
  const spreadsheet = ss || getSpreadsheet();

  // 1. DB (게시판 형태 - 식단/운동)
  let dbSheet = spreadsheet.getSheetByName('DB');
  if (!dbSheet) {
    dbSheet = spreadsheet.insertSheet('DB');
    dbSheet.appendRow(['id', 'category', 'date', 'time', 'title', 'subType', 'calories', 'carbs', 'protein', 'fat', 'imageUrl', 'content', 'created_at']);
  } else if (dbSheet.getLastRow() === 0) {
    dbSheet.appendRow(['id', 'category', 'date', 'time', 'title', 'subType', 'calories', 'carbs', 'protein', 'fat', 'imageUrl', 'content', 'created_at']);
  }

  // 2. Body (신체 데이터)
  let bodySheet = spreadsheet.getSheetByName('Body');
  if (!bodySheet) {
    bodySheet = spreadsheet.insertSheet('Body');
    bodySheet.appendRow(['id', 'date', 'weight', 'muscleMass', 'bodyFatPercent', 'bmi', 'bmr', 'notes', 'created_at']);
  } else if (bodySheet.getLastRow() === 0) {
    bodySheet.appendRow(['id', 'date', 'weight', 'muscleMass', 'bodyFatPercent', 'bmi', 'bmr', 'notes', 'created_at']);
  }

  // 3. Activity (삼성헬스 활동)
  let actSheet = spreadsheet.getSheetByName('Activity');
  if (!actSheet) {
    actSheet = spreadsheet.insertSheet('Activity');
    actSheet.appendRow(['date', 'steps', 'distanceKm', 'activeCalories', 'activeMinutes', 'totalCalories', 'updated_at']);
  } else if (actSheet.getLastRow() === 0) {
    actSheet.appendRow(['date', 'steps', 'distanceKm', 'activeCalories', 'activeMinutes', 'totalCalories', 'updated_at']);
  }

  // 4. sleep (삼성헬스 수면)
  let sleepSheet = spreadsheet.getSheetByName('sleep');
  if (!sleepSheet) {
    sleepSheet = spreadsheet.insertSheet('sleep');
    sleepSheet.appendRow(['date', 'startTime', 'endTime', 'durationMinutes', 'deepSleepMinutes', 'sleepScore', 'updated_at']);
  } else if (sleepSheet.getLastRow() === 0) {
    sleepSheet.appendRow(['date', 'startTime', 'endTime', 'durationMinutes', 'deepSleepMinutes', 'sleepScore', 'updated_at']);
  }

  // 5. vitals (삼성헬스 바이탈)
  let vitalsSheet = spreadsheet.getSheetByName('vitals');
  if (!vitalsSheet) {
    vitalsSheet = spreadsheet.insertSheet('vitals');
    vitalsSheet.appendRow(['date', 'time', 'heartRate', 'bloodPressureSys', 'bloodPressureDia', 'oxygenPercent', 'updated_at']);
  } else if (vitalsSheet.getLastRow() === 0) {
    vitalsSheet.appendRow(['date', 'time', 'heartRate', 'bloodPressureSys', 'bloodPressureDia', 'oxygenPercent', 'updated_at']);
  }

  // 6. Meta
  let metaSheet = spreadsheet.getSheetByName('Meta');
  if (!metaSheet) {
    metaSheet = spreadsheet.insertSheet('Meta');
    metaSheet.appendRow(['key', 'value']);
    metaSheet.appendRow(['last_modified', new Date().toISOString()]);
  }
}

function updateLastModified(ss = null) {
  const spreadsheet = ss || getSpreadsheet();
  let metaSheet = spreadsheet.getSheetByName('Meta');
  if (!metaSheet) {
    metaSheet = spreadsheet.insertSheet('Meta');
    metaSheet.appendRow(['key', 'value']);
  }
  const nowStr = new Date().toISOString();
  const lastRow = metaSheet.getLastRow();
  let found = false;
  if (lastRow > 1) {
    const keys = metaSheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < keys.length; i++) {
      if (String(keys[i][0]).trim() === 'last_modified') {
        metaSheet.getRange(i + 2, 2).setValue(nowStr);
        found = true;
        break;
      }
    }
  }
  if (!found) {
    metaSheet.appendRow(['last_modified', nowStr]);
  }
  return nowStr;
}

function getLastModified(ss = null) {
  const spreadsheet = ss || getSpreadsheet();
  const metaSheet = spreadsheet.getSheetByName('Meta');
  if (!metaSheet) return new Date().toISOString();
  const lastRow = metaSheet.getLastRow();
  if (lastRow <= 1) return new Date().toISOString();
  const values = metaSheet.getRange(2, 1, lastRow - 1, 2).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === 'last_modified') {
      return String(values[i][1]);
    }
  }
  return new Date().toISOString();
}

function getAllHealthData(ss = null) {
  const spreadsheet = ss || getSpreadsheet();
  initHealthSheetsIfNeeded(spreadsheet);

  // 1. DB
  const dbSheet = spreadsheet.getSheetByName('DB');
  const dbLastRow = dbSheet.getLastRow();
  const dbList = [];
  if (dbLastRow > 1) {
    const rows = dbSheet.getRange(2, 1, dbLastRow - 1, 13).getValues();
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      if (!row[0]) continue;
      dbList.push({
        id: String(row[0]),
        category: String(row[1] || 'Diet'),
        date: formatIsoDate(row[2]),
        time: String(row[3] || ''),
        title: String(row[4] || ''),
        subType: String(row[5] || ''),
        calories: Number(row[6]) || 0,
        carbs: Number(row[7]) || 0,
        protein: Number(row[8]) || 0,
        fat: Number(row[9]) || 0,
        imageUrl: String(row[10] || ''),
        content: String(row[11] || ''),
        created_at: String(row[12] || '')
      });
    }
  }

  // 2. Body
  const bodySheet = spreadsheet.getSheetByName('Body');
  const bodyLastRow = bodySheet.getLastRow();
  const bodyList = [];
  if (bodyLastRow > 1) {
    const rows = bodySheet.getRange(2, 1, bodyLastRow - 1, 9).getValues();
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      if (!row[0]) continue;
      bodyList.push({
        id: String(row[0]),
        date: formatIsoDate(row[1]),
        weight: Number(row[2]) || 0,
        muscleMass: Number(row[3]) || 0,
        bodyFatPercent: Number(row[4]) || 0,
        bmi: Number(row[5]) || 0,
        bmr: Number(row[6]) || 0,
        notes: String(row[7] || ''),
        created_at: String(row[8] || '')
      });
    }
  }

  // 3. Activity (Samsung Health)
  const actSheet = spreadsheet.getSheetByName('Activity');
  const actLastRow = actSheet ? actSheet.getLastRow() : 0;
  const actList = [];
  if (actLastRow > 1) {
    const rows = actSheet.getRange(2, 1, actLastRow - 1, 7).getValues();
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      if (!row[0]) continue;
      actList.push({
        date: formatIsoDate(row[0]),
        steps: Number(row[1]) || 0,
        distanceKm: Number(row[2]) || 0,
        activeCalories: Number(row[3]) || 0,
        activeMinutes: Number(row[4]) || 0,
        totalCalories: Number(row[5]) || 0,
        updated_at: String(row[6] || '')
      });
    }
  }

  // 4. sleep (Samsung Health)
  const sleepSheet = spreadsheet.getSheetByName('sleep');
  const sleepLastRow = sleepSheet ? sleepSheet.getLastRow() : 0;
  const sleepList = [];
  if (sleepLastRow > 1) {
    const rows = sleepSheet.getRange(2, 1, sleepLastRow - 1, 7).getValues();
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      if (!row[0]) continue;
      sleepList.push({
        date: formatIsoDate(row[0]),
        startTime: String(row[1] || ''),
        endTime: String(row[2] || ''),
        durationMinutes: Number(row[3]) || 0,
        deepSleepMinutes: Number(row[4]) || 0,
        sleepScore: Number(row[5]) || 0,
        updated_at: String(row[6] || '')
      });
    }
  }

  // 5. vitals (Samsung Health)
  const vitalsSheet = spreadsheet.getSheetByName('vitals');
  const vitalsLastRow = vitalsSheet ? vitalsSheet.getLastRow() : 0;
  const vitalsList = [];
  if (vitalsLastRow > 1) {
    const rows = vitalsSheet.getRange(2, 1, vitalsLastRow - 1, 7).getValues();
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      if (!row[0]) continue;
      vitalsList.push({
        date: formatIsoDate(row[0]),
        time: String(row[1] || ''),
        heartRate: Number(row[2]) || 0,
        bloodPressureSys: Number(row[3]) || 0,
        bloodPressureDia: Number(row[4]) || 0,
        oxygenPercent: Number(row[5]) || 0,
        updated_at: String(row[6] || '')
      });
    }
  }

  return {
    success: true,
    db: dbList,
    body: bodyList,
    activity: actList,
    sleep: sleepList,
    vitals: vitalsList,
    last_modified: getLastModified(spreadsheet)
  };
}

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'getHealthData';

    if (action === 'getHealthData') {
      return createJsonResponse(getAllHealthData());
    } else if (action === 'getHealthMeta') {
      return createJsonResponse({
        success: true,
        last_modified: getLastModified()
      });
    } else if (action === 'setup') {
      initHealthSheetsIfNeeded();
      return createJsonResponse({
        success: true,
        message: '5개 시트가 정상적으로 초기화되었습니다.'
      });
    } else if (action === 'ping') {
      return createJsonResponse({
        success: true,
        message: 'pong',
        timestamp: new Date().toISOString()
      });
    }

    return createJsonResponse({ success: false, error: 'Unknown GET action: ' + action });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

function doPost(e) {
  try {
    let payload = {};
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action;
    const password = payload.password;
    const data = payload.data || payload;

    // Admin Auth
    const adminPass = getAdminPassword();
    if (!password || password !== adminPass) {
      return createJsonResponse({ success: false, error: '관리자 인증 비밀번호가 일치하지 않습니다.' });
    }

    const ss = getSpreadsheet();
    initHealthSheetsIfNeeded(ss);

    // 1. DB (식단 및 운동 게시글 CRUD)
    if (action === 'savePost') {
      const sheet = ss.getSheetByName('DB');
      const lastRow = sheet.getLastRow();
      const id = data.id || ('post-' + Date.now());
      const category = data.category || 'Diet'; // 'Diet' or 'Workout'
      const date = data.date || formatIsoDate(new Date());
      const time = data.time || '';
      const title = data.title || '';
      const subType = data.subType || ''; // '아침'/'점심'/'저녁'/'간식' or '웨이트'/'유산소'
      const calories = Number(data.calories) || 0;
      const carbs = Number(data.carbs) || 0;
      const protein = Number(data.protein) || 0;
      const fat = Number(data.fat) || 0;
      const imageUrl = data.imageUrl || '';
      const content = typeof data.content === 'object' ? JSON.stringify(data.content) : (data.content || '');
      const createdAt = data.created_at || new Date().toISOString();

      let targetRow = -1;
      if (lastRow > 1) {
        const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let i = 0; i < ids.length; i++) {
          if (String(ids[i][0]) === id) {
            targetRow = i + 2;
            break;
          }
        }
      }

      const rowValues = [id, category, date, time, title, subType, calories, carbs, protein, fat, imageUrl, content, createdAt];
      if (targetRow !== -1) {
        sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
      } else {
        sheet.appendRow(rowValues);
      }
      SpreadsheetApp.flush();
      const lm = updateLastModified(ss);
      return createJsonResponse({ success: true, message: '게시글이 저장되었습니다.', id, last_modified: lm });

    } else if (action === 'deletePost') {
      const sheet = ss.getSheetByName('DB');
      const lastRow = sheet.getLastRow();
      const id = data.id;
      if (!id) return createJsonResponse({ success: false, error: '삭제할 ID가 누락되었습니다.' });

      let deleteRow = -1;
      if (lastRow > 1) {
        const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let i = 0; i < ids.length; i++) {
          if (String(ids[i][0]) === id) {
            deleteRow = i + 2;
            break;
          }
        }
      }
      if (deleteRow !== -1) {
        sheet.deleteRow(deleteRow);
        SpreadsheetApp.flush();
        const lm = updateLastModified(ss);
        return createJsonResponse({ success: true, message: '게시글이 삭제되었습니다.', id, last_modified: lm });
      }
      return createJsonResponse({ success: false, error: '해당 ID의 게시글을 찾을 수 없습니다.' });

    // 2. BODY (신체 인바디 데이터 CRUD)
    } else if (action === 'saveBody') {
      const sheet = ss.getSheetByName('Body');
      const lastRow = sheet.getLastRow();
      const date = data.date || formatIsoDate(new Date());
      const id = data.id || ('body-' + date);
      const weight = Number(data.weight) || 0;
      const muscleMass = Number(data.muscleMass) || 0;
      const bodyFatPercent = Number(data.bodyFatPercent) || 0;
      const bmi = Number(data.bmi) || 0;
      const bmr = Number(data.bmr) || 0;
      const notes = data.notes || '';
      const createdAt = data.created_at || new Date().toISOString();

      let targetRow = -1;
      if (lastRow > 1) {
        const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let i = 0; i < ids.length; i++) {
          if (String(ids[i][0]) === id || String(ids[i][0]) === ('body-' + date)) {
            targetRow = i + 2;
            break;
          }
        }
      }

      const rowValues = [id, date, weight, muscleMass, bodyFatPercent, bmi, bmr, notes, createdAt];
      if (targetRow !== -1) {
        sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
      } else {
        sheet.appendRow(rowValues);
      }
      SpreadsheetApp.flush();
      const lm = updateLastModified(ss);
      return createJsonResponse({ success: true, message: '신체 데이터가 저장되었습니다.', id, last_modified: lm });

    } else if (action === 'deleteBody') {
      const sheet = ss.getSheetByName('Body');
      const lastRow = sheet.getLastRow();
      const id = data.id;
      if (!id) return createJsonResponse({ success: false, error: '삭제할 ID가 누락되었습니다.' });

      let deleteRow = -1;
      if (lastRow > 1) {
        const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let i = 0; i < ids.length; i++) {
          if (String(ids[i][0]) === id) {
            deleteRow = i + 2;
            break;
          }
        }
      }
      if (deleteRow !== -1) {
        sheet.deleteRow(deleteRow);
        SpreadsheetApp.flush();
        const lm = updateLastModified(ss);
        return createJsonResponse({ success: true, message: '신체 데이터가 삭제되었습니다.', id, last_modified: lm });
      }
      return createJsonResponse({ success: false, error: '해당 ID의 데이터를 찾을 수 없습니다.' });
    }

    return createJsonResponse({ success: false, error: '알 수 없는 action: ' + action });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}
