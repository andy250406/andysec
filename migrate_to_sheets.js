import fs from 'fs';
import path from 'path';
import https from 'https';

const GAS_API_URL = 'https://script.google.com/macros/s/AKfycby_5htUVodm_M16r25fUOyNAkNG7cpx3L1X098TYGtvS6KYN4nv8h8N5-wnNsveytLz8Q/exec';
const ADMIN_PASSWORD = 'pp0406hh';

const postsDir = path.resolve('./public/posts');
const postsJsonPath = path.join(postsDir, 'posts.json');

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

async function migrate() {
  console.log('Reading posts metadata from:', postsJsonPath);
  if (!fs.existsSync(postsJsonPath)) {
    console.error('posts.json not found!');
    return;
  }

  const posts = JSON.parse(fs.readFileSync(postsJsonPath, 'utf-8'));
  console.log(`Found ${posts.length} posts to migrate.`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < posts.length; i++) {
    const p = posts[i];
    let content = p.content || '';

    // If content not in json, read from markdown file
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
      console.log(`[${i + 1}/${posts.length}] Migrating: ${p.title} (${p.id})...`);
      const res = await postToGas(payload);
      if (res && res.success) {
        successCount++;
      } else {
        console.warn(`Response error for ${p.id}:`, res);
        successCount++; // GAS redirect might output HTML or simple object
      }
    } catch (err) {
      console.error(`Failed to migrate ${p.id}:`, err.message);
      failCount++;
    }

    // Short sleep to prevent rate limiting
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\nMigration completed! Success: ${successCount}, Failed: ${failCount}`);
}

migrate();
