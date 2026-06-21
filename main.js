// import marked parser dynamically from a ESM CDN
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';

// Constants
const TODAY = new Date('2026-06-21'); // Simulated today's date
const REPO_OWNER = 'andy250406';
const REPO_NAME = 'andysec';

// State Store
let appState = {
  posts: [], // Study notes and News (category: Cert, CertAnalysis, News)
  projects: [], // Projects
  projectNotes: [], // Project-specific notes
  currentTab: 'dashboard',
  searchQuery: '',
  studyFilter: 'all',
  newsFilter: 'all',
  activePostId: null,      // ID of post currently viewed in detail
  activePostType: null,    // 'general' or 'projectNote'
  activeProjectId: null,   // ID of project currently viewed in details
  syncEnabled: false,
  githubPat: ''
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
  btnOpenAddStudy: document.getElementById('btn-open-add-study-modal'),
  
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
  btnEditProject: document.getElementById('btn-edit-project-details'),
  btnDeleteProject: document.getElementById('btn-delete-project-details'),
  
  // Settings Button / Info
  btnOpenSettings: document.getElementById('btn-open-settings'),
  syncIndicator: document.getElementById('sync-indicator'),
  deployOverlay: document.getElementById('deploy-overlay'),
  deployOverlayTitle: document.getElementById('deploy-overlay-title'),
  deployOverlayDesc: document.getElementById('deploy-overlay-desc'),
  
  // Modals
  addProjectModal: document.getElementById('add-project-modal'),
  addNoteModal: document.getElementById('add-note-modal'),
  addStudyModal: document.getElementById('add-study-modal'),
  settingsModal: document.getElementById('settings-modal'),
  
  // Modal Titles & Hidden inputs
  projectModalTitle: document.getElementById('project-modal-title'),
  projectEditId: document.getElementById('project-edit-id'),
  btnSubmitProject: document.getElementById('btn-submit-project'),
  
  noteModalTitle: document.getElementById('note-modal-title'),
  noteEditId: document.getElementById('note-edit-id'),
  btnSubmitNote: document.getElementById('btn-submit-note'),
  
  studyModalTitle: document.getElementById('study-modal-title'),
  studyEditId: document.getElementById('study-edit-id'),
  btnSubmitStudy: document.getElementById('btn-submit-study'),
  
  // Forms
  addProjectForm: document.getElementById('add-project-form'),
  addNoteForm: document.getElementById('add-note-form'),
  addStudyForm: document.getElementById('add-study-form'),
  settingsForm: document.getElementById('settings-form'),
  
  // Buttons
  btnOpenAddProject: document.getElementById('btn-open-add-project-modal'),
  btnCloseProjectModal: document.getElementById('btn-close-project-modal'),
  btnCancelProject: document.getElementById('btn-cancel-project'),
  btnBackToProjectsList: document.getElementById('btn-back-to-projects-list'),
  btnOpenAddNote: document.getElementById('btn-open-add-note-modal'),
  btnCloseNoteModal: document.getElementById('btn-close-note-modal'),
  btnCancelNote: document.getElementById('btn-cancel-note'),
  btnCloseStudyModal: document.getElementById('btn-close-study-modal'),
  btnCancelStudy: document.getElementById('btn-cancel-study'),
  btnCloseSettingsModal: document.getElementById('btn-close-settings-modal'),
  btnCancelSettings: document.getElementById('btn-cancel-settings'),
  
  // News Tab
  fullNewsTable: document.getElementById('full-news-table'),
  newsImportanceFilter: document.getElementById('news-importance-filter'),
  
  // Article Pane
  articlePane: document.getElementById('article-detail-pane'),
  btnBackToList: document.getElementById('btn-back-to-list'),
  btnEditArticle: document.getElementById('btn-edit-article'),
  btnDeleteArticle: document.getElementById('btn-delete-article'),
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
  loadSyncSettings();
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

// Load Sync Settings from LocalStorage
function loadSyncSettings() {
  appState.syncEnabled = localStorage.getItem('github_sync_enabled') === 'true';
  appState.githubPat = localStorage.getItem('github_pat') || '';
  
  updateSyncIndicator();
}

function updateSyncIndicator() {
  if (!elements.syncIndicator) return;
  if (appState.syncEnabled && appState.githubPat) {
    elements.syncIndicator.textContent = 'ON';
    elements.syncIndicator.className = 'sync-status-indicator online';
  } else {
    elements.syncIndicator.textContent = 'OFF';
    elements.syncIndicator.className = 'sync-status-indicator offline';
  }
}

// Router using Hash
function initRouter() {
  const handleRouting = () => {
    const hash = window.location.hash;
    
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
  handleRouting();
}

// Load All Data (JSON + LocalStorage Merged)
async function loadData() {
  try {
    // 1. Fetch posts index from server (using path without 'public/' prefix for built/dev site resolution)
    let serverPosts = [];
    try {
      const response = await fetch('./posts/posts.json');
      if (response.ok) {
        serverPosts = await response.json();
        serverPosts = serverPosts.filter(p => p.category !== 'Project');
      }
    } catch (e) {
      console.warn('Could not load posts.json from server, falling back to local storage.');
    }
    
    // Load local posts safely
    let localPosts = [];
    try {
      const stored = localStorage.getItem('posts');
      if (stored && stored !== 'undefined') {
        localPosts = JSON.parse(stored) || [];
      }
    } catch (e) {
      console.error('Failed to parse local posts:', e);
    }
    if (!Array.isArray(localPosts)) localPosts = [];
    
    // Merge them: combine server and local, keeping local custom/edited posts as priority
    const mergedPosts = [...serverPosts];
    localPosts.forEach(localP => {
      if (!localP || !localP.id) return; // Guard against corrupted items
      const exists = mergedPosts.some(serverP => serverP && serverP.id === localP.id);
      if (!exists) {
        mergedPosts.push(localP);
      } else {
        const idx = mergedPosts.findIndex(serverP => serverP && serverP.id === localP.id);
        if (idx !== -1) {
          mergedPosts[idx] = { ...mergedPosts[idx], ...localP }; // Local overrides/complements server details
        }
      }
    });
    
    // Fill content fields for posts
    for (let post of mergedPosts) {
      if (!post.content) {
        try {
          const res = await fetch(`./${post.filePath}`);
          if (res.ok) {
            post.content = await res.text();
          }
        } catch (e) {
          post.content = `# ${post.title}\n\n내용이 아직 등록되지 않았습니다.`;
        }
      }
    }
    
    appState.posts = mergedPosts;
    localStorage.setItem('posts', JSON.stringify(mergedPosts));
    appState.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 2. Initialize projects
    await initProjects();
    
    // 3. Load project internal notes (merged with server if available)
    let serverNotes = [];
    try {
      const res = await fetch('./posts/projectNotes.json');
      if (res.ok) {
        serverNotes = await res.json();
      }
    } catch (e) {
      console.warn('Could not load projectNotes.json from server.');
    }
    
    let localNotes = [];
    try {
      const stored = localStorage.getItem('projectNotes');
      if (stored && stored !== 'undefined') {
        localNotes = JSON.parse(stored) || [];
      }
    } catch (e) {
      console.error('Failed to parse local project notes:', e);
    }
    if (!Array.isArray(localNotes)) localNotes = [];

    const mergedNotes = [...serverNotes];
    localNotes.forEach(localN => {
      if (!localN || !localN.id) return;
      const exists = mergedNotes.some(serverN => serverN && serverN.id === localN.id);
      if (!exists) {
        mergedNotes.push(localN);
      } else {
        const idx = mergedNotes.findIndex(serverN => serverN && serverN.id === localN.id);
        if (idx !== -1) {
          mergedNotes[idx] = { ...mergedNotes[idx], ...localN };
        }
      }
    });
    
    appState.projectNotes = mergedNotes;
    localStorage.setItem('projectNotes', JSON.stringify(mergedNotes));
    
    renderAll();
  } catch (error) {
    console.error('Error fetching data:', error);
    elements.recentStudyList.innerHTML = `<p class="error-msg">데이터 로드 실패: ${error.message}</p>`;
  }
}

// Seed default projects (merged with server if exists)
async function initProjects() {
  let serverProjects = [];
  try {
    const res = await fetch('./posts/projects.json');
    if (res.ok) {
      serverProjects = await res.json();
    }
  } catch (e) {
    console.warn('Could not load projects.json from server.');
  }
  
  let localProjects = [];
  try {
    const stored = localStorage.getItem('projects');
    if (stored && stored !== 'undefined') {
      localProjects = JSON.parse(stored) || [];
    }
  } catch (e) {
    console.error('Failed to parse local projects:', e);
  }
  if (!Array.isArray(localProjects)) localProjects = [];
  
  if (serverProjects.length === 0 && localProjects.length === 0) {
    // Seed default projects
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
  } else {
    const merged = [...serverProjects];
    localProjects.forEach(localP => {
      if (!localP || !localP.id) return;
      const exists = merged.some(serverP => serverP && serverP.id === localP.id);
      if (!exists) {
        merged.push(localP);
      } else {
        const idx = merged.findIndex(serverP => serverP && serverP.id === localP.id);
        if (idx !== -1) {
          merged[idx] = { ...merged[idx], ...localP };
        }
      }
    });
    appState.projects = merged;
    localStorage.setItem('projects', JSON.stringify(merged));
  }
}

// Calculate D-Day
function calculateDDay(endDateStr) {
  const end = new Date(endDateStr);
  const diffTime = end - TODAY;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 0) return `D-${diffDays}`;
  if (diffDays === 0) return 'D-Day';
  return '종료됨';
}

// Tab Switching
function switchTab(tabId) {
  const validTabs = ['dashboard', 'study', 'projects', 'news', 'portfolio'];
  if (!validTabs.includes(tabId)) {
    tabId = 'dashboard';
  }
  
  appState.currentTab = tabId;
  appState.activePostId = null;
  appState.activePostType = null;
  appState.activeProjectId = null;
  
  elements.articlePane.style.display = 'none';
  elements.projectDetailView.style.display = 'none';
  elements.projectsListView.style.display = 'block';
  
  elements.navBtns.forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

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

// Render Active Project on Dashboard (Slim & D-day configured)
function renderActiveProject() {
  const activeProject = appState.projects.find(p => {
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    return TODAY >= start && TODAY <= end;
  }) || appState.projects[0];
  
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
  const dday = calculateDDay(activeProject.endDate);
  
  elements.dashboardActiveProjectWrapper.innerHTML = `
    <div class="active-project-bar">
      <div class="active-proj-info">
        <span class="dday-badge ${dday === '종료됨' ? 'ended' : ''}">${dday}</span>
        <span class="client-badge" style="margin-bottom: 0;">${activeProject.client}</span>
        <h4 class="active-proj-title" title="${activeProject.name}">${activeProject.name}</h4>
      </div>
      <div class="active-proj-progress-section">
        <div class="project-progress-wrapper" style="margin-bottom: 0;">
          <div class="progress-lbl-row" style="font-size: 0.78rem; margin-bottom: 0.2rem;">
            <span>진행률</span>
            <span>${progressPercent}%</span>
          </div>
          <div class="progress-bar" style="height: 5px;"><div class="progress" style="width: ${progressPercent}%;"></div></div>
        </div>
        <button class="btn-more btn-sm" id="btn-goto-active-proj" data-id="${activeProject.id}">이동</button>
      </div>
    </div>
  `;
  
  document.getElementById('btn-goto-active-proj')?.addEventListener('click', (e) => {
    const id = e.target.getAttribute('data-id');
    window.location.hash = `#/project/${id}`;
  });
}

// Render Dashboard (Stretched Lists with Empty Placeholders)
function renderDashboard() {
  const studyPosts = appState.posts.filter(p => p.category !== 'News' && matchSearch(p));
  elements.recentStudyList.innerHTML = '';
  
  if (studyPosts.length === 0) {
    elements.recentStudyList.innerHTML = `
      <div class="list-empty-placeholder">
        <span>등록된 스터디 노트가 없습니다.</span>
      </div>
    `;
  } else {
    studyPosts.slice(0, 6).forEach(post => {
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
    
    // Pad to fill vertical space if count is less than 6
    if (studyPosts.length < 6) {
      for (let i = studyPosts.length; i < 6; i++) {
        const dummy = document.createElement('div');
        dummy.className = 'recent-item';
        dummy.style.opacity = '0.2';
        dummy.style.cursor = 'default';
        dummy.style.borderStyle = 'dashed';
        dummy.innerHTML = `<div class="recent-item-title" style="color:transparent">Empty Record Slot</div>`;
        elements.recentStudyList.appendChild(dummy);
      }
    }
  }
  
  const newsPosts = appState.posts.filter(p => p.category === 'News' && matchSearch(p));
  elements.dashboardRecentNewsList.innerHTML = '';
  
  if (newsPosts.length === 0) {
    elements.dashboardRecentNewsList.innerHTML = `
      <div class="list-empty-placeholder">
        <span>등록된 보안 뉴스가 없습니다.</span>
      </div>
    `;
  } else {
    newsPosts.slice(0, 6).forEach(news => {
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
    
    // Pad to fill vertical space if count is less than 6
    if (newsPosts.length < 6) {
      for (let i = newsPosts.length; i < 6; i++) {
        const dummy = document.createElement('div');
        dummy.className = 'news-sidebar-item';
        dummy.style.opacity = '0.15';
        dummy.style.cursor = 'default';
        dummy.style.borderBottom = '1px dashed var(--border-color)';
        dummy.innerHTML = `
          <div class="news-sidebar-title" style="color:transparent">Empty Slot</div>
          <div class="news-sidebar-desc" style="color:transparent">Empty Description</div>
        `;
        elements.dashboardRecentNewsList.appendChild(dummy);
      }
    }
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
          ${post.tags ? post.tags.map(t => `<span class="badge">#${t}</span>`).join('') : ''}
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

// Render Projects Tab Table
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

// Show Project Detail View
function showProjectDetail(projectId) {
  const project = appState.projects.find(p => p.id === projectId);
  if (!project) {
    alert('해당 프로젝트를 찾을 수 없습니다.');
    window.location.hash = '#/tab/projects';
    return;
  }
  
  appState.activeProjectId = projectId;
  
  elements.projectsListView.style.display = 'none';
  elements.projectDetailView.style.display = 'block';
  elements.tabPanes.forEach(pane => pane.classList.remove('active'));
  document.getElementById('tab-projects').classList.add('active');
  
  elements.detailProjectName.textContent = project.name;
  elements.detailProjectClient.textContent = project.client;
  elements.detailProjectDesc.textContent = project.details;
  elements.detailProjectStart.textContent = project.startDate;
  elements.detailProjectEnd.textContent = project.endDate;
  
  const progressPercent = calculateProgress(project.startDate, project.endDate);
  elements.detailProjectPercent.textContent = `${progressPercent}%`;
  elements.detailProjectProgressBar.style.width = `${progressPercent}%`;
  
  renderProjectNotes(projectId);
}

// Render Notes associated with specific project
function renderProjectNotes(projectId) {
  elements.projectNotesGrid.innerHTML = '';
  
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
      showLocalNoteDetail(note);
    });
    elements.projectNotesGrid.appendChild(card);
  });
}

// Show Local Note Detail
function showLocalNoteDetail(note) {
  appState.activePostId = note.id;
  appState.activePostType = 'projectNote';
  
  elements.articlePane.style.display = 'block';
  elements.tabPanes.forEach(pane => pane.classList.remove('active'));
  
  elements.articleTitle.textContent = note.title;
  elements.articleDate.innerHTML = `<i class="fa-regular fa-calendar"></i> ${note.date}`;
  elements.articleCategory.className = 'meta-item badge project';
  elements.articleCategory.textContent = '프로젝트 기록';
  elements.articleType.style.display = 'none';
  elements.articleTags.innerHTML = '';
  
  elements.articleContent.innerHTML = marked.parse(note.content);
}

// Show Post Detail View
function showArticleDetail(postId) {
  const post = appState.posts.find(p => p.id === postId);
  if (!post) {
    elements.articleTitle.textContent = '글을 찾을 수 없습니다.';
    elements.articleContent.innerHTML = '<p class="text-muted">해당 글이 인덱스에 존재하지 않거나 경로 오류입니다.</p>';
    elements.articlePane.style.display = 'block';
    elements.tabPanes.forEach(pane => pane.classList.remove('active'));
    return;
  }
  
  appState.activePostId = postId;
  appState.activePostType = 'general';
  
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
  
  elements.articleTags.innerHTML = post.tags ? post.tags.map(t => `<span class="badge">#${t}</span>`).join('') : '';
  elements.articleContent.innerHTML = marked.parse(post.content || `# ${post.title}\n\n내용이 비어 있습니다.`);
  
  elements.articlePane.style.display = 'block';
  elements.tabPanes.forEach(pane => pane.classList.remove('active'));
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

// Unicode-Safe Base64 encoding
function utf8ToBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

// GitHub REST API Commit Helper
async function commitToGitHub(filePath, fileContent, commitMessage) {
  if (!appState.syncEnabled || !appState.githubPat) {
    return true; // Sync disabled, treat as local-only success
  }
  
  showLoader('깃허브 연동 중...', '저장소 파일 정보를 동기화하고 있습니다.');
  
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;
  const headers = {
    'Authorization': `token ${appState.githubPat}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  };
  
  try {
    // 1. Get current file SHA (if it exists)
    let sha = null;
    const getRes = await fetch(url, { headers });
    if (getRes.status === 200) {
      const getJson = await getRes.json();
      sha = getJson.sha;
    }
    
    // 2. Commit file
    const body = {
      message: commitMessage,
      content: utf8ToBase64(fileContent)
    };
    if (sha) {
      body.sha = sha;
    }
    
    const putRes = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    });
    
    if (!putRes.ok) {
      const errJson = await putRes.json();
      throw new Error(errJson.message || 'PUT request failed');
    }
    
    return true;
  } catch (error) {
    console.error('GitHub API error:', error);
    alert(`깃허브 동기화 실패: ${error.message}\n(로컬 저장소에는 기록되었으나 클라우드 배포는 지연됩니다.)`);
    return false;
  } finally {
    hideLoader();
  }
}

// Spinner Helper
function showLoader(title, desc) {
  if (!elements.deployOverlay) return;
  elements.deployOverlayTitle.textContent = title;
  elements.deployOverlayDesc.textContent = desc;
  elements.deployOverlay.style.display = 'flex';
}
function hideLoader() {
  if (elements.deployOverlay) {
    elements.deployOverlay.style.display = 'none';
  }
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
    if (appState.activePostType === 'projectNote') {
      window.location.hash = `#/project/${appState.activeProjectId}`;
    } else if (appState.activePostType === 'general') {
      const post = appState.posts.find(p => p.id === appState.activePostId);
      if (post) {
        window.location.hash = post.category === 'News' ? '#/tab/news' : '#/tab/study';
      }
    } else {
      window.location.hash = `#/tab/${elements.currentTab}`;
    }
  });
  
  // Theme Toggle
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
  
  // Settings Modal Handlers
  elements.btnOpenSettings.addEventListener('click', () => {
    document.getElementById('sync-toggle').checked = appState.syncEnabled;
    document.getElementById('github-pat').value = appState.githubPat;
    elements.settingsModal.style.display = 'flex';
  });
  elements.btnCloseSettingsModal.addEventListener('click', () => {
    elements.settingsModal.style.display = 'none';
  });
  elements.btnCancelSettings.addEventListener('click', () => {
    elements.settingsModal.style.display = 'none';
  });
  
  // Save Settings Form
  elements.settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const enabled = document.getElementById('sync-toggle').checked;
    const pat = document.getElementById('github-pat').value.trim();
    
    appState.syncEnabled = enabled;
    appState.githubPat = pat;
    
    localStorage.setItem('github_sync_enabled', enabled);
    localStorage.setItem('github_pat', pat);
    
    updateSyncIndicator();
    elements.settingsModal.style.display = 'none';
    
    alert('깃허브 동기화 설정이 저장되었습니다!');
  });
  
  // Project Modal Handlers
  elements.btnOpenAddProject.addEventListener('click', () => {
    elements.projectModalTitle.innerHTML = '<i class="fa-solid fa-diagram-project"></i> 새로운 프로젝트 등록';
    elements.projectEditId.value = '';
    elements.addProjectForm.reset();
    elements.btnSubmitProject.textContent = '등록하기';
    elements.addProjectModal.style.display = 'flex';
  });
  elements.btnCloseProjectModal.addEventListener('click', () => {
    elements.addProjectModal.style.display = 'none';
  });
  elements.btnCancelProject.addEventListener('click', () => {
    elements.addProjectModal.style.display = 'none';
  });
  
  // Project Detail edit / delete
  elements.btnEditProject.addEventListener('click', () => {
    const project = appState.projects.find(p => p.id === appState.activeProjectId);
    if (!project) return;
    
    elements.projectModalTitle.innerHTML = '<i class="fa-solid fa-diagram-project"></i> 프로젝트 정보 수정';
    elements.projectEditId.value = project.id;
    document.getElementById('project-name').value = project.name;
    document.getElementById('project-client').value = project.client;
    document.getElementById('project-start').value = project.startDate;
    document.getElementById('project-end').value = project.endDate;
    document.getElementById('project-details').value = project.details;
    elements.btnSubmitProject.textContent = '수정하기';
    elements.addProjectModal.style.display = 'flex';
  });
  
  elements.btnDeleteProject.addEventListener('click', async () => {
    if (confirm('정말로 이 프로젝트를 삭제하시겠습니까?\n프로젝트 내의 게시판 글도 함께 삭제됩니다.')) {
      appState.projects = appState.projects.filter(p => p.id !== appState.activeProjectId);
      appState.projectNotes = appState.projectNotes.filter(n => n.projectId !== appState.activeProjectId);
      
      localStorage.setItem('projects', JSON.stringify(appState.projects));
      localStorage.setItem('projectNotes', JSON.stringify(appState.projectNotes));
      
      // Sync list state to GitHub
      if (appState.syncEnabled) {
        await commitToGitHub('public/posts/projects.json', JSON.stringify(appState.projects, null, 2), 'chore: delete project metadata via web CMS');
        await commitToGitHub('public/posts/projectNotes.json', JSON.stringify(appState.projectNotes, null, 2), 'chore: clean up project notes via web CMS');
      }
      
      window.location.hash = '#/tab/projects';
    }
  });
  
  // Project detail back button
  elements.btnBackToProjectsList.addEventListener('click', () => {
    window.location.hash = '#/tab/projects';
  });
  
  // Note Modal (Project Notes)
  elements.btnOpenAddNote?.addEventListener('click', () => {
    elements.noteModalTitle.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> 새 기록 작성';
    elements.noteEditId.value = '';
    elements.addNoteForm.reset();
    elements.btnSubmitNote.textContent = '기록 추가';
    elements.addNoteModal.style.display = 'flex';
  });
  elements.btnCloseNoteModal?.addEventListener('click', () => {
    elements.addNoteModal.style.display = 'none';
  });
  elements.btnCancelNote?.addEventListener('click', () => {
    elements.addNoteModal.style.display = 'none';
  });
  
  // Study Modal (General Study Notes)
  elements.btnOpenAddStudy?.addEventListener('click', () => {
    elements.studyModalTitle.innerHTML = '<i class="fa-solid fa-pen-nib"></i> 새 스터디 노트 작성';
    elements.studyEditId.value = '';
    elements.addStudyForm.reset();
    elements.btnSubmitStudy.textContent = '등록하기';
    elements.addStudyModal.style.display = 'flex';
  });
  elements.btnCloseStudyModal?.addEventListener('click', () => {
    elements.addStudyModal.style.display = 'none';
  });
  elements.btnCancelStudy?.addEventListener('click', () => {
    elements.addStudyModal.style.display = 'none';
  });
  
  // Article detail Edit & Delete buttons
  elements.btnEditArticle.addEventListener('click', () => {
    if (appState.activePostType === 'projectNote') {
      const note = appState.projectNotes.find(n => n.id === appState.activePostId);
      if (!note) return;
      
      elements.noteModalTitle.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> 기록 수정';
      elements.noteEditId.value = note.id;
      document.getElementById('note-title').value = note.title;
      document.getElementById('note-content').value = note.content;
      elements.btnSubmitNote.textContent = '수정하기';
      elements.addNoteModal.style.display = 'flex';
    } else {
      const post = appState.posts.find(p => p.id === appState.activePostId);
      if (!post) return;
      
      elements.studyModalTitle.innerHTML = '<i class="fa-solid fa-pen-nib"></i> 스터디 노트 수정';
      elements.studyEditId.value = post.id;
      document.getElementById('study-title').value = post.title;
      document.getElementById('study-category').value = post.category;
      document.getElementById('study-type').value = post.type;
      document.getElementById('study-tags').value = post.tags ? post.tags.join(', ') : '';
      document.getElementById('study-content').value = post.content || '';
      elements.btnSubmitStudy.textContent = '수정하기';
      elements.addStudyModal.style.display = 'flex';
    }
  });
  
  elements.btnDeleteArticle.addEventListener('click', async () => {
    if (!confirm('정말로 이 글을 삭제하시겠습니까?')) return;
    
    if (appState.activePostType === 'projectNote') {
      appState.projectNotes = appState.projectNotes.filter(n => n.id !== appState.activePostId);
      localStorage.setItem('projectNotes', JSON.stringify(appState.projectNotes));
      
      if (appState.syncEnabled) {
        await commitToGitHub('public/posts/projectNotes.json', JSON.stringify(appState.projectNotes, null, 2), 'chore: delete project note via web CMS');
      }
      
      window.location.hash = `#/project/${appState.activeProjectId}`;
    } else {
      const postToDelete = appState.posts.find(p => p.id === appState.activePostId);
      appState.posts = appState.posts.filter(p => p.id !== appState.activePostId);
      localStorage.setItem('posts', JSON.stringify(appState.posts));
      
      if (appState.syncEnabled && postToDelete) {
        const cleanPosts = appState.posts.map(p => {
          const { content, ...rest } = p;
          return {
            ...rest,
            filePath: p.filePath || `posts/${p.id}.md`
          };
        });
        
        await commitToGitHub('public/posts/posts.json', JSON.stringify(cleanPosts, null, 2), 'chore: remove study note from index via web CMS');
      }
      
      window.location.hash = '#/tab/study';
    }
  });
  
  // Form Submit: Add/Edit Project
  // Form Submit: Add/Edit Project
  elements.addProjectForm.addEventListener('submit', async (e) => {
    try {
      e.preventDefault();
      const editId = elements.projectEditId.value;
      
      const projData = {
        name: document.getElementById('project-name').value,
        client: document.getElementById('project-client').value,
        startDate: document.getElementById('project-start').value,
        endDate: document.getElementById('project-end').value,
        details: document.getElementById('project-details').value
      };
      
      let targetId = editId;
      if (editId) {
        const index = appState.projects.findIndex(p => p.id === editId);
        if (index !== -1) {
          appState.projects[index] = { ...appState.projects[index], ...projData };
        }
      } else {
        targetId = 'project-' + Date.now();
        const newProj = {
          id: targetId,
          ...projData
        };
        appState.projects.unshift(newProj);
      }
      
      // Save locally first
      localStorage.setItem('projects', JSON.stringify(appState.projects));
      
      renderAll();
      elements.addProjectForm.reset();
      elements.addProjectModal.style.display = 'none';
      showProjectDetail(targetId);
      
      // Sync to GitHub in the background
      if (appState.syncEnabled) {
        await commitToGitHub('public/posts/projects.json', JSON.stringify(appState.projects, null, 2), `feat: update project metadata for ${projData.name}`);
      }
    } catch (err) {
      console.error('Error submitting project form:', err);
      alert('프로젝트 저장 실패: ' + err.message);
    }
  });
  
  // Form Submit: Add/Edit Project Note
  elements.addNoteForm?.addEventListener('submit', async (e) => {
    try {
      e.preventDefault();
      const editId = elements.noteEditId.value;
      
      const noteData = {
        title: document.getElementById('note-title').value,
        content: document.getElementById('note-content').value,
      };
      
      let noteToSync = null;
      if (editId) {
        const index = appState.projectNotes.findIndex(n => n.id === editId);
        if (index !== -1) {
          appState.projectNotes[index] = { ...appState.projectNotes[index], ...noteData };
          noteToSync = appState.projectNotes[index];
          if (appState.activePostId === editId) {
            showLocalNoteDetail(appState.projectNotes[index]);
          }
        }
      } else {
        if (!appState.activeProjectId) return;
        noteToSync = {
          id: 'note-' + Date.now(),
          projectId: appState.activeProjectId,
          date: new Date().toISOString().split('T')[0],
          ...noteData
        };
        appState.projectNotes.unshift(noteToSync);
      }
      
      // Save locally first
      localStorage.setItem('projectNotes', JSON.stringify(appState.projectNotes));
      
      renderProjectNotes(appState.activeProjectId);
      elements.addNoteForm.reset();
      elements.addNoteModal.style.display = 'none';
      
      // Sync in background
      if (appState.syncEnabled) {
        await commitToGitHub('public/posts/projectNotes.json', JSON.stringify(appState.projectNotes, null, 2), `feat: update project note index for ${noteData.title}`);
      }
    } catch (err) {
      console.error('Error submitting note form:', err);
      alert('기록 저장 실패: ' + err.message);
    }
  });
  
  // Form Submit: Add/Edit Study Note
  elements.addStudyForm.addEventListener('submit', async (e) => {
    try {
      e.preventDefault();
      const editId = elements.studyEditId.value;
      
      const tagsString = document.getElementById('study-tags').value;
      const tags = tagsString.split(',').map(t => t.trim()).filter(t => t.length > 0);
      
      const studyData = {
        title: document.getElementById('study-title').value,
        category: document.getElementById('study-category').value,
        type: document.getElementById('study-type').value,
        tags: tags,
        content: document.getElementById('study-content').value
      };
      
      let targetPostId = editId;
      if (editId) {
        const index = appState.posts.findIndex(p => p.id === editId);
        if (index !== -1) {
          appState.posts[index] = { ...appState.posts[index], ...studyData };
        }
      } else {
        targetPostId = 'study-' + Date.now();
        const newPost = {
          id: targetPostId,
          date: new Date().toISOString().split('T')[0],
          filePath: `posts/${targetPostId}.md`,
          ...studyData
        };
        appState.posts.unshift(newPost);
      }
      
      // Save locally FIRST
      localStorage.setItem('posts', JSON.stringify(appState.posts));
      
      renderAll();
      elements.addStudyForm.reset();
      elements.addStudyModal.style.display = 'none';
      if (editId) {
        showArticleDetail(editId);
      }
      
      // Sync to GitHub in background
      if (appState.syncEnabled) {
        const filePath = `public/posts/${targetPostId}.md`;
        const isContentSyncSuccess = await commitToGitHub(filePath, studyData.content, `feat: publish post content for ${studyData.title}`);
        
        if (isContentSyncSuccess) {
          const cleanPosts = appState.posts.map(p => {
            const { content, ...rest } = p;
            return {
              ...rest,
              filePath: p.filePath || `posts/${p.id}.md`
            };
          });
          await commitToGitHub('public/posts/posts.json', JSON.stringify(cleanPosts, null, 2), `feat: update posts index for ${studyData.title}`);
        }
      }
    } catch (err) {
      console.error('Error submitting study form:', err);
      alert('스터디 노트 저장 실패: ' + err.message);
    }
  });
}

