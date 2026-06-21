// import marked parser dynamically from a ESM CDN
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';

// State Store
let appState = {
  posts: [],
  currentTab: 'dashboard',
  searchQuery: '',
  studyFilter: 'all',
  newsFilter: 'all',
  activePostId: null
};

// DOM Elements
const elements = {
  navBtns: document.querySelectorAll('.nav-btn'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  themeToggle: document.getElementById('theme-toggle'),
  liveClock: document.getElementById('live-clock'),
  globalSearch: document.getElementById('global-search'),
  recentStudyList: document.getElementById('recent-study-list'),
  dashboardNewsTable: document.getElementById('dashboard-news-table'),
  studyPostsGrid: document.getElementById('study-posts-grid'),
  projectsGrid: document.getElementById('projects-grid'),
  fullNewsTable: document.getElementById('full-news-table'),
  newsImportanceFilter: document.getElementById('news-importance-filter'),
  
  // Counts
  countRookie: document.getElementById('count-rookie'),
  countProjects: document.getElementById('count-projects'),
  countCerts: document.getElementById('count-certs'),
  countNews: document.getElementById('count-news'),
  
  // Article Pane
  articlePane: document.getElementById('article-detail-pane'),
  btnBackToList: document.getElementById('btn-back-to-list'),
  articleTitle: document.getElementById('article-title'),
  articleDate: document.getElementById('article-date'),
  articleCategory: document.getElementById('article-category'),
  articleType: document.getElementById('article-type'),
  articleTags: document.getElementById('article-tags'),
  articleContent: document.getElementById('article-content'),
  
  // Filter Buttons
  studyFilterBtns: document.querySelectorAll('.filter-btn'),
  
  // More buttons
  moreBtns: document.querySelectorAll('.btn-more')
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initTheme();
  fetchPosts();
  setupEventListeners();
  initRouter();
});

// Live Clock
function initClock() {
  const updateClock = () => {
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0];
    if (elements.liveClock) {
      elements.liveClock.textContent = timeString;
    }
  };
  updateClock();
  setInterval(updateClock, 1000);
}

// Light/Dark Theme Toggle
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
    elements.themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
  } else {
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
    elements.themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
  }
}

function toggleTheme() {
  if (document.body.classList.contains('dark-theme')) {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
    localStorage.setItem('theme', 'light');
    elements.themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
  } else {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
    localStorage.setItem('theme', 'dark');
    elements.themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
  }
}

// Router using Hash
function initRouter() {
  const handleRouting = () => {
    const hash = window.location.hash;
    if (hash.startsWith('#/post/')) {
      const postId = hash.replace('#/post/', '');
      showArticleDetail(postId);
    } else {
      // Hide article view and show active tab
      elements.articlePane.style.display = 'none';
      
      let targetTab = 'dashboard';
      if (hash.startsWith('#/tab/')) {
        targetTab = hash.replace('#/tab/', '');
      }
      switchTab(targetTab);
    }
  };
  
  window.addEventListener('hashchange', handleRouting);
  // Trigger initially
  handleRouting();
}

// Fetch Posts Index JSON
async function fetchPosts() {
  try {
    const response = await fetch('./public/posts/posts.json');
    if (!response.ok) throw new Error('Failed to load posts index');
    appState.posts = await response.json();
    
    // Sort posts by date descending
    appState.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    renderAll();
  } catch (error) {
    console.error('Error fetching posts:', error);
    elements.recentStudyList.innerHTML = `<p class="error-msg">데이터 로드 실패: ${error.message}</p>`;
  }
}

// Tab Switching
function switchTab(tabId) {
  // Validate tabId exists
  const validTabs = ['dashboard', 'study', 'projects', 'news', 'portfolio'];
  if (!validTabs.includes(tabId)) {
    tabId = 'dashboard';
  }
  
  appState.currentTab = tabId;
  appState.activePostId = null;
  elements.articlePane.style.display = 'none';
  
  // Update UI navigation active state
  elements.navBtns.forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Toggle Tab content panes
  elements.tabPanes.forEach(pane => {
    if (pane.id === `tab-${tabId}`) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });
  
  // If search matches filter, clear/refilter when navigating tabs
  renderAll();
}

// Render All Components
function renderAll() {
  updateCounts();
  renderDashboard();
  renderStudyNotes();
  renderProjects();
  renderSecurityNews();
}

// Update Dashboard Counters
function updateCounts() {
  const rookieCount = appState.posts.filter(p => p.category === 'Rookie').length;
  const projectCount = appState.posts.filter(p => p.category === 'Project').length;
  const certCount = appState.posts.filter(p => p.category === 'Cert' || p.category === 'CertAnalysis').length;
  const newsCount = appState.posts.filter(p => p.category === 'News').length;
  
  if (elements.countRookie) elements.countRookie.textContent = rookieCount;
  if (elements.countProjects) elements.countProjects.textContent = projectCount;
  if (elements.countCerts) elements.countCerts.textContent = certCount;
  if (elements.countNews) elements.countNews.textContent = newsCount;
}

// Render Dashboard Pane
function renderDashboard() {
  // 1. Recent study posts (limit to 4, excluding news)
  const studyPosts = appState.posts.filter(p => p.category !== 'News' && matchSearch(p));
  elements.recentStudyList.innerHTML = '';
  
  if (studyPosts.length === 0) {
    elements.recentStudyList.innerHTML = '<p class="text-muted">등록된 스터디 노트가 없습니다.</p>';
  } else {
    studyPosts.slice(0, 4).forEach(post => {
      const item = document.createElement('div');
      item.className = 'recent-item';
      item.innerHTML = `
        <div class="recent-item-title">${post.title}</div>
        <div class="recent-item-meta">
          <span class="badge ${post.category.toLowerCase()}">${getCategoryName(post.category)}</span>
          <span class="notice-date">${post.date.replace(/-/g, '.')}</span>
        </div>
      `;
      item.addEventListener('click', () => {
        window.location.hash = `#/post/${post.id}`;
      });
      elements.recentStudyList.appendChild(item);
    });
  }
  
  // 2. Security News (limit to 3)
  const newsPosts = appState.posts.filter(p => p.category === 'News' && matchSearch(p));
  elements.dashboardNewsTable.innerHTML = '';
  
  if (newsPosts.length === 0) {
    elements.dashboardNewsTable.innerHTML = '<tr><td colspan="5" class="text-center text-muted">등록된 보안 뉴스가 없습니다.</td></tr>';
  } else {
    newsPosts.slice(0, 3).forEach(news => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span style="color:#fb923c">${news.importance}</span></td>
        <td><strong class="news-link-btn" style="cursor:pointer">${news.title}</strong></td>
        <td><span class="badge">${news.source}</span></td>
        <td class="text-muted">${news.date}</td>
        <td><a href="${news.newsLink}" target="_blank" class="news-link-btn" title="원본 뉴스로 이동"><i class="fa-solid fa-arrow-up-right-from-square"></i></a></td>
      `;
      tr.querySelector('strong').addEventListener('click', () => {
        window.location.hash = `#/post/${news.id}`;
      });
      elements.dashboardNewsTable.appendChild(tr);
    });
  }
}

// Render Study Notes Tab
function renderStudyNotes() {
  elements.studyPostsGrid.innerHTML = '';
  const filtered = appState.posts.filter(p => {
    // Category check
    if (appState.studyFilter === 'all') {
      return (p.category === 'Rookie' || p.category === 'Cert' || p.category === 'CertAnalysis');
    }
    return p.category === appState.studyFilter;
  }).filter(matchSearch);
  
  if (filtered.length === 0) {
    elements.studyPostsGrid.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 2rem;">검색 및 필터 조건에 부합하는 글이 없습니다.</p>';
    return;
  }
  
  filtered.forEach(post => {
    const card = document.createElement('div');
    card.className = 'post-card';
    card.innerHTML = `
      <div class="post-card-header">
        <span class="badge ${post.category.toLowerCase()}">${getCategoryName(post.category)}</span>
        <span class="badge type-badge">${post.type}</span>
      </div>
      <div class="post-card-body">
        <h4 class="post-card-title">${post.title}</h4>
        <div class="badge-group">
          ${post.tags.map(t => `<span class="badge">#${t}</span>`).join('')}
        </div>
      </div>
      <div class="post-card-footer">
        <span><i class="fa-regular fa-calendar-days"></i> ${post.date}</span>
        <span>더 보기 <i class="fa-solid fa-angle-right"></i></span>
      </div>
    `;
    card.addEventListener('click', () => {
      window.location.hash = `#/post/${post.id}`;
    });
    elements.studyPostsGrid.appendChild(card);
  });
}

// Render Projects Tab
function renderProjects() {
  elements.projectsGrid.innerHTML = '';
  const projects = appState.posts.filter(p => p.category === 'Project').filter(matchSearch);
  
  if (projects.length === 0) {
    elements.projectsGrid.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 2rem;">등록된 프로젝트가 없습니다.</p>';
    return;
  }
  
  projects.forEach(project => {
    const card = document.createElement('div');
    card.className = 'post-card';
    card.innerHTML = `
      <div class="post-card-header">
        <span class="badge project">${getCategoryName(project.category)}</span>
        <span class="badge type-badge">${project.type}</span>
      </div>
      <div class="post-card-body">
        <h4 class="post-card-title">${project.title}</h4>
        <div class="badge-group">
          ${project.tags.map(t => `<span class="badge">#${t}</span>`).join('')}
        </div>
      </div>
      <div class="post-card-footer">
        <span><i class="fa-regular fa-calendar-days"></i> ${project.date}</span>
        <span>리포트 보기 <i class="fa-solid fa-chevron-right"></i></span>
      </div>
    `;
    card.addEventListener('click', () => {
      window.location.hash = `#/post/${project.id}`;
    });
    elements.projectsGrid.appendChild(card);
  });
}

// Render Security News Tab
function renderSecurityNews() {
  elements.fullNewsTable.innerHTML = '';
  const newsList = appState.posts.filter(p => {
    if (p.category !== 'News') return false;
    if (appState.newsFilter !== 'all' && p.importance !== appState.newsFilter) return false;
    return true;
  }).filter(matchSearch);
  
  if (newsList.length === 0) {
    elements.fullNewsTable.innerHTML = '<tr><td colspan="5" class="text-center text-muted" style="padding: 2rem;">해당 조건의 보안 뉴스가 존재하지 않습니다.</td></tr>';
    return;
  }
  
  newsList.forEach(news => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span style="color:#fb923c">${news.importance}</span></td>
      <td><strong class="news-link-btn" style="cursor:pointer">${news.title}</strong></td>
      <td><span class="badge">${news.source}</span></td>
      <td class="text-muted">${news.date}</td>
      <td><a href="${news.newsLink}" target="_blank" class="news-link-btn" title="원본 기사 링크"><i class="fa-solid fa-up-right-from-square"></i> 이동</a></td>
    `;
    tr.querySelector('strong').addEventListener('click', () => {
      window.location.hash = `#/post/${news.id}`;
    });
    elements.fullNewsTable.appendChild(tr);
  });
}

// Show Post Detail View
async function showArticleDetail(postId) {
  const post = appState.posts.find(p => p.id === postId);
  if (!post) {
    elements.articleTitle.textContent = '글을 찾을 수 없습니다.';
    elements.articleContent.innerHTML = '<p class="text-muted">해당 글이 인덱스에 존재하지 않거나 경로 오류입니다.</p>';
    elements.articlePane.style.display = 'block';
    // Hide active tabs
    elements.tabPanes.forEach(pane => pane.classList.remove('active'));
    return;
  }
  
  appState.activePostId = postId;
  
  // Set metadata
  elements.articleTitle.textContent = post.title;
  elements.articleDate.innerHTML = `<i class="fa-regular fa-calendar"></i> ${post.date}`;
  elements.articleCategory.className = `meta-item badge ${post.category.toLowerCase()}`;
  elements.articleCategory.textContent = getCategoryName(post.category);
  
  if (post.type) {
    elements.articleType.style.display = 'inline-block';
    elements.articleType.textContent = post.type;
  } else {
    elements.articleType.style.display = 'none';
  }
  
  elements.articleTags.innerHTML = post.tags.map(t => `<span class="badge">#${t}</span>`).join('');
  elements.articleContent.innerHTML = '<p class="text-muted"><i class="fa-solid fa-spinner fa-spin"></i> 로딩 중...</p>';
  
  // Render Pane
  elements.articlePane.style.display = 'block';
  elements.tabPanes.forEach(pane => pane.classList.remove('active'));
  
  try {
    const response = await fetch(`./public/${post.filePath}`);
    if (!response.ok) throw new Error('Markdown file load failed');
    const mdText = await response.text();
    // Parse using marked
    elements.articleContent.innerHTML = marked.parse(mdText);
  } catch (error) {
    console.error(error);
    elements.articleContent.innerHTML = `<p class="error-msg">본문을 불러오는 데 실패했습니다: ${error.message}</p>`;
  }
}

// Helpers
function getCategoryName(category) {
  const mapping = {
    'Rookie': 'SK루키즈',
    'Cert': '자격증 공부',
    'CertAnalysis': '보안인증 분석',
    'Project': '프로젝트',
    'News': '보안 뉴스'
  };
  return mapping[category] || category;
}

function matchSearch(post) {
  if (!appState.searchQuery) return true;
  const q = appState.searchQuery.toLowerCase();
  const titleMatch = post.title.toLowerCase().includes(q);
  const tagMatch = post.tags.some(t => t.toLowerCase().includes(q));
  const typeMatch = post.type && post.type.toLowerCase().includes(q);
  return titleMatch || tagMatch || typeMatch;
}

// Event Listeners
function setupEventListeners() {
  // Navigation tabs clicks
  elements.navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      window.location.hash = `#/tab/${tabId}`;
    });
  });
  
  // Back to list button
  elements.btnBackToList.addEventListener('click', () => {
    if (appState.activePostId) {
      const post = appState.posts.find(p => p.id === appState.activePostId);
      if (post) {
        if (post.category === 'Project') {
          window.location.hash = '#/tab/projects';
        } else if (post.category === 'News') {
          window.location.hash = '#/tab/news';
        } else {
          window.location.hash = '#/tab/study';
        }
        return;
      }
    }
    window.location.hash = `#/tab/${appState.currentTab}`;
  });
  
  // Theme Toggle click
  elements.themeToggle.addEventListener('click', toggleTheme);
  
  // Global Search input
  elements.globalSearch.addEventListener('input', (e) => {
    appState.searchQuery = e.target.value;
    renderAll();
  });
  
  // Study tab Filter clicks
  elements.studyFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.studyFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.studyFilter = btn.getAttribute('data-filter');
      renderStudyNotes();
    });
  });
  
  // News Importance Filter changes
  elements.newsImportanceFilter.addEventListener('change', (e) => {
    appState.newsFilter = e.target.value;
    renderSecurityNews();
  });
  
  // Dashboard "View More" (btn-more) buttons
  elements.moreBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target-tab');
      window.location.hash = `#/tab/${target}`;
    });
  });
}
