// import marked parser dynamically from a ESM CDN
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';

// Constants
const TODAY = new Date('2026-06-21'); // Simulated today's date

// State Store
let appState = {
  posts: [], // Study notes and News loaded from JSON
  projects: [], // Projects loaded from LocalStorage / JSON
  projectNotes: [], // Project-specific notes written by user
  currentTab: 'dashboard',
  searchQuery: '',
  studyFilter: 'all',
  newsFilter: 'all',
  activePostId: null,
  activeProjectId: null // ID of project currently viewed in details
};

// DOM Elements
const elements = {
  navBtns: document.querySelectorAll('.nav-menu .nav-btn'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  themeToggle: document.getElementById('theme-toggle'),
  liveClock: document.getElementById('live-clock'),
  globalSearch: document.getElementById('global-search'),
  
  // Dashboard Elements
  dashboardActiveProjectWrapper: document.getElementById('dashboard-active-project-wrapper'),
  recentStudyList: document.getElementById('recent-study-list'),
  dashboardRecentNewsList: document.getElementById('dashboard-recent-news-list'),
  
  // Study Tab
  studyPostsGrid: document.getElementById('study-posts-grid'),
  studyFilterBtns: document.querySelectorAll('#tab-study .filter-btn'),
  
  // Projects Tab
  projectsListView: document.getElementById('projects-list-view'),
  projectDetailView: document.getElementById('project-detail-view'),
  projectsTableBody: document.getElementById('projects-table-body'),
  detailProjectName: document.getElementById('detail-project-name'),
  detailProjectClient: document.getElementById('detail-project-client'),
  detailProjectDesc: document.getElementById('detail-project-desc'),
  detailProjectStart: document.getElementById('detail-project-start'),
  detailProjectEnd: document.getElementById('detail-project-end'),
  detailProjectPercent: document.getElementById('detail-project-percent'),
  detailProjectProgressBar: document.getElementById('detail-project-progress-bar'),
  projectNotesGrid: document.getElementById('project-notes-grid'),
  
  // Modals
  addProjectModal: document.getElementById('add-project-modal'),
  addNoteModal: document.getElementById('add-note-modal'),
  
  // Forms
  addProjectForm: document.getElementById('add-project-form'),
  addNoteForm: document.getElementById('add-note-form'),
  
  // Buttons
  btnOpenAddProject: document.getElementById('btn-open-add-project-modal'),
  btnCloseProjectModal: document.getElementById('btn-close-project-modal'),
  btnCancelProject: document.getElementById('btn-cancel-project'),
  btnBackToProjectsList: document.getElementById('btn-back-to-projects-list'),
  btnOpenAddNote: document.getElementById('btn-open-add-note-modal'),
  btnCloseNoteModal: document.getElementById('btn-close-note-modal'),
  btnCancelNote: document.getElementById('btn-cancel-note'),
  
  // News Tab
  fullNewsTable: document.getElementById('full-news-table'),
  newsImportanceFilter: document.getElementById('news-importance-filter'),
  
  // Article Pane
  articlePane: document.getElementById('article-detail-pane'),
  btnBackToList: document.getElementById('btn-back-to-list'),
  articleTitle: document.getElementById('article-title'),
  articleDate: document.getElementById('article-date'),
  articleCategory: document.getElementById('article-category'),
  articleType: document.getElementById('article-type'),
  articleTags: document.getElementById('article-tags'),
  articleContent: document.getElementById('article-content'),
  
  // More buttons
  moreBtns: document.querySelectorAll('.btn-more')
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initTheme();
  loadData();
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
    
    // Reset view visibility
    elements.articlePane.style.display = 'none';
    
    if (hash.startsWith('#/post/')) {
      const postId = hash.replace('#/post/', '');
      showArticleDetail(postId);
    } else if (hash.startsWith('#/project/')) {
      const projectId = hash.replace('#/project/', '');
      showProjectDetail(projectId);
    } else {
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

// Load All Data (JSON + LocalStorage)
async function loadData() {
  try {
    // 1. Fetch posts (Study notes & News)
    const response = await fetch('./public/posts/posts.json');
    if (!response.ok) throw new Error('Failed to load posts index');
    const allPosts = await response.json();
    
    // Sort study notes and news
    appState.posts = allPosts.filter(p => p.category !== 'Project');
    appState.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 2. Initialize projects from localStorage or seed defaults
    initProjects(allPosts.filter(p => p.category === 'Project'));
    
    // 3. Load project internal notes
    appState.projectNotes = JSON.parse(localStorage.getItem('projectNotes')) || [];
    
    renderAll();
  } catch (error) {
    console.error('Error fetching data:', error);
    elements.recentStudyList.innerHTML = `<p class="error-msg">데이터 로드 실패: ${error.message}</p>`;
  }
}

// Seed default projects if none exist in localStorage
function initProjects(defaultProjects) {
  const savedProjects = localStorage.getItem('projects');
  if (savedProjects) {
    appState.projects = JSON.parse(savedProjects);
  } else {
    // Add additional fields for projects
    const seeded = [
      {
        id: 'project-cons-audit',
        name: '개인정보 보안 컨설팅 수탁사 점검 프로젝트',
        client: 'SK쉴더스 수탁기관',
        startDate: '2026-03-01',
        endDate: '2026-05-30',
        details: '위탁사의 수탁사 대상 개인정보 관리 실태 정기 점검 수행. 안전성 확보 조치 고시 점검 체크리스트 구성 및 이행 지도.'
      },
      {
        id: 'project-web-vuln',
        name: '의료 데이터를 위한 웹 취약점 자동 진단 시스템',
        client: '가상 의료재단',
        startDate: '2026-01-02',
        endDate: '2026-02-15',
        details: 'OWASP Top 10 기준 웹 취약점 자동 스캔 알고리즘 개발 및 진단 보고서 자동 PDF 출력 기능 구현.'
      },
      {
        id: 'project-forest-fire',
        name: '산불 발생 데이터 분석 대시보드 구축',
        client: '공공 빅데이터 분석 챌린지',
        startDate: '2025-10-15',
        endDate: '2025-11-30',
        details: 'Streamlit을 활용해 기상 데이터 및 피해 면적 데이터를 결합하여 연관 관계 지표 시각화 대시보드 제작.'
      },
      {
        id: 'project-cloud-vuln',
        name: '2026 하반기 클라우드 인프라 보안 진단 컨설팅',
        client: '네오테크 코리아',
        startDate: '2026-05-01',
        endDate: '2026-08-30',
        details: '고객사의 AWS 클라우드 아키텍처 대상 IAM 권한 정책, VPC 네트워크 통제 및 데이터 암호화 설정 점검 컨설팅.'
      }
    ];
    appState.projects = seeded;
    localStorage.setItem('projects', JSON.stringify(seeded));
  }
}

// Calculate Project Progress Percentage
function calculateProgress(startStr, endStr) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  
  if (TODAY < start) return 0;
  if (TODAY > end) return 100;
  
  const total = end - start;
  const current = TODAY - start;
  
  return Math.min(100, Math.max(0, Math.round((current / total) * 100)));
}

// Tab Switching
function switchTab(tabId) {
  const validTabs = ['dashboard', 'study', 'projects', 'news', 'portfolio'];
  if (!validTabs.includes(tabId)) {
    tabId = 'dashboard';
  }
  
  appState.currentTab = tabId;
  appState.activePostId = null;
  appState.activeProjectId = null;
  
  // Hide details and modals
  elements.articlePane.style.display = 'none';
  elements.projectDetailView.style.display = 'none';
  elements.projectsListView.style.display = 'block';
  
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
  
  renderAll();
}

// Render All Components
function renderAll() {
  renderActiveProject();
  renderDashboard();
  renderStudyNotes();
  renderProjectsList();
  renderSecurityNews();
}

// Render Active Project on Dashboard
function renderActiveProject() {
  // Find project that is currently in progress
  const activeProject = appState.projects.find(p => {
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    return TODAY >= start && TODAY <= end;
  }) || appState.projects[0]; // Fallback to first project if none is active
  
  if (!elements.dashboardActiveProjectWrapper) return;
  
  if (!activeProject) {
    elements.dashboardActiveProjectWrapper.innerHTML = `
      <div class="card-body">
        <p class="text-muted text-center">현재 진행 중인 프로젝트 일정이 없습니다.</p>
      </div>
    `;
    return;
  }
  
  const progressPercent = calculateProgress(activeProject.startDate, activeProject.endDate);
  
  elements.dashboardActiveProjectWrapper.innerHTML = `
    <div class="card-header">
      <h3><i class="fa-solid fa-bolt"></i> 현재 진행 중인 프로젝트</h3>
      <span class="client-badge">${activeProject.client}</span>
    </div>
    <div class="active-project-body">
      <div class="active-proj-left">
        <h4 class="active-proj-title">${activeProject.name}</h4>
        <p class="active-proj-desc">${activeProject.details}</p>
      </div>
      <div class="active-proj-right">
        <div class="active-proj-dates">
          <span>시작일: <span>${activeProject.startDate}</span></span>
          <span>종료일: <span>${activeProject.endDate}</span></span>
        </div>
        <div class="project-progress-wrapper">
          <div class="progress-lbl-row">
            <span>진행률 (기준일: 2026.06.21)</span>
            <span>${progressPercent}%</span>
          </div>
          <div class="progress-bar"><div class="progress" style="width: ${progressPercent}%;"></div></div>
        </div>
        <div style="text-align: right; margin-top: 5px;">
          <button class="btn-more" id="btn-goto-active-proj" data-id="${activeProject.id}">상세 기록 게시판 이동</button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('btn-goto-active-proj')?.addEventListener('click', (e) => {
    const id = e.target.getAttribute('data-id');
    window.location.hash = `#/project/${id}`;
  });
}

// Render Dashboard (Recent Study list + Sidebar News list)
function renderDashboard() {
  // 1. Recent study notes (exclude News/Projects)
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
  
  // 2. Sidebar Recent News (4 items, simplified text list)
  const newsPosts = appState.posts.filter(p => p.category === 'News' && matchSearch(p));
  elements.dashboardRecentNewsList.innerHTML = '';
  
  if (newsPosts.length === 0) {
    elements.dashboardRecentNewsList.innerHTML = '<p class="text-muted text-center">등록된 뉴스가 없습니다.</p>';
  } else {
    newsPosts.slice(0, 4).forEach(news => {
      const item = document.createElement('div');
      item.className = 'news-sidebar-item';
      item.innerHTML = `
        <div class="news-sidebar-header">
          <span style="color:#fb923c">${news.importance}</span>
          <span class="notice-date">${news.date}</span>
        </div>
        <div class="news-sidebar-title">${news.title}</div>
        <div class="news-sidebar-desc">출처: ${news.source}</div>
      `;
      item.addEventListener('click', () => {
        window.location.hash = `#/post/${news.id}`;
      });
      elements.dashboardRecentNewsList.appendChild(item);
    });
  }
}

// Render Study Notes Tab
function renderStudyNotes() {
  elements.studyPostsGrid.innerHTML = '';
  const filtered = appState.posts.filter(p => {
    if (appState.studyFilter === 'all') {
      return (p.category === 'Cert' || p.category === 'CertAnalysis');
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

// Render Projects Schedule List on Projects Tab
function renderProjectsList() {
  if (!elements.projectsTableBody) return;
  elements.projectsTableBody.innerHTML = '';
  
  const projects = appState.projects.filter(p => {
    if (!appState.searchQuery) return true;
    const q = appState.searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q) || p.details.toLowerCase().includes(q);
  });
  
  if (projects.length === 0) {
    elements.projectsTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">등록된 프로젝트가 없습니다.</td></tr>';
    return;
  }
  
  projects.forEach(p => {
    const progressPercent = calculateProgress(p.startDate, p.endDate);
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.innerHTML = `
      <td><strong>${p.name}</strong></td>
      <td><span class="client-badge" style="margin-bottom:0">${p.client}</span></td>
      <td><span style="font-family:var(--font-code)">${p.startDate}</span></td>
      <td><span style="font-family:var(--font-code)">${p.endDate}</span></td>
      <td>
        <div style="width: 140px;">
          <div class="progress-lbl-row" style="font-size:0.75rem">
            <span>${progressPercent}%</span>
          </div>
          <div class="progress-bar" style="height:4px"><div class="progress" style="width: ${progressPercent}%;"></div></div>
        </div>
      </td>
    `;
    tr.addEventListener('click', () => {
      window.location.hash = `#/project/${p.id}`;
    });
    elements.projectsTableBody.appendChild(tr);
  });
}

// Show Project Detail View & Load Internal Board
function showProjectDetail(projectId) {
  const project = appState.projects.find(p => p.id === projectId);
  if (!project) {
    alert('해당 프로젝트를 찾을 수 없습니다.');
    window.location.hash = '#/tab/projects';
    return;
  }
  
  appState.activeProjectId = projectId;
  
  // Show/Hide divs
  elements.projectsListView.style.display = 'none';
  elements.projectDetailView.style.display = 'block';
  elements.tabPanes.forEach(pane => pane.classList.remove('active'));
  document.getElementById('tab-projects').classList.add('active');
  
  // Populate Metadata
  elements.detailProjectName.textContent = project.name;
  elements.detailProjectClient.textContent = project.client;
  elements.detailProjectDesc.textContent = project.details;
  elements.detailProjectStart.textContent = project.startDate;
  elements.detailProjectEnd.textContent = project.endDate;
  
  const progressPercent = calculateProgress(project.startDate, project.endDate);
  elements.detailProjectPercent.textContent = `${progressPercent}%`;
  elements.detailProjectProgressBar.style.width = `${progressPercent}%`;
  
  // Render project specific notes
  renderProjectNotes(projectId);
}

// Render Notes associated with specific project
function renderProjectNotes(projectId) {
  elements.projectNotesGrid.innerHTML = '';
  
  // Filter notes that belong to this project
  const notes = appState.projectNotes.filter(n => n.projectId === projectId);
  
  if (notes.length === 0) {
    elements.projectNotesGrid.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 2rem;">이 프로젝트에 작성된 기록이 없습니다. 새로운 기록을 등록해 보세요!</p>';
    return;
  }
  
  notes.forEach(note => {
    const card = document.createElement('div');
    card.className = 'note-card';
    card.innerHTML = `
      <h4 class="note-card-title">${note.title}</h4>
      <p class="note-card-excerpt">${note.content.substring(0, 120)}${note.content.length > 120 ? '...' : ''}</p>
      <div class="note-card-footer">
        <span><i class="fa-regular fa-clock"></i> ${note.date}</span>
        <span style="color:var(--accent-color)">상세보기 <i class="fa-solid fa-chevron-right"></i></span>
      </div>
    `;
    card.addEventListener('click', () => {
      // Show detail inline or as article detail
      // Let's reuse standard article view but adapt it for localStorage notes
      showLocalNoteDetail(note);
    });
    elements.projectNotesGrid.appendChild(card);
  });
}

// Show Local Note Detail in the Article Pane
function showLocalNoteDetail(note) {
  elements.articlePane.style.display = 'block';
  elements.tabPanes.forEach(pane => pane.classList.remove('active'));
  
  elements.articleTitle.textContent = note.title;
  elements.articleDate.innerHTML = `<i class="fa-regular fa-calendar"></i> ${note.date}`;
  elements.articleCategory.className = 'meta-item badge project';
  elements.articleCategory.textContent = '프로젝트 기록';
  elements.articleType.style.display = 'none';
  elements.articleTags.innerHTML = '';
  
  // Parse content using marked
  elements.articleContent.innerHTML = marked.parse(note.content);
}

// Render Security News Tab List
function renderSecurityNews() {
  if (!elements.fullNewsTable) return;
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

// Show Post Detail View from posts.json
async function showArticleDetail(postId) {
  const post = appState.posts.find(p => p.id === postId);
  if (!post) {
    elements.articleTitle.textContent = '글을 찾을 수 없습니다.';
    elements.articleContent.innerHTML = '<p class="text-muted">해당 글이 인덱스에 존재하지 않거나 경로 오류입니다.</p>';
    elements.articlePane.style.display = 'block';
    elements.tabPanes.forEach(pane => pane.classList.remove('active'));
    return;
  }
  
  appState.activePostId = postId;
  
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
  
  elements.articlePane.style.display = 'block';
  elements.tabPanes.forEach(pane => pane.classList.remove('active'));
  
  try {
    const response = await fetch(`./public/${post.filePath}`);
    if (!response.ok) throw new Error('Markdown file load failed');
    const mdText = await response.text();
    elements.articleContent.innerHTML = marked.parse(mdText);
  } catch (error) {
    console.error(error);
    elements.articleContent.innerHTML = `<p class="error-msg">본문을 불러오는 데 실패했습니다: ${error.message}</p>`;
  }
}

// Helpers
function getCategoryName(category) {
  const mapping = {
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
  const title = post.title.toLowerCase();
  const tagMatch = post.tags && post.tags.some(t => t.toLowerCase().includes(q));
  const typeMatch = post.type && post.type.toLowerCase().includes(q);
  return title.includes(q) || tagMatch || typeMatch;
}

// Event Listeners Setup
function setupEventListeners() {
  // Navigation tabs
  elements.navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      window.location.hash = `#/tab/${tabId}`;
    });
  });
  
  // Back to list button inside Article Pane
  elements.btnBackToList.addEventListener('click', () => {
    if (appState.activePostId) {
      const post = appState.posts.find(p => p.id === appState.activePostId);
      if (post) {
        window.location.hash = post.category === 'News' ? '#/tab/news' : '#/tab/study';
        return;
      }
    }
    // If it's a project internal note
    if (appState.activeProjectId) {
      window.location.hash = `#/project/${appState.activeProjectId}`;
      return;
    }
    window.location.hash = `#/tab/${appState.currentTab}`;
  });
  
  // Theme Toggle Click
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
  elements.newsImportanceFilter?.addEventListener('change', (e) => {
    appState.newsFilter = e.target.value;
    renderSecurityNews();
  });
  
  // Dashboard "View More" links
  elements.moreBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target-tab');
      window.location.hash = `#/tab/${target}`;
    });
  });
  
  // Projects Add Project Modal handlers
  elements.btnOpenAddProject.addEventListener('click', () => {
    elements.addProjectModal.style.display = 'flex';
  });
  elements.btnCloseProjectModal.addEventListener('click', () => {
    elements.addProjectModal.style.display = 'none';
  });
  elements.btnCancelProject.addEventListener('click', () => {
    elements.addProjectModal.style.display = 'none';
  });
  
  // Project detail back button
  elements.btnBackToProjectsList.addEventListener('click', () => {
    window.location.hash = '#/tab/projects';
  });
  
  // Project Internal Note Modal handlers
  elements.btnOpenAddNote?.addEventListener('click', () => {
    elements.addNoteModal.style.display = 'flex';
  });
  elements.btnCloseNoteModal?.addEventListener('click', () => {
    elements.addNoteModal.style.display = 'none';
  });
  elements.btnCancelNote?.addEventListener('click', () => {
    elements.addNoteModal.style.display = 'none';
  });
  
  // Form Submit: Add Project
  elements.addProjectForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newProj = {
      id: 'project-' + Date.now(),
      name: document.getElementById('project-name').value,
      client: document.getElementById('project-client').value,
      startDate: document.getElementById('project-start').value,
      endDate: document.getElementById('project-end').value,
      details: document.getElementById('project-details').value
    };
    
    appState.projects.unshift(newProj);
    localStorage.setItem('projects', JSON.stringify(appState.projects));
    
    elements.addProjectForm.reset();
    elements.addProjectModal.style.display = 'none';
    
    renderAll();
  });
  
  // Form Submit: Add Project Note
  elements.addNoteForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!appState.activeProjectId) return;
    
    const newNote = {
      id: 'note-' + Date.now(),
      projectId: appState.activeProjectId,
      title: document.getElementById('note-title').value,
      content: document.getElementById('note-content').value,
      date: new Date().toISOString().split('T')[0]
    };
    
    appState.projectNotes.unshift(newNote);
    localStorage.setItem('projectNotes', JSON.stringify(appState.projectNotes));
    
    elements.addNoteForm.reset();
    elements.addNoteModal.style.display = 'none';
    
    renderProjectNotes(appState.activeProjectId);
  });
}
