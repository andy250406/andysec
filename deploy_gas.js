import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCRIPT_ID = '1g7_bIb6Oex-EoLvlu7wf2b5AY3eUhvRg2NEt0uPD_BYZO_1jLFhoKqvK';
const DEPLOYMENT_ID = 'AKfycby_5htUVodm_M16r25fUOyNAkNG7cpx3L1X098TYGtvS6KYN4nv8h8N5-wnNsveytLz8Q';
const CODE_FILE_PATH = path.join(__dirname, 'gas_backend_code.gs');

function getClaspRcPath() {
  const home = process.env.USERPROFILE || process.env.HOME;
  return path.join(home, '.clasprc.json');
}

function getAccessToken() {
  return new Promise((resolve, reject) => {
    const rcPath = getClaspRcPath();
    if (!fs.existsSync(rcPath)) {
      return reject(new Error('Cannot find .clasprc.json credentials at ' + rcPath));
    }
    const rc = JSON.parse(fs.readFileSync(rcPath, 'utf8'));
    const creds = rc.tokens?.default || rc;
    if (!creds.refresh_token) {
      return reject(new Error('No refresh_token in .clasprc.json'));
    }

    const postData = new URLSearchParams({
      client_id: creds.client_id,
      client_secret: creds.client_secret,
      refresh_token: creds.refresh_token,
      grant_type: 'refresh_token'
    }).toString();

    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.access_token) {
            resolve(json.access_token);
          } else {
            reject(new Error('OAuth failed: ' + body));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function apiRequest(method, endpoint, token, data = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL('https://script.googleapis.com' + endpoint);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(`API ${method} ${endpoint} failed (${res.statusCode}): ${JSON.stringify(json, null, 2)}`));
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(body);
          } else {
            reject(new Error(`API ${method} ${endpoint} failed (${res.statusCode}): ${body}`));
          }
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function main() {
  console.log('🚀 [AndySec] Google Apps Script 자동 배포 시작...');
  console.log(`- Script ID: ${SCRIPT_ID}`);
  console.log(`- Deployment ID: ${DEPLOYMENT_ID}`);

  // 1. Get Access Token
  console.log('1. OAuth Access Token 획득 중...');
  const token = await getAccessToken();
  console.log('✔ Access Token 획득 완료');

  // 2. Fetch existing project files
  console.log('2. 기존 프로젝트 파일 정보 조회 중...');
  const projectContent = await apiRequest('GET', `/v1/projects/${SCRIPT_ID}/content`, token);
  let appsscriptJson = {
    timeZone: 'Asia/Seoul',
    dependencies: {},
    exceptionLogging: 'STACKDRIVER',
    runtimeVersion: 'V8',
    webapp: {
      executeAs: 'USER_DEPLOYING',
      access: 'ANYONE_ANONYMOUS'
    }
  };

  if (projectContent.files) {
    const existingManifest = projectContent.files.find(f => f.name === 'appsscript');
    if (existingManifest && existingManifest.source) {
      try {
        appsscriptJson = JSON.parse(existingManifest.source);
      } catch (e) {}
    }
  }

  // 3. Read local gas_backend_code.gs
  console.log('3. 로컬 gas_backend_code.gs 읽는 중...');
  const localSource = fs.readFileSync(CODE_FILE_PATH, 'utf8');
  console.log(`✔ 로컬 코드 크기: ${localSource.length} bytes`);

  // 4. Update project content
  console.log('4. Apps Script 프로젝트 소스 코드 업데이트 중 (PUT /content)...');
  const putPayload = {
    files: [
      {
        name: 'appsscript',
        type: 'JSON',
        source: JSON.stringify(appsscriptJson, null, 2)
      },
      {
        name: 'Code',
        type: 'SERVER_JS',
        source: localSource
      }
    ]
  };
  await apiRequest('PUT', `/v1/projects/${SCRIPT_ID}/content`, token, putPayload);
  console.log('✔ 소스 코드 업데이트 완료');

  // 5. Create new version
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log('5. 새 버전 생성 중 (POST /versions)...');
  const versionRes = await apiRequest('POST', `/v1/projects/${SCRIPT_ID}/versions`, token, {
    description: `AndySec_AutoDeploy_${now}`
  });
  const newVersion = versionRes.versionNumber;
  console.log(`✔ 새 버전 생성 완료: v${newVersion}`);

  // 6. Update deployment
  console.log(`6. 배포 업데이트 중 (PUT /deployments/${DEPLOYMENT_ID} -> v${newVersion})...`);
  const deployPayload = {
    deploymentConfig: {
      scriptId: SCRIPT_ID,
      versionNumber: newVersion,
      manifestFileName: 'appsscript',
      description: `AndySec_Live_v${newVersion}`
    }
  };
  await apiRequest('PUT', `/v1/projects/${SCRIPT_ID}/deployments/${DEPLOYMENT_ID}`, token, deployPayload);
  console.log(`✔ 웹 앱 배포 완료! (버전 ${newVersion} 적용됨)`);
  console.log('\n🎉 배포가 성공적으로 완료되었습니다! AndySec 블로그가 즉시 최신 GAS 코드로 동작합니다.');
}

main().catch(err => {
  console.error('\n❌ 배포 실패:', err.message);
  process.exit(1);
});
