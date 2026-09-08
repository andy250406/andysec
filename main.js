// import marked parser dynamically from a ESM CDN
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';

// Constants & API Endpoints
const TODAY = new Date(); // Actual current date

// Google Apps Script Web App Deployment URL
const GAS_API_URL = localStorage.getItem('gas_api_url') || 'https://script.google.com/macros/s/AKfycby_5htUVodm_M16r25fUOyNAkNG7cpx3L1X098TYGtvS6KYN4nv8h8N5-wnNsveytLz8Q/exec';

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
  isAdmin: false,          // Administrator unlocked status
  adminPassword: ''        // Cached admin password for GAS cross-validation
};

// DOM Elements
const elements = {
  navBtns: document.querySelectorAll('.nav-menu .nav-btn'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  themeToggle: document.getElementById('theme-toggle'),
  adminAuthBtn: document.getElementById('admin-auth-btn'),
  liveClock: document.getElementById('live-clock'),
  globalSearch: document.getElementById('global-search'),
  
  // Dashboard Elements
  dashboardActiveProjectWrapper: document.getElementById('dashboard-active-project-wrapper'),
  recentStudyList: document.getElementById('recent-study-list'),
  dashboardRecentNewsList: document.getElementById('dashboard-recent-news-list'),
  
  // Study Tab
  studyFilterBar: document.getElementById('study-filter-bar'),
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
  
  // Deploy Overlay / Loading Spinner
  deployOverlay: document.getElementById('deploy-overlay'),
  deployOverlayTitle: document.getElementById('deploy-overlay-title'),
  deployOverlayDesc: document.getElementById('deploy-overlay-desc'),
  
  // Modals
  addProjectModal: document.getElementById('add-project-modal'),
  addNoteModal: document.getElementById('add-note-modal'),
  addStudyModal: document.getElementById('add-study-modal'),
  adminAuthModal: document.getElementById('admin-auth-modal'),
  
  // Modal Titles & Hidden inputs
  projectModalTitle: document.getElementById('project-modal-title'),
  projectEditId: document.getElementById('project-edit-id'),
  btnSubmitProject: document.getElementById('btn-submit-project'),
  
  noteModalTitle: document.getElementById('note-modal-title'),
  noteEditId: document.getElementById('note-edit-id'),
  btnSubmitNote: document.getElementById('btn-submit-note'),
  
  studyModalTitle: document.getElementById('study-modal-title'),
  studyEditId: document.getElementById('study-edit-id'),
  studyCategory: document.getElementById('study-category'),
  btnSubmitStudy: document.getElementById('btn-submit-study'),
  
  // Admin Auth Form & Elements
  adminAuthForm: document.getElementById('admin-auth-form'),
  adminPasswordInput: document.getElementById('admin-password-input'),
  adminPwdGroup: document.getElementById('admin-pwd-group'),
  adminStatusInfo: document.getElementById('admin-status-info'),
  btnSubmitAdmin: document.getElementById('btn-submit-admin'),
  btnLogoutAdmin: document.getElementById('btn-logout-admin'),
  btnCloseAdminModal: document.getElementById('btn-close-admin-modal'),
  btnCancelAdmin: document.getElementById('btn-cancel-admin'),
  
  // Forms
  addProjectForm: document.getElementById('add-project-form'),
  addNoteForm: document.getElementById('add-note-form'),
  addStudyForm: document.getElementById('add-study-form'),
  
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
  
  // News Tab
  fullNewsTable: document.getElementById('full-news-table'),
  newsImportanceFilter: document.getElementById('news-importance-filter'),
  btnNewsDeleteMode: document.getElementById('btn-news-delete-mode'),
  newsDeleteActions: document.getElementById('news-delete-actions'),
  btnNewsDeleteConfirm: document.getElementById('btn-news-delete-confirm'),
  btnNewsDeleteCancel: document.getElementById('btn-news-delete-cancel'),
  newsSelectAll: document.getElementById('news-select-all'),
  
  // Article Pane
  articlePane: document.getElementById('article-detail-pane'),
  btnBackToList: document.getElementById('btn-back-to-list'),
  btnEditArticle: document.getElementById('btn-edit-article'),
  btnDeleteArticle: document.getElementById('btn-delete-article'),
  articleTitle: document.getElementById('article-title'),
  articleDate: document.getElementById('article-date'),
  articleCategory: document.getElementById('article-category'),
  articleType: document.getElementById('article-type'),
  articleContent: document.getElementById('article-content'),
  
  // Note Editor Pane (Full-page)
  noteEditorPane: document.getElementById('note-editor-pane'),
  btnCancelEditor: document.getElementById('btn-cancel-editor'),
  btnSaveEditor: document.getElementById('btn-save-editor'),
  editorViewTitle: document.getElementById('editor-view-title'),
  editorPostId: document.getElementById('editor-post-id'),
  editorPostTitle: document.getElementById('editor-post-title'),
  editorCategorySelect: document.getElementById('editor-category-select'),
  editorCustomCategoryInput: document.getElementById('editor-custom-category-input'),
  btnDeleteSelectedCategory: document.getElementById('btn-delete-selected-category'),
  editorPostType: document.getElementById('editor-post-type'),
  editorNewsFieldsGroup: document.getElementById('editor-news-fields-group'),
  editorNewsImportance: document.getElementById('editor-news-importance'),
  editorNewsSource: document.getElementById('editor-news-source'),
  editorNewsDate: document.getElementById('editor-news-date'),
  editorNewsLink: document.getElementById('editor-news-link'),
  btnToggleGuideBanner: document.getElementById('btn-toggle-guide-banner'),
  editorGuideBody: document.getElementById('editor-guide-body'),
  editorMainTextarea: document.getElementById('editor-main-textarea'),
  editorWysiwygContent: document.getElementById('editor-wysiwyg-content'),
  editorWordCount: document.getElementById('editor-word-count'),
  
  // Link Title Bubble Popover
  editorLinkBubble: document.getElementById('editor-link-bubble'),
  linkBubbleUrlDisplay: document.getElementById('link-bubble-url-display'),
  linkBubbleTitleInput: document.getElementById('link-bubble-title-input'),
  btnLinkBubbleApply: document.getElementById('btn-link-bubble-apply'),
  btnLinkBubbleKeepUrl: document.getElementById('btn-link-bubble-keep-url'),
  btnLinkBubbleClose: document.getElementById('btn-link-bubble-close'),
  
  // Table Generator Modal
  tableGeneratorModal: document.getElementById('table-generator-modal'),
  btnOpenTableModal: document.getElementById('btn-open-table-modal'),
  btnCloseTableModal: document.getElementById('btn-close-table-modal'),
  btnCancelTable: document.getElementById('btn-cancel-table'),
  tableGeneratorForm: document.getElementById('table-generator-form'),
  tableInputCols: document.getElementById('table-input-cols'),
  tableInputRows: document.getElementById('table-input-rows'),
  tableInputAlign: document.getElementById('table-input-align'),

  // More buttons
  moreBtns: document.querySelectorAll('.btn-more')
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initTheme();
  loadAdminAuth();
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

// Load Admin Auth State from LocalStorage
function loadAdminAuth() {
  const cachedPwd = localStorage.getItem('admin_auth_pwd') || '';
  if (cachedPwd) {
    appState.isAdmin = true;
    appState.adminPassword = cachedPwd;
  } else {
    appState.isAdmin = false;
    appState.adminPassword = '';
  }
  
  updateAdminUI();
}

function updateAdminUI() {
  if (elements.adminAuthBtn) {
    if (appState.isAdmin) {
      elements.adminAuthBtn.classList.add('admin-unlocked');
      elements.adminAuthBtn.title = '관리자 인증됨 (클릭하여 관리)';
    } else {
      elements.adminAuthBtn.classList.remove('admin-unlocked');
      elements.adminAuthBtn.title = '관리자 인증 (열쇠)';
    }
  }
  applyAdminPermissions();
}

// Dynamically toggles write/edit/delete actions based on Admin Status
function applyAdminPermissions() {
  const isAdmin = appState.isAdmin;
  
  if (elements.btnOpenAddStudy) elements.btnOpenAddStudy.style.display = isAdmin ? 'block' : 'none';
  if (elements.btnOpenAddProject) elements.btnOpenAddProject.style.display = isAdmin ? 'block' : 'none';
  if (elements.btnEditProject) elements.btnEditProject.style.display = isAdmin ? 'inline-block' : 'none';
  if (elements.btnDeleteProject) elements.btnDeleteProject.style.display = isAdmin ? 'inline-block' : 'none';
  if (elements.btnOpenAddNote) elements.btnOpenAddNote.style.display = isAdmin ? 'block' : 'none';
  if (elements.btnEditArticle) elements.btnEditArticle.style.display = isAdmin ? 'inline-block' : 'none';
  if (elements.btnDeleteArticle) elements.btnDeleteArticle.style.display = isAdmin ? 'inline-block' : 'none';
  
  // Hide details view metadata action buttons if not admin
  const projectMetaActions = document.querySelector('.project-info-header .meta-actions');
  if (projectMetaActions) {
    projectMetaActions.style.display = isAdmin ? 'block' : 'none';
  }
  const articleActions = document.getElementById('article-detail-actions');
  if (articleActions) {
    articleActions.style.display = isAdmin ? 'block' : 'none';
  }

  if (elements.btnNewsDeleteMode) {
    if (!isAdmin) {
      elements.btnNewsDeleteMode.style.display = 'none';
      if (elements.newsDeleteActions) elements.newsDeleteActions.style.display = 'none';
    } else {
      elements.btnNewsDeleteMode.style.display = appState.newsDeleteMode ? 'none' : 'inline-block';
      if (elements.newsDeleteActions) elements.newsDeleteActions.style.display = appState.newsDeleteMode ? 'flex' : 'none';
    }
  }
}

// Router using Hash
function initRouter() {
  const handleRouting = () => {
    const hash = window.location.hash;
    
    if (elements.articlePane) elements.articlePane.style.display = 'none';
    if (elements.noteEditorPane) elements.noteEditorPane.style.display = 'none';
    
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

// Load All Data (GAS Sheets DB Priority + Local Fallback)
async function loadData() {
  try {
    let serverPosts = [];
    
    // 1. Fetch live posts from Google Apps Script (Sheets DB)
    showLoader('데이터 로딩 중...', '구글 시트 데이터베이스와 연결하고 있습니다.');
    let gasLoaded = false;
    try {
      const gasRes = await fetch(`${GAS_API_URL}?action=getPosts`, { method: 'GET' });
      if (gasRes.ok) {
        const gasData = await gasRes.json();
        if (gasData && gasData.success && Array.isArray(gasData.posts)) {
          serverPosts = gasData.posts;
          gasLoaded = true;
          console.log(`[GAS API] Successfully loaded ${serverPosts.length} posts from Sheets DB.`);
        }
      }
    } catch (gasErr) {
      console.warn('[GAS API] Live fetch failed or offline, falling back to local posts.json:', gasErr);
    } finally {
      hideLoader();
    }

    // Fallback: If GAS fetch failed, fetch static posts.json
    if (!gasLoaded || serverPosts.length === 0) {
      try {
        const response = await fetch('./posts/posts.json');
        if (response.ok) {
          serverPosts = await response.json();
          serverPosts = serverPosts.filter(p => p.category !== 'Project');
        }
      } catch (e) {
        console.warn('Could not load posts.json from server, falling back to local storage.');
      }
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
    const deletedIds = JSON.parse(localStorage.getItem('deletedPosts') || '[]');
    const deletedSet = new Set(deletedIds);
    const serverPostsFiltered = serverPosts.filter(p => p && p.id && !deletedSet.has(p.id));
    
    const mergedPosts = [...serverPostsFiltered];
    localPosts.forEach(localP => {
      if (!localP || !localP.id || deletedSet.has(localP.id)) return;
      const exists = mergedPosts.some(serverP => serverP && serverP.id === localP.id);
      if (!exists) {
        mergedPosts.push(localP);
      } else {
        const idx = mergedPosts.findIndex(serverP => serverP && serverP.id === localP.id);
        if (idx !== -1) {
          mergedPosts[idx] = { ...mergedPosts[idx], ...localP };
        }
      }
    });
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

// Calculate Progress Percentage
function calculateProgress(startStr, endStr) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  
  if (TODAY < start) return 0;
  if (TODAY > end) return 100;
  
  const total = end - start;
  const current = TODAY - start;
  
  return Math.min(100, Math.max(0, Math.round((current / total) * 100)));
}

// Strip Markdown syntax from a string for safe text excerpts
function stripMarkdown(mdString) {
  if (!mdString) return '';
  return mdString
    .replace(/[#*`~_\-+=|>]/g, '')            // Remove headers, bold, list markers, quotes
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links, keep anchor text
    .replace(/!\[[^\]]*\]\([^\)]+\)/g, '')   // Remove images
    .replace(/<\/?[^>]+(>|$)/g, '')          // Strip HTML tags
    .replace(/\s+/g, ' ')                    // Normalize whitespace
    .trim();
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
  
  if (elements.articlePane) elements.articlePane.style.display = 'none';
  if (elements.noteEditorPane) elements.noteEditorPane.style.display = 'none';
  if (elements.projectDetailView) elements.projectDetailView.style.display = 'none';
  if (elements.projectsListView) elements.projectsListView.style.display = 'block';
  
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
  renderStudyCategories();
  renderActiveProject();
  renderDashboard();
  renderStudyNotes();
  renderProjectsList();
  renderSecurityNews();
  applyAdminPermissions();
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
    if (p.category === 'News' || p.category === 'Project') return false;
    if (appState.studyFilter === 'all') {
      return true;
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
  
  const isSync = appState.syncEnabled && appState.githubPat;
  if (!isSync) {
    elements.projectNotesGrid.innerHTML = `
      <div class="lock-placeholder" style="grid-column: 1/-1; text-align: center; padding: 3rem 2rem; background: rgba(220, 38, 38, 0.04); border: 1px dashed rgba(220, 38, 38, 0.2); border-radius: 8px;">
        <i class="fa-solid fa-lock" style="font-size: 2rem; color: #ef4444; margin-bottom: 1rem; display: block;"></i>
        <h4 style="font-family: var(--font-header); font-size: 1.1rem; color: var(--text-highlight); margin-bottom: 0.5rem;">프로젝트 기록판 비활성화</h4>
        <p class="text-muted" style="font-size: 0.85rem; max-width: 460px; margin: 0 auto; line-height: 1.5;">
          본 프로젝트의 상세 스터디 및 진단 기록은 보안상 비공개 상태입니다. 접근 권한을 획득하려면 관리자 계정으로 <strong>깃허브 동기화</strong>를 인증하십시오.
        </p>
      </div>
    `;
    return;
  }
  
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
      <p class="note-card-excerpt">${stripMarkdown(note.content).substring(0, 120)}${stripMarkdown(note.content).length > 120 ? '...' : ''}</p>
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

// Reset Article Font Size to 100%
function resetTextSize() {
  const defaultBtn = document.querySelector('.text-size-btn[data-size="1em"]');
  if (defaultBtn) {
    const sizeBtns = document.querySelectorAll('.text-size-btn');
    sizeBtns.forEach(b => {
      b.classList.remove('active');
      b.style.background = 'none';
      b.style.color = 'var(--text-muted)';
      b.style.fontWeight = 'normal';
    });
    defaultBtn.classList.add('active');
    defaultBtn.style.background = 'var(--accent-color)';
    defaultBtn.style.color = '#fff';
    defaultBtn.style.fontWeight = '600';
  }
  if (elements.articleContent) {
    elements.articleContent.style.fontSize = '1em';
  }
}

// Helper: Replace {{img_1}}, {{img_2}} placeholders with actual image URLs
function replaceImagePlaceholders(content, images) {
  if (!content) return '';
  if (!images || !Array.isArray(images) || images.length === 0) return content;
  
  return content.replace(/\{\{img_(\d+)\}\}/g, (match, indexStr) => {
    const idx = parseInt(indexStr, 10) - 1;
    const url = images[idx];
    if (url) {
      return `![Image ${indexStr}](${url})`;
    }
    return match;
  });
}

// Show Local Note Detail
function showLocalNoteDetail(note) {
  resetTextSize();
  if (!appState.isAdmin) {
    alert('보안상 비공개 상태인 프로젝트 게시글입니다. 관리자 열쇠(🔑)로 인증 후 확인 가능합니다.');
    window.location.hash = '#/tab/projects';
    return;
  }
  appState.activePostId = note.id;
  appState.activePostType = 'projectNote';
  
  elements.articlePane.style.display = 'block';
  elements.tabPanes.forEach(pane => pane.classList.remove('active'));
  
  elements.articleTitle.textContent = note.title;
  elements.articleDate.innerHTML = `<i class="fa-regular fa-calendar"></i> ${note.date}`;
  elements.articleCategory.className = 'meta-item badge project';
  elements.articleCategory.textContent = '프로젝트 기록';
  elements.articleType.style.display = 'none';
  
  const processedContent = replaceImagePlaceholders(note.content, note.images);
  elements.articleContent.innerHTML = marked.parse(processedContent);
}

// Show Post Detail View
async function showArticleDetail(postId) {
  resetTextSize();
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
  
  if (!post.content) {
    elements.articleContent.innerHTML = '<p class="text-center text-muted" style="padding: 2rem;"><i class="fa-solid fa-spinner fa-spin"></i> 내용을 불러오는 중...</p>';
    try {
      const res = await fetch(`./${post.filePath}`);
      if (res.ok) {
        post.content = await res.text();
      } else {
        post.content = `# ${post.title}\n\n내용을 불러오지 못했습니다. (HTTP ${res.status})`;
      }
    } catch (e) {
      post.content = `# ${post.title}\n\n내용을 불러오는 중 오류가 발생했습니다.`;
    }
  }
  
  const processedContent = replaceImagePlaceholders(post.content, post.images);
  elements.articleContent.innerHTML = marked.parse(processedContent);
  
  elements.articlePane.style.display = 'block';
  elements.tabPanes.forEach(pane => pane.classList.remove('active'));
}

// Render Security News Tab List
function renderSecurityNews() {
  if (!elements.fullNewsTable) return;
  elements.fullNewsTable.innerHTML = '';
  
  const isDeleteMode = appState.newsDeleteMode;
  
  // Show or hide header checkbox column
  const deleteHeaders = document.querySelectorAll('.news-delete-col');
  deleteHeaders.forEach(el => {
    el.style.display = isDeleteMode ? 'table-cell' : 'none';
  });

  if (elements.newsSelectAll) {
    elements.newsSelectAll.checked = false;
  }
  
  const newsList = appState.posts.filter(p => {
    if (p.category !== 'News') return false;
    if (appState.newsFilter !== 'all' && p.importance !== appState.newsFilter) return false;
    return true;
  }).filter(matchSearch);
  
  if (newsList.length === 0) {
    elements.fullNewsTable.innerHTML = `<tr><td colspan="${isDeleteMode ? 6 : 5}" class="text-center text-muted" style="padding: 2rem;">해당 조건의 보안 뉴스가 존재하지 않습니다.</td></tr>`;
    return;
  }
  
  newsList.forEach(news => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="news-delete-col" style="${isDeleteMode ? '' : 'display: none;'} text-align: center;">
        <input type="checkbox" class="news-item-checkbox" data-id="${news.id}">
      </td>
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

// Helpers & Category Management
const DEFAULT_CATEGORIES = [
  { id: 'Cert', name: '자격증 공부' },
  { id: 'CertAnalysis', name: '보안인증 분석' },
  { id: 'Shieldus', name: '쉴더스 교육' }
];

function getCategoryName(category) {
  const mapping = {
    'Cert': '자격증 공부',
    'CertAnalysis': '보안인증 분석',
    'Shieldus': '쉴더스 교육',
    'Project': '프로젝트',
    'News': '보안 뉴스'
  };
  if (mapping[category]) return mapping[category];
  
  // Check stored custom categories
  const customCats = getCustomCategories();
  const found = customCats.find(c => c.id === category);
  return found ? found.name : category;
}

function getCustomCategories() {
  try {
    const raw = localStorage.getItem('custom_categories');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse custom_categories:', e);
  }
  return [];
}

function saveCustomCategories(cats) {
  localStorage.setItem('custom_categories', JSON.stringify(cats));
}

function getAllStudyCategories() {
  const customCats = getCustomCategories();
  const hiddenDefaults = JSON.parse(localStorage.getItem('hidden_default_cats') || '[]');
  const map = new Map();
  
  // 1. Default categories (filter out deleted default categories)
  DEFAULT_CATEGORIES.forEach(c => {
    if (!hiddenDefaults.includes(c.id)) {
      map.set(c.id, { ...c, isDefault: true });
    }
  });
  
  // 2. Custom categories in localStorage
  customCats.forEach(c => map.set(c.id, { ...c, isDefault: false }));
  
  // 3. Any category found in existing posts (in case of legacy/imported posts, provided not explicitly deleted)
  if (appState.posts && Array.isArray(appState.posts)) {
    appState.posts.forEach(p => {
      if (p.category && p.category !== 'News' && p.category !== 'Project' && p.category !== 'ProjectNote') {
        if (!map.has(p.category) && !hiddenDefaults.includes(p.category)) {
          map.set(p.category, { id: p.category, name: p.category, isDefault: false });
        }
      }
    });
  }
  
  return Array.from(map.values());
}

// Render dynamic study categories in both filter bar and editor dropdown
function renderStudyCategories() {
  const allCats = getAllStudyCategories();
  
  // 1. Render study filter bar buttons
  if (elements.studyFilterBar) {
    let filterHtml = `<button class="filter-btn ${appState.studyFilter === 'all' ? 'active' : ''}" data-filter="all">전체</button>`;
    allCats.forEach(cat => {
      const activeClass = appState.studyFilter === cat.id ? 'active' : '';
      filterHtml += `<button class="filter-btn ${activeClass}" data-filter="${cat.id}">${cat.name}</button>`;
    });
    elements.studyFilterBar.innerHTML = filterHtml;
    
    // Re-bind click events on dynamic filter buttons
    const btns = elements.studyFilterBar.querySelectorAll('.filter-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        appState.studyFilter = btn.getAttribute('data-filter');
        renderStudyNotes();
      });
    });
  }

  // 2. Render category select options in Note Editor
  if (elements.editorCategorySelect) {
    const currentVal = elements.editorCategorySelect.value;
    let selectHtml = '';
    allCats.forEach(cat => {
      selectHtml += `<option value="${cat.id}">${cat.name}</option>`;
    });
    selectHtml += `<option value="custom">+ 직접 입력 (새 카테고리)</option>`;
    elements.editorCategorySelect.innerHTML = selectHtml;
    
    if (currentVal && Array.from(elements.editorCategorySelect.options).some(o => o.value === currentVal)) {
      elements.editorCategorySelect.value = currentVal;
    }
  }
}

// Category Deletion with Strict Post-Existence Validation
function deleteCategory(targetCategoryId) {
  if (!appState.isAdmin) {
    alert('카테고리 관리는 관리자 인증(🔑) 후에만 가능합니다.');
    return;
  }
  
  if (!targetCategoryId || targetCategoryId === 'custom') {
    alert('삭제할 카테고리를 먼저 선택해 주세요.');
    return;
  }
  
  // Count how many posts exist under this category
  const postsCount = appState.posts.filter(p => p.category === targetCategoryId).length;
  
  if (postsCount > 0) {
    alert(`[삭제 불가 경고]\n\n해당 카테고리('${getCategoryName(targetCategoryId)}')로 작성된 게시글이 ${postsCount}건 존재합니다.\n\n글이 존재하는 카테고리는 삭제할 수 없습니다. 글을 다른 카테고리로 이동하거나 먼저 삭제해 주세요.`);
    return;
  }
  
  const catName = getCategoryName(targetCategoryId);
  if (!confirm(`'${catName}' 카테고리를 정말로 삭제하시겠습니까?\n(해당 카테고리로 작성된 글이 없어 안전하게 삭제됩니다.)`)) {
    return;
  }
  
  // Remove from custom categories
  let customCats = getCustomCategories();
  customCats = customCats.filter(c => c.id !== targetCategoryId);
  saveCustomCategories(customCats);
  
  // Also check if default category
  const isDef = DEFAULT_CATEGORIES.some(c => c.id === targetCategoryId);
  if (isDef) {
    let hiddenDefaults = JSON.parse(localStorage.getItem('hidden_default_cats') || '[]');
    if (!hiddenDefaults.includes(targetCategoryId)) {
      hiddenDefaults.push(targetCategoryId);
      localStorage.setItem('hidden_default_cats', JSON.stringify(hiddenDefaults));
    }
  }
  
  // Reset current filter if active
  if (appState.studyFilter === targetCategoryId) {
    appState.studyFilter = 'all';
  }
  
  renderStudyCategories();
  renderStudyNotes();
  
  if (elements.editorCategorySelect) {
    elements.editorCategorySelect.value = 'Cert';
  }
  if (elements.editorCustomCategoryInput) {
    elements.editorCustomCategoryInput.style.display = 'none';
    elements.editorCustomCategoryInput.value = '';
  }
  
  alert(`'${catName}' 카테고리가 안전하게 삭제되었습니다.`);
}

function matchSearch(post) {
  if (!appState.searchQuery) return true;
  const q = appState.searchQuery.toLowerCase();
  const title = post.title.toLowerCase();
  const typeMatch = post.type && post.type.toLowerCase().includes(q);
  return title.includes(q) || typeMatch;
}

// Unicode-Safe Base64 encoding
function utf8ToBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

// GAS Backend API Communication Helper
async function sendToGasApi(action, data = {}) {
  if (!appState.adminPassword) {
    throw new Error('관리자 인증이 필요합니다. 상단 열쇠(🔑) 버튼을 눌러 인증해 주세요.');
  }

  showLoader('데이터 처리 중...', 'Google Sheets 데이터베이스와 통신하고 있습니다.');

  try {
    const payload = {
      password: appState.adminPassword,
      action: action,
      data: data
    };

    const response = await fetch(GAS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8' // GAS doPost CORS preflight 최적화
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`서버 응답 오류 (HTTP ${response.status})`);
    }

    const resJson = await response.json();
    if (!resJson.success) {
      throw new Error(resJson.error || '작업 수행 실패');
    }

    return resJson;
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

  // Admin Auth Key Button (🔑) Handler
  elements.adminAuthBtn?.addEventListener('click', () => {
    if (appState.isAdmin) {
      elements.adminStatusInfo.style.display = 'block';
      elements.adminPwdGroup.style.display = 'none';
      elements.btnLogoutAdmin.style.display = 'inline-block';
      elements.btnSubmitAdmin.style.display = 'none';
    } else {
      elements.adminStatusInfo.style.display = 'none';
      elements.adminPwdGroup.style.display = 'block';
      elements.btnLogoutAdmin.style.display = 'none';
      elements.btnSubmitAdmin.style.display = 'inline-block';
      elements.adminPasswordInput.value = '';
    }
    elements.adminAuthModal.style.display = 'flex';
  });

  elements.btnCloseAdminModal?.addEventListener('click', () => {
    elements.adminAuthModal.style.display = 'none';
  });
  elements.btnCancelAdmin?.addEventListener('click', () => {
    elements.adminAuthModal.style.display = 'none';
  });

  // Admin Auth Form Submit
  elements.adminAuthForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pwd = elements.adminPasswordInput.value.trim();
    if (!pwd) {
      alert('관리자 비밀번호를 입력해 주세요.');
      return;
    }

    showLoader('비밀번호 검증 중...', '관리자 권한을 확인하고 있습니다.');
    try {
      // Optional cross-validation with GAS if URL reachable
      let verified = false;
      try {
        const testRes = await fetch(GAS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ password: pwd, action: 'verifyPassword' })
        });
        if (testRes.ok) {
          const testJson = await testRes.json();
          if (testJson.success) verified = true;
        }
      } catch (err) {
        // Fallback for offline or pre-deployment phase
        console.warn('GAS validation skipped or unreachable, accepting client input:', err);
        verified = true;
      }

      if (!verified) {
        throw new Error('관리자 비밀번호가 일치하지 않습니다.');
      }

      localStorage.setItem('admin_auth_pwd', pwd);
      appState.isAdmin = true;
      appState.adminPassword = pwd;
      updateAdminUI();
      elements.adminAuthModal.style.display = 'none';
      alert('관리자 인증이 완료되었습니다. 글 작성, 수정, 삭제 기능이 활성화되었습니다.');
    } catch (err) {
      alert('인증 실패: ' + err.message);
    } finally {
      hideLoader();
    }
  });

  // Admin Logout (Lock)
  elements.btnLogoutAdmin?.addEventListener('click', () => {
    if (confirm('관리자 모드를 잠그시겠습니까?')) {
      localStorage.removeItem('admin_auth_pwd');
      appState.isAdmin = false;
      appState.adminPassword = '';
      updateAdminUI();
      elements.adminAuthModal.style.display = 'none';
      alert('관리자 모드가 잠겼습니다.');
    }
  });
  
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
  
  // Note Editor Functions
  function openNoteEditor(postId = null) {
    if (!appState.isAdmin) {
      alert('글 작성/수정은 관리자 인증(🔑) 후에만 가능합니다.');
      return;
    }

    // Hide other views
    elements.tabPanes.forEach(pane => pane.classList.remove('active'));
    if (elements.articlePane) elements.articlePane.style.display = 'none';
    if (elements.projectDetailView) elements.projectDetailView.style.display = 'none';
    if (elements.projectsListView) elements.projectsListView.style.display = 'none';
    
    // Show editor pane
    if (elements.noteEditorPane) elements.noteEditorPane.style.display = 'flex';

    // Populate category dropdown
    renderStudyCategories();

    if (postId) {
      // Editing existing post
      const post = appState.posts.find(p => p.id === postId);
      if (!post) {
        alert('수정할 글을 찾을 수 없습니다.');
        return;
      }
      
      const isNews = post.category === 'News';
      elements.editorViewTitle.innerHTML = isNews ? '<i class="fa-solid fa-newspaper"></i> 보안 뉴스 수정' : '<i class="fa-solid fa-pen-nib"></i> 스터디 노트 수정';
      elements.editorPostId.value = post.id;
      elements.editorPostTitle.value = post.title || '';
      
      // Category selection
      const existsInSelect = Array.from(elements.editorCategorySelect.options).some(o => o.value === post.category);
      if (existsInSelect) {
        elements.editorCategorySelect.value = post.category;
        elements.editorCustomCategoryInput.style.display = 'none';
        elements.editorCustomCategoryInput.value = '';
      } else {
        elements.editorCategorySelect.value = 'custom';
        elements.editorCustomCategoryInput.style.display = 'block';
        elements.editorCustomCategoryInput.value = post.category || '';
      }
      
      elements.editorPostType.value = post.type || (isNews ? 'News' : '보안');
      const rawMarkdown = post.content || '';
      elements.editorMainTextarea.value = rawMarkdown;
      if (elements.editorWysiwygContent) {
        elements.editorWysiwygContent.innerHTML = rawMarkdown ? marked.parse(rawMarkdown) : '';
      }
      
      // News specific fields
      if (elements.editorNewsFieldsGroup) {
        elements.editorNewsFieldsGroup.style.display = isNews ? 'block' : 'none';
        if (isNews) {
          elements.editorNewsImportance.value = post.importance || '⭐⭐⭐';
          elements.editorNewsSource.value = post.source || '';
          elements.editorNewsDate.value = post.date || '';
          elements.editorNewsLink.value = post.newsLink || '';
        }
      }
    } else {
      // New post
      elements.editorViewTitle.innerHTML = '<i class="fa-solid fa-pen-nib"></i> 새 스터디 노트 작성';
      elements.editorPostId.value = '';
      elements.editorPostTitle.value = '';
      elements.editorCategorySelect.value = 'Cert';
      elements.editorCustomCategoryInput.style.display = 'none';
      elements.editorCustomCategoryInput.value = '';
      elements.editorPostType.value = '';
      elements.editorMainTextarea.value = '';
      if (elements.editorWysiwygContent) {
        elements.editorWysiwygContent.innerHTML = '';
      }
      
      if (elements.editorNewsFieldsGroup) {
        elements.editorNewsFieldsGroup.style.display = 'none';
        elements.editorNewsImportance.value = '⭐⭐⭐';
        elements.editorNewsSource.value = '';
        elements.editorNewsDate.value = new Date().toISOString().split('T')[0];
        elements.editorNewsLink.value = '';
      }
    }

    updateEditorWordCount();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeNoteEditor() {
    if (elements.noteEditorPane) elements.noteEditorPane.style.display = 'none';
    const targetTab = appState.currentTab || 'study';
    switchTab(targetTab);
  }

  function updateEditorWordCount() {
    if (elements.editorWordCount && elements.editorWysiwygContent) {
      const text = elements.editorWysiwygContent.innerText || '';
      elements.editorWordCount.textContent = `${text.trim().length}자`;
    }
  }

  // Convert HTML nodes back to clean Markdown
  function htmlNodeToMarkdown(node) {
    if (!node) return '';
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    // Handle interactive editor image card
    if (node.classList && node.classList.contains('editor-img-card')) {
      const img = node.querySelector('img');
      const src = img ? (img.getAttribute('src') || '') : '';
      const alt = img ? (img.getAttribute('alt') || '이미지') : '이미지';
      return `\n![${alt}](${src})\n\n`;
    }

    const tag = node.tagName.toLowerCase();
    const children = Array.from(node.childNodes).map(htmlNodeToMarkdown).join('');

    switch (tag) {
      case 'h1':
        return `\n# ${children.trim()}\n\n`;
      case 'h2':
        return `\n## ${children.trim()}\n\n`;
      case 'h3':
        return `\n### ${children.trim()}\n\n`;
      case 'h4':
        return `\n#### ${children.trim()}\n\n`;
      case 'h5':
        return `\n##### ${children.trim()}\n\n`;
      case 'h6':
        return `\n###### ${children.trim()}\n\n`;
      case 'p':
        return children.trim() ? `\n${children.trim()}\n\n` : '\n';
      case 'strong':
      case 'b':
        return `**${children}**`;
      case 'em':
      case 'i':
        return `*${children}*`;
      case 'del':
      case 's':
      case 'strike':
        return `~~${children}~~`;
      case 'code':
        if (node.parentElement && node.parentElement.tagName.toLowerCase() === 'pre') {
          return children;
        }
        return `\`${children}\``;
      case 'pre':
        return `\n\`\`\`\n${children.trim()}\n\`\`\`\n\n`;
      case 'blockquote':
        return `\n> ${children.trim().replace(/\n/g, '\n> ')}\n\n`;
      case 'ul':
        return `\n${children}\n`;
      case 'ol':
        return `\n${children}\n`;
      case 'li': {
        const parentTag = node.parentElement ? node.parentElement.tagName.toLowerCase() : 'ul';
        if (parentTag === 'ol') {
          const index = Array.from(node.parentElement.children).indexOf(node) + 1;
          return `${index}. ${children.trim()}\n`;
        }
        return `- ${children.trim()}\n`;
      }
      case 'hr':
        return `\n---\n\n`;
      case 'img': {
        const src = node.getAttribute('src') || '';
        const alt = node.getAttribute('alt') || '이미지';
        return `\n![${alt}](${src})\n\n`;
      }
      case 'a': {
        const href = node.getAttribute('href') || '';
        return `[${children.trim() || href}](${href})`;
      }
      case 'table': {
        const rows = Array.from(node.querySelectorAll('tr'));
        if (rows.length === 0) return '';
        let md = '\n';
        rows.forEach((r, idx) => {
          const cells = Array.from(r.querySelectorAll('th, td'));
          const rowText = '| ' + cells.map(c => htmlNodeToMarkdown(c).trim().replace(/\|/g, '\\|')).join(' | ') + ' |';
          md += rowText + '\n';
          if (idx === 0) {
            const separator = '| ' + cells.map(() => '---').join(' | ') + ' |';
            md += separator + '\n';
          }
        });
        return md + '\n';
      }
      case 'br':
        return '\n';
      case 'div':
        return children.trim() ? `\n${children.trim()}\n` : '\n';
      default:
        return children;
    }
  }

  function getWysiwygMarkdown() {
    if (!elements.editorWysiwygContent) return '';
    let md = Array.from(elements.editorWysiwygContent.childNodes)
      .map(htmlNodeToMarkdown)
      .join('');
    // Normalize excess blank lines
    md = md.replace(/\n{3,}/g, '\n\n').trim();
    return md;
  }

  // Active Link Anchor for Floating Bubble
  let activeLinkAnchor = null;

  function showLinkBubble(anchorEl) {
    if (!elements.editorLinkBubble || !anchorEl) return;
    activeLinkAnchor = anchorEl;
    const url = anchorEl.getAttribute('href') || '';
    
    if (elements.linkBubbleUrlDisplay) {
      elements.linkBubbleUrlDisplay.textContent = url.length > 35 ? url.substring(0, 32) + '...' : url;
      elements.linkBubbleUrlDisplay.title = url;
    }
    if (elements.linkBubbleTitleInput) {
      elements.linkBubbleTitleInput.value = (anchorEl.textContent && anchorEl.textContent !== url) ? anchorEl.textContent : '';
    }

    // Position bubble near anchor
    const anchorRect = anchorEl.getBoundingClientRect();
    const wrapperRect = elements.editorWysiwygContent.getBoundingClientRect();
    
    let top = anchorRect.bottom - wrapperRect.top + 8;
    let left = anchorRect.left - wrapperRect.left;
    if (left < 10) left = 10;
    if (left + 360 > wrapperRect.width) left = Math.max(10, wrapperRect.width - 370);

    elements.editorLinkBubble.style.top = `${top}px`;
    elements.editorLinkBubble.style.left = `${left}px`;
    elements.editorLinkBubble.style.display = 'block';

    setTimeout(() => {
      elements.linkBubbleTitleInput?.focus();
    }, 50);
  }

  function hideLinkBubble() {
    if (elements.editorLinkBubble) {
      elements.editorLinkBubble.style.display = 'none';
    }
    activeLinkAnchor = null;
  }

  // Link Bubble Handlers
  elements.btnLinkBubbleApply?.addEventListener('click', () => {
    if (activeLinkAnchor) {
      const newTitle = elements.linkBubbleTitleInput ? elements.linkBubbleTitleInput.value.trim() : '';
      const url = activeLinkAnchor.getAttribute('href') || '';
      activeLinkAnchor.textContent = newTitle || url;
      activeLinkAnchor.title = `클릭 시 이동: ${url}`;
    }
    hideLinkBubble();
    elements.editorWysiwygContent?.focus();
    updateEditorWordCount();
  });

  elements.btnLinkBubbleKeepUrl?.addEventListener('click', () => {
    if (activeLinkAnchor) {
      const url = activeLinkAnchor.getAttribute('href') || '';
      activeLinkAnchor.textContent = url;
      activeLinkAnchor.title = `클릭 시 이동: ${url}`;
    }
    hideLinkBubble();
    elements.editorWysiwygContent?.focus();
    updateEditorWordCount();
  });

  elements.btnLinkBubbleClose?.addEventListener('click', () => {
    hideLinkBubble();
    elements.editorWysiwygContent?.focus();
  });

  elements.linkBubbleTitleInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      elements.btnLinkBubbleApply?.click();
    } else if (e.key === 'Escape') {
      hideLinkBubble();
      elements.editorWysiwygContent?.focus();
    }
  });

  // URL Detector & Converter for Text
  function isImageUrl(url) {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    return /\.(jpeg|jpg|gif|png|webp|svg|bmp)$/.test(cleanUrl) || 
           url.includes('images.unsplash.com') ||
           url.includes('imgur.com') ||
           url.includes('googleusercontent.com');
  }

  function processUrlInTextNode(textNode, offset) {
    const text = textNode.textContent;
    const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
    let match;
    let targetMatch = null;

    while ((match = urlRegex.exec(text)) !== null) {
      const matchStart = match.index;
      const matchEnd = match.index + match[0].length;
      if (offset >= matchStart && offset <= matchEnd + 1) {
        targetMatch = { url: match[0], start: matchStart, end: matchEnd };
        break;
      }
    }

    if (!targetMatch) return false;

    const before = text.substring(0, targetMatch.start);
    const after = text.substring(targetMatch.end);
    const parent = textNode.parentNode;
    if (!parent) return false;

    if (isImageUrl(targetMatch.url)) {
      // Create image card with hover tooltip & click to open
      const imgCard = document.createElement('span');
      imgCard.className = 'editor-img-card';
      imgCard.title = `이미지 원본: ${targetMatch.url} (클릭 시 새 창 열기)`;
      imgCard.innerHTML = `<img src="${targetMatch.url}" alt="이미지">`;
      imgCard.addEventListener('click', (ev) => {
        ev.stopPropagation();
        window.open(targetMatch.url, '_blank');
      });

      const frag = document.createDocumentFragment();
      if (before) frag.appendChild(document.createTextNode(before));
      frag.appendChild(imgCard);
      const spaceNode = document.createTextNode(after ? (after.startsWith(' ') ? after : ' ' + after) : '\u00A0');
      frag.appendChild(spaceNode);

      parent.replaceChild(frag, textNode);

      // Move cursor after image
      const sel = window.getSelection();
      const range = document.createRange();
      range.setStart(spaceNode, 1);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      return true;
    } else {
      // Create clickable anchor tag
      const anchor = document.createElement('a');
      anchor.href = targetMatch.url;
      anchor.target = '_blank';
      anchor.textContent = targetMatch.url;
      anchor.title = `클릭 시 이동: ${targetMatch.url}`;
      anchor.addEventListener('click', (ev) => {
        if (ev.ctrlKey || ev.metaKey) {
          window.open(targetMatch.url, '_blank');
        } else {
          ev.preventDefault();
          showLinkBubble(anchor);
        }
      });

      const frag = document.createDocumentFragment();
      if (before) frag.appendChild(document.createTextNode(before));
      frag.appendChild(anchor);
      const spaceNode = document.createTextNode(after ? (after.startsWith(' ') ? after : ' ' + after) : '\u00A0');
      frag.appendChild(spaceNode);

      parent.replaceChild(frag, textNode);

      // Show title input bubble
      showLinkBubble(anchor);

      // Move cursor after anchor
      const sel = window.getSelection();
      const range = document.createRange();
      range.setStart(spaceNode, 1);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      return true;
    }
  }

  // Handle instant Markdown transformations as the user types in contenteditable
  if (elements.editorWysiwygContent) {
    elements.editorWysiwygContent.addEventListener('input', () => {
      updateEditorWordCount();
    });

    // Handle clicks inside editor (open link bubble when clicking existing link)
    elements.editorWysiwygContent.addEventListener('click', (e) => {
      const anchor = e.target.closest('a');
      if (anchor) {
        e.preventDefault();
        showLinkBubble(anchor);
      } else {
        hideLinkBubble();
      }
    });

    // Handle Paste event: Detect URLs and format automatically
    elements.editorWysiwygContent.addEventListener('paste', (e) => {
      const pastedText = (e.clipboardData || window.clipboardData).getData('text');
      if (!pastedText) return;

      const trimmed = pastedText.trim();
      if (/^https?:\/\/[^\s]+$/.test(trimmed)) {
        e.preventDefault();
        if (isImageUrl(trimmed)) {
          const imgHtml = `<span class="editor-img-card" title="이미지 원본: ${trimmed} (클릭 시 새 창 열기)"><img src="${trimmed}" alt="이미지"></span>&nbsp;`;
          document.execCommand('insertHTML', false, imgHtml);
        } else {
          const linkId = 'link-' + Date.now();
          const linkHtml = `<a id="${linkId}" href="${trimmed}" target="_blank" title="클릭 시 이동: ${trimmed}">${trimmed}</a>&nbsp;`;
          document.execCommand('insertHTML', false, linkHtml);
          const anchor = document.getElementById(linkId);
          if (anchor) {
            anchor.removeAttribute('id');
            showLinkBubble(anchor);
          }
        }
        updateEditorWordCount();
      }
    });

    elements.editorWysiwygContent.addEventListener('keydown', (e) => {
      const sel = window.getSelection();
      if (!sel || !sel.anchorNode) return;

      // 1. Ctrl+B / Cmd+B Shortcut for Bold
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        document.execCommand('bold', false, null);
        updateEditorWordCount();
        return;
      }

      // 2. Backspace inside List, Blockquote, or Heading to revert to normal paragraph
      if (e.key === 'Backspace' && sel.isCollapsed) {
        const anchor = sel.anchorNode;
        const parentLi = anchor.nodeType === Node.ELEMENT_NODE ? anchor.closest('li') : anchor.parentElement?.closest('li');
        
        if (parentLi) {
          // If cursor is at the very beginning of the li item or li is empty
          const textContent = parentLi.textContent;
          if (textContent === '' || textContent === '\n' || sel.anchorOffset === 0) {
            e.preventDefault();
            // Outdent list to turn it into normal text line
            document.execCommand('outdent', false, null);
            document.execCommand('formatBlock', false, 'p');
            updateEditorWordCount();
            return;
          }
        }

        const parentQuote = anchor.nodeType === Node.ELEMENT_NODE ? anchor.closest('blockquote') : anchor.parentElement?.closest('blockquote');
        if (parentQuote) {
          const textContent = parentQuote.textContent;
          if (textContent === '' || textContent === '\n' || sel.anchorOffset === 0) {
            e.preventDefault();
            document.execCommand('formatBlock', false, 'p');
            updateEditorWordCount();
            return;
          }
        }
      }

      // 3. Space or Enter transformations
      if (e.key === ' ' || e.key === 'Enter') {
        let node = sel.anchorNode;
        if (node.nodeType === Node.ELEMENT_NODE) {
          node = node.childNodes[sel.anchorOffset - 1] || node;
        }
        if (node.nodeType !== Node.TEXT_NODE) return;

        const textBeforeCursor = node.textContent.substring(0, sel.anchorOffset);

        // A. Space triggers
        if (e.key === ' ') {
          // Check for URL typing first (e.g. user typed https://... followed by Space)
          if (/https?:\/\/[^\s]+$/.test(textBeforeCursor)) {
            const converted = processUrlInTextNode(node, sel.anchorOffset);
            if (converted) {
              e.preventDefault();
              return;
            }
          }

          // Strict line-start check: only transform if the cursor is right after the prefix at the start of block
          // 1. Heading 1: exactly "#"
          if (textBeforeCursor === '#') {
            e.preventDefault();
            node.textContent = node.textContent.substring(sel.anchorOffset);
            document.execCommand('formatBlock', false, 'H1');
            return;
          }

          // 2. Heading 2: exactly "##"
          if (textBeforeCursor === '##') {
            e.preventDefault();
            node.textContent = node.textContent.substring(sel.anchorOffset);
            document.execCommand('formatBlock', false, 'H2');
            return;
          }

          // 3. Heading 3: exactly "###"
          if (textBeforeCursor === '###') {
            e.preventDefault();
            node.textContent = node.textContent.substring(sel.anchorOffset);
            document.execCommand('formatBlock', false, 'H3');
            return;
          }

          // 4. Bullet List: exactly "-" or "*"
          if (textBeforeCursor === '-' || textBeforeCursor === '*') {
            e.preventDefault();
            node.textContent = node.textContent.substring(sel.anchorOffset);
            document.execCommand('insertUnorderedList', false, null);
            return;
          }

          // 5. Ordered List: exactly "1."
          if (textBeforeCursor === '1.') {
            e.preventDefault();
            node.textContent = node.textContent.substring(sel.anchorOffset);
            document.execCommand('insertOrderedList', false, null);
            return;
          }

          // 6. Blockquote: exactly ">"
          if (textBeforeCursor === '>') {
            e.preventDefault();
            node.textContent = node.textContent.substring(sel.anchorOffset);
            document.execCommand('formatBlock', false, 'BLOCKQUOTE');
            return;
          }

          // 7. Inline Bold: **word** + Space
          const boldMatch = textBeforeCursor.match(/\*\*([^*]+)\*\*$/);
          if (boldMatch) {
            e.preventDefault();
            const boldText = boldMatch[1];
            const startIdx = boldMatch.index;
            const beforeBold = node.textContent.substring(0, startIdx);
            const afterBold = node.textContent.substring(sel.anchorOffset);
            
            const bTag = document.createElement('strong');
            bTag.textContent = boldText;
            const spaceNode = document.createTextNode(' ');

            const frag = document.createDocumentFragment();
            if (beforeBold) frag.appendChild(document.createTextNode(beforeBold));
            frag.appendChild(bTag);
            frag.appendChild(spaceNode);
            if (afterBold) frag.appendChild(document.createTextNode(afterBold));

            node.parentNode.replaceChild(frag, node);

            const newRange = document.createRange();
            newRange.setStart(spaceNode, 1);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
            return;
          }

          // 8. Inline Italic: *word* + Space (and not **)
          const italicMatch = textBeforeCursor.match(/(?<!\*)\*([^*]+)\*$/);
          if (italicMatch) {
            e.preventDefault();
            const italicText = italicMatch[1];
            const startIdx = italicMatch.index;
            const beforeItalic = node.textContent.substring(0, startIdx);
            const afterItalic = node.textContent.substring(sel.anchorOffset);
            
            const iTag = document.createElement('em');
            iTag.textContent = italicText;
            const spaceNode = document.createTextNode(' ');

            const frag = document.createDocumentFragment();
            if (beforeItalic) frag.appendChild(document.createTextNode(beforeItalic));
            frag.appendChild(iTag);
            frag.appendChild(spaceNode);
            if (afterItalic) frag.appendChild(document.createTextNode(afterItalic));

            node.parentNode.replaceChild(frag, node);

            const newRange = document.createRange();
            newRange.setStart(spaceNode, 1);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
            return;
          }

          // 9. Inline Strike: ~~word~~ + Space
          const strikeMatch = textBeforeCursor.match(/~~([^~]+)~~$/);
          if (strikeMatch) {
            e.preventDefault();
            const strikeText = strikeMatch[1];
            const startIdx = strikeMatch.index;
            const beforeStrike = node.textContent.substring(0, startIdx);
            const afterStrike = node.textContent.substring(sel.anchorOffset);
            
            const sTag = document.createElement('del');
            sTag.textContent = strikeText;
            const spaceNode = document.createTextNode(' ');

            const frag = document.createDocumentFragment();
            if (beforeStrike) frag.appendChild(document.createTextNode(beforeStrike));
            frag.appendChild(sTag);
            frag.appendChild(spaceNode);
            if (afterStrike) frag.appendChild(document.createTextNode(afterStrike));

            node.parentNode.replaceChild(frag, node);

            const newRange = document.createRange();
            newRange.setStart(spaceNode, 1);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
            return;
          }

          // 10. Inline Code: `code` + Space
          const codeMatch = textBeforeCursor.match(/`([^`]+)`$/);
          if (codeMatch) {
            e.preventDefault();
            const codeText = codeMatch[1];
            const startIdx = codeMatch.index;
            const beforeCode = node.textContent.substring(0, startIdx);
            const afterCode = node.textContent.substring(sel.anchorOffset);
            
            const cTag = document.createElement('code');
            cTag.textContent = codeText;
            const spaceNode = document.createTextNode(' ');

            const frag = document.createDocumentFragment();
            if (beforeCode) frag.appendChild(document.createTextNode(beforeCode));
            frag.appendChild(cTag);
            frag.appendChild(spaceNode);
            if (afterCode) frag.appendChild(document.createTextNode(afterCode));

            node.parentNode.replaceChild(frag, node);

            const newRange = document.createRange();
            newRange.setStart(spaceNode, 1);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
            return;
          }

          // 11. Markdown Link: [Title](URL) + Space
          const linkMatch = textBeforeCursor.match(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
          if (linkMatch) {
            e.preventDefault();
            const title = linkMatch[1];
            const url = linkMatch[2];
            const startIdx = linkMatch.index;
            const beforeLink = node.textContent.substring(0, startIdx);
            const afterLink = node.textContent.substring(sel.anchorOffset);

            const aTag = document.createElement('a');
            aTag.href = url;
            aTag.target = '_blank';
            aTag.textContent = title;
            aTag.title = `클릭 시 이동: ${url}`;
            aTag.addEventListener('click', (ev) => {
              if (ev.ctrlKey || ev.metaKey) {
                window.open(url, '_blank');
              } else {
                ev.preventDefault();
                showLinkBubble(aTag);
              }
            });

            const spaceNode = document.createTextNode(' ');
            const frag = document.createDocumentFragment();
            if (beforeLink) frag.appendChild(document.createTextNode(beforeLink));
            frag.appendChild(aTag);
            frag.appendChild(spaceNode);
            if (afterLink) frag.appendChild(document.createTextNode(afterLink));

            node.parentNode.replaceChild(frag, node);

            const newRange = document.createRange();
            newRange.setStart(spaceNode, 1);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
            return;
          }

          // 12. Markdown Image: ![Alt](URL) + Space
          const imgMatch = textBeforeCursor.match(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)$/);
          if (imgMatch) {
            e.preventDefault();
            const alt = imgMatch[1] || '이미지';
            const url = imgMatch[2];
            const startIdx = imgMatch.index;
            const beforeImg = node.textContent.substring(0, startIdx);
            const afterImg = node.textContent.substring(sel.anchorOffset);

            const card = document.createElement('span');
            card.className = 'editor-img-card';
            card.title = `이미지 원본: ${url} (클릭 시 새 창 열기)`;
            card.innerHTML = `<img src="${url}" alt="${alt}">`;
            card.addEventListener('click', (ev) => {
              ev.stopPropagation();
              window.open(url, '_blank');
            });

            const spaceNode = document.createTextNode(' ');
            const frag = document.createDocumentFragment();
            if (beforeImg) frag.appendChild(document.createTextNode(beforeImg));
            frag.appendChild(card);
            frag.appendChild(spaceNode);
            if (afterImg) frag.appendChild(document.createTextNode(afterImg));

            node.parentNode.replaceChild(frag, node);

            const newRange = document.createRange();
            newRange.setStart(spaceNode, 1);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
            return;
          }
        }

        // B. Enter triggers
        if (e.key === 'Enter') {
          // Horizontal rule: "---" + Enter
          if (textBeforeCursor.trim() === '---') {
            e.preventDefault();
            node.textContent = '';
            document.execCommand('insertHorizontalRule', false, null);
            return;
          }

          // Code block: "```" + Enter
          if (textBeforeCursor.trim() === '```') {
            e.preventDefault();
            node.textContent = '';
            document.execCommand('insertHTML', false, '<pre><code>// 코드 작성</code></pre><p><br></p>');
            return;
          }
        }
      }
    });
  }

  // Insert HTML or Markdown tags into WYSIWYG editor
  function insertWysiwygSnippet(prefix, suffix = '', defaultText = '') {
    if (!elements.editorWysiwygContent) return;
    elements.editorWysiwygContent.focus();
    const sel = window.getSelection();
    let selectedText = sel ? sel.toString() : '';
    if (!selectedText) selectedText = defaultText;

    const combined = `${prefix}${selectedText}${suffix}`;
    document.execCommand('insertText', false, combined);
    updateEditorWordCount();
  }

  // Open Editor button in Study Notes tab
  elements.btnOpenAddStudy?.addEventListener('click', () => {
    openNoteEditor(null);
  });

  // Cancel / Back button in Note Editor
  elements.btnCancelEditor?.addEventListener('click', () => {
    const content = getWysiwygMarkdown();
    if (content.trim().length > 0) {
      if (!confirm('작성 중인 내용이 저장되지 않았습니다. 목록으로 돌아가시겠습니까?')) {
        return;
      }
    }
    closeNoteEditor();
  });

  // Category select change in Note Editor
  elements.editorCategorySelect?.addEventListener('change', (e) => {
    const val = e.target.value;
    const isCustom = val === 'custom';

    if (elements.editorCustomCategoryInput) {
      elements.editorCustomCategoryInput.style.display = isCustom ? 'block' : 'none';
      if (isCustom) elements.editorCustomCategoryInput.focus();
    }
  });

  // Delete category button in Note Editor
  elements.btnDeleteSelectedCategory?.addEventListener('click', () => {
    const selectedCat = elements.editorCategorySelect.value;
    deleteCategory(selectedCat);
  });

  // Toggle Markdown quick guide banner
  elements.btnToggleGuideBanner?.addEventListener('click', () => {
    if (elements.editorGuideBody) {
      const isHidden = elements.editorGuideBody.style.display === 'none';
      elements.editorGuideBody.style.display = isHidden ? 'block' : 'none';
      const icon = elements.btnToggleGuideBanner.querySelector('.guide-toggle-icon i');
      if (icon) {
        icon.className = isHidden ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-right';
      }
    }
  });

  // Markdown Toolbar Actions (Targeting WYSIWYG content directly)
  document.querySelectorAll('.editor-toolbar .tool-btn[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!elements.editorWysiwygContent) return;
      elements.editorWysiwygContent.focus();
      const action = btn.getAttribute('data-action');
      switch (action) {
        case 'h1':
          document.execCommand('formatBlock', false, 'H1');
          break;
        case 'h2':
          document.execCommand('formatBlock', false, 'H2');
          break;
        case 'h3':
          document.execCommand('formatBlock', false, 'H3');
          break;
        case 'bold':
          document.execCommand('bold', false, null);
          break;
        case 'italic':
          document.execCommand('italic', false, null);
          break;
        case 'strike':
          document.execCommand('strikeThrough', false, null);
          break;
        case 'quote':
          document.execCommand('formatBlock', false, 'BLOCKQUOTE');
          break;
        case 'code-inline': {
          const sel = window.getSelection();
          const txt = sel ? sel.toString() : 'code';
          document.execCommand('insertHTML', false, `<code>${txt || '코드'}</code>`);
          break;
        }
        case 'code-block': {
          const sel = window.getSelection();
          const txt = sel ? sel.toString() : '// 코드 작성';
          document.execCommand('insertHTML', false, `<pre><code>${txt}</code></pre><p><br></p>`);
          break;
        }
        case 'ul':
          document.execCommand('insertUnorderedList', false, null);
          break;
        case 'ol':
          document.execCommand('insertOrderedList', false, null);
          break;
        case 'hr':
          document.execCommand('insertHorizontalRule', false, null);
          break;
        case 'link': {
          const url = prompt('링크 URL을 입력하세요:', 'https://');
          if (url) {
            document.execCommand('createLink', false, url);
          }
          break;
        }
        case 'img-tag':
          document.execCommand('insertText', false, '{{img_1}}');
          break;
      }
      updateEditorWordCount();
    });
  });

  // Table Generator Modal handlers
  elements.btnOpenTableModal?.addEventListener('click', () => {
    if (elements.tableGeneratorModal) {
      elements.tableGeneratorModal.style.display = 'flex';
    }
  });
  elements.btnCloseTableModal?.addEventListener('click', () => {
    if (elements.tableGeneratorModal) elements.tableGeneratorModal.style.display = 'none';
  });
  elements.btnCancelTable?.addEventListener('click', () => {
    if (elements.tableGeneratorModal) elements.tableGeneratorModal.style.display = 'none';
  });

  // Table Generator Form submit (Inserts HTML Table directly into WYSIWYG editor)
  elements.tableGeneratorForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const cols = parseInt(elements.tableInputCols.value, 10) || 3;
    const rows = parseInt(elements.tableInputRows.value, 10) || 3;

    // Build Table HTML
    let tableHtml = '<table border="1"><thead><tr>';
    for (let c = 1; c <= cols; c++) {
      tableHtml += `<th>헤더 ${c}</th>`;
    }
    tableHtml += '</tr></thead><tbody>';

    for (let r = 1; r <= rows; r++) {
      tableHtml += '<tr>';
      for (let c = 1; c <= cols; c++) {
        tableHtml += `<td>항목 ${r}-${c}</td>`;
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table><p><br></p>';

    if (elements.editorWysiwygContent) {
      elements.editorWysiwygContent.focus();
      document.execCommand('insertHTML', false, tableHtml);
      updateEditorWordCount();
    }
    elements.tableGeneratorModal.style.display = 'none';
  });

  // Save Editor Post (GAS + Local)
  elements.btnSaveEditor?.addEventListener('click', async () => {
    try {
      const editId = elements.editorPostId.value;
      const title = elements.editorPostTitle.value.trim();
      if (!title) {
        alert('글 제목을 입력해 주세요.');
        elements.editorPostTitle.focus();
        return;
      }

      let category = elements.editorCategorySelect.value;
      if (category === 'custom') {
        const customVal = elements.editorCustomCategoryInput.value.trim();
        if (!customVal) {
          alert('새 카테고리명을 입력해 주세요.');
          elements.editorCustomCategoryInput.focus();
          return;
        }
        category = customVal;
        
        // Save new custom category
        let customCats = getCustomCategories();
        if (!customCats.some(c => c.id === category)) {
          customCats.push({ id: category, name: category });
          saveCustomCategories(customCats);
        }
      }

      const type = elements.editorPostType.value.trim() || '보안';
      // Convert current WYSIWYG content to clean Markdown
      const content = getWysiwygMarkdown();
      const isNews = category === 'News';

      const postData = {
        title,
        category,
        type,
        content
      };

      if (isNews) {
        postData.importance = elements.editorNewsImportance.value;
        postData.source = elements.editorNewsSource.value.trim();
        postData.date = elements.editorNewsDate.value || new Date().toISOString().split('T')[0];
        postData.newsLink = elements.editorNewsLink.value.trim();
      }

      let targetPostId = editId;
      if (editId) {
        const index = appState.posts.findIndex(p => p.id === editId);
        if (index !== -1) {
          appState.posts[index] = { ...appState.posts[index], ...postData };
        }
      } else {
        targetPostId = isNews ? 'news-' + Date.now() : 'study-' + Date.now();
        const newPost = {
          id: targetPostId,
          date: postData.date || new Date().toISOString().split('T')[0],
          filePath: `posts/${targetPostId}.md`,
          ...postData
        };
        appState.posts.unshift(newPost);
      }

      // Save locally first
      localStorage.setItem('posts', JSON.stringify(appState.posts));
      renderAll();
      closeNoteEditor();

      if (targetPostId) {
        showArticleDetail(targetPostId);
      }

      // Real-time Sync to Google Sheets via GAS
      if (appState.isAdmin) {
        const gasResult = await sendToGasApi('savePost', {
          id: targetPostId,
          category: postData.category,
          title: postData.title,
          date: postData.date || new Date().toISOString().split('T')[0],
          content: postData.content
        });
        console.log('[GAS API] Post successfully saved:', gasResult);
      }
    } catch (err) {
      console.error('Error saving post from editor:', err);
      alert('글 저장 실패: ' + err.message);
    }
  });

  // Article detail Edit button (wired to fullpage editor)
  elements.btnEditArticle?.addEventListener('click', () => {
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
      openNoteEditor(appState.activePostId);
    }
  });

  // Article detail Delete button
  elements.btnDeleteArticle?.addEventListener('click', async () => {
    if (!confirm('정말로 이 글을 삭제하시겠습니까?')) return;
    
    if (appState.activePostType === 'projectNote') {
      const noteId = appState.activePostId;
      appState.projectNotes = appState.projectNotes.filter(n => n.id !== noteId);
      localStorage.setItem('projectNotes', JSON.stringify(appState.projectNotes));
      
      if (appState.isAdmin) {
        try {
          await sendToGasApi('deletePost', { id: noteId });
        } catch (err) {
          console.warn('GAS delete error:', err);
        }
      }
      
      window.location.hash = `#/project/${appState.activeProjectId}`;
    } else {
      const postToDelete = appState.posts.find(p => p.id === appState.activePostId);
      const postId = appState.activePostId;
      appState.posts = appState.posts.filter(p => p.id !== postId);
      localStorage.setItem('posts', JSON.stringify(appState.posts));
      
      const deletedIds = JSON.parse(localStorage.getItem('deletedPosts') || '[]');
      if (postToDelete && !deletedIds.includes(postToDelete.id)) {
        deletedIds.push(postToDelete.id);
        localStorage.setItem('deletedPosts', JSON.stringify(deletedIds));
      }
      
      if (appState.isAdmin && postToDelete) {
        try {
          await sendToGasApi('deletePost', { id: postId });
        } catch (err) {
          alert('구글 시트 삭제 중 오류 발생: ' + err.message);
        }
      }
      
      window.location.hash = '#/tab/study';
    }
  });

  // News delete mode buttons
  elements.btnNewsDeleteMode?.addEventListener('click', () => {
    appState.newsDeleteMode = true;
    applyAdminPermissions();
    renderSecurityNews();
  });

  elements.btnNewsDeleteCancel?.addEventListener('click', () => {
    appState.newsDeleteMode = false;
    applyAdminPermissions();
    renderSecurityNews();
  });

  elements.newsSelectAll?.addEventListener('change', (e) => {
    const checked = e.target.checked;
    const checkboxes = elements.fullNewsTable.querySelectorAll('.news-item-checkbox');
    checkboxes.forEach(cb => cb.checked = checked);
  });

  elements.btnNewsDeleteConfirm?.addEventListener('click', async () => {
    const checkboxes = elements.fullNewsTable.querySelectorAll('.news-item-checkbox:checked');
    const checkedIds = Array.from(checkboxes).map(cb => cb.getAttribute('data-id'));
    
    if (checkedIds.length === 0) {
      alert('선택된 보안 뉴스가 없습니다.');
      return;
    }
    
    if (!confirm(`정말로 선택한 ${checkedIds.length}개의 보안 뉴스를 삭제하시겠습니까?`)) {
      return;
    }
    
    try {
      const postsToDelete = appState.posts.filter(p => checkedIds.includes(p.id));
      appState.posts = appState.posts.filter(p => !checkedIds.includes(p.id));
      
      localStorage.setItem('posts', JSON.stringify(appState.posts));
      
      const deletedIds = JSON.parse(localStorage.getItem('deletedPosts') || '[]');
      let addedToDeleted = false;
      postsToDelete.forEach(p => {
        if (!deletedIds.includes(p.id)) {
          deletedIds.push(p.id);
          addedToDeleted = true;
        }
      });
      if (addedToDeleted) {
        localStorage.setItem('deletedPosts', JSON.stringify(deletedIds));
      }
      
      appState.newsDeleteMode = false;
      applyAdminPermissions();
      renderAll();
      
      // Batch delete via GAS Sheets API
      if (appState.isAdmin) {
        for (const post of postsToDelete) {
          try {
            await sendToGasApi('deletePost', { id: post.id });
          } catch (err) {
            console.warn(`[GAS API] Failed to delete ${post.id}:`, err);
          }
        }
      }
      
      alert('선택한 보안 뉴스가 정상적으로 삭제되었습니다.');
    } catch (err) {
      console.error('Error during batch deletion:', err);
      alert('삭제 중 오류가 발생했습니다: ' + err.message);
    }
  });

  // Text size selector for article details
  const sizeBtns = document.querySelectorAll('.text-size-btn');
  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach(b => {
        b.classList.remove('active');
        b.style.background = 'none';
        b.style.color = 'var(--text-muted)';
        b.style.fontWeight = 'normal';
      });
      btn.classList.add('active');
      btn.style.background = 'var(--accent-color)';
      btn.style.color = '#fff';
      btn.style.fontWeight = '600';
      
      const sizeValue = btn.getAttribute('data-size');
      const contentArea = document.getElementById('article-content');
      if (contentArea) {
        contentArea.style.fontSize = sizeValue;
      }
    });
  });
}

