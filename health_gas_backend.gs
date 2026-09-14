/**
 * AndySec Health & Fitness Google Apps Script (GAS) Backend API
 * 
 * 구글 스프레드시트 5대 시트 구조 (Samsung Health & AndySec Health):
 * 1. DB: id, category(Diet/Workout), date, time, title, subType, calories, carbs, protein, fat, imageUrl, content, created_at
 * 2. Body: id, date, weight, muscleMass, bodyFatPercent, bmi, bmr, notes, created_at
 * 3. Activity: Samsung Health 실제 연동 (Date, Steps, Distance (m), Total Calories (kcal), Active Calories (kcal), Duration (min) 등)
 * 4. Sleep: Samsung Health 실제 연동 (Date, Start Time, End Time, Light/Deep/REM Sleep (min), Awake (min) 등)
 * 5. Vitals: Samsung Health 실제 연동 (Date, Heart rate avg (bpm), Oxygen saturation avg (%), Resting heart rate avg (bpm) 등)
 * 6. Meta: key, value (last_modified 동기화 타임스탬프)
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

function getSheetCaseInsensitive(spreadsheet, name) {
  if (!spreadsheet) spreadsheet = getSpreadsheet();
  const sheets = spreadsheet.getSheets();
  const targetLower = String(name).trim().toLowerCase();
  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].getName().trim().toLowerCase() === targetLower) {
      return sheets[i];
    }
  }
  return null;
}

function buildHeaderMap(headers) {
  const map = {};
  if (!headers || !Array.isArray(headers)) return map;
  for (let i = 0; i < headers.length; i++) {
    const cleanHeader = String(headers[i] || '').trim().toLowerCase();
    if (cleanHeader) {
      map[cleanHeader] = i;
    }
  }
  return map;
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
  const str = String(d).trim();
  if (str.includes('T')) return str.split('T')[0];
  if (str.includes(' ')) return str.split(' ')[0];
  return str;
}

function initHealthSheetsIfNeeded(ss = null) {
  const spreadsheet = ss || getSpreadsheet();

  // 1. DB (게시판 형태 - 식단/운동)
  let dbSheet = getSheetCaseInsensitive(spreadsheet, 'DB');
  if (!dbSheet) {
    dbSheet = spreadsheet.insertSheet('DB');
    dbSheet.appendRow(['id', 'category', 'date', 'time', 'title', 'subType', 'calories', 'carbs', 'protein', 'fat', 'imageUrl', 'content', 'created_at']);
  } else if (dbSheet.getLastRow() === 0) {
    dbSheet.appendRow(['id', 'category', 'date', 'time', 'title', 'subType', 'calories', 'carbs', 'protein', 'fat', 'imageUrl', 'content', 'created_at']);
  }

  // 2. Body (신체 데이터 - 인바디)
  let bodySheet = getSheetCaseInsensitive(spreadsheet, 'Body');
  if (!bodySheet) {
    bodySheet = spreadsheet.insertSheet('Body');
    bodySheet.appendRow(['id', 'date', 'weight', 'muscleMass', 'bodyFatPercent', 'bmi', 'bmr', 'notes', 'created_at']);
  } else if (bodySheet.getLastRow() === 0) {
    bodySheet.appendRow(['id', 'date', 'weight', 'muscleMass', 'bodyFatPercent', 'bmi', 'bmr', 'notes', 'created_at']);
  }

  // 3. Activity (삼성헬스 연동 - 없으면 기본 헤더로 생성)
  let actSheet = getSheetCaseInsensitive(spreadsheet, 'Activity');
  if (!actSheet) {
    actSheet = spreadsheet.insertSheet('Activity');
    actSheet.appendRow(['Date', 'Source(s)', 'Timezone', 'Steps', 'Distance (m)', 'Total Calories (kcal)', 'Active Calories (kcal)', 'Duration (min)']);
  }

  // 4. Sleep (삼성헬스 연동 - 없으면 기본 헤더로 생성)
  let sleepSheet = getSheetCaseInsensitive(spreadsheet, 'Sleep');
  if (!sleepSheet) {
    sleepSheet = spreadsheet.insertSheet('Sleep');
    sleepSheet.appendRow(['Date', 'Source(s)', 'Timezone', 'Start Time', 'End Time', 'Light Sleep (min)', 'Deep Sleep (min)', 'REM Sleep (min)', 'Awake (min)']);
  }

  // 5. Vitals (삼성헬스 연동 - 없으면 기본 헤더로 생성)
  let vitalsSheet = getSheetCaseInsensitive(spreadsheet, 'Vitals');
  if (!vitalsSheet) {
    vitalsSheet = spreadsheet.insertSheet('Vitals');
    vitalsSheet.appendRow(['Date', 'Source(s)', 'Timezone', 'Heart rate min (bpm)', 'Heart rate max (bpm)', 'Heart rate avg (bpm)', 'Oxygen saturation avg (%)', 'Resting heart rate avg (bpm)', 'Blood pressure (mmHg)']);
  }

  // 6. Meta
  let metaSheet = getSheetCaseInsensitive(spreadsheet, 'Meta');
  if (!metaSheet) {
    metaSheet = spreadsheet.insertSheet('Meta');
    metaSheet.appendRow(['key', 'value']);
    metaSheet.appendRow(['last_modified', new Date().toISOString()]);
  }
}

function updateLastModified(ss = null) {
  const spreadsheet = ss || getSpreadsheet();
  let metaSheet = getSheetCaseInsensitive(spreadsheet, 'Meta');
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
  const metaSheet = getSheetCaseInsensitive(spreadsheet, 'Meta');
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

  // 1. DB (식단 / 운동 게시판)
  const dbSheet = getSheetCaseInsensitive(spreadsheet, 'DB');
  const dbLastRow = dbSheet ? dbSheet.getLastRow() : 0;
  const dbList = [];
  if (dbLastRow > 1) {
    const headers = dbSheet.getRange(1, 1, 1, dbSheet.getLastColumn()).getValues()[0];
    const hMap = buildHeaderMap(headers);
    const rows = dbSheet.getRange(2, 1, dbLastRow - 1, dbSheet.getLastColumn()).getValues();

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const id = row[hMap['id'] !== undefined ? hMap['id'] : 0];
      if (!id) continue;

      dbList.push({
        id: String(id),
        category: String(row[hMap['category']] || 'Diet'),
        date: formatIsoDate(row[hMap['date']]),
        time: String(row[hMap['time']] || ''),
        title: String(row[hMap['title']] || ''),
        subType: String(row[hMap['subtype']] || ''),
        calories: Number(row[hMap['calories']]) || 0,
        carbs: Number(row[hMap['carbs']]) || 0,
        protein: Number(row[hMap['protein']]) || 0,
        fat: Number(row[hMap['fat']]) || 0,
        imageUrl: String(row[hMap['imageurl']] || ''),
        content: String(row[hMap['content']] || ''),
        created_at: String(row[hMap['created_at']] || '')
      });
    }
  }

  // 2. Body (신체 데이터 - 인바디)
  const bodySheet = getSheetCaseInsensitive(spreadsheet, 'Body');
  const bodyLastRow = bodySheet ? bodySheet.getLastRow() : 0;
  const bodyList = [];
  if (bodyLastRow > 1) {
    const headers = bodySheet.getRange(1, 1, 1, bodySheet.getLastColumn()).getValues()[0];
    const hMap = buildHeaderMap(headers);
    const rows = bodySheet.getRange(2, 1, bodyLastRow - 1, bodySheet.getLastColumn()).getValues();

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const id = row[hMap['id'] !== undefined ? hMap['id'] : 0];
      if (!id) continue;

      bodyList.push({
        id: String(id),
        date: formatIsoDate(row[hMap['date']]),
        weight: Number(row[hMap['weight']]) || 0,
        muscleMass: Number(row[hMap['musclemass']]) || 0,
        bodyFatPercent: Number(row[hMap['bodyfatpercent']]) || 0,
        bmi: Number(row[hMap['bmi']]) || 0,
        bmr: Number(row[hMap['bmr']]) || 0,
        notes: String(row[hMap['notes']] || ''),
        created_at: String(row[hMap['created_at']] || '')
      });
    }
  }

  // 3. Activity (삼성헬스 활동량 - 동적 헤더 매핑)
  const actSheet = getSheetCaseInsensitive(spreadsheet, 'Activity');
  const actLastRow = actSheet ? actSheet.getLastRow() : 0;
  const actList = [];
  if (actLastRow > 1) {
    const headers = actSheet.getRange(1, 1, 1, actSheet.getLastColumn()).getValues()[0];
    const hMap = buildHeaderMap(headers);
    const rows = actSheet.getRange(2, 1, actLastRow - 1, actSheet.getLastColumn()).getValues();

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const rawDate = row[hMap['date'] !== undefined ? hMap['date'] : 0];
      if (!rawDate) continue;

      // Distance (m) -> km
      let distanceKm = 0;
      if (hMap['distance (m)'] !== undefined && row[hMap['distance (m)']]) {
        distanceKm = Number((Number(row[hMap['distance (m)']]) / 1000).toFixed(2));
      } else if (hMap['distancekm'] !== undefined && row[hMap['distancekm']]) {
        distanceKm = Number(row[hMap['distancekm']]) || 0;
      }

      // Active Calories
      let activeCal = 0;
      if (hMap['active calories (kcal)'] !== undefined && row[hMap['active calories (kcal)']]) {
        activeCal = Number(row[hMap['active calories (kcal)']]) || 0;
      } else if (hMap['exercise calories (kcal)'] !== undefined && row[hMap['exercise calories (kcal)']]) {
        activeCal = Number(row[hMap['exercise calories (kcal)']]) || 0;
      } else if (hMap['activecalories'] !== undefined && row[hMap['activecalories']]) {
        activeCal = Number(row[hMap['activecalories']]) || 0;
      }

      // Total Calories
      let totalCal = 0;
      if (hMap['total calories (kcal)'] !== undefined && row[hMap['total calories (kcal)']]) {
        totalCal = Number(row[hMap['total calories (kcal)']]) || 0;
      } else if (hMap['totalcalories'] !== undefined && row[hMap['totalcalories']]) {
        totalCal = Number(row[hMap['totalcalories']]) || 0;
      }

      // Steps
      const steps = hMap['steps'] !== undefined ? (Number(row[hMap['steps']]) || 0) : 0;

      // Duration (min)
      let durationMin = 0;
      if (hMap['duration (min)'] !== undefined && row[hMap['duration (min)']]) {
        durationMin = Number(row[hMap['duration (min)']]) || 0;
      } else if (hMap['activeminutes'] !== undefined && row[hMap['activeminutes']]) {
        durationMin = Number(row[hMap['activeminutes']]) || 0;
      }

      actList.push({
        date: formatIsoDate(rawDate),
        steps: steps,
        distanceKm: distanceKm,
        activeCalories: activeCal,
        activeMinutes: durationMin,
        totalCalories: totalCal,
        source: hMap['source(s)'] !== undefined ? String(row[hMap['source(s)']] || '') : '',
        exerciseName: hMap['exercise name'] !== undefined ? String(row[hMap['exercise name']] || '') : ''
      });
    }
  }

  // 4. Sleep (삼성헬스 수면 데이터 - 동적 헤더 매핑)
  const sleepSheet = getSheetCaseInsensitive(spreadsheet, 'Sleep');
  const sleepLastRow = sleepSheet ? sleepSheet.getLastRow() : 0;
  const sleepList = [];
  if (sleepLastRow > 1) {
    const headers = sleepSheet.getRange(1, 1, 1, sleepSheet.getLastColumn()).getValues()[0];
    const hMap = buildHeaderMap(headers);
    const rows = sleepSheet.getRange(2, 1, sleepLastRow - 1, sleepSheet.getLastColumn()).getValues();

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const rawDate = row[hMap['date'] !== undefined ? hMap['date'] : 0];
      if (!rawDate) continue;

      const lightSleep = hMap['light sleep (min)'] !== undefined ? (Number(row[hMap['light sleep (min)']]) || 0) : 0;
      const deepSleep = hMap['deep sleep (min)'] !== undefined ? (Number(row[hMap['deep sleep (min)']]) || 0) : 0;
      const remSleep = hMap['rem sleep (min)'] !== undefined ? (Number(row[hMap['rem sleep (min)']]) || 0) : 0;
      const awake = hMap['awake (min)'] !== undefined ? (Number(row[hMap['awake (min)']]) || 0) : 0;

      // Total sleep duration
      let totalDuration = 0;
      if (hMap['durationminutes'] !== undefined && row[hMap['durationminutes']]) {
        totalDuration = Number(row[hMap['durationminutes']]) || 0;
      } else {
        totalDuration = lightSleep + deepSleep + remSleep;
      }

      // Calculated Sleep Score (0~100) based on duration & deep sleep ratio
      let sleepScore = 0;
      if (hMap['sleepscore'] !== undefined && row[hMap['sleepscore']]) {
        sleepScore = Number(row[hMap['sleepscore']]) || 0;
      } else if (totalDuration > 0) {
        // Ideal: 480 min (8h), Deep sleep ideal: 80~100 min
        const durationScore = Math.min(60, (totalDuration / 450) * 60);
        const deepScore = Math.min(40, (deepSleep / 80) * 40);
        sleepScore = Math.round(durationScore + deepScore);
      }

      sleepList.push({
        date: formatIsoDate(rawDate),
        startTime: hMap['start time'] !== undefined ? String(row[hMap['start time']] || '') : '',
        endTime: hMap['end time'] !== undefined ? String(row[hMap['end time']] || '') : '',
        durationMinutes: totalDuration,
        deepSleepMinutes: deepSleep,
        lightSleepMinutes: lightSleep,
        remSleepMinutes: remSleep,
        awakeMinutes: awake,
        sleepScore: sleepScore
      });
    }
  }

  // 5. Vitals (삼성헬스 바이탈 데이터 - 동적 헤더 매핑)
  const vitalsSheet = getSheetCaseInsensitive(spreadsheet, 'Vitals');
  const vitalsLastRow = vitalsSheet ? vitalsSheet.getLastRow() : 0;
  const vitalsList = [];
  if (vitalsLastRow > 1) {
    const headers = vitalsSheet.getRange(1, 1, 1, vitalsSheet.getLastColumn()).getValues()[0];
    const hMap = buildHeaderMap(headers);
    const rows = vitalsSheet.getRange(2, 1, vitalsLastRow - 1, vitalsSheet.getLastColumn()).getValues();

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const rawDate = row[hMap['date'] !== undefined ? hMap['date'] : 0];
      if (!rawDate) continue;

      let hr = 0;
      if (hMap['heart rate avg (bpm)'] !== undefined && row[hMap['heart rate avg (bpm)']]) {
        hr = Number(row[hMap['heart rate avg (bpm)']]) || 0;
      } else if (hMap['resting heart rate avg (bpm)'] !== undefined && row[hMap['resting heart rate avg (bpm)']]) {
        hr = Number(row[hMap['resting heart rate avg (bpm)']]) || 0;
      } else if (hMap['heartrate'] !== undefined && row[hMap['heartrate']]) {
        hr = Number(row[hMap['heartrate']]) || 0;
      }

      let oxygen = 0;
      if (hMap['oxygen saturation avg (%)'] !== undefined && row[hMap['oxygen saturation avg (%)']]) {
        oxygen = Number(row[hMap['oxygen saturation avg (%)']]) || 0;
      } else if (hMap['oxygenpercent'] !== undefined && row[hMap['oxygenpercent']]) {
        oxygen = Number(row[hMap['oxygenpercent']]) || 0;
      }

      vitalsList.push({
        date: formatIsoDate(rawDate),
        heartRate: hr ? Number(hr.toFixed(1)) : '--',
        heartRateMin: hMap['heart rate min (bpm)'] !== undefined ? Number(row[hMap['heart rate min (bpm)']]) || 0 : 0,
        heartRateMax: hMap['heart rate max (bpm)'] !== undefined ? Number(row[hMap['heart rate max (bpm)']]) || 0 : 0,
        oxygenPercent: oxygen ? Number(oxygen.toFixed(1)) : 0,
        bloodPressure: hMap['blood pressure (mmhg)'] !== undefined ? String(row[hMap['blood pressure (mmhg)']] || '') : '',
        time: hMap['time'] !== undefined ? String(row[hMap['time']] || '') : ''
      });
    }
  }

  return {
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
    const action = (e && e.parameter && e.parameter.action) || 'getAllData';

    if (action === 'getAllData' || action === 'getHealthData') {
      const allData = getAllHealthData();
      return createJsonResponse({
        status: 'success',
        success: true,
        data: allData
      });
    } else if (action === 'getHealthMeta' || action === 'getLastModified') {
      return createJsonResponse({
        status: 'success',
        success: true,
        last_modified: getLastModified()
      });
    } else if (action === 'setup') {
      initHealthSheetsIfNeeded();
      return createJsonResponse({
        status: 'success',
        success: true,
        message: '5개 시트가 정상적으로 초기화되었습니다.'
      });
    } else if (action === 'ping') {
      return createJsonResponse({
        status: 'success',
        success: true,
        message: 'pong',
        timestamp: new Date().toISOString()
      });
    }

    return createJsonResponse({ status: 'error', success: false, error: 'Unknown GET action: ' + action });
  } catch (err) {
    return createJsonResponse({ status: 'error', success: false, error: err.toString() });
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
    const data = payload.item || payload.data || payload;

    // Admin Auth
    const adminPass = getAdminPassword();
    if (!password || password !== adminPass) {
      return createJsonResponse({ status: 'error', success: false, error: '관리자 인증 비밀번호가 일치하지 않습니다.' });
    }

    const ss = getSpreadsheet();
    initHealthSheetsIfNeeded(ss);

    // 1. DB (식단 및 운동 게시글 CRUD: saveDBItem / savePost)
    if (action === 'saveDBItem' || action === 'savePost') {
      const sheet = getSheetCaseInsensitive(ss, 'DB');
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
      return createJsonResponse({ status: 'success', success: true, message: '게시글이 저장되었습니다.', id, last_modified: lm });

    } else if (action === 'deleteDBItem' || action === 'deletePost') {
      const sheet = getSheetCaseInsensitive(ss, 'DB');
      const lastRow = sheet.getLastRow();
      const id = data.id;
      if (!id) return createJsonResponse({ status: 'error', success: false, error: '삭제할 ID가 누락되었습니다.' });

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
        return createJsonResponse({ status: 'success', success: true, message: '게시글이 삭제되었습니다.', id, last_modified: lm });
      }
      return createJsonResponse({ status: 'error', success: false, error: '해당 ID의 게시글을 찾을 수 없습니다.' });

    // 2. Body (신체 인바디 데이터 CRUD: saveBodyItem / saveBody)
    } else if (action === 'saveBodyItem' || action === 'saveBody') {
      const sheet = getSheetCaseInsensitive(ss, 'Body');
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
      return createJsonResponse({ status: 'success', success: true, message: '신체 데이터가 저장되었습니다.', id, last_modified: lm });

    } else if (action === 'deleteBodyItem' || action === 'deleteBody') {
      const sheet = getSheetCaseInsensitive(ss, 'Body');
      const lastRow = sheet.getLastRow();
      const id = data.id;
      if (!id) return createJsonResponse({ status: 'error', success: false, error: '삭제할 ID가 누락되었습니다.' });

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
        return createJsonResponse({ status: 'success', success: true, message: '신체 데이터가 삭제되었습니다.', id, last_modified: lm });
      }
      return createJsonResponse({ status: 'error', success: false, error: '해당 ID의 데이터를 찾을 수 없습니다.' });
    }

    return createJsonResponse({ status: 'error', success: false, error: '알 수 없는 action: ' + action });
  } catch (err) {
    return createJsonResponse({ status: 'error', success: false, error: err.toString() });
  }
}

/**
 * 1회 권한 승인 및 점검용 테스트 함수 (Apps Script 편집기에서 실행 버튼 클릭용)
 */
function testSetup() {
  const ss = getSpreadsheet();
  Logger.log('연결된 스프레드시트 이름: ' + ss.getName());
  initHealthSheetsIfNeeded(ss);
  const data = getAllHealthData(ss);
  Logger.log('Activity 레코드 수: ' + data.activity.length);
  Logger.log('Sleep 레코드 수: ' + data.sleep.length);
  Logger.log('Vitals 레코드 수: ' + data.vitals.length);
  Logger.log('DB 레코드 수: ' + data.db.length);
  Logger.log('Body 레코드 수: ' + data.body.length);
  return 'SUCCESS';
}
