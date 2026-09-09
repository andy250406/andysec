import fs from 'fs';
import path from 'path';
import https from 'https';

const GAS_API_URL = 'https://script.google.com/macros/s/AKfycby_5htUVodm_M16r25fUOyNAkNG7cpx3L1X098TYGtvS6KYN4nv8h8N5-wnNsveytLz8Q/exec';
const ADMIN_PASSWORD = 'pp0406hh';

const postsDir = path.resolve('./public/posts');
const postsJsonPath = path.join(postsDir, 'posts.json');
const projectsJsonPath = path.join(postsDir, 'projects.json');
const projectNotesJsonPath = path.join(postsDir, 'projectNotes.json');

function postToGas(payload) {
  return new Promise((resolve, reject) => {
    const dataString = JSON.stringify(payload);
    
    function sendRequest(urlStr) {
      const parsedUrl = new URL(urlStr);
      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
          'Content-Length': Buffer.byteLength(dataString)
        }
      };

      const req = https.request(options, (res) => {
        // Handle Google Apps Script 302 Redirection
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // Follow redirect with GET
          https.get(res.headers.location, (redirectRes) => {
            let body = '';
            redirectRes.on('data', chunk => body += chunk);
            redirectRes.on('end', () => {
              try {
                resolve(JSON.parse(body));
              } catch (e) {
                resolve({ raw: body });
              }
            });
          }).on('error', reject);
          return;
        }

        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve({ raw: body });
          }
        });
      });

      req.on('error', reject);
      req.write(dataString);
      req.end();
    }

    sendRequest(GAS_API_URL);
  });
}

async function migratePosts() {
  console.log('\n--- [1/3] Migrating Posts (게시글 마이그레이션) ---');
  if (!fs.existsSync(postsJsonPath)) {
    console.log('posts.json not found, skipping posts migration.');
    return;
  }

  const posts = JSON.parse(fs.readFileSync(postsJsonPath, 'utf-8'));
  console.log(`Found ${posts.length} posts to migrate.`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < posts.length; i++) {
    const p = posts[i];
    let content = p.content || '';

    if (!content && p.filePath) {
      const fullPath = path.resolve('public', p.filePath);
      if (fs.existsSync(fullPath)) {
        content = fs.readFileSync(fullPath, 'utf-8');
      }
    }

    const payload = {
      password: ADMIN_PASSWORD,
      action: 'savePost',
      data: {
        id: p.id,
        category: p.category || 'General',
        title: p.title,
        date: p.date,
        content: content,
        images: p.images || []
      }
    };

    try {
      console.log(`[${i + 1}/${posts.length}] Migrating Post: ${p.title} (${p.id})...`);
      const res = await postToGas(payload);
      if (res && res.success) {
        successCount++;
      } else {
        console.warn(`Response for ${p.id}:`, res);
        successCount++;
      }
    } catch (err) {
      console.error(`Failed to migrate ${p.id}:`, err.message);
      failCount++;
    }

    await new Promise(r => setTimeout(r, 400));
  }
  console.log(`Posts migration completed: Success ${successCount}, Failed ${failCount}`);
}

async function migrateProjects() {
  console.log('\n--- [2/3] Migrating Projects (프로젝트 및 하위 세부진단 마이그레이션) ---');
  if (!fs.existsSync(projectsJsonPath)) {
    console.log('projects.json not found, skipping projects migration.');
    return;
  }

  const projects = JSON.parse(fs.readFileSync(projectsJsonPath, 'utf-8'));
  console.log(`Found ${projects.length} projects to migrate.`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < projects.length; i++) {
    const proj = projects[i];
    const payload = {
      password: ADMIN_PASSWORD,
      action: 'saveProject',
      data: {
        id: proj.id,
        name: proj.name,
        client: proj.client || '',
        startDate: proj.startDate || '',
        endDate: proj.endDate || '',
        details: proj.details || '',
        diagnostics: proj.diagnostics || []
      }
    };

    try {
      const diagCount = (proj.diagnostics && proj.diagnostics.length) || 0;
      console.log(`[${i + 1}/${projects.length}] Migrating Project: ${proj.name} (Diagnostics: ${diagCount}개)...`);
      const res = await postToGas(payload);
      if (res && res.success) {
        successCount++;
      } else {
        console.warn(`Response for ${proj.id}:`, res);
        successCount++;
      }
    } catch (err) {
      console.error(`Failed to migrate project ${proj.id}:`, err.message);
      failCount++;
    }

    await new Promise(r => setTimeout(r, 400));
  }
  console.log(`Projects migration completed: Success ${successCount}, Failed ${failCount}`);
}

async function migrateProjectNotes() {
  console.log('\n--- [3/3] Migrating Project Notes (프로젝트 기록 게시물 마이그레이션) ---');
  if (!fs.existsSync(projectNotesJsonPath)) {
    console.log('projectNotes.json not found, skipping project notes migration.');
    return;
  }

  const notes = JSON.parse(fs.readFileSync(projectNotesJsonPath, 'utf-8'));
  console.log(`Found ${notes.length} project notes to migrate.`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    const payload = {
      password: ADMIN_PASSWORD,
      action: 'saveProjectNote',
      data: {
        id: note.id,
        projectId: note.projectId,
        title: note.title,
        date: note.date,
        content: note.content || ''
      }
    };

    try {
      console.log(`[${i + 1}/${notes.length}] Migrating Project Note: ${note.title} (${note.id})...`);
      const res = await postToGas(payload);
      if (res && res.success) {
        successCount++;
      } else {
        console.warn(`Response for ${note.id}:`, res);
        successCount++;
      }
    } catch (err) {
      console.error(`Failed to migrate project note ${note.id}:`, err.message);
      failCount++;
    }

    await new Promise(r => setTimeout(r, 400));
  }
  console.log(`Project notes migration completed: Success ${successCount}, Failed ${failCount}`);
}

async function migrateAll() {
  const args = process.argv.slice(2);
  const postsOnly = args.includes('--posts-only');
  const projectsOnly = args.includes('--projects-only');
  const notesOnly = args.includes('--notes-only');

  if (projectsOnly) {
    await migrateProjects();
  } else if (notesOnly) {
    await migrateProjectNotes();
  } else if (postsOnly) {
    await migratePosts();
  } else {
    await migratePosts();
    await migrateProjects();
    await migrateProjectNotes();
  }
  console.log('\n모든 마이그레이션 작업이 완료되었습니다!');
}

migrateAll();
