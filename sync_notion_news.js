import fs from 'fs';
import path from 'path';
import https from 'https';

// Load Notion Token dynamically from local config to avoid hardcoding secrets
const mcpConfigPath = 'C:\\Users\\Andy\\.gemini\\config\\mcp_config.json';
let NOTION_TOKEN = '';
try {
  const config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf-8'));
  const headersStr = config.mcpServers["notion-mcp-server"].env.OPENAPI_MCP_HEADERS;
  const headersObj = JSON.parse(headersStr);
  NOTION_TOKEN = headersObj.Authorization.replace("Bearer ", "");
} catch (e) {
  console.error("Error reading NOTION_TOKEN from config:", e);
  process.exit(1);
}

const NOTION_VERSION = "2022-06-28";
const DATABASE_ID = "31225a92bc7581f88bd2da9de49c0374";

const HEADERS = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": NOTION_VERSION,
  "Content-Type": "application/json",
  "User-Agent": "NodeJS-Notion-Sync"
};

function request(method, url, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      method: method,
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers: HEADERS
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

function convertRichText(richTextArray) {
  if (!richTextArray || richTextArray.length === 0) return '';
  return richTextArray.map(rt => {
    let text = rt.plain_text || '';
    if (rt.annotations) {
      if (rt.annotations.code) text = `\`${text}\``;
      if (rt.annotations.bold) text = `**${text}**`;
      if (rt.annotations.italic) text = `*${text}*`;
      if (rt.annotations.strikethrough) text = `~~${text}~~`;
    }
    if (rt.href) {
      text = `[${text}](${rt.href})`;
    }
    return text;
  }).join('');
}

async function convertBlocksToMarkdown(blocks) {
  let markdown = '';
  for (const block of blocks) {
    const type = block.type;
    const content = block[type];
    
    switch (type) {
      case 'paragraph':
        markdown += convertRichText(content.rich_text) + '\n\n';
        break;
      case 'heading_1':
        markdown += `# ${convertRichText(content.rich_text)}\n\n`;
        break;
      case 'heading_2':
        markdown += `## ${convertRichText(content.rich_text)}\n\n`;
        break;
      case 'heading_3':
        markdown += `### ${convertRichText(content.rich_text)}\n\n`;
        break;
      case 'bulleted_list_item':
        markdown += `* ${convertRichText(content.rich_text)}\n`;
        break;
      case 'numbered_list_item':
        markdown += `1. ${convertRichText(content.rich_text)}\n`;
        break;
      case 'quote':
        markdown += `> ${convertRichText(content.rich_text)}\n\n`;
        break;
      case 'code':
        markdown += `\`\`\`${content.language || ''}\n${convertRichText(content.rich_text)}\n\`\`\`\n\n`;
        break;
      case 'divider':
        markdown += '---\n\n';
        break;
      default:
        // Ignore unsupported blocks or write as paragraph if rich_text is present
        if (content && content.rich_text) {
          markdown += convertRichText(content.rich_text) + '\n\n';
        }
        break;
    }
  }
  return markdown;
}

async function getPageBlocks(pageId) {
  let blocks = [];
  let hasMore = true;
  let startCursor = null;
  while (hasMore) {
    let url = `https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`;
    if (startCursor) {
      url += `&start_cursor=${startCursor}`;
    }
    const res = await request("GET", url);
    blocks = blocks.concat(res.results || []);
    hasMore = res.has_more;
    startCursor = res.next_cursor;
  }
  return blocks;
}

async function sync() {
  console.log("Fetching pages from Notion database...");
  const queryResult = await request("POST", `https://api.notion.com/v1/databases/${DATABASE_ID}/query`);
  const pages = queryResult.results || [];
  console.log(`Found ${pages.length} pages in database.`);

  const postsDir = path.resolve('./public/posts');
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }

  const postsIndexPath = path.join(postsDir, 'posts.json');
  let currentPosts = [];
  if (fs.existsSync(postsIndexPath)) {
    try {
      currentPosts = JSON.parse(fs.readFileSync(postsIndexPath, 'utf-8'));
    } catch (e) {
      console.error("Error reading posts.json, initializing empty index", e);
    }
  }

  // Remove existing News category items to replace with fresh sync
  currentPosts = currentPosts.filter(p => p.category !== 'News');

  const newNewsPosts = [];

  for (const page of pages) {
    const pageId = page.id;
    const props = page.properties;

    // Parse properties safely
    const title = props.Name && props.Name.title ? props.Name.title.map(t => t.plain_text).join('') : '제목 없음';
    const date = props.날짜 && props.날짜.date ? props.날짜.date.start : new Date().toISOString().split('T')[0];
    const source = props.출처 && props.출처.rich_text ? props.출처.rich_text.map(t => t.plain_text).join('') : '출처 없음';
    const importance = props.중요도 && props.중요도.select ? props.중요도.select.name : '⭐⭐⭐';
    const newsLink = props["뉴스 링크"] && props["뉴스 링크"].url ? props["뉴스 링크"].url : '';

    console.log(`Processing page: ${title} (${date})`);

    // Fetch children blocks and convert to Markdown
    const blocks = await getPageBlocks(pageId);
    const mdBody = await convertBlocksToMarkdown(blocks);

    const mdContent = `# ${title}\n\n${mdBody}`;
    const filename = `news-${pageId}.md`;
    fs.writeFileSync(path.join(postsDir, filename), mdContent, 'utf-8');

    newNewsPosts.push({
      id: `news-${pageId}`,
      title: title,
      date: date,
      category: "News",
      source: source,
      importance: importance,
      newsLink: newsLink,
      tags: ["보안뉴스", "Notion연동"],
      filePath: `posts/${filename}`
    });
  }

  // Merge & Sort by date descending
  const finalPosts = [...currentPosts, ...newNewsPosts].sort((a, b) => b.date.localeCompare(a.date));

  fs.writeFileSync(postsIndexPath, JSON.stringify(finalPosts, null, 2), 'utf-8');
  console.log("Notion News Sync Completed Successfully!");
}

sync().catch(err => {
  console.error("Sync failed:", err);
  process.exit(1);
});
