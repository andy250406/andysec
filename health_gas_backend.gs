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
    dbSheet.appendRow(['id', 'category', 'date', 'time', 'title', 'subType', 'calories', 'carbs', 'protein', 'fat', 'imageUrl', 'content', 'location', 'memo', 'created_at']);
  } else if (dbSheet.getLastRow() === 0) {
    dbSheet.appendRow(['id', 'category', 'date', 'time', 'title', 'subType', 'calories', 'carbs', 'protein', 'fat', 'imageUrl', 'content', 'location', 'memo', 'created_at']);
  } else {
    const headers = dbSheet.getRange(1, 1, 1, dbSheet.getLastColumn()).getValues()[0];
    const hMap = buildHeaderMap(headers);
    if (hMap['location'] === undefined) {
      dbSheet.getRange(1, dbSheet.getLastColumn() + 1).setValue('location');
    }
    if (hMap['memo'] === undefined) {
      dbSheet.getRange(1, dbSheet.getLastColumn() + 1).setValue('memo');
    }
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

/**
 * 신체 프로필(Body Measurements) 기반 TDEE, 활동 칼로리, 세부 운동 칼로리 자동 계산 및 시트 기입
 */
function recalculateAndFillActivityCalories(spreadsheet, forceAll) {
  if (!spreadsheet) spreadsheet = getSpreadsheet();
  const actSheet = getSheetCaseInsensitive(spreadsheet, 'Activity');
  if (!actSheet || actSheet.getLastRow() <= 1) return { updatedCount: 0 };

  // 1. Get latest body profile from Body Measurements / Body
  let latestWeight = 90.0;
  let latestHeight = 1.85;

  const bodySheet = getSheetCaseInsensitive(spreadsheet, 'Body Measurements') || getSheetCaseInsensitive(spreadsheet, 'Body');
  if (bodySheet && bodySheet.getLastRow() > 1) {
    const bHeaders = bodySheet.getRange(1, 1, 1, bodySheet.getLastColumn()).getValues()[0];
    const bHMap = buildHeaderMap(bHeaders);
    const bRows = bodySheet.getRange(2, 1, bodySheet.getLastRow() - 1, bodySheet.getLastColumn()).getValues();

    for (let i = bRows.length - 1; i >= 0; i--) {
      const bRow = bRows[i];
      let w = 0;
      if (bHMap['weight (kg)'] !== undefined && bRow[bHMap['weight (kg)']]) {
        w = Number(bRow[bHMap['weight (kg)']]);
      } else if (bHMap['weight'] !== undefined && bRow[bHMap['weight']]) {
        w = Number(bRow[bHMap['weight']]);
      }
      if (w > 30 && w < 200) {
        latestWeight = w;
        break;
      }
    }

    for (let i = bRows.length - 1; i >= 0; i--) {
      const bRow = bRows[i];
      if (bHMap['height (m)'] !== undefined && bRow[bHMap['height (m)']]) {
        let hStr = String(bRow[bHMap['height (m)']]);
        if (hStr.includes('=')) hStr = hStr.split('=').pop();
        const m = hStr.match(/([0-9]+\.?[0-9]*)/);
        if (m) {
          const num = Number(m[1]);
          if (num > 0.5 && num < 2.5) {
            latestHeight = num;
            break;
          } else if (num >= 50 && num <= 250) {
            latestHeight = num / 100;
            break;
          }
        }
      }
    }
  }

  // Baseline Constants based on profile:
  const BMR_REST = 1870; // kcal
  const C_BASE = 1564; // kcal
  const STRIDE = Number((latestHeight * 0.415).toFixed(2)) || 0.77; // m
  const K_FACTOR = Number((0.0513 * (latestWeight / 90.0)).toFixed(4)) || 0.0513; // kcal/step

  // 2. Read Activity sheet data
  const lastRow = actSheet.getLastRow();
  const lastCol = actSheet.getLastColumn();
  const headers = actSheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const hMap = buildHeaderMap(headers);

  const colDate = hMap['date'] !== undefined ? hMap['date'] : 0;
  const colSource = hMap['source(s)'] !== undefined ? hMap['source(s)'] : 1;
  const colSteps = hMap['steps'];
  const colDist = hMap['distance (m)'];
  const colTotCal = hMap['total calories (kcal)'];
  const colActCal = hMap['active calories (kcal)'];
  const colExName = hMap['exercise name'];
  const colDuration = hMap['duration (min)'];
  const colExCal = hMap['exercise calories (kcal)'];
  const colExDist = hMap['exercise distance (m)'];

  if (colTotCal === undefined || colActCal === undefined || colExCal === undefined) {
    return { error: 'Required calorie columns not found in Activity sheet' };
  }

  const rowsRange = actSheet.getRange(2, 1, lastRow - 1, lastCol);
  const rows = rowsRange.getValues();

  // Group by date
  const dateGroups = {};
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const rawDate = row[colDate];
    if (!rawDate) continue;
    const dateStr = formatIsoDate(rawDate);
    if (!dateGroups[dateStr]) dateGroups[dateStr] = [];
    dateGroups[dateStr].push({ rowIndex: r, row: row });
  }

  function getMET(exName, speedKmh) {
    if (!exName) return 4.0;
    const name = String(exName).toLowerCase();
    if (name.includes('treadmill') || name.includes('running') || name.includes('러닝')) {
      if (speedKmh > 8) return 9.0;
      if (speedKmh > 6) return 8.0;
      return 7.0;
    }
    if (name.includes('strength') || name.includes('weight') || name.includes('웨이트') || name.includes('근력')) {
      return 4.0;
    }
    if (name.includes('walking') || name.includes('걷기')) {
      return 3.5;
    }
    if (name.includes('cycling') || name.includes('자전거')) {
      return 6.0;
    }
    return 4.5;
  }

  let modified = false;
  let updatedCount = 0;

  for (const dateStr in dateGroups) {
    const group = dateGroups[dateStr];
    const shealthItems = group.filter(item => String(item.row[colSource] || '').includes('com.sec.android.app.shealth'));
    const hcItems = group.filter(item => String(item.row[colSource] || '').includes('com.android.healthconnect'));
    const targetItems = shealthItems.length > 0 ? shealthItems : group;

    // Check if this date already has active calories filled
    const hasExistingAct = targetItems.some(item => {
      const v = item.row[colActCal];
      return v !== '' && v !== null && v !== undefined && Number(v) > 0;
    });

    // If not forcing all, and all target items already have Active Calories, skip this date
    if (!forceAll && hasExistingAct) {
      const hasEmptyAct = targetItems.some(item => {
        const v = item.row[colActCal];
        return v === '' || v === null || v === undefined;
      });
      if (!hasEmptyAct) {
        continue;
      }
    }

    // Daily max steps
    let maxSteps = 0;
    targetItems.forEach(item => {
      const st = Number(item.row[colSteps]) || 0;
      if (st > maxSteps) maxSteps = st;
    });

    // Robust raw total calories:
    // 1. Prefer unchanged Health Connect row if available
    let maxRawTotCal = 0;
    if (hcItems.length > 0) {
      hcItems.forEach(item => {
        const tc = Number(item.row[colTotCal]) || 0;
        if (tc > maxRawTotCal) maxRawTotCal = tc;
      });
    }
    // 2. Fallback to shealth item raw value
    if (maxRawTotCal === 0) {
      targetItems.forEach(item => {
        const tc = Number(item.row[colTotCal]) || 0;
        if (tc > maxRawTotCal) maxRawTotCal = tc;
      });
    }

    // If maxRawTotCal > 2100 due to prior recalculated TotalCal, recover from existing exercise/active cal
    let E_ex = 0;
    if (maxRawTotCal > 0 && maxRawTotCal <= 2100) {
      E_ex = Math.max(0, maxRawTotCal - C_BASE);
    } else {
      let existingExSum = 0;
      targetItems.forEach(item => {
        const ec = Number(item.row[colExCal]) || 0;
        existingExSum += ec;
      });
      if (existingExSum > 0) {
        E_ex = existingExSum;
      } else if (maxRawTotCal > C_BASE) {
        E_ex = Math.max(0, maxRawTotCal - C_BASE);
      }
    }

    // Exercise items
    const exItems = targetItems.filter(item => {
      const name = colExName !== undefined ? String(item.row[colExName] || '').trim() : '';
      const dur = colDuration !== undefined ? (Number(item.row[colDuration]) || 0) : 0;
      return name.length > 0 && dur > 0;
    });

    let maxExDist = 0;
    exItems.forEach(item => {
      const d1 = colExDist !== undefined ? (Number(item.row[colExDist]) || 0) : 0;
      const d2 = colDist !== undefined ? (Number(item.row[colDist]) || 0) : 0;
      const dist = Math.max(d1, d2);
      if (dist > maxExDist) maxExDist = dist;
    });

    const S_ex = maxExDist > 0 ? Math.round(maxExDist / STRIDE) : 0;
    const S_daily = Math.max(0, maxSteps - S_ex);
    const E_daily = Number((S_daily * K_FACTOR).toFixed(1));

    const finalTotalCal = Math.round(BMR_REST + E_ex + E_daily);
    const finalActiveCal = Math.round(E_ex + E_daily);

    // Exercise breakdown
    let exCaloriesMap = {};
    if (exItems.length > 0 && E_ex > 0) {
      let totalScore = 0;
      const scored = exItems.map(item => {
        const dur = Number(item.row[colDuration]) || 1;
        let dist = 0;
        if (colExDist !== undefined && item.row[colExDist]) dist = Number(item.row[colExDist]);
        else if (colDist !== undefined && item.row[colDist]) dist = Number(item.row[colDist]);
        let speed = 0;
        if (dur > 0 && dist > 0) speed = (dist / 1000) / (dur / 60);
        const met = getMET(item.row[colExName], speed);
        const score = met * dur;
        totalScore += score;
        return { item: item, score: score };
      });

      scored.forEach(s => {
        const ratio = totalScore > 0 ? (s.score / totalScore) : (1 / scored.length);
        exCaloriesMap[s.item.rowIndex] = Math.round(E_ex * ratio);
      });
    }

    // Apply to group rows
    group.forEach(item => {
      const rIdx = item.rowIndex;
      const row = rows[rIdx];
      const isShealth = String(row[colSource] || '').includes('com.sec.android.app.shealth');

      const currentAct = Number(row[colActCal]) || 0;
      const currentEx = Number(row[colExCal]) || 0;
      const currentTot = Number(row[colTotCal]) || 0;

      const targetTot = isShealth ? finalTotalCal : currentTot;
      const targetAct = isShealth ? finalActiveCal : currentAct;
      const targetEx = exCaloriesMap[rIdx] !== undefined ? exCaloriesMap[rIdx] : (currentEx > 0 ? currentEx : '');

      const needsUpdate = forceAll || currentAct === 0 || (exItems.length > 0 && currentEx === 0) || row[colActCal] === '' || (isShealth && row[colTotCal] !== targetTot);

      if (needsUpdate) {
        if (row[colTotCal] !== targetTot || row[colActCal] !== targetAct || row[colExCal] !== targetEx) {
          row[colTotCal] = targetTot;
          row[colActCal] = targetAct;
          row[colExCal] = targetEx;
          modified = true;
          updatedCount++;
        }
      }
    });
  }

  if (modified) {
    rowsRange.setValues(rows);
    SpreadsheetApp.flush();
    updateLastModified(spreadsheet);
  }

  return { status: 'success', updatedCount: updatedCount, profile: { weight: latestWeight, height: latestHeight, stride: STRIDE, bmr: BMR_REST } };
}

function getAllHealthData(ss = null) {
  const spreadsheet = ss || getSpreadsheet();
  initHealthSheetsIfNeeded(spreadsheet);

  // Auto-calculate & fill missing calories in Activity sheet based on latest Body Measurements
  try {
    recalculateAndFillActivityCalories(spreadsheet, false);
  } catch (e) {
    Logger.log('recalculateAndFillActivityCalories auto-run warning: ' + e);
  }

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
        location: String(row[hMap['location']] || ''),
        memo: String(row[hMap['memo']] || ''),
        content: String(row[hMap['content']] || ''),
        created_at: String(row[hMap['created_at']] || '')
      });
    }
  }

  // 2. Body (신체 데이터 - 인바디 / Body Measurements 연동)
  let bodySheet = getSheetCaseInsensitive(spreadsheet, 'Body Measurements') || getSheetCaseInsensitive(spreadsheet, 'Body');
  const bodyLastRow = bodySheet ? bodySheet.getLastRow() : 0;
  const bodyList = [];
  if (bodyLastRow > 1) {
    const headers = bodySheet.getRange(1, 1, 1, bodySheet.getLastColumn()).getValues()[0];
    const hMap = buildHeaderMap(headers);
    const rows = bodySheet.getRange(2, 1, bodyLastRow - 1, bodySheet.getLastColumn()).getValues();

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const rawDate = row[hMap['date'] !== undefined ? hMap['date'] : (hMap['date/time'] !== undefined ? hMap['date/time'] : 0)];
      if (!rawDate) continue;

      let weightVal = 0;
      if (hMap['weight (kg)'] !== undefined && row[hMap['weight (kg)']]) {
        weightVal = Number(row[hMap['weight (kg)']]) || 0;
      } else if (hMap['weight'] !== undefined && row[hMap['weight']]) {
        weightVal = Number(row[hMap['weight']]) || 0;
      }

      let fatVal = 0;
      if (hMap['body fat (%)'] !== undefined && row[hMap['body fat (%)']]) {
        fatVal = Number(row[hMap['body fat (%)']]) || 0;
      } else if (hMap['bodyfatpercent'] !== undefined && row[hMap['bodyfatpercent']]) {
        fatVal = Number(row[hMap['bodyfatpercent']]) || 0;
      }

      let heightVal = 1.85;
      if (hMap['height (m)'] !== undefined && row[hMap['height (m)']]) {
        let rawH = String(row[hMap['height (m)']]);
        if (rawH.includes('=')) rawH = rawH.split('=').pop();
        const matchH = rawH.match(/([0-9]+\.?[0-9]*)/);
        if (matchH) {
          const num = Number(matchH[1]);
          if (num > 0.5 && num < 2.5) heightVal = num;
          else if (num >= 50 && num <= 250) heightVal = num / 100;
        }
      }

      let muscleVal = 0;
      if (hMap['lean body mass (kg)'] !== undefined && row[hMap['lean body mass (kg)']]) {
        muscleVal = Number(row[hMap['lean body mass (kg)']]) || 0;
      } else if (hMap['musclemass'] !== undefined && row[hMap['musclemass']]) {
        muscleVal = Number(row[hMap['musclemass']]) || 0;
      }

      bodyList.push({
        id: String(row[hMap['id'] !== undefined ? hMap['id'] : 0] || ('body-' + r)),
        date: formatIsoDate(rawDate),
        weight: weightVal ? Number(weightVal.toFixed(1)) : 88.0,
        muscleMass: muscleVal ? Number(muscleVal.toFixed(1)) : 0,
        bodyFatPercent: fatVal ? Number(fatVal.toFixed(1)) : 24.5,
        height: heightVal,
        bmi: (weightVal && heightVal) ? Number((weightVal / (heightVal * heightVal)).toFixed(1)) : 25.7,
        bmr: 1870,
        notes: String(row[hMap['notes'] !== undefined ? hMap['notes'] : 0] || '삼성헬스 연동'),
        created_at: String(row[hMap['created_at'] !== undefined ? hMap['created_at'] : 0] || '')
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

      const sourceStr = hMap['source(s)'] !== undefined ? String(row[hMap['source(s)']] || '') : '';
      if (sourceStr.includes('com.android.healthconnect')) {
        continue;
      }

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
      } else if (hMap['activecalories'] !== undefined && row[hMap['activecalories']]) {
        activeCal = Number(row[hMap['activecalories']]) || 0;
      }

      // Exercise Calories
      let exCal = 0;
      if (hMap['exercise calories (kcal)'] !== undefined && row[hMap['exercise calories (kcal)']]) {
        exCal = Number(row[hMap['exercise calories (kcal)']]) || 0;
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
        exerciseCalories: exCal,
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

      // 1. Heart rate
      let hrAvg = 0;
      if (hMap['heart rate avg (bpm)'] !== undefined && row[hMap['heart rate avg (bpm)']]) {
        hrAvg = Number(row[hMap['heart rate avg (bpm)']]) || 0;
      } else if (hMap['resting heart rate avg (bpm)'] !== undefined && row[hMap['resting heart rate avg (bpm)']]) {
        hrAvg = Number(row[hMap['resting heart rate avg (bpm)']]) || 0;
      } else if (hMap['heartrate'] !== undefined && row[hMap['heartrate']]) {
        hrAvg = Number(row[hMap['heartrate']]) || 0;
      }

      let hrMin = 0;
      if (hMap['heart rate min (bpm)'] !== undefined && row[hMap['heart rate min (bpm)']]) {
        hrMin = Number(row[hMap['heart rate min (bpm)']]) || 0;
      } else if (hMap['minheartrate'] !== undefined && row[hMap['minheartrate']]) {
        hrMin = Number(row[hMap['minheartrate']]) || 0;
      }

      let hrMax = 0;
      if (hMap['heart rate max (bpm)'] !== undefined && row[hMap['heart rate max (bpm)']]) {
        hrMax = Number(row[hMap['heart rate max (bpm)']]) || 0;
      } else if (hMap['maxheartrate'] !== undefined && row[hMap['maxheartrate']]) {
        hrMax = Number(row[hMap['maxheartrate']]) || 0;
      }

      // 2. Oxygen saturation
      let oxAvg = 0;
      if (hMap['oxygen saturation avg (%)'] !== undefined && row[hMap['oxygen saturation avg (%)']]) {
        oxAvg = Number(row[hMap['oxygen saturation avg (%)']]) || 0;
      } else if (hMap['oxygenpercent'] !== undefined && row[hMap['oxygenpercent']]) {
        oxAvg = Number(row[hMap['oxygenpercent']]) || 0;
      } else if (hMap['oxygensaturation'] !== undefined && row[hMap['oxygensaturation']]) {
        oxAvg = Number(row[hMap['oxygensaturation']]) || 0;
      }

      let oxMin = 0;
      if (hMap['oxygen saturation min (%)'] !== undefined && row[hMap['oxygen saturation min (%)']]) {
        oxMin = Number(row[hMap['oxygen saturation min (%)']]) || 0;
      } else if (hMap['minoxygensaturation'] !== undefined && row[hMap['minoxygensaturation']]) {
        oxMin = Number(row[hMap['minoxygensaturation']]) || 0;
      }

      let oxMax = 0;
      if (hMap['oxygen saturation max (%)'] !== undefined && row[hMap['oxygen saturation max (%)']]) {
        oxMax = Number(row[hMap['oxygen saturation max (%)']]) || 0;
      } else if (hMap['maxoxygensaturation'] !== undefined && row[hMap['maxoxygensaturation']]) {
        oxMax = Number(row[hMap['maxoxygensaturation']]) || 0;
      }

      let restingHr = 0;
      if (hMap['resting heart rate avg (bpm)'] !== undefined && row[hMap['resting heart rate avg (bpm)']]) {
        restingHr = Number(row[hMap['resting heart rate avg (bpm)']]) || 0;
      }

      vitalsList.push({
        date: formatIsoDate(rawDate),
        heartRate: hrAvg ? Number(hrAvg.toFixed(1)) : '--',
        heartRateAvg: hrAvg ? Number(hrAvg.toFixed(1)) : 0,
        heartRateMin: hrMin,
        heartRateMax: hrMax,
        minHeartRate: hrMin,
        maxHeartRate: hrMax,
        avgHeartRate: hrAvg ? Number(hrAvg.toFixed(1)) : 0,
        restingHeartRate: restingHr,
        oxygenPercent: oxAvg ? Number(oxAvg.toFixed(1)) : 0,
        oxygenSaturation: oxAvg ? Number(oxAvg.toFixed(1)) : 0,
        oxygenAvg: oxAvg ? Number(oxAvg.toFixed(1)) : 0,
        oxygenMin: oxMin ? Number(oxMin.toFixed(1)) : 0,
        oxygenMax: oxMax ? Number(oxMax.toFixed(1)) : 0,
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
    } else if (action === 'recalculateActivity') {
      const forceAll = !!(e && e.parameter && (e.parameter.force === 'true' || e.parameter.forceAll === 'true' || e.parameter.force === '1'));
      const ss = getSpreadsheet();
      const res = recalculateAndFillActivityCalories(ss, forceAll);
      return createJsonResponse({
        status: 'success',
        success: true,
        result: res
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

    // 0. Recalculate Activity Calories
    if (action === 'recalculateActivity') {
      const forceAll = !!(data.forceAll || data.force || payload.forceAll || payload.force);
      const res = recalculateAndFillActivityCalories(ss, forceAll);
      return createJsonResponse({ status: 'success', success: true, result: res });
    }

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
      const location = data.location || '';
      const memo = data.memo || '';
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

      // Check headers
      let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      let hMap = buildHeaderMap(headers);
      if (hMap['location'] === undefined || hMap['memo'] === undefined) {
        if (hMap['location'] === undefined) {
          sheet.getRange(1, sheet.getLastColumn() + 1).setValue('location');
        }
        if (hMap['memo'] === undefined) {
          sheet.getRange(1, sheet.getLastColumn() + 1).setValue('memo');
        }
        headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        hMap = buildHeaderMap(headers);
      }

      const rowValues = new Array(headers.length).fill('');
      rowValues[hMap['id'] !== undefined ? hMap['id'] : 0] = id;
      if (hMap['category'] !== undefined) rowValues[hMap['category']] = category;
      if (hMap['date'] !== undefined) rowValues[hMap['date']] = date;
      if (hMap['time'] !== undefined) rowValues[hMap['time']] = time;
      if (hMap['title'] !== undefined) rowValues[hMap['title']] = title;
      if (hMap['subtype'] !== undefined) rowValues[hMap['subtype']] = subType;
      if (hMap['calories'] !== undefined) rowValues[hMap['calories']] = calories;
      if (hMap['carbs'] !== undefined) rowValues[hMap['carbs']] = carbs;
      if (hMap['protein'] !== undefined) rowValues[hMap['protein']] = protein;
      if (hMap['fat'] !== undefined) rowValues[hMap['fat']] = fat;
      if (hMap['imageurl'] !== undefined) rowValues[hMap['imageurl']] = (imageUrl && imageUrl.length > 48000) ? '' : imageUrl;
      if (hMap['location'] !== undefined) rowValues[hMap['location']] = location;
      if (hMap['memo'] !== undefined) rowValues[hMap['memo']] = memo;
      if (hMap['content'] !== undefined) rowValues[hMap['content']] = content;
      if (hMap['created_at'] !== undefined) rowValues[hMap['created_at']] = createdAt;

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
