import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCRIPT_ID = '1NyF45ZVcADSs5PWNNOmLaJWC9kC-bwsF9EZ4Z__QTo74h7x5xdTkftEl';
const DEPLOYMENT_ID = 'AKfycbz5axHM_61gZngyDkr9CXwhK0AXdi4JRRm23Won8IaHxzbV7YWTpT7Wd_qn7GuL0gTgYg';
const CODE_FILE_PATH = path.join(__dirname, 'health_gas_backend.gs');

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
  console.log('🚀 [AndySec_Health] Google Apps Script 자동 배포 시작...');
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
        appsscriptJson = Object.assign(appsscriptJson, JSON.parse(existingManifest.source));
      } catch (e) {}
    }
  }

  appsscriptJson.oauthScopes = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
  ];
  appsscriptJson.webapp = {
    executeAs: 'USER_DEPLOYING',
    access: 'ANYONE_ANONYMOUS'
  };

  // 3. Read local health_gas_backend.gs
  console.log('3. 로컬 health_gas_backend.gs 읽는 중...');
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
    description: `AndySec_Health_AutoDeploy_${now}`
  });
  const newVersion = versionRes.versionNumber;
  console.log(`✔ 새 버전 생성 완료: v${newVersion}`);

  // 6. Check existing deployments or create new one
  console.log('6. 배포 확인 및 웹 앱 배포 등록 중...');
  const depRes = await apiRequest('GET', `/v1/projects/${SCRIPT_ID}/deployments`, token);
  let targetDepId = null;
  if (depRes.deployments && depRes.deployments.length > 0) {
    const prodDep = depRes.deployments.find(d => 
      d.deploymentConfig?.versionNumber && 
      d.deploymentId !== 'AKfycbxYS-UDKlfwcrfl19rI8bqtO_EajsWf-6N-aY9VjGuY'
    );
    if (prodDep) targetDepId = prodDep.deploymentId;
  }

  let finalDepId = targetDepId;
  if (targetDepId) {
    console.log(`기존 배포(${targetDepId}) 업데이트 중...`);
    const deployPayload = {
      deploymentConfig: {
        scriptId: SCRIPT_ID,
        versionNumber: newVersion,
        manifestFileName: 'appsscript',
        description: `AndySec_Health_Live_v${newVersion}`
      }
    };
    await apiRequest('PUT', `/v1/projects/${SCRIPT_ID}/deployments/${targetDepId}`, token, deployPayload);
  } else {
    console.log('새 웹 앱 배포 생성 중...');
    const createRes = await apiRequest('POST', `/v1/projects/${SCRIPT_ID}/deployments`, token, {
      versionNumber: newVersion,
      manifestFileName: 'appsscript',
      description: `AndySec_Health_Live_v${newVersion}`
    });
    finalDepId = createRes.deploymentId;
  }

  const webAppUrl = `https://script.google.com/macros/s/${finalDepId}/exec`;
  console.log(`✔ 웹 앱 배포 완료! Deployment ID: ${finalDepId}`);
  console.log(`\n🎉 [Health Web App URL] -> ${webAppUrl}`);

  fs.writeFileSync(path.join(__dirname, 'health_gas_info.json'), JSON.stringify({
    scriptId: SCRIPT_ID,
    deploymentId: finalDepId,
    webAppUrl: webAppUrl,
    version: newVersion,
    deployedAt: now
  }, null, 2));
}

main().catch(err => {
  console.error('\n❌ 배포 실패:', err.message);
  process.exit(1);
});
