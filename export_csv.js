import fs from 'fs';
import path from 'path';

const postsDir = path.resolve('./public/posts');
const postsJsonPath = path.join(postsDir, 'posts.json');

const posts = JSON.parse(fs.readFileSync(postsJsonPath, 'utf-8'));

// CSV 헤더: id, category, title, date, content, image_1, image_2, image_3
function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  return '"' + str.replace(/"/g, '""') + '"';
}

const rows = [];
rows.push(['id', 'category', 'title', 'date', 'content', 'image_1', 'image_2', 'image_3'].join(','));

for (const p of posts) {
  let content = p.content || '';
  if (!content && p.filePath) {
    const fp = path.resolve('public', p.filePath);
    if (fs.existsSync(fp)) {
      content = fs.readFileSync(fp, 'utf-8');
    }
  }

  const row = [
    escapeCsv(p.id),
    escapeCsv(p.category || 'General'),
    escapeCsv(p.title),
    escapeCsv(p.date),
    escapeCsv(content),
    '""', '""', '""'
  ];
  rows.push(row.join(','));
}

const csvOutput = rows.join('\r\n');
fs.writeFileSync(path.resolve('./posts_migration.csv'), '\uFEFF' + csvOutput, 'utf-8');
console.log(`Generated posts_migration.csv with ${posts.length} posts.`);
