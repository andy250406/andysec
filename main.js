// import marked parser dynamically from a ESM CDN
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';

// Constants & API Endpoints
const TODAY = new Date(); // Actual current date

// Google Apps Script Web App Deployment URLs
const GAS_API_URL = localStorage.getItem('gas_api_url') || 'https://script.google.com/macros/s/AKfycby_5htUVodm_M16r25fUOyNAkNG7cpx3L1X098TYGtvS6KYN4nv8h8N5-wnNsveytLz8Q/exec';
const HEALTH_GAS_API_URL = localStorage.getItem('health_gas_api_url') || 'https://script.google.com/macros/s/AKfycbz5axHM_61gZngyDkr9CXwhK0AXdi4JRRm23Won8IaHxzbV7YWTpT7Wd_qn7GuL0gTgYg/exec';

// Default Profile & Portfolio Data (Fallbacks for initial/offline load)
const DEFAULT_PROFILE = {
  id: 'profile-main',
  name: '안태경',
  title: '보안 컨설턴트',
  company: 'SK쉴더스 기업컨설팅 2팀',
  bio: 'SK쉴더스 기업컨설팅 2팀 보안 컨설턴트 안태경',
  email: 'pp0406hh@gmail.com',
  phone: '010-2224-1060',
  avatarUrl: './profile.jpg'
};

const DEFAULT_PORTFOLIO = [
  { id: 'cert-1', type: 'cert', title: 'CPPG (개인정보관리사) 취득', date: '2026.04', description: '개인정보보호법 및 망법 등 관련 규정 준수 요건 검토 지식 보유', category: '', level: '', percent: 0, sortOrder: 1 },
  { id: 'cert-2', type: 'cert', title: 'AWS Certified Cloud Practitioner 취득', date: '2026.03', description: 'AWS 핵심 클라우드 아키텍처 및 클라우드 보안 공동 책임 모델 지식 검증', category: '', level: '', percent: 0, sortOrder: 2 },
  { id: 'cert-3', type: 'cert', title: '빅데이터분석기사 필기 합격', date: '2025.10', description: '대용량 보안 모니터링 로그 및 시계열 기상/재해 데이터 처리 분석 역량', category: '', level: '', percent: 0, sortOrder: 3 },
  { id: 'cert-4', type: 'cert', title: '정보처리기사 취득', date: '2025.09', description: '시스템 아키텍처 설계, 네트워크 및 운영체제 전반에 대한 기본 지식 검증', category: '', level: '', percent: 0, sortOrder: 4 },
  { id: 'proj-1', type: 'project', title: '개인정보 보안 컨설팅 수탁사 점검 프로젝트', date: '2026.04', description: 'SK Shieldus Rookies 28기 최종 프로젝트로 모의 수탁기업 점검서 수립 및 가이드라인 제시', category: '', level: '', percent: 0, sortOrder: 1 },
  { id: 'proj-2', type: 'project', title: '의료 데이터를 위한 웹 취약점 자동 진단 시스템', date: '2026.01', description: '병원 데이터 대상 웹 취약점 자동 스캔 프로그램 및 대응 소스코드 리포트 연동 시스템', category: '', level: '', percent: 0, sortOrder: 2 },
  { id: 'proj-3', type: 'project', title: '산불 발생 데이터 분석 대시보드 구축', date: '2025.11', description: 'Streamlit을 활용하여 기온, 풍속 및 산불 발생 피해 면적 연계 시각화 및 예측 인자 분석', category: '', level: '', percent: 0, sortOrder: 3 },
  { id: 'proj-4', type: 'project', title: 'AI를 활용한 자동 틀린 그림 찾기 프로그램', date: '2021.12', description: '대학교 졸업 작품으로 OpenCV와 머신러닝 비교 검출 알고리즘 적용', category: '', level: '', percent: 0, sortOrder: 4 },
  { id: 'career-1', type: 'career', title: '여단 통신중대 정보체계운용/정비병 복무', date: '2023.11 ~ 2025.05', description: '인트라넷 네트워크 서버 구축 지원 및 군 내부 정보체계 장애 처리/유지보수 담당', category: '', level: '', percent: 0, sortOrder: 1 },
  { id: 'skill-1', type: 'skill', title: '개인정보보호 및 법률 점검', date: '', description: '', category: '보안 & 컨설팅', level: '중하 (⭐⭐)', percent: 40, sortOrder: 1 },
  { id: 'skill-2', type: 'skill', title: '취약점 진단 (Web/System)', date: '', description: '', category: '보안 & 컨설팅', level: '하 (⭐)', percent: 20, sortOrder: 2 },
  { id: 'skill-3', type: 'skill', title: 'ISMS-P 인증 기준 분석', date: '', description: '', category: '보안 & 컨설팅', level: '하 (⭐)', percent: 20, sortOrder: 3 },
  { id: 'skill-4', type: 'skill', title: 'Python', date: '', description: '', category: '개발 & 데이터', level: '상 (⭐⭐⭐⭐)', percent: 85, sortOrder: 4 },
  { id: 'skill-5', type: 'skill', title: 'JAVA, C', date: '', description: '', category: '개발 & 데이터', level: '중 (⭐⭐⭐)', percent: 60, sortOrder: 5 },
  { id: 'skill-6', type: 'skill', title: '클라우드 인프라 (AWS)', date: '', description: '', category: '개발 & 데이터', level: '하 (⭐)', percent: 20, sortOrder: 6 },
  { id: 'skill-7', type: 'skill', title: 'HTML/CSS/JS', date: '', description: '', category: '개발 & 데이터', level: '중하 (⭐⭐)', percent: 40, sortOrder: 7 }
];

// State Store
let appState = {
  posts: [], // Study notes and News (category: Cert, CertAnalysis, News)
  projects: [], // Projects
  projectNotes: [], // Project-specific notes
  profile: null, // User profile info (from Google Sheets DB)
  portfolio: [], // Portfolio items (from Google Sheets DB)
  currentTab: 'dashboard',
  searchQuery: '',
  studyFilter: 'all',
  newsFilter: 'all',
  activePostId: null,      // ID of post currently viewed in detail
  activePostType: null,    // 'general' or 'projectNote'
  activeProjectId: null,   // ID of project currently viewed in details
  activeDiagId: null,      // ID of diagnostic currently viewed in detail
  expandedProjects: new Set(['project-1782022260306']), // Expanded project tree IDs
  isAdmin: false,          // Administrator unlocked status
  adminPassword: '',       // Cached admin password for GAS cross-validation
  
  // Health & Fitness Mode State
  mode: 'sec',             // 'sec' (Security Blog) or 'health' (Health & Fitness)
  currentHealthTab: 'health-dashboard',
  healthData: { db: [], body: [], activity: [], sleep: [], vitals: [] },
  geminiApiKey: localStorage.getItem('gemini_api_key') || '',
  geminiModel: localStorage.getItem('gemini_model') || 'gemini-1.5-flash',
  dietFilter: 'all',
  activeDietDate: null
};

// DOM Elements
const elements = {
  navBtns: document.querySelectorAll('.nav-menu .nav-btn'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  themeToggle: document.getElementById('theme-toggle'),
  adminAuthBtn: document.getElementById('admin-auth-btn'),
  pwaInstallBtn: document.getElementById('pwa-install-btn'),
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
  
  // Project Diagnostic Elements
  diagnosticDetailPane: document.getElementById('diagnostic-detail-pane'),
  btnBackToProjectFromDiag: document.getElementById('btn-back-to-project-from-diag'),
  diagParentProjName: document.getElementById('diag-parent-proj-name'),
  diagCurrentName: document.getElementById('diag-current-name'),
  diagTypeBadge: document.getElementById('diag-type-badge'),
  diagStatusBadge: document.getElementById('diag-status-badge'),
  detailDiagName: document.getElementById('detail-diag-name'),
  detailDiagTarget: document.getElementById('detail-diag-target'),
  detailDiagDesc: document.getElementById('detail-diag-desc'),
  detailDiagSchedule: document.getElementById('detail-diag-schedule'),
  detailDiagProgressBar: document.getElementById('detail-diag-progress-bar'),
  detailDiagPercent: document.getElementById('detail-diag-percent'),
  diagAdminActions: document.getElementById('diag-admin-actions'),
  btnEditDiagDetails: document.getElementById('btn-edit-diag-details'),
  btnDeleteDiagDetails: document.getElementById('btn-delete-diag-details'),
  diagnosticArticleContent: document.getElementById('diagnostic-article-content'),
  projectDiagnosticsGrid: document.getElementById('project-diagnostics-grid'),
  btnOpenAddDiagModal: document.getElementById('btn-open-add-diag-modal'),

  // Diagnostic Modal Elements
  addDiagnosticModal: document.getElementById('add-diagnostic-modal'),
  diagModalTitle: document.getElementById('diag-modal-title'),
  addDiagnosticForm: document.getElementById('add-diagnostic-form'),
  diagEditId: document.getElementById('diag-edit-id'),
  diagParentId: document.getElementById('diag-parent-id'),
  diagName: document.getElementById('diag-name'),
  diagType: document.getElementById('diag-type'),
  diagStatus: document.getElementById('diag-status'),
  diagTarget: document.getElementById('diag-target'),
  diagStart: document.getElementById('diag-start'),
  diagEnd: document.getElementById('diag-end'),
  diagDesc: document.getElementById('diag-desc'),
  diagContent: document.getElementById('diag-content'),
  btnCloseDiagModal: document.getElementById('btn-close-diag-modal'),
  btnCancelDiag: document.getElementById('btn-cancel-diag'),
  btnSubmitDiag: document.getElementById('btn-submit-diag'),
  
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
  btnOpenAddNewsEditor: document.getElementById('btn-open-add-news-editor'),
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
  editorTitleGroup: document.getElementById('editor-title-group'),
  editorCatGroup: document.getElementById('editor-cat-group'),
  editorTypeGroup: document.getElementById('editor-type-group'),
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
  moreBtns: document.querySelectorAll('.btn-more'),

  // Profile Elements
  profileDisplayName: document.getElementById('profile-display-name'),
  profileDisplayTitle: document.getElementById('profile-display-title'),
  profileDisplaySlogan: document.getElementById('profile-display-slogan'),
  profileDisplayEmail: document.getElementById('profile-display-email'),
  profileDisplayPhone: document.getElementById('profile-display-phone'),
  emailBtn: document.getElementById('email-btn'),
  phoneBtn: document.getElementById('phone-btn'),
  btnEditProfile: document.getElementById('btn-edit-profile'),

  // Portfolio Elements
  btnEditPortfolio: document.getElementById('btn-edit-portfolio'),
  portfolioQuoteText: document.getElementById('portfolio-quote-text'),
  portfolioQuoteAuthor: document.getElementById('portfolio-quote-author'),
  timelineCerts: document.getElementById('timeline-certs'),
  timelineProjects: document.getElementById('timeline-projects'),
  timelineCareers: document.getElementById('timeline-careers'),
  skillsContainer: document.getElementById('skills-container'),

  // Edit Profile Modal
  editProfileModal: document.getElementById('edit-profile-modal'),
  editProfileForm: document.getElementById('edit-profile-form'),
  inputProfileName: document.getElementById('input-profile-name'),
  inputProfileTitle: document.getElementById('input-profile-title'),
  inputProfileCompany: document.getElementById('input-profile-company'),
  inputProfileBio: document.getElementById('input-profile-bio'),
  inputProfileEmail: document.getElementById('input-profile-email'),
  inputProfilePhone: document.getElementById('input-profile-phone'),
  btnCloseEditProfile: document.getElementById('btn-close-edit-profile'),
  btnCancelEditProfile: document.getElementById('btn-cancel-edit-profile'),
  btnSubmitEditProfile: document.getElementById('btn-submit-edit-profile'),

  // Edit Portfolio Modal
  editPortfolioModal: document.getElementById('edit-portfolio-modal'),
  btnCloseEditPortfolio: document.getElementById('btn-close-edit-portfolio'),
  btnCancelEditPortfolio: document.getElementById('btn-cancel-edit-portfolio'),
  btnSubmitAllPortfolio: document.getElementById('btn-submit-all-portfolio'),
  portModalTabs: document.querySelectorAll('.port-tab-btn'),
  portItemsManagerList: document.getElementById('portfolio-items-manager-list'),
  portFormTitle: document.getElementById('port-form-title'),
  portItemId: document.getElementById('port-item-id'),
  portItemType: document.getElementById('port-item-type'),
  portInputTitle: document.getElementById('port-input-title'),
  portInputDate: document.getElementById('port-input-date'),
  portInputDesc: document.getElementById('port-input-desc'),
  portGroupDate: document.getElementById('port-group-date'),
  portGroupDesc: document.getElementById('port-group-desc'),
  portGroupSkillFields: document.getElementById('port-group-skill-fields'),
  portInputCat: document.getElementById('port-input-cat'),
  portInputLevel: document.getElementById('port-input-level'),
  portInputPercent: document.getElementById('port-input-percent'),
  btnResetPortItem: document.getElementById('btn-reset-port-item'),
  btnSavePortItem: document.getElementById('btn-save-port-item'),

  // Health Mode Elements
  modeHealthToggleBtn: document.getElementById('mode-health-toggle-btn'),
  geminiSettingsBtn: document.getElementById('gemini-settings-btn'),
  navSec: document.getElementById('nav-sec'),
  navHealth: document.getElementById('nav-health'),

  // Health Dashboard Elements
  healthCardSteps: document.getElementById('health-card-steps'),
  healthCardActiveCal: document.getElementById('health-card-active-cal'),
  healthCardCalories: document.getElementById('health-card-calories'),
  healthCardMacros: document.getElementById('health-card-macros'),
  healthCardWeight: document.getElementById('health-card-weight'),
  healthCardBodyDetail: document.getElementById('health-card-body-detail'),
  healthCardSleep: document.getElementById('health-card-sleep'),
  healthCardHr: document.getElementById('health-card-hr'),
  healthTodayDietList: document.getElementById('health-today-diet-list'),
  healthTodayWorkoutList: document.getElementById('health-today-workout-list'),

  // Health Diet Elements
  btnOpenAddDiet: document.getElementById('btn-open-add-diet'),
  modalHealthDiet: document.getElementById('modal-health-diet'),
  formHealthDiet: document.getElementById('form-health-diet'),
  dietEditId: document.getElementById('diet-edit-id'),
  dietModalTitle: document.getElementById('diet-modal-title'),
  dietInputDate: document.getElementById('diet-input-date'),
  dietInputTime: document.getElementById('diet-input-time'),
  dietInputSubtype: document.getElementById('diet-input-subtype'),
  dietInputTitle: document.getElementById('diet-input-title'),
  dietInputCalories: document.getElementById('diet-input-calories'),
  dietInputCarbs: document.getElementById('diet-input-carbs'),
  dietInputProtein: document.getElementById('diet-input-protein'),
  dietInputFat: document.getElementById('diet-input-fat'),
  dietInputContent: document.getElementById('diet-input-content'),
  dietImageInput: document.getElementById('diet-image-input'),
  dietImageFilename: document.getElementById('diet-image-filename'),
  dietImagePreview: document.getElementById('diet-image-preview'),
  dietImagePreviewBox: document.getElementById('diet-image-preview-box'),
  btnRemoveDietImage: document.getElementById('btn-remove-diet-image'),
  dietTextPrompt: document.getElementById('diet-text-prompt'),
  btnRunDietAi: document.getElementById('btn-run-diet-ai'),
  dietAiStatus: document.getElementById('diet-ai-status'),
  dietFilterBar: document.getElementById('diet-filter-bar'),
  healthDietGrid: document.getElementById('health-diet-grid'),
  dietDateListView: document.getElementById('diet-date-list-view'),
  dietDateList: document.getElementById('diet-date-list'),
  dietDateDetailView: document.getElementById('diet-date-detail-view'),
  btnBackToDietList: document.getElementById('btn-back-to-diet-list'),
  dietDetailDateTitle: document.getElementById('diet-detail-date-title'),
  btnDetailAddMeal: document.getElementById('btn-detail-add-meal'),
  dietDailySummaryBanner: document.getElementById('diet-daily-summary-banner'),
  dietDetailMealsStack: document.getElementById('diet-detail-meals-stack'),
  btnCloseDietModal: document.getElementById('btn-close-diet-modal'),
  btnCancelDiet: document.getElementById('btn-cancel-diet'),

  // Health Workout Elements
  btnOpenAddWorkout: document.getElementById('btn-open-add-workout'),
  modalHealthWorkout: document.getElementById('modal-health-workout'),
  formHealthWorkout: document.getElementById('form-health-workout'),
  workoutEditId: document.getElementById('workout-edit-id'),
  workoutModalTitle: document.getElementById('workout-modal-title'),
  workoutInputDate: document.getElementById('workout-input-date'),
  workoutInputTime: document.getElementById('workout-input-time'),
  workoutInputSubtype: document.getElementById('workout-input-subtype'),
  workoutInputTitle: document.getElementById('workout-input-title'),
  workoutInputDuration: document.getElementById('workout-input-duration'),
  workoutInputCalories: document.getElementById('workout-input-calories'),
  workoutInputContent: document.getElementById('workout-input-content'),
  healthWorkoutGrid: document.getElementById('health-workout-grid'),
  btnCloseWorkoutModal: document.getElementById('btn-close-workout-modal'),
  btnCancelWorkout: document.getElementById('btn-cancel-workout'),
  samsungSteps: document.getElementById('samsung-steps'),
  samsungDistance: document.getElementById('samsung-distance'),
  samsungActiveCal: document.getElementById('samsung-active-cal'),
  samsungActiveTime: document.getElementById('samsung-active-time'),
  samsungStatsDate: document.getElementById('samsung-stats-date'),

  // Health Body Elements
  btnOpenAddBody: document.getElementById('btn-open-add-body'),
  modalHealthBody: document.getElementById('modal-health-body'),
  formHealthBody: document.getElementById('form-health-body'),
  bodyEditId: document.getElementById('body-edit-id'),
  bodyModalTitle: document.getElementById('body-modal-title'),
  bodyInputDate: document.getElementById('body-input-date'),
  bodyInputWeight: document.getElementById('body-input-weight'),
  bodyInputMuscle: document.getElementById('body-input-muscle'),
  bodyInputFat: document.getElementById('body-input-fat'),
  bodyInputNotes: document.getElementById('body-input-notes'),
  btnCloseBodyModal: document.getElementById('btn-close-body-modal'),
  btnCancelBody: document.getElementById('btn-cancel-body'),
  healthBodyTableBody: document.getElementById('health-body-table-body'),
  bodyLatestSummary: document.getElementById('body-latest-summary'),

  // Gemini Settings Elements
  modalGeminiSettings: document.getElementById('modal-gemini-settings'),
  geminiApiKeyInput: document.getElementById('gemini-api-key-input'),
  geminiModelSelect: document.getElementById('gemini-model-select'),
  geminiKeyStatus: document.getElementById('gemini-key-status'),
  btnCloseGeminiModal: document.getElementById('btn-close-gemini-modal'),
  btnCancelGeminiSettings: document.getElementById('btn-cancel-gemini-settings'),
  btnSaveGeminiSettings: document.getElementById('btn-save-gemini-settings')
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initTheme();
  initResizeHandler();
  loadAdminAuth();
  setupEventListeners();
  initRouter();
  loadData();
  loadHealthData();
  initPWA();
});

// Progressive Web App (PWA) Handler
function initPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    });
  }

  let deferredPrompt = null;
  const installBtn = elements.pwaInstallBtn || document.getElementById('pwa-install-btn');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) {
      installBtn.style.display = 'inline-flex';
    }
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] Install prompt outcome: ${outcome}`);
      deferredPrompt = null;
      installBtn.style.display = 'none';
    });
  }

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] AndySec app installed');
    if (installBtn) {
      installBtn.style.display = 'none';
    }
    deferredPrompt = null;
  });
}

// Window Resize Performance Optimizer (suppresses transitions during resize to prevent layout thrashing & stutter)
function initResizeHandler() {
  let resizeTimer;
  window.addEventListener('resize', () => {
    document.body.classList.add('resize-animation-stopper');
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      document.body.classList.remove('resize-animation-stopper');
    }, 120);
  });
}

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
  if (elements.btnOpenAddDiagModal) elements.btnOpenAddDiagModal.style.display = isAdmin ? 'inline-block' : 'none';
  if (elements.btnEditProject) elements.btnEditProject.style.display = isAdmin ? 'inline-block' : 'none';
  if (elements.btnDeleteProject) elements.btnDeleteProject.style.display = isAdmin ? 'inline-block' : 'none';
  if (elements.diagAdminActions) elements.diagAdminActions.style.display = isAdmin ? 'flex' : 'none';
  if (elements.btnOpenAddNote) elements.btnOpenAddNote.style.display = isAdmin ? 'block' : 'none';
  if (elements.btnEditArticle) elements.btnEditArticle.style.display = isAdmin ? 'inline-block' : 'none';
  if (elements.btnDeleteArticle) elements.btnDeleteArticle.style.display = isAdmin ? 'inline-block' : 'none';
  if (elements.btnEditProfile) elements.btnEditProfile.style.display = isAdmin ? 'inline-flex' : 'none';
  if (elements.btnEditPortfolio) elements.btnEditPortfolio.style.display = isAdmin ? 'inline-flex' : 'none';
  if (elements.btnOpenAddNewsEditor) elements.btnOpenAddNewsEditor.style.display = isAdmin ? 'inline-block' : 'none';
  
  // Health Mode Buttons Visibility
  if (elements.modeHealthToggleBtn) {
    elements.modeHealthToggleBtn.style.display = isAdmin ? 'inline-flex' : 'none';
  }
  if (elements.geminiSettingsBtn) {
    elements.geminiSettingsBtn.style.display = (isAdmin && appState.mode === 'health') ? 'inline-flex' : 'none';
  }
  if (!isAdmin && appState.mode === 'health') {
    toggleAppMode('sec');
  }
  
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

  // Synchronize project list table view (show/hide diagnostic sub-rows)
  renderProjectsList();

  // If viewing project detail view, update project notes & diagnostics lock/unlock view immediately
  if (appState.activeProjectId && elements.projectDetailView && elements.projectDetailView.style.display !== 'none') {
    const proj = appState.projects.find(p => p.id === appState.activeProjectId);
    if (proj) renderProjectDiagnostics(proj);
    renderProjectNotes(appState.activeProjectId);
  }
}

// Router using Hash
function initRouter() {
  const handleRouting = () => {
    const hash = window.location.hash;
    
    if (elements.articlePane) elements.articlePane.style.display = 'none';
    if (elements.noteEditorPane) elements.noteEditorPane.style.display = 'none';
    if (elements.diagnosticDetailPane) elements.diagnosticDetailPane.style.display = 'none';
    
    if (hash.startsWith('#/post/')) {
      const postId = hash.replace('#/post/', '');
      showArticleDetail(postId);
    } else if (hash.startsWith('#/diagnostic/')) {
      const path = hash.replace('#/diagnostic/', '');
      const parts = path.split('/');
      const projectId = parts[0];
      const diagId = parts[1];
      showDiagnosticDetail(projectId, diagId);
    } else if (hash.startsWith('#/project/')) {
      const projectId = hash.replace('#/project/', '');
      showProjectDetail(projectId);
    } else if (hash.startsWith('#/health-diet/')) {
      const date = hash.replace('#/health-diet/', '');
      switchTab('health-diet');
      showDietDateDetail(date);
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

// // Instant Local Hydration (0ms Initial Paint)
function hydrateInitialData() {
  let hasData = false;
  try {
    const storedPosts = localStorage.getItem('posts');
    if (storedPosts && storedPosts !== 'undefined') {
      const parsed = JSON.parse(storedPosts);
      if (Array.isArray(parsed) && parsed.length > 0) {
        appState.posts = parsed;
        appState.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        hasData = true;
      }
    }
  } catch (e) {
    console.warn('Failed to parse local posts:', e);
  }

  try {
    const storedProjects = localStorage.getItem('projects');
    if (storedProjects && storedProjects !== 'undefined') {
      const parsed = JSON.parse(storedProjects);
      if (Array.isArray(parsed) && parsed.length > 0) {
        appState.projects = parsed;
        hasData = true;
      }
    }
  } catch (e) {
    console.warn('Failed to parse local projects:', e);
  }

  try {
    const storedNotes = localStorage.getItem('projectNotes');
    if (storedNotes && storedNotes !== 'undefined') {
      const parsed = JSON.parse(storedNotes);
      if (Array.isArray(parsed)) {
        appState.projectNotes = parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse local notes:', e);
  }

  initProfile(null);
  initPortfolio([]);

  if (hasData) {
    renderAll();
  }
  return hasData;
}

// Fetch and apply lightweight metadata from Google Sheets DB
async function fetchAndApplyAllData(expectedLastModified = null) {
  try {
    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${GAS_API_URL}?action=getAllData`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutTimer);

    if (!res.ok) return false;
    const data = await res.json();
    if (!data || !data.success) return false;

    if (Array.isArray(data.posts)) {
      appState.posts = data.posts;
      localStorage.setItem('posts', JSON.stringify(data.posts));
      appState.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    if (Array.isArray(data.projects)) {
      await initProjects(data.projects);
    }
    if (Array.isArray(data.projectNotes)) {
      appState.projectNotes = data.projectNotes;
      localStorage.setItem('projectNotes', JSON.stringify(data.projectNotes));
    }
    if (data.profile) {
      initProfile(data.profile);
    }
    if (Array.isArray(data.portfolio)) {
      initPortfolio(data.portfolio);
    }

    const lastMod = data.lastModified || expectedLastModified || new Date().toISOString();
    localStorage.setItem('andysec_last_modified', lastMod);

    renderAll();
    console.log(`[GAS API] Successfully synced data (${appState.posts.length} posts, ${appState.projects.length} projects). Timestamp: ${lastMod}`);
    return true;
  } catch (err) {
    console.warn('[GAS API] fetchAndApplyAllData error:', err);
    return false;
  }
}

// Load All Data (ETag / Conditional Last-Modified Smart Caching)
async function loadData() {
  // 1. 로컬 캐시 즉시 렌더링 (체감 대기시간 0초)
  const hasLocalData = hydrateInitialData();
  const cachedLastModified = localStorage.getItem('andysec_last_modified');

  // 로컬 캐시가 아예 없는 최초 방문자인 경우에만 로딩 오버레이 표출
  const isFirstVisit = !hasLocalData || !cachedLastModified;
  if (isFirstVisit) {
    showLoader('데이터 로딩 중...', '구글 시트 데이터베이스와 연결하고 있습니다.');
    const ok = await fetchAndApplyAllData();
    hideLoader();
    if (!ok) {
      showTopRightError('DB에서 데이터를 불러오지 못했습니다. 잠시후 다시 시도해주세요.');
    }
    return;
  }

  // 2. 이미 캐시가 있는 경우: 화면은 즉시 사용 가능하며, 백그라운드에서 최종 수정 시각만 초경량(50B) 대조
  try {
    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), 8000);

    const modRes = await fetch(`${GAS_API_URL}?action=getLastModified`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutTimer);

    if (modRes.ok) {
      const modData = await modRes.json();
      if (modData && modData.success && modData.lastModified) {
        const serverLastModified = modData.lastModified;

        // 캐시와 최종 변경 시각이 완전히 동일: 추가 다운로드 0회, 즉시 종료
        if (cachedLastModified === serverLastModified) {
          console.log(`[DB Cache Hit] 로컬 캐시가 최신 상태입니다. (최종 변경: ${serverLastModified})`);
          return;
        }

        // DB에 변경이 발생한 경우: 경량 전체 데이터 동기화
        console.log(`[DB Cache Miss/Update] DB 변경 감지 (${cachedLastModified} -> ${serverLastModified}). 최신 데이터를 동기화합니다.`);
        await fetchAndApplyAllData(serverLastModified);
      }
    }
  } catch (err) {
    console.warn('[GAS API] 백그라운드 최종 수정 시각 확인 실패 (캐시로 정상 표시 중):', err);
  }
}

// Initialize projects (100% GAS DB Single Source of Truth)
async function initProjects(gasServerProjects = []) {
  if (Array.isArray(gasServerProjects) && gasServerProjects.length > 0) {
    appState.projects = gasServerProjects;
    localStorage.setItem('projects', JSON.stringify(gasServerProjects));
    return;
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

  appState.projects = localProjects;
}

// Safe HTML escaping helper
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Initialize Profile State
function initProfile(serverProfile = null) {
  if (serverProfile && serverProfile.name) {
    appState.profile = serverProfile;
    localStorage.setItem('profile', JSON.stringify(serverProfile));
  } else {
    try {
      const stored = localStorage.getItem('profile');
      if (stored && stored !== 'undefined') {
        appState.profile = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse local profile:', e);
    }
    if (!appState.profile) {
      appState.profile = { ...DEFAULT_PROFILE };
    }
  }
}

// Initialize Portfolio State
function initPortfolio(serverPortfolio = []) {
  if (Array.isArray(serverPortfolio) && serverPortfolio.length > 0) {
    appState.portfolio = serverPortfolio;
    localStorage.setItem('portfolio', JSON.stringify(serverPortfolio));
  } else {
    try {
      const stored = localStorage.getItem('portfolio');
      if (stored && stored !== 'undefined') {
        appState.portfolio = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse local portfolio:', e);
    }
    if (!Array.isArray(appState.portfolio) || appState.portfolio.length === 0) {
      appState.portfolio = [...DEFAULT_PORTFOLIO];
    }
  }
}

// Render Profile in Sidebar & Portfolio Tab Quote
function renderProfile() {
  const p = appState.profile || DEFAULT_PROFILE;
  if (elements.profileDisplayName) elements.profileDisplayName.textContent = p.name || '';
  if (elements.profileDisplayTitle) elements.profileDisplayTitle.textContent = p.title || '';
  if (elements.profileDisplaySlogan) elements.profileDisplaySlogan.textContent = p.company || '';
  if (elements.profileDisplayEmail) elements.profileDisplayEmail.textContent = p.email || '';
  if (elements.profileDisplayPhone) elements.profileDisplayPhone.textContent = p.phone || '';
  if (elements.emailBtn && p.email) elements.emailBtn.href = `mailto:${p.email}`;
  if (elements.phoneBtn && p.phone) elements.phoneBtn.href = `tel:${p.phone}`;

  // Portfolio quote / intro
  if (elements.portfolioQuoteText) elements.portfolioQuoteText.textContent = p.bio || p.company || '';
  if (elements.portfolioQuoteAuthor) elements.portfolioQuoteAuthor.textContent = `${p.title || ''} ${p.name || ''}`.trim();
}

// Render Portfolio items dynamically (Certifications, Projects, Careers, Skills)
function renderPortfolio() {
  const items = appState.portfolio || DEFAULT_PORTFOLIO;

  // 1. Certifications
  const certs = items.filter(i => i.type === 'cert');
  if (elements.timelineCerts) {
    if (certs.length === 0) {
      elements.timelineCerts.innerHTML = '<p class="text-muted" style="font-size: 0.85rem; padding: 0.5rem 0;">등록된 자격증이 없습니다.</p>';
    } else {
      elements.timelineCerts.innerHTML = certs.map(c => `
        <div class="timeline-item">
          <span class="timeline-date">${escapeHtml(c.date || '')}</span>
          <div class="timeline-content">
            <h5>${escapeHtml(c.title || '')}</h5>
            <p>${escapeHtml(c.description || '')}</p>
          </div>
        </div>
      `).join('');
    }
  }

  // 2. Project History
  const projects = items.filter(i => i.type === 'project');
  if (elements.timelineProjects) {
    if (projects.length === 0) {
      elements.timelineProjects.innerHTML = '<p class="text-muted" style="font-size: 0.85rem; padding: 0.5rem 0;">등록된 프로젝트 이력이 없습니다.</p>';
    } else {
      elements.timelineProjects.innerHTML = projects.map(pr => `
        <div class="timeline-item">
          <span class="timeline-date">${escapeHtml(pr.date || '')}</span>
          <div class="timeline-content">
            <h5>${escapeHtml(pr.title || '')}</h5>
            <p>${escapeHtml(pr.description || '')}</p>
          </div>
        </div>
      `).join('');
    }
  }

  // 3. Careers
  const careers = items.filter(i => i.type === 'career');
  if (elements.timelineCareers) {
    if (careers.length === 0) {
      elements.timelineCareers.innerHTML = '<p class="text-muted" style="font-size: 0.85rem; padding: 0.5rem 0;">등록된 경력 이력이 없습니다.</p>';
    } else {
      elements.timelineCareers.innerHTML = careers.map(cr => `
        <div class="timeline-item">
          <span class="timeline-date">${escapeHtml(cr.date || '')}</span>
          <div class="timeline-content">
            <h5>${escapeHtml(cr.title || '')}</h5>
            <p>${escapeHtml(cr.description || '')}</p>
          </div>
        </div>
      `).join('');
    }
  }

  // 4. Skills
  const skills = items.filter(i => i.type === 'skill');
  if (elements.skillsContainer) {
    if (skills.length === 0) {
      elements.skillsContainer.innerHTML = '<p class="text-muted" style="font-size: 0.85rem; padding: 0.5rem 0;">등록된 스킬이 없습니다.</p>';
    } else {
      // Group by category
      const categories = {};
      skills.forEach(sk => {
        const cat = sk.category || '기타 역량';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(sk);
      });

      let html = '';
      Object.keys(categories).forEach(cat => {
        html += `<div class="skill-category-title">${escapeHtml(cat)}</div>`;
        categories[cat].forEach(sk => {
          const percent = Math.min(100, Math.max(0, Number(sk.percent) || 0));
          html += `
            <div class="skill-item">
              <div class="skill-info">
                <span>${escapeHtml(sk.title || '')}</span>
                <span class="skill-level">${escapeHtml(sk.level || '')}</span>
              </div>
              <div class="progress-bar"><div class="progress" style="width: ${percent}%;"></div></div>
            </div>
          `;
        });
      });
      elements.skillsContainer.innerHTML = html;
    }
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
  const validTabs = ['dashboard', 'study', 'projects', 'news', 'portfolio', 'health-dashboard', 'health-diet', 'health-workout', 'health-body'];
  if (!validTabs.includes(tabId)) {
    tabId = (appState.mode === 'health') ? 'health-dashboard' : 'dashboard';
  }
  
  appState.currentTab = tabId;
  if (tabId.startsWith('health-')) {
    appState.currentHealthTab = tabId;
    appState.mode = 'health';
    if (elements.navSec) elements.navSec.style.display = 'none';
    if (elements.navHealth) elements.navHealth.style.display = 'flex';
    if (elements.modeHealthToggleBtn) {
      elements.modeHealthToggleBtn.innerHTML = '<i class="fa-solid fa-shield-halved" style="color: #38bdf8;"></i>';
      elements.modeHealthToggleBtn.title = '보안 블로그 모드로 복귀';
      elements.modeHealthToggleBtn.classList.add('active-health');
    }
    if (elements.geminiSettingsBtn) {
      elements.geminiSettingsBtn.style.display = appState.isAdmin ? 'inline-flex' : 'none';
    }
  } else {
    if (appState.mode === 'health') {
      appState.mode = 'sec';
      if (elements.navSec) elements.navSec.style.display = 'flex';
      if (elements.navHealth) elements.navHealth.style.display = 'none';
      if (elements.modeHealthToggleBtn) {
        elements.modeHealthToggleBtn.innerHTML = '<i class="fa-solid fa-heart" style="color: #10b981;"></i>';
        elements.modeHealthToggleBtn.title = 'Health & Fitness 모드로 전환';
        elements.modeHealthToggleBtn.classList.remove('active-health');
      }
      if (elements.geminiSettingsBtn) {
        elements.geminiSettingsBtn.style.display = 'none';
      }
    }
  }

  appState.activePostId = null;
  appState.activePostType = null;
  appState.activeProjectId = null;
  appState.activeDiagId = null;
  if (tabId !== 'health-diet' || !window.location.hash.startsWith('#/health-diet/')) {
    appState.activeDietDate = null;
    if (elements.dietDateDetailView) elements.dietDateDetailView.style.display = 'none';
    if (elements.dietDateListView) elements.dietDateListView.style.display = 'block';
  }
  
  if (elements.articlePane) elements.articlePane.style.display = 'none';
  if (elements.noteEditorPane) elements.noteEditorPane.style.display = 'none';
  if (elements.projectDetailView) elements.projectDetailView.style.display = 'none';
  if (elements.diagnosticDetailPane) elements.diagnosticDetailPane.style.display = 'none';
  if (elements.projectsListView) elements.projectsListView.style.display = 'block';
  
  const allNavBtns = document.querySelectorAll('.nav-menu .nav-btn');
  allNavBtns.forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const allPanes = document.querySelectorAll('.tab-pane');
  allPanes.forEach(pane => {
    if (pane.id === `tab-${tabId}`) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });
  
  if (tabId.startsWith('health-')) {
    renderHealthSection(tabId);
  } else {
    renderAll();
  }
}

// Render All Components
function renderAll() {
  renderProfile();
  renderPortfolio();
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
      const importanceHtml = news.importance ? `<span style="color:#fb923c">${escapeHtml(news.importance)}</span>` : '';
      const sourceHtml = news.source ? `<div class="news-sidebar-desc">출처: ${escapeHtml(news.source)}</div>` : '';
      item.innerHTML = `
        <div class="news-sidebar-header">
          ${importanceHtml}
          <span class="notice-date">${escapeHtml(news.date || '')}</span>
        </div>
        <div class="news-sidebar-title">${escapeHtml(news.title || '')}</div>
        ${sourceHtml}
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
    const typeBadgeHtml = post.type ? `<span class="badge type-badge">${escapeHtml(post.type)}</span>` : '';
    card.innerHTML = `
      <div class="post-card-header">
        <span class="badge ${post.category.toLowerCase()}">${getCategoryName(post.category)}</span>
        ${typeBadgeHtml}
      </div>
      <div class="post-card-body">
        <h4 class="post-card-title">${escapeHtml(post.title)}</h4>
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

// Helper for diagnostic status badge
function getDiagStatusInfo(status) {
  switch (status) {
    case 'completed':
      return { label: '완료', cls: 'completed' };
    case 'in-progress':
      return { label: '진행중', cls: 'in-progress' };
    case 'planned':
      return { label: '예정', cls: 'planned' };
    default:
      return { label: status || '진행중', cls: 'in-progress' };
  }
}

// Render Projects Tab Table with Tree Hierarchy
function renderProjectsList() {
  if (!elements.projectsTableBody) return;
  elements.projectsTableBody.innerHTML = '';
  
  if (!appState.expandedProjects) {
    appState.expandedProjects = new Set(['project-1782022260306']);
  }
  
  const projects = appState.projects.filter(p => {
    if (!appState.searchQuery) return true;
    const q = appState.searchQuery.toLowerCase();
    const matchesProject = p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q) || (p.details && p.details.toLowerCase().includes(q));
    const matchesDiag = p.diagnostics && p.diagnostics.some(d => 
      d.name.toLowerCase().includes(q) || (d.target && d.target.toLowerCase().includes(q)) || (d.type && d.type.toLowerCase().includes(q))
    );
    return matchesProject || matchesDiag;
  });
  
  if (projects.length === 0) {
    elements.projectsTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">등록된 프로젝트가 없습니다.</td></tr>';
    return;
  }
  
  projects.forEach(p => {
    const progressPercent = calculateProgress(p.startDate, p.endDate);
    const hasDiags = appState.isAdmin && Array.isArray(p.diagnostics) && p.diagnostics.length > 0;
    const isExpanded = hasDiags && appState.expandedProjects.has(p.id);

    // Parent Project Row
    const tr = document.createElement('tr');
    tr.className = `project-table-row ${hasDiags ? 'tree-parent-row' : ''}`;
    tr.style.cursor = 'pointer';

    const toggleBtnHtml = hasDiags
      ? `<button class="tree-toggle-btn ${isExpanded ? 'expanded' : ''}" data-project-id="${p.id}" title="${isExpanded ? '진단 일정 접기' : '진단 일정 펼치기'}">
           <i class="fa-solid fa-chevron-right"></i>
         </button>`
      : `<span style="display:inline-block; width:24px;"></span>`;

    const diagCountBadge = hasDiags
      ? `<span class="diag-count-badge"><i class="fa-solid fa-list-check"></i> 세부진단 ${p.diagnostics.length}</span>`
      : '';

    tr.innerHTML = `
      <td class="col-proj-name">
        ${toggleBtnHtml}
        <strong>${p.name}</strong>
        ${diagCountBadge}
      </td>
      <td class="col-client"><span class="client-badge" style="margin-bottom:0">${p.client}</span></td>
      <td class="col-start"><span style="font-family:var(--font-code)">${p.startDate}</span></td>
      <td class="col-end"><span style="font-family:var(--font-code)">${p.endDate}</span></td>
      <td class="col-progress">
        <div class="project-progress-container" style="width: 140px;">
          <div class="progress-lbl-row" style="font-size:0.75rem">
            <span>${progressPercent}%</span>
          </div>
          <div class="progress-bar" style="height:4px"><div class="progress" style="width: ${progressPercent}%;"></div></div>
        </div>
      </td>
    `;

    // Toggle button click (stop propagation so it doesn't navigate into project)
    const toggleBtn = tr.querySelector('.tree-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (appState.expandedProjects.has(p.id)) {
          appState.expandedProjects.delete(p.id);
        } else {
          appState.expandedProjects.add(p.id);
        }
        renderProjectsList();
      });
    }

    // Row click: go to project detail
    tr.addEventListener('click', () => {
      window.location.hash = `#/project/${p.id}`;
    });
    elements.projectsTableBody.appendChild(tr);

    // Render Sub-Tree Child Rows if expanded
    if (hasDiags && isExpanded) {
      p.diagnostics.forEach((diag, idx) => {
        const isLast = idx === p.diagnostics.length - 1;
        const branchSymbol = isLast ? '└──' : '├──';
        const stInfo = getDiagStatusInfo(diag.status);
        
        const subTr = document.createElement('tr');
        subTr.className = `project-table-row diagnostic-sub-row ${isLast ? 'last-sub-row' : ''}`;
        subTr.style.cursor = 'pointer';
        subTr.innerHTML = `
          <td class="col-proj-name">
            <div class="tree-branch-container">
              <span class="tree-branch-line">${branchSymbol}</span>
              <span class="tree-diag-icon"><i class="fa-solid fa-shield-halved"></i></span>
              <span class="tree-diag-name">${diag.name}</span>
            </div>
          </td>
          <td class="col-client">
            <span class="diag-type-badge">${escapeHtml(diag.type || '')}</span>
          </td>
          <td class="col-start"><span style="font-family:var(--font-code)">${diag.startDate}</span></td>
          <td class="col-end"><span style="font-family:var(--font-code)">${diag.endDate}</span></td>
          <td class="col-progress">
            <div class="diag-sub-status-cell">
              <span class="diag-status-badge ${stInfo.cls}">${stInfo.label}</span>
              <span class="diag-detail-arrow" title="진단 상세 보기"><i class="fa-solid fa-arrow-right"></i></span>
            </div>
          </td>
        `;

        // Direct navigation to diagnostic detail!
        subTr.addEventListener('click', (e) => {
          e.stopPropagation();
          window.location.hash = `#/diagnostic/${p.id}/${diag.id}`;
        });

        elements.projectsTableBody.appendChild(subTr);
      });
    }
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
  
  if (elements.diagnosticDetailPane) elements.diagnosticDetailPane.style.display = 'none';
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
  
  renderProjectDiagnostics(project);
  renderProjectNotes(projectId);
  applyAdminPermissions();
}

// Render Sub-Diagnostics inside Project Detail View
function renderProjectDiagnostics(project) {
  if (!elements.projectDiagnosticsGrid) return;
  elements.projectDiagnosticsGrid.innerHTML = '';
  
  if (!appState.isAdmin) {
    elements.projectDiagnosticsGrid.innerHTML = `
      <div class="lock-placeholder" style="grid-column: 1/-1; text-align: center; padding: 3rem 2rem; background: rgba(220, 38, 38, 0.04); border: 1px dashed rgba(220, 38, 38, 0.2); border-radius: 8px;">
        <i class="fa-solid fa-lock" style="font-size: 2rem; color: #ef4444; margin-bottom: 1rem; display: block;"></i>
        <h4 style="font-family: var(--font-header); font-size: 1.1rem; color: var(--text-highlight); margin-bottom: 0.5rem;">세부 진단 과업 및 수행 일정 비공개</h4>
        <p class="text-muted" style="font-size: 0.85rem; max-width: 460px; margin: 0 auto; line-height: 1.5;">
          본 프로젝트의 세부 진단 과업 및 일정 정보는 보안상 비공개 상태입니다. 접근 권한을 획득하려면 상단 <strong>관리자 열쇠(🔑)</strong> 버튼을 눌러 인증하십시오.
        </p>
      </div>
    `;
    return;
  }
  
  const diags = project.diagnostics || [];
  if (diags.length === 0) {
    elements.projectDiagnosticsGrid.innerHTML = `
      <div class="card" style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: var(--text-muted);">
        <i class="fa-solid fa-clipboard-list" style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
        <p>등록된 세부 진단 과업이 없습니다.</p>
        <p style="font-size: 0.85rem; margin-top: 0.5rem;">상단의 [새 진단 일정 추가] 버튼을 눌러 진단을 등록해 보세요.</p>
      </div>
    `;
    return;
  }

  diags.forEach(diag => {
    const stInfo = getDiagStatusInfo(diag.status);
    const progressPercent = diag.status === 'completed' ? 100 : calculateProgress(diag.startDate, diag.endDate);
    
    const card = document.createElement('div');
    card.className = 'diag-card';
    card.innerHTML = `
      <div>
        <div class="diag-card-top">
          ${diag.type ? `<span class="diag-type-badge">${escapeHtml(diag.type)}</span>` : ''}
          <span class="diag-status-badge ${stInfo.cls}">${stInfo.label}</span>
        </div>
        <h4 class="diag-card-title">${diag.name}</h4>
        <div class="diag-card-target">
          <i class="fa-solid fa-bullseye"></i>
          <span><strong>대상:</strong> ${diag.target || '-'}</span>
        </div>
        <p class="diag-card-desc">${diag.details || '상세 설명이 없습니다.'}</p>
        <div class="diag-card-schedule">
          <i class="fa-regular fa-calendar"></i>
          <span>${diag.startDate} ~ ${diag.endDate}</span>
        </div>
        <div class="project-progress-wrapper" style="margin-bottom: 1rem;">
          <div class="progress-lbl-row" style="font-size: 0.75rem;">
            <span>진행률</span>
            <span>${progressPercent}%</span>
          </div>
          <div class="progress-bar" style="height: 5px;"><div class="progress" style="width: ${progressPercent}%;"></div></div>
        </div>
      </div>
      <div class="diag-card-footer">
        <button class="btn-diag-view" data-diag-id="${diag.id}">
          <i class="fa-solid fa-file-lines"></i> 진단 상세 일지 보기
        </button>
        ${appState.isAdmin ? `
          <div class="meta-actions" style="display: flex; gap: 0.4rem;">
            <button class="btn-secondary btn-sm btn-edit-diag" data-diag-id="${diag.id}" title="진단 수정"><i class="fa-regular fa-pen-to-square"></i></button>
            <button class="btn-danger btn-sm btn-del-diag" data-diag-id="${diag.id}" title="진단 삭제"><i class="fa-regular fa-trash-can"></i></button>
          </div>
        ` : ''}
      </div>
    `;

    card.querySelector('.btn-diag-view').addEventListener('click', () => {
      window.location.hash = `#/diagnostic/${project.id}/${diag.id}`;
    });

    if (appState.isAdmin) {
      card.querySelector('.btn-edit-diag')?.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditDiagnosticModal(project.id, diag.id);
      });
      card.querySelector('.btn-del-diag')?.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteDiagnostic(project.id, diag.id);
      });
    }

    elements.projectDiagnosticsGrid.appendChild(card);
  });
}

// Show Diagnostic Detail View
function showDiagnosticDetail(projectId, diagId) {
  if (!appState.isAdmin) {
    alert('보안상 비공개 상태인 세부 진단 일지입니다. 관리자 열쇠(🔑)로 인증 후 확인 가능합니다.');
    window.location.hash = `#/project/${projectId}`;
    return;
  }

  const project = appState.projects.find(p => p.id === projectId);
  if (!project) {
    alert('해당 프로젝트를 찾을 수 없습니다.');
    window.location.hash = '#/tab/projects';
    return;
  }
  const diag = project.diagnostics ? project.diagnostics.find(d => d.id === diagId) : null;
  if (!diag) {
    alert('해당 진단 일정을 찾을 수 없습니다.');
    window.location.hash = `#/project/${projectId}`;
    return;
  }

  appState.activeProjectId = projectId;
  appState.activeDiagId = diagId;

  if (elements.projectsListView) elements.projectsListView.style.display = 'none';
  if (elements.projectDetailView) elements.projectDetailView.style.display = 'none';
  if (elements.diagnosticDetailPane) elements.diagnosticDetailPane.style.display = 'block';

  elements.tabPanes.forEach(pane => pane.classList.remove('active'));
  document.getElementById('tab-projects').classList.add('active');

  // Breadcrumbs & Names
  if (elements.diagParentProjName) {
    elements.diagParentProjName.textContent = project.name;
    elements.diagParentProjName.onclick = () => {
      window.location.hash = `#/project/${project.id}`;
    };
  }
  if (elements.diagCurrentName) elements.diagCurrentName.textContent = diag.name;
  if (elements.detailDiagName) elements.detailDiagName.textContent = diag.name;
  if (elements.detailDiagTarget) elements.detailDiagTarget.textContent = diag.target || '지정되지 않음';
  if (elements.detailDiagDesc) elements.detailDiagDesc.textContent = diag.details || '';

  // Badges
  const stInfo = getDiagStatusInfo(diag.status);
  if (elements.diagTypeBadge) {
    elements.diagTypeBadge.textContent = diag.type || '';
    elements.diagTypeBadge.style.display = diag.type ? 'inline-block' : 'none';
  }
  if (elements.diagStatusBadge) {
    elements.diagStatusBadge.className = `diag-status-badge ${stInfo.cls}`;
    elements.diagStatusBadge.textContent = stInfo.label;
  }

  // Schedule & Progress
  const progressPercent = diag.status === 'completed' ? 100 : calculateProgress(diag.startDate, diag.endDate);
  if (elements.detailDiagSchedule) elements.detailDiagSchedule.textContent = `${diag.startDate} ~ ${diag.endDate}`;
  if (elements.detailDiagProgressBar) elements.detailDiagProgressBar.style.width = `${progressPercent}%`;
  if (elements.detailDiagPercent) elements.detailDiagPercent.textContent = `${progressPercent}%`;

  // Markdown Content
  if (elements.diagnosticArticleContent) {
    if (diag.content && diag.content.trim()) {
      elements.diagnosticArticleContent.innerHTML = marked.parse(diag.content);
    } else {
      elements.diagnosticArticleContent.innerHTML = '<p class="text-muted" style="text-align:center; padding: 2rem;">작성된 진단 상세 일지 및 점검 결과가 없습니다.</p>';
    }
  }

  // Admin Actions
  if (elements.diagAdminActions) {
    elements.diagAdminActions.style.display = appState.isAdmin ? 'flex' : 'none';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Open Add/Edit Diagnostic Modal
function openAddDiagnosticModal(projectId) {
  if (!elements.addDiagnosticModal) return;
  elements.diagModalTitle.innerHTML = '<i class="fa-solid fa-list-check"></i> 세부 진단 일정 등록';
  elements.addDiagnosticForm.reset();
  elements.diagEditId.value = '';
  elements.diagParentId.value = projectId;
  elements.btnSubmitDiag.textContent = '진단 등록';
  elements.addDiagnosticModal.style.display = 'flex';
}

function openEditDiagnosticModal(projectId, diagId) {
  if (!elements.addDiagnosticModal) return;
  const project = appState.projects.find(p => p.id === projectId);
  if (!project) return;
  const diag = project.diagnostics ? project.diagnostics.find(d => d.id === diagId) : null;
  if (!diag) return;

  elements.diagModalTitle.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> 세부 진단 일정 수정';
  elements.diagEditId.value = diag.id;
  elements.diagParentId.value = projectId;
  elements.diagName.value = diag.name || '';
  elements.diagType.value = diag.type || '';
  elements.diagStatus.value = diag.status || 'in-progress';
  elements.diagTarget.value = diag.target || '';
  elements.diagStart.value = diag.startDate || '';
  elements.diagEnd.value = diag.endDate || '';
  elements.diagDesc.value = diag.details || '';
  elements.diagContent.value = diag.content || '';
  elements.btnSubmitDiag.textContent = '변경사항 저장';
  elements.addDiagnosticModal.style.display = 'flex';
}

// Delete Diagnostic
async function deleteDiagnostic(projectId, diagId) {
  if (!confirm('정말로 이 세부 진단 일정을 삭제하시겠습니까?')) return;
  const project = appState.projects.find(p => p.id === projectId);
  if (!project || !project.diagnostics) return;

  const updatedProject = {
    ...project,
    diagnostics: project.diagnostics.filter(d => d.id !== diagId)
  };

  if (appState.isAdmin && appState.adminPassword) {
    try {
      await sendToGasApi('saveProject', updatedProject);
    } catch (err) {
      alert(err.message);
      return;
    }
  }

  const pIdx = appState.projects.findIndex(p => p.id === projectId);
  if (pIdx !== -1) appState.projects[pIdx] = updatedProject;
  localStorage.setItem('projects', JSON.stringify(appState.projects));

  if (appState.activeDiagId === diagId) {
    window.location.hash = `#/project/${projectId}`;
  } else {
    renderProjectsList();
    if (elements.projectDetailView && elements.projectDetailView.style.display !== 'none') {
      renderProjectDiagnostics(updatedProject);
    }
  }
}

// Render Notes associated with specific project
function renderProjectNotes(projectId) {
  elements.projectNotesGrid.innerHTML = '';
  
  if (!appState.isAdmin) {
    elements.projectNotesGrid.innerHTML = `
      <div class="lock-placeholder" style="grid-column: 1/-1; text-align: center; padding: 3rem 2rem; background: rgba(220, 38, 38, 0.04); border: 1px dashed rgba(220, 38, 38, 0.2); border-radius: 8px;">
        <i class="fa-solid fa-lock" style="font-size: 2rem; color: #ef4444; margin-bottom: 1rem; display: block;"></i>
        <h4 style="font-family: var(--font-header); font-size: 1.1rem; color: var(--text-highlight); margin-bottom: 0.5rem;">프로젝트 기록판 비공개</h4>
        <p class="text-muted" style="font-size: 0.85rem; max-width: 460px; margin: 0 auto; line-height: 1.5;">
          본 프로젝트의 상세 스터디 및 진단 기록은 보안상 비공개 상태입니다. 접근 권한을 획득하려면 상단 <strong>관리자 열쇠(🔑)</strong> 버튼을 눌러 인증하십시오.
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
  } else if (post.category === 'News' && post.source) {
    elements.articleType.style.display = 'inline-block';
    elements.articleType.textContent = `출처: ${post.source}`;
  } else {
    elements.articleType.style.display = 'none';
  }
  
  if (!post.content) {
    elements.articleContent.innerHTML = '<p class="text-center text-muted" style="padding: 2.5rem;"><i class="fa-solid fa-spinner fa-spin"></i> 본문 내용을 안전하게 불러오는 중...</p>';
    try {
      const res = await fetch(`${GAS_API_URL}?action=getPostDetail&id=${encodeURIComponent(post.id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && (data.content || (data.post && data.post.content))) {
          post.content = data.content || data.post.content;
          if (data.post && data.post.images && Array.isArray(data.post.images)) {
            post.images = data.post.images;
          }
          // 읽은 본문을 로컬 캐시에도 보관하여 재열람 시 0ms 즉시 표시
          try {
            const storedPosts = JSON.parse(localStorage.getItem('posts') || '[]');
            const idx = storedPosts.findIndex(p => p.id === post.id);
            if (idx !== -1) {
              storedPosts[idx].content = post.content;
              if (post.images) storedPosts[idx].images = post.images;
              localStorage.setItem('posts', JSON.stringify(storedPosts));
            }
          } catch (storageErr) {}
        } else {
          post.content = `# ${post.title}\n\n본문 데이터를 불러오지 못했습니다.`;
        }
      } else {
        post.content = `# ${post.title}\n\n본문 데이터를 불러오지 못했습니다. (HTTP ${res.status})`;
      }
    } catch (e) {
      post.content = `# ${post.title}\n\n본문을 불러오는 중 네트워크 오류가 발생했습니다.`;
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
    if (appState.newsFilter !== 'all') {
      if ((p.importance || '') !== appState.newsFilter) return false;
    }
    return true;
  }).filter(matchSearch);
  
  if (newsList.length === 0) {
    elements.fullNewsTable.innerHTML = `<tr><td colspan="${isDeleteMode ? 6 : 5}" class="text-center text-muted" style="padding: 2rem;">해당 조건의 보안 뉴스가 존재하지 않습니다.</td></tr>`;
    return;
  }
  
  newsList.forEach(news => {
    const tr = document.createElement('tr');
    tr.className = 'news-table-row';
    const importanceHtml = news.importance
      ? `<span class="news-importance-stars" style="color:#fb923c">${escapeHtml(news.importance)}</span>`
      : '<span class="text-muted">-</span>';
    const sourceHtml = news.source
      ? `<span class="badge news-source-badge">${escapeHtml(news.source)}</span>`
      : '<span class="text-muted">-</span>';
    const newsLinkHtml = news.newsLink
      ? `<a href="${escapeHtml(news.newsLink)}" target="_blank" class="news-link-btn news-external-link" title="원본 기사 링크"><i class="fa-solid fa-arrow-up-right-from-square"></i> 이동</a>`
      : '<span class="text-muted" style="font-size: 0.85rem;">-</span>';

    tr.innerHTML = `
      <td class="news-delete-col" style="${isDeleteMode ? '' : 'display: none;'} text-align: center;">
        <input type="checkbox" class="news-item-checkbox" data-id="${escapeHtml(news.id)}">
      </td>
      <td class="col-importance">${importanceHtml}</td>
      <td class="col-title"><strong class="news-link-btn" style="cursor:pointer">${escapeHtml(news.title)}</strong></td>
      <td class="col-source">${sourceHtml}</td>
      <td class="col-date text-muted">${escapeHtml(news.date || '')}</td>
      <td class="col-link">${newsLinkHtml}</td>
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
  const title = (post.title || '').toLowerCase();
  const typeMatch = post.type && post.type.toLowerCase().includes(q);
  const sourceMatch = post.source && post.source.toLowerCase().includes(q);
  return title.includes(q) || typeMatch || sourceMatch;
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
    let response;

    // deletePost는 브라우저 간 교차 출처(CORS) 302 리다이렉트 시 본문 손실/차단 이슈가 없는 GET 파라미터 방식을 우선 시도
    if (action === 'deletePost' && data && data.id) {
      try {
        const getUrl = `${GAS_API_URL}?action=deletePost&id=${encodeURIComponent(data.id)}&password=${encodeURIComponent(appState.adminPassword)}`;
        response = await fetch(getUrl, { method: 'GET' });
      } catch (getErr) {
        console.warn('[GAS API GET Delete error, attempting POST fallback]', getErr);
      }
    }

    if (!response) {
      const payload = {
        password: appState.adminPassword,
        action: action,
        data: data
      };

      try {
        response = await fetch(GAS_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8' // GAS doPost CORS preflight 최적화
          },
          body: JSON.stringify(payload)
        });
      } catch (netErr) {
        // 만약 deletePost에서 POST 오류 발생 시 GET으로 재시도
        if (action === 'deletePost' && data && data.id) {
          try {
            const getUrl = `${GAS_API_URL}?action=deletePost&id=${encodeURIComponent(data.id)}&password=${encodeURIComponent(appState.adminPassword)}`;
            response = await fetch(getUrl, { method: 'GET' });
          } catch (retryErr) {
            console.error('[GAS API Network/CORS Error]', retryErr);
            throw new Error(`Google Sheets 통신 실패 (${netErr.message || 'Failed to fetch'}).\n\n[원인]\nGoogle Apps Script 웹 앱 배포 설정의 '액세스 권한이 있는 사용자'가 '모든 사용자(Anyone)'로 설정되지 않아 브라우저 보안에 의해 연결이 거부되었습니다.\n\n[해결 방법]\nApps Script 편집기 > 배포 관리 > ✏️(편집) > '액세스 권한'을 '모든 사용자(Anyone)'로 변경 후 새 버전으로 배포해 주세요.`);
          }
        } else {
          console.error('[GAS API Network/CORS Error]', netErr);
          throw new Error(`Google Sheets 통신 실패 (${netErr.message || 'Failed to fetch'}).\n\n[원인]\nGoogle Apps Script 웹 앱 배포 설정의 '액세스 권한이 있는 사용자'가 '모든 사용자(Anyone)'로 설정되지 않아 브라우저 보안에 의해 연결이 거부되었습니다.\n\n[해결 방법]\nApps Script 편집기 > 배포 관리 > ✏️(편집) > '액세스 권한'을 '모든 사용자(Anyone)'로 변경 후 새 버전으로 배포해 주세요.`);
        }
      }
    }

    if (!response.ok) {
      throw new Error(`서버 응답 오류 (HTTP ${response.status})`);
    }

    const resJson = await response.json();
    if (!resJson.success) {
      throw new Error(resJson.error || '작업 수행 실패');
    }

    if (resJson.lastModified) {
      localStorage.setItem('andysec_last_modified', resJson.lastModified);
    }

    return resJson;
  } finally {
    hideLoader();
  }
}

// Spinner Helper with Smooth Fade-out
function showLoader(title, desc) {
  if (!elements.deployOverlay) return;
  elements.deployOverlay.classList.remove('fade-out');
  elements.deployOverlayTitle.textContent = title;
  elements.deployOverlayDesc.textContent = desc;
  elements.deployOverlay.style.display = 'flex';
}

function hideLoader(callback = null) {
  if (!elements.deployOverlay) {
    if (callback) callback();
    return;
  }
  elements.deployOverlay.classList.add('fade-out');
  setTimeout(() => {
    elements.deployOverlay.style.display = 'none';
    elements.deployOverlay.classList.remove('fade-out');
    if (callback) callback();
  }, 500);
}

// Top-Right Red Popup Toast Message (5초 후 fadeout)
function showTopRightError(message = 'DB에서 데이터를 불러오지 못했습니다. 잠시후 다시 시도해주세요.') {
  let toast = document.getElementById('top-right-error-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'top-right-error-toast';
    toast.className = 'top-right-toast';
    toast.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> <span id="top-right-error-msg"></span>';
    document.body.appendChild(toast);
  }
  const msgSpan = toast.querySelector('#top-right-error-msg');
  if (msgSpan) msgSpan.textContent = message;

  // Show
  toast.classList.add('show');

  // 5초 후 자동 fadeout
  if (toast._dismissTimer) clearTimeout(toast._dismissTimer);
  toast._dismissTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 5000);
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
    if (elements.articlePane) elements.articlePane.style.display = 'none';
    if (appState.activePostType === 'projectNote') {
      if (appState.activeProjectId) {
        showProjectDetail(appState.activeProjectId);
        if (window.location.hash !== `#/project/${appState.activeProjectId}`) {
          window.location.hash = `#/project/${appState.activeProjectId}`;
        }
      } else {
        window.location.hash = '#/tab/projects';
      }
    } else if (appState.activePostType === 'general') {
      const post = appState.posts.find(p => p.id === appState.activePostId);
      const targetTab = (post && post.category === 'News') ? 'news' : 'study';
      const targetHash = `#/tab/${targetTab}`;
      if (window.location.hash === targetHash) {
        switchTab(targetTab);
      } else {
        window.location.hash = targetHash;
      }
    } else {
      const targetTab = appState.currentTab || 'study';
      const targetHash = `#/tab/${targetTab}`;
      if (window.location.hash === targetHash) {
        switchTab(targetTab);
      } else {
        window.location.hash = targetHash;
      }
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

  // Open News Editor button
  elements.btnOpenAddNewsEditor?.addEventListener('click', () => {
    openNoteEditor(null, 'News');
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
    if (!confirm('정말로 이 프로젝트를 삭제하시겠습니까?\n프로젝트 내의 게시판 글도 함께 삭제됩니다.')) return;
    const projId = appState.activeProjectId;
    if (appState.isAdmin && appState.adminPassword) {
      try {
        await sendToGasApi('deleteProject', { id: projId });
      } catch (err) {
        const forceLocal = confirm(err.message + '\n\n원격 구글 시트 DB 삭제에 실패했습니다.\n그래도 현재 브라우저 로컬 캐시에서 강제로 삭제하시겠습니까?');
        if (!forceLocal) return;
      }
    }
    appState.projects = appState.projects.filter(p => p.id !== projId);
    appState.projectNotes = appState.projectNotes.filter(n => n.projectId !== projId);
    
    localStorage.setItem('projects', JSON.stringify(appState.projects));
    localStorage.setItem('projectNotes', JSON.stringify(appState.projectNotes));
    
    window.location.hash = '#/tab/projects';
  });

  // Form Submit: Add/Edit Project
  elements.addProjectForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = elements.projectEditId.value;
    
    let targetProj;
    if (editId) {
      const index = appState.projects.findIndex(p => p.id === editId);
      if (index === -1) return;
      targetProj = {
        ...appState.projects[index],
        name: document.getElementById('project-name').value.trim(),
        client: document.getElementById('project-client').value.trim(),
        startDate: document.getElementById('project-start').value,
        endDate: document.getElementById('project-end').value,
        details: document.getElementById('project-details').value.trim()
      };
    } else {
      targetProj = {
        id: 'project-' + Date.now(),
        name: document.getElementById('project-name').value.trim(),
        client: document.getElementById('project-client').value.trim(),
        startDate: document.getElementById('project-start').value,
        endDate: document.getElementById('project-end').value,
        details: document.getElementById('project-details').value.trim(),
        diagnostics: []
      };
    }

    if (appState.isAdmin && appState.adminPassword) {
      try {
        await sendToGasApi('saveProject', targetProj);
      } catch (err) {
        alert(err.message);
        return;
      }
    }

    if (editId) {
      const index = appState.projects.findIndex(p => p.id === editId);
      if (index !== -1) appState.projects[index] = targetProj;
    } else {
      appState.projects.unshift(targetProj);
    }
    
    localStorage.setItem('projects', JSON.stringify(appState.projects));
    elements.addProjectForm.reset();
    elements.addProjectModal.style.display = 'none';
    
    renderAll();
    
    if (editId) {
      showProjectDetail(editId);
    }
  });
  
  // Project detail back button
  elements.btnBackToProjectsList.addEventListener('click', () => {
    if (elements.projectDetailView) elements.projectDetailView.style.display = 'none';
    if (elements.projectsListView) elements.projectsListView.style.display = 'block';
    if (window.location.hash === '#/tab/projects') {
      switchTab('projects');
    } else {
      window.location.hash = '#/tab/projects';
    }
  });

  // Diagnostic Modal and Form Submit
  elements.btnOpenAddDiagModal?.addEventListener('click', () => {
    if (appState.activeProjectId) {
      openAddDiagnosticModal(appState.activeProjectId);
    }
  });
  elements.btnCloseDiagModal?.addEventListener('click', () => {
    elements.addDiagnosticModal.style.display = 'none';
  });
  elements.btnCancelDiag?.addEventListener('click', () => {
    elements.addDiagnosticModal.style.display = 'none';
  });

  elements.addDiagnosticForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const projectId = elements.diagParentId.value;
    const editId = elements.diagEditId.value;
    const project = appState.projects.find(p => p.id === projectId);
    if (!project) {
      alert('프로젝트를 찾을 수 없습니다.');
      return;
    }

    const diagData = {
      name: elements.diagName.value.trim(),
      type: elements.diagType.value.trim(),
      status: elements.diagStatus.value,
      target: elements.diagTarget.value.trim(),
      startDate: elements.diagStart.value,
      endDate: elements.diagEnd.value,
      details: elements.diagDesc.value.trim(),
      content: elements.diagContent.value
    };

    const updatedProject = {
      ...project,
      diagnostics: Array.isArray(project.diagnostics) ? [...project.diagnostics] : []
    };

    if (editId) {
      const idx = updatedProject.diagnostics.findIndex(d => d.id === editId);
      if (idx !== -1) {
        updatedProject.diagnostics[idx] = { ...updatedProject.diagnostics[idx], ...diagData };
      }
    } else {
      const newDiag = {
        id: 'diag-' + Date.now(),
        ...diagData
      };
      updatedProject.diagnostics.push(newDiag);
    }

    if (appState.isAdmin && appState.adminPassword) {
      try {
        await sendToGasApi('saveProject', updatedProject);
      } catch (err) {
        alert(err.message);
        return;
      }
    }

    const pIdx = appState.projects.findIndex(p => p.id === projectId);
    if (pIdx !== -1) appState.projects[pIdx] = updatedProject;

    localStorage.setItem('projects', JSON.stringify(appState.projects));
    elements.addDiagnosticModal.style.display = 'none';
    elements.addDiagnosticForm.reset();

    renderProjectsList();
    if (elements.projectDetailView && elements.projectDetailView.style.display !== 'none') {
      renderProjectDiagnostics(updatedProject);
    }
    if (elements.diagnosticDetailPane && elements.diagnosticDetailPane.style.display !== 'none') {
      showDiagnosticDetail(projectId, editId || updatedProject.diagnostics[updatedProject.diagnostics.length - 1].id);
    }
  });

  // Diagnostic Detail View Buttons
  elements.btnBackToProjectFromDiag?.addEventListener('click', () => {
    if (elements.diagnosticDetailPane) elements.diagnosticDetailPane.style.display = 'none';
    if (appState.activeProjectId) {
      showProjectDetail(appState.activeProjectId);
      if (window.location.hash !== `#/project/${appState.activeProjectId}`) {
        window.location.hash = `#/project/${appState.activeProjectId}`;
      }
    } else {
      if (elements.projectDetailView) elements.projectDetailView.style.display = 'none';
      if (elements.projectsListView) elements.projectsListView.style.display = 'block';
      if (window.location.hash === '#/tab/projects') {
        switchTab('projects');
      } else {
        window.location.hash = '#/tab/projects';
      }
    }
  });

  elements.btnEditDiagDetails?.addEventListener('click', () => {
    if (appState.activeProjectId && appState.activeDiagId) {
      openEditDiagnosticModal(appState.activeProjectId, appState.activeDiagId);
    }
  });

  elements.btnDeleteDiagDetails?.addEventListener('click', () => {
    if (appState.activeProjectId && appState.activeDiagId) {
      deleteDiagnostic(appState.activeProjectId, appState.activeDiagId);
    }
  });

  // Diagnostic Detail Text Size Controls
  document.querySelectorAll('.diag-size-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.diag-size-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const size = e.currentTarget.getAttribute('data-size');
      if (elements.diagnosticArticleContent) {
        elements.diagnosticArticleContent.style.fontSize = size;
      }
    });
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

  // Form Submit: Add/Edit Project Note
  elements.addNoteForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = elements.noteEditId.value;
    
    let targetNote;
    if (editId) {
      const index = appState.projectNotes.findIndex(n => n.id === editId);
      if (index === -1) return;
      targetNote = {
        ...appState.projectNotes[index],
        title: document.getElementById('note-title').value.trim(),
        content: document.getElementById('note-content').value
      };
    } else {
      if (!appState.activeProjectId) return;
      targetNote = {
        id: 'note-' + Date.now(),
        projectId: appState.activeProjectId,
        date: new Date().toISOString().split('T')[0],
        title: document.getElementById('note-title').value.trim(),
        content: document.getElementById('note-content').value
      };
    }

    if (appState.isAdmin && appState.adminPassword) {
      try {
        await sendToGasApi('saveProjectNote', targetNote);
      } catch (err) {
        alert(err.message);
        return;
      }
    }

    if (editId) {
      const index = appState.projectNotes.findIndex(n => n.id === editId);
      if (index !== -1) {
        appState.projectNotes[index] = targetNote;
        if (appState.activePostId === editId) {
          showLocalNoteDetail(targetNote);
        }
      }
    } else {
      appState.projectNotes.unshift(targetNote);
    }
    
    localStorage.setItem('projectNotes', JSON.stringify(appState.projectNotes));
    elements.addNoteForm.reset();
    elements.addNoteModal.style.display = 'none';
    
    renderProjectNotes(appState.activeProjectId);
  });
  
  // Note Editor Functions
  function openNoteEditor(postId = null, initialCategory = null) {
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

    // Populate category dropdown (보안 뉴스 제외됨)
    renderStudyCategories();

    const post = postId ? appState.posts.find(p => p.id === postId) : null;
    const isNews = (initialCategory === 'News') || (post && post.category === 'News');
    appState.editorMode = isNews ? 'News' : 'Study';

    if (elements.noteEditorPane) {
      elements.noteEditorPane.classList.toggle('news-mode', isNews);
    }

    if (isNews) {
      // News Mode: Exactly 6 attributes (제목, 본문, 날짜, 출처, 원문링크, 중요도)
      // Category and Type are completely hidden/disabled in News mode
      elements.editorViewTitle.innerHTML = postId 
        ? '<i class="fa-solid fa-newspaper"></i> 보안 뉴스 수정' 
        : '<i class="fa-solid fa-newspaper"></i> 새 보안 뉴스 작성';
      elements.editorPostId.value = post ? post.id : '';
      elements.editorPostTitle.value = post ? (post.title || '') : '';
      elements.editorPostType.value = '';
      elements.editorPostType.removeAttribute('required');

      if (elements.editorNewsFieldsGroup) {
        elements.editorNewsFieldsGroup.style.display = 'block';
        elements.editorNewsImportance.value = (post && post.importance) ? post.importance : '⭐⭐⭐';
        elements.editorNewsSource.value = (post && post.source) ? post.source : '';
        elements.editorNewsDate.value = (post && post.date) ? post.date : new Date().toISOString().split('T')[0];
        elements.editorNewsLink.value = (post && post.newsLink) ? post.newsLink : '';
      }

      const rawMarkdown = post ? (post.content || '') : '';
      elements.editorMainTextarea.value = rawMarkdown;
      if (elements.editorWysiwygContent) {
        elements.editorWysiwygContent.innerHTML = rawMarkdown ? marked.parse(rawMarkdown) : '';
      }
    } else {
      // Study Note Mode: Category & Type required, News fields hidden
      elements.editorViewTitle.innerHTML = postId 
        ? '<i class="fa-solid fa-pen-nib"></i> 스터디 노트 수정' 
        : '<i class="fa-solid fa-pen-nib"></i> 새 스터디 노트 작성';
      elements.editorPostId.value = post ? post.id : '';
      elements.editorPostTitle.value = post ? (post.title || '') : '';
      elements.editorPostType.setAttribute('required', 'required');
      elements.editorPostType.value = post ? (post.type || '') : '';

      if (elements.editorNewsFieldsGroup) {
        elements.editorNewsFieldsGroup.style.display = 'none';
      }

      if (post) {
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
      } else {
        elements.editorCategorySelect.value = initialCategory || (elements.editorCategorySelect.options[0]?.value || 'Cert');
        elements.editorCustomCategoryInput.style.display = 'none';
        elements.editorCustomCategoryInput.value = '';
      }

      const rawMarkdown = post ? (post.content || '') : '';
      elements.editorMainTextarea.value = rawMarkdown;
      if (elements.editorWysiwygContent) {
        elements.editorWysiwygContent.innerHTML = rawMarkdown ? marked.parse(rawMarkdown) : '';
      }
    }

    // Always ensure Markdown guide banner is collapsed by default
    if (elements.editorGuideBody) {
      elements.editorGuideBody.style.display = 'none';
      const icon = elements.btnToggleGuideBanner?.querySelector('.guide-toggle-icon i');
      if (icon) {
        icon.className = 'fa-solid fa-chevron-right';
      }
    }

    updateEditorWordCount();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeNoteEditor() {
    if (elements.noteEditorPane) {
      elements.noteEditorPane.style.display = 'none';
      elements.noteEditorPane.classList.remove('news-mode');
    }
    const targetTab = (appState.editorMode === 'News') ? 'news' : (appState.currentTab || 'study');
    if (window.location.hash === `#/tab/${targetTab}`) {
      switchTab(targetTab);
    } else {
      window.location.hash = `#/tab/${targetTab}`;
    }
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
      case 'u':
        return `<u>${children}</u>`;
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

    // Handle Paste event: Detect URLs, raw images, and format automatically
    elements.editorWysiwygContent.addEventListener('paste', (e) => {
      // 1. Check for image files in clipboard (Direct Image Copy-Paste like Notion)
      const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            e.preventDefault();
            const file = items[i].getAsFile();
            const reader = new FileReader();
            reader.onload = (uploadEvent) => {
              const base64Data = uploadEvent.target.result;
              const imgHtml = `<span class="editor-img-card" title="클릭 시 새 창 열기"><img src="${base64Data}" alt="첨부 이미지"></span><p><br></p>`;
              document.execCommand('insertHTML', false, imgHtml);
              updateEditorWordCount();
            };
            reader.readAsDataURL(file);
            return;
          }
        }
      }

      // 2. Check for URL text
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

    // Sync toolbar active button states
    function updateToolbarState() {
      const commands = {
        'bold': 'bold',
        'italic': 'italic',
        'underline': 'underline',
        'strike': 'strikeThrough'
      };
      for (const [action, cmd] of Object.entries(commands)) {
        const btn = document.querySelector(`.editor-toolbar .tool-btn[data-action="${action}"]`);
        if (btn) {
          try {
            if (document.queryCommandState(cmd)) {
              btn.classList.add('active');
            } else {
              btn.classList.remove('active');
            }
          } catch (e) {}
        }
      }

      // Check code button active state
      const codeBtn = document.querySelector(`.editor-toolbar .tool-btn[data-action="code-inline"]`);
      if (codeBtn) {
        const sel = window.getSelection();
        if (sel && sel.anchorNode) {
          const parentCode = sel.anchorNode.nodeType === Node.ELEMENT_NODE 
            ? sel.anchorNode.closest('code') 
            : sel.anchorNode.parentElement?.closest('code');
          if (parentCode && (!parentCode.parentElement || parentCode.parentElement.tagName.toLowerCase() !== 'pre')) {
            codeBtn.classList.add('active');
          } else {
            codeBtn.classList.remove('active');
          }
        } else {
          codeBtn.classList.remove('active');
        }
      }
    }

    // Helper: Apply or toggle inline formatting with Notion-style exit logic
    function formatInlineStyle(command) {
      if (!elements.editorWysiwygContent) return;
      elements.editorWysiwygContent.focus();
      const sel = window.getSelection();
      if (!sel || !sel.anchorNode) return;

      if (command === 'code') {
        // Special handling for inline code
        const selectedText = sel.toString();
        if (selectedText) {
          const range = sel.getRangeAt(0);
          const codeEl = document.createElement('code');
          codeEl.textContent = selectedText;
          range.deleteContents();
          range.insertNode(codeEl);

          const spaceNode = document.createTextNode('\u00A0');
          if (codeEl.nextSibling) {
            codeEl.parentNode.insertBefore(spaceNode, codeEl.nextSibling);
          } else {
            codeEl.parentNode.appendChild(spaceNode);
          }

          const newRange = document.createRange();
          newRange.setStart(spaceNode, 1);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        } else {
          // Collapsed: check if already inside code
          const parentCode = sel.anchorNode.nodeType === Node.ELEMENT_NODE 
            ? sel.anchorNode.closest('code') 
            : sel.anchorNode.parentElement?.closest('code');
          if (parentCode && (!parentCode.parentElement || parentCode.parentElement.tagName.toLowerCase() !== 'pre')) {
            // Exit code tag
            const spaceNode = document.createTextNode('\u00A0');
            if (parentCode.nextSibling) {
              parentCode.parentNode.insertBefore(spaceNode, parentCode.nextSibling);
            } else {
              parentCode.parentNode.appendChild(spaceNode);
            }
            const newRange = document.createRange();
            newRange.setStart(spaceNode, 1);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
          } else {
            document.execCommand('insertHTML', false, '<code>\u200B</code>');
          }
        }
        updateToolbarState();
        updateEditorWordCount();
        return;
      }

      const isSelection = !sel.isCollapsed && sel.toString().length > 0;
      if (isSelection) {
        // 1. Text is selected: Apply format ONLY to the selected range
        document.execCommand(command, false, null);

        // Ensure subsequent typed characters are plain normal text
        const currentSel = window.getSelection();
        if (currentSel && currentSel.rangeCount > 0) {
          const range = currentSel.getRangeAt(0);
          range.collapse(false); // collapse cursor to the end of selection

          // Insert a neutral trailing space node outside/after the formatted tag
          const spaceNode = document.createTextNode('\u00A0');
          range.insertNode(spaceNode);

          const newRange = document.createRange();
          newRange.setStart(spaceNode, 1);
          newRange.collapse(true);
          currentSel.removeAllRanges();
          currentSel.addRange(newRange);

          // If browser still keeps the command active at this position, turn it off
          if (document.queryCommandState(command)) {
            document.execCommand(command, false, null);
          }
        }
      } else {
        // 2. No text selected: Toggle state (active toolbar button & continue in style)
        document.execCommand(command, false, null);
      }

      updateToolbarState();
      updateEditorWordCount();
    }

    // Sync active toolbar states on selection changes and mouse/key events
    document.addEventListener('selectionchange', () => {
      if (document.activeElement === elements.editorWysiwygContent || elements.editorWysiwygContent.contains(document.activeElement)) {
        updateToolbarState();
      }
    });

    elements.editorWysiwygContent.addEventListener('keyup', () => {
      updateToolbarState();
    });

    elements.editorWysiwygContent.addEventListener('keydown', (e) => {
      const sel = window.getSelection();
      if (!sel || !sel.anchorNode) return;

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // 1. Notion-style Rich Text Shortcuts
      // Ctrl + Shift + X: Strikethrough (취소선)
      if (isCtrlOrCmd && e.shiftKey && (e.key === 'x' || e.key === 'X')) {
        e.preventDefault();
        formatInlineStyle('strikeThrough');
        return;
      }

      // Ctrl + B: Bold (굵게)
      if (isCtrlOrCmd && !e.shiftKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        formatInlineStyle('bold');
        return;
      }

      // Ctrl + I: Italic (기울임)
      if (isCtrlOrCmd && !e.shiftKey && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        formatInlineStyle('italic');
        return;
      }

      // Ctrl + U: Underline (밑줄)
      if (isCtrlOrCmd && !e.shiftKey && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        formatInlineStyle('underline');
        return;
      }

      // Ctrl + E: Inline Code (인라인 코드)
      if (isCtrlOrCmd && !e.shiftKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        formatInlineStyle('code');
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

          // Strict line-level heading conversion (Never affects previous paragraphs)
          const headingMatch = textBeforeCursor.match(/^(#{1,3})$/);
          if (headingMatch) {
            e.preventDefault();
            const level = headingMatch[1].length; // 1 -> H1, 2 -> H2, 3 -> H3
            const tag = `H${level}`;

            // Find current block element containing node inside editor
            let block = node;
            while (block && block.parentNode !== elements.editorWysiwygContent && block !== elements.editorWysiwygContent) {
              block = block.parentNode;
            }

            // Remove heading prefix from text
            node.textContent = node.textContent.substring(sel.anchorOffset);

            if (block && block !== elements.editorWysiwygContent) {
              // Convert existing block to heading tag
              const headingEl = document.createElement(tag);
              while (block.firstChild) {
                headingEl.appendChild(block.firstChild);
              }
              if (!headingEl.hasChildNodes() || !headingEl.textContent.trim()) {
                headingEl.innerHTML = '<br>';
              }
              block.parentNode.replaceChild(headingEl, block);

              // Set cursor inside new heading element
              const newRange = document.createRange();
              newRange.setStart(headingEl, 0);
              newRange.collapse(true);
              sel.removeAllRanges();
              sel.addRange(newRange);
            } else {
              // Fallback to formatBlock
              document.execCommand('formatBlock', false, tag);
            }
            updateEditorWordCount();
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
            const spaceNode = document.createTextNode('\u00A0');

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
            if (document.queryCommandState('bold')) {
              document.execCommand('bold', false, null);
            }
            updateToolbarState();
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
            const spaceNode = document.createTextNode('\u00A0');

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
            if (document.queryCommandState('italic')) {
              document.execCommand('italic', false, null);
            }
            updateToolbarState();
            return;
          }

          // 9. Inline Underline: <u>word</u> + Space
          const underlineMatch = textBeforeCursor.match(/<u>([^<]+)<\/u>$/i);
          if (underlineMatch) {
            e.preventDefault();
            const underlineText = underlineMatch[1];
            const startIdx = underlineMatch.index;
            const beforeUnderline = node.textContent.substring(0, startIdx);
            const afterUnderline = node.textContent.substring(sel.anchorOffset);
            
            const uTag = document.createElement('u');
            uTag.textContent = underlineText;
            const spaceNode = document.createTextNode('\u00A0');

            const frag = document.createDocumentFragment();
            if (beforeUnderline) frag.appendChild(document.createTextNode(beforeUnderline));
            frag.appendChild(uTag);
            frag.appendChild(spaceNode);
            if (afterUnderline) frag.appendChild(document.createTextNode(afterUnderline));

            node.parentNode.replaceChild(frag, node);

            const newRange = document.createRange();
            newRange.setStart(spaceNode, 1);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
            if (document.queryCommandState('underline')) {
              document.execCommand('underline', false, null);
            }
            updateToolbarState();
            return;
          }

          // 10. Inline Strike: ~~word~~ + Space
          const strikeMatch = textBeforeCursor.match(/~~([^~]+)~~$/);
          if (strikeMatch) {
            e.preventDefault();
            const strikeText = strikeMatch[1];
            const startIdx = strikeMatch.index;
            const beforeStrike = node.textContent.substring(0, startIdx);
            const afterStrike = node.textContent.substring(sel.anchorOffset);
            
            const sTag = document.createElement('del');
            sTag.textContent = strikeText;
            const spaceNode = document.createTextNode('\u00A0');

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
            if (document.queryCommandState('strikeThrough')) {
              document.execCommand('strikeThrough', false, null);
            }
            updateToolbarState();
            return;
          }

          // 11. Inline Code: `code` + Space
          const codeMatch = textBeforeCursor.match(/`([^`]+)`$/);
          if (codeMatch) {
            e.preventDefault();
            const codeText = codeMatch[1];
            const startIdx = codeMatch.index;
            const beforeCode = node.textContent.substring(0, startIdx);
            const afterCode = node.textContent.substring(sel.anchorOffset);
            
            const cTag = document.createElement('code');
            cTag.textContent = codeText;
            const spaceNode = document.createTextNode('\u00A0');

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
            updateToolbarState();
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
    const isNews = val === 'News';

    if (elements.editorCustomCategoryInput) {
      elements.editorCustomCategoryInput.style.display = isCustom ? 'block' : 'none';
      if (isCustom) elements.editorCustomCategoryInput.focus();
    }

    if (elements.editorNewsFieldsGroup) {
      elements.editorNewsFieldsGroup.style.display = isNews ? 'block' : 'none';
      if (isNews && !elements.editorNewsDate.value) {
        elements.editorNewsDate.value = new Date().toISOString().split('T')[0];
      }
    }

    if (elements.editorViewTitle) {
      elements.editorViewTitle.innerHTML = isNews
        ? '<i class="fa-solid fa-newspaper"></i> 보안 뉴스 작성/수정'
        : '<i class="fa-solid fa-pen-nib"></i> 스터디 노트 작성/수정';
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
          formatInlineStyle('bold');
          break;
        case 'italic':
          formatInlineStyle('italic');
          break;
        case 'underline':
          formatInlineStyle('underline');
          break;
        case 'strike':
          formatInlineStyle('strikeThrough');
          break;
        case 'quote':
          document.execCommand('formatBlock', false, 'BLOCKQUOTE');
          break;
        case 'code-inline':
          formatInlineStyle('code');
          break;
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
          if (url && url.trim()) {
            const linkId = 'link-' + Date.now();
            document.execCommand('insertHTML', false, `<a id="${linkId}" href="${url.trim()}" target="_blank" title="클릭 시 이동: ${url.trim()}">${url.trim()}</a>&nbsp;`);
            const anchor = document.getElementById(linkId);
            if (anchor) {
              anchor.removeAttribute('id');
              showLinkBubble(anchor);
            }
          }
          break;
        }
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

      const isNews = (appState.editorMode === 'News');
      const content = getWysiwygMarkdown();
      let postData = {};

      if (isNews) {
        // News Mode: Exactly 6 fields (title, content, date, source, newsLink, importance)
        // No category dropdown, no type attribute
        const source = elements.editorNewsSource ? elements.editorNewsSource.value.trim() : '';
        if (!source) {
          alert('보안 뉴스의 출처(언론사 등)를 입력해 주세요.');
          elements.editorNewsSource?.focus();
          return;
        }
        const importance = elements.editorNewsImportance ? elements.editorNewsImportance.value : '⭐⭐⭐';
        const date = elements.editorNewsDate?.value || new Date().toISOString().split('T')[0];
        const newsLink = elements.editorNewsLink ? elements.editorNewsLink.value.trim() : '';

        postData = {
          title,
          category: 'News',
          type: '',
          content,
          date,
          source,
          newsLink,
          importance
        };
      } else {
        // Study Note Mode: title, category, type, content
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

        const type = elements.editorPostType.value.trim();
        if (!type) {
          alert('유형을 입력해 주세요. (예: 주요정보통신기반시설, CPPG, ISMS-P 등)');
          elements.editorPostType.focus();
          return;
        }

        const existingPost = editId ? appState.posts.find(p => p.id === editId) : null;
        const date = existingPost?.date || new Date().toISOString().split('T')[0];

        postData = {
          title,
          category,
          type,
          content,
          date
        };
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

      if (elements.noteEditorPane) {
        elements.noteEditorPane.style.display = 'none';
        elements.noteEditorPane.classList.remove('news-mode');
      }

      if (targetPostId) {
        const targetHash = `#/post/${targetPostId}`;
        if (window.location.hash === targetHash) {
          showArticleDetail(targetPostId);
        } else {
          window.location.hash = targetHash;
        }
      } else {
        closeNoteEditor();
      }

      // Real-time Sync to Google Sheets via GAS
      if (appState.isAdmin) {
        const gasResult = await sendToGasApi('savePost', {
          id: targetPostId,
          category: postData.category,
          title: postData.title,
          date: postData.date || new Date().toISOString().split('T')[0],
          content: postData.content,
          importance: postData.importance || '',
          source: postData.source || '',
          newsLink: postData.newsLink || '',
          type: postData.type || '',
          images: postData.images || []
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
      if (appState.isAdmin && appState.adminPassword) {
        try {
          await sendToGasApi('deleteProjectNote', { id: noteId });
        } catch (err) {
          const forceLocal = confirm(err.message + '\n\n원격 구글 시트 DB 삭제에 실패했습니다.\n그래도 현재 브라우저 로컬 캐시에서만 강제로 삭제하시겠습니까?\n(취소를 누르면 글이 보존되며 삭제가 중단됩니다.)');
          if (!forceLocal) return;
        }
      }
      appState.projectNotes = appState.projectNotes.filter(n => n.id !== noteId);
      localStorage.setItem('projectNotes', JSON.stringify(appState.projectNotes));
      renderProjectNotes(appState.activeProjectId);
      alert('프로젝트 기록이 삭제되었습니다.');
      if (elements.articlePane) elements.articlePane.style.display = 'none';
      if (appState.activeProjectId) {
        showProjectDetail(appState.activeProjectId);
        if (window.location.hash !== `#/project/${appState.activeProjectId}`) {
          window.location.hash = `#/project/${appState.activeProjectId}`;
        }
      } else {
        window.location.hash = '#/tab/projects';
      }
    } else {
      const postToDelete = appState.posts.find(p => p.id === appState.activePostId);
      const postId = appState.activePostId;

      if (appState.isAdmin && postToDelete) {
        try {
          await sendToGasApi('deletePost', { id: postId });
        } catch (err) {
          const forceLocal = confirm(err.message + '\n\n원격 구글 시트 DB 삭제에 실패했습니다.\n그래도 현재 브라우저 로컬 캐시에서만 강제로 삭제하시겠습니까?\n(취소를 누르면 글이 보존되며 삭제가 중단됩니다.)');
          if (!forceLocal) {
            return; // 취소 시 글 삭제 중단 및 보존
          }
        }
      }
      
      appState.posts = appState.posts.filter(p => p.id !== postId);
      localStorage.setItem('posts', JSON.stringify(appState.posts));
      
      const deletedIds = JSON.parse(localStorage.getItem('deletedPosts') || '[]');
      if (postToDelete && !deletedIds.includes(postToDelete.id)) {
        deletedIds.push(postToDelete.id);
        localStorage.setItem('deletedPosts', JSON.stringify(deletedIds));
      }
      
      alert('게시글이 성공적으로 삭제되었습니다.');
      renderAll();
      if (elements.articlePane) elements.articlePane.style.display = 'none';
      const targetTab = (postToDelete && postToDelete.category === 'News') ? 'news' : 'study';
      const targetHash = `#/tab/${targetTab}`;
      if (window.location.hash === targetHash) {
        switchTab(targetTab);
      } else {
        window.location.hash = targetHash;
      }
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
        const failedIds = [];
        for (const post of postsToDelete) {
          try {
            await sendToGasApi('deletePost', { id: post.id });
          } catch (err) {
            console.warn(`[GAS API] Failed to delete ${post.id}:`, err);
            failedIds.push(post.id);
          }
        }
        if (failedIds.length > 0) {
          alert(`로컬 목록은 갱신되었으나, 원격 구글 시트 DB 삭제 중 ${failedIds.length}건의 통신 오류가 발생했습니다.\n\nGoogle Apps Script의 배포 설정을 확인해 주세요.`);
        } else {
          alert('선택한 보안 뉴스가 정상적으로 삭제되었습니다.');
        }
      } else {
        alert('선택한 보안 뉴스가 정상적으로 삭제되었습니다.');
      }
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

  // =========================================================================
  // Profile Edit Modal Event Listeners
  // =========================================================================
  elements.btnEditProfile?.addEventListener('click', () => {
    const prof = appState.profile || DEFAULT_PROFILE;
    if (elements.inputProfileName) elements.inputProfileName.value = prof.name || '';
    if (elements.inputProfileTitle) elements.inputProfileTitle.value = prof.title || '';
    if (elements.inputProfileCompany) elements.inputProfileCompany.value = prof.company || '';
    if (elements.inputProfileBio) elements.inputProfileBio.value = prof.bio || '';
    if (elements.inputProfileEmail) elements.inputProfileEmail.value = prof.email || '';
    if (elements.inputProfilePhone) elements.inputProfilePhone.value = prof.phone || '';
    if (elements.editProfileModal) elements.editProfileModal.style.display = 'flex';
  });

  elements.btnCloseEditProfile?.addEventListener('click', () => {
    if (elements.editProfileModal) elements.editProfileModal.style.display = 'none';
  });

  elements.btnCancelEditProfile?.addEventListener('click', () => {
    if (elements.editProfileModal) elements.editProfileModal.style.display = 'none';
  });

  elements.editProfileForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const updatedProfile = {
      id: 'profile-main',
      name: elements.inputProfileName.value.trim(),
      title: elements.inputProfileTitle.value.trim(),
      company: elements.inputProfileCompany.value.trim(),
      bio: elements.inputProfileBio.value.trim(),
      email: elements.inputProfileEmail.value.trim(),
      phone: elements.inputProfilePhone.value.trim(),
      avatarUrl: (appState.profile && appState.profile.avatarUrl) || './profile.jpg'
    };

    if (appState.isAdmin && appState.adminPassword) {
      try {
        await sendToGasApi('saveProfile', updatedProfile);
      } catch (err) {
        alert(err.message);
        return;
      }
    }

    appState.profile = updatedProfile;
    localStorage.setItem('profile', JSON.stringify(updatedProfile));
    renderProfile();
    if (elements.editProfileModal) elements.editProfileModal.style.display = 'none';
    alert('프로필 정보가 성공적으로 저장되었습니다.');
  });

  // =========================================================================
  // Portfolio Manager Modal Event Listeners
  // =========================================================================
  let tempPortfolioList = [];
  let currentPortTab = 'cert';

  function renderPortManagerTab() {
    if (!elements.portItemsManagerList) return;

    // Update tab button styles
    elements.portModalTabs?.forEach(btn => {
      const tab = btn.getAttribute('data-port-tab');
      if (tab === currentPortTab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Adjust form fields based on tab
    if (elements.portItemType) elements.portItemType.value = currentPortTab;
    if (elements.portFormTitle) {
      const tabNames = { cert: '자격증', project: '프로젝트 이력', career: '경력', skill: '스킬' };
      elements.portFormTitle.innerHTML = `<i class="fa-solid fa-plus"></i> 새 ${tabNames[currentPortTab] || '항목'} 추가`;
    }

    if (currentPortTab === 'skill') {
      if (elements.portLabelTitle) elements.portLabelTitle.textContent = '스킬명 (기술명)';
      if (elements.portInputTitle) elements.portInputTitle.placeholder = '예: Python, 취약점 진단';
      if (elements.portGroupDate) elements.portGroupDate.style.display = 'none';
      if (elements.portGroupDesc) elements.portGroupDesc.style.display = 'none';
      if (elements.portGroupSkillFields) elements.portGroupSkillFields.style.display = 'flex';
    } else {
      const titleLabels = { cert: '자격증명', project: '프로젝트명', career: '경력 / 부대명' };
      const titlePlaceholders = {
        cert: '예: CPPG (개인정보관리사) 취득',
        project: '예: 개인정보 보안 컨설팅 수탁사 점검 프로젝트',
        career: '예: 여단 통신중대 정보체계운용/정비병 복무'
      };
      if (elements.portLabelTitle) elements.portLabelTitle.textContent = titleLabels[currentPortTab] || '항목명';
      if (elements.portInputTitle) elements.portInputTitle.placeholder = titlePlaceholders[currentPortTab] || '항목명 입력';
      if (elements.portGroupDate) elements.portGroupDate.style.display = 'block';
      if (elements.portGroupDesc) elements.portGroupDesc.style.display = 'block';
      if (elements.portGroupSkillFields) elements.portGroupSkillFields.style.display = 'none';
    }

    // Filter items by currentPortTab
    const filtered = tempPortfolioList.filter(it => it.type === currentPortTab);
    if (filtered.length === 0) {
      elements.portItemsManagerList.innerHTML = `
        <div style="text-align: center; padding: 1.25rem; color: var(--text-muted); font-size: 0.85rem; background: rgba(255,255,255,0.02); border-radius: 6px;">
          등록된 항목이 없습니다. 아래 양식에서 새 항목을 추가해 주세요.
        </div>
      `;
    } else {
      elements.portItemsManagerList.innerHTML = filtered.map(it => {
        const metaStr = it.type === 'skill'
          ? `<span><i class="fa-solid fa-layer-group"></i> ${escapeHtml(it.category || '기타')}</span><span><i class="fa-solid fa-star"></i> ${escapeHtml(it.level || '')}</span><span><i class="fa-solid fa-chart-simple"></i> ${it.percent}%</span>`
          : `<span><i class="fa-regular fa-calendar"></i> ${escapeHtml(it.date || '')}</span><span>${escapeHtml(it.description || '')}</span>`;

        return `
          <div class="port-item-row" data-id="${escapeHtml(it.id)}">
            <div class="port-item-info">
              <div class="port-item-title">${escapeHtml(it.title || '')}</div>
              <div class="port-item-meta">${metaStr}</div>
            </div>
            <div class="port-item-actions">
              <button type="button" class="btn-secondary btn-sm btn-edit-port-item" data-id="${escapeHtml(it.id)}" title="수정"><i class="fa-regular fa-pen-to-square"></i></button>
              <button type="button" class="btn-danger btn-sm btn-delete-port-item" data-id="${escapeHtml(it.id)}" title="삭제"><i class="fa-regular fa-trash-can"></i></button>
            </div>
          </div>
        `;
      }).join('');
    }

    // Attach row button events
    elements.portItemsManagerList.querySelectorAll('.btn-edit-port-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const target = tempPortfolioList.find(it => it.id === id);
        if (!target) return;

        if (elements.portItemId) elements.portItemId.value = target.id;
        if (elements.portInputTitle) elements.portInputTitle.value = target.title || '';
        if (elements.portInputDate) elements.portInputDate.value = target.date || '';
        if (elements.portInputDesc) elements.portInputDesc.value = target.description || '';
        if (elements.portInputCat) elements.portInputCat.value = target.category || '';
        if (elements.portInputLevel) elements.portInputLevel.value = target.level || '';
        if (elements.portInputPercent) elements.portInputPercent.value = target.percent || 0;

        if (elements.portFormTitle) {
          elements.portFormTitle.innerHTML = `<i class="fa-solid fa-pen"></i> 항목 수정 (${escapeHtml(target.title)})`;
        }
        if (elements.btnResetPortItem) elements.btnResetPortItem.style.display = 'inline-block';
      });
    });

    elements.portItemsManagerList.querySelectorAll('.btn-delete-port-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (!confirm('이 항목을 포트폴리오에서 삭제하시겠습니까?')) return;
        tempPortfolioList = tempPortfolioList.filter(it => it.id !== id);
        resetPortItemForm();
        renderPortManagerTab();
      });
    });
  }

  function resetPortItemForm() {
    if (elements.portItemId) elements.portItemId.value = '';
    if (elements.portInputTitle) elements.portInputTitle.value = '';
    if (elements.portInputDate) elements.portInputDate.value = '';
    if (elements.portInputDesc) elements.portInputDesc.value = '';
    if (elements.portInputCat) elements.portInputCat.value = '';
    if (elements.portInputLevel) elements.portInputLevel.value = '';
    if (elements.portInputPercent) elements.portInputPercent.value = '';
    if (elements.btnResetPortItem) elements.btnResetPortItem.style.display = 'none';
    if (elements.portFormTitle) {
      const tabNames = { cert: '자격증', project: '프로젝트 이력', career: '경력', skill: '스킬' };
      elements.portFormTitle.innerHTML = `<i class="fa-solid fa-plus"></i> 새 ${tabNames[currentPortTab] || '항목'} 추가`;
    }
  }

  elements.btnEditPortfolio?.addEventListener('click', () => {
    tempPortfolioList = JSON.parse(JSON.stringify(appState.portfolio || DEFAULT_PORTFOLIO));
    currentPortTab = 'cert';
    resetPortItemForm();
    renderPortManagerTab();
    if (elements.editPortfolioModal) elements.editPortfolioModal.style.display = 'flex';
  });

  elements.btnCloseEditPortfolio?.addEventListener('click', () => {
    if (elements.editPortfolioModal) elements.editPortfolioModal.style.display = 'none';
  });

  elements.btnCancelEditPortfolio?.addEventListener('click', () => {
    if (elements.editPortfolioModal) elements.editPortfolioModal.style.display = 'none';
  });

  elements.portModalTabs?.forEach(btn => {
    btn.addEventListener('click', () => {
      currentPortTab = btn.getAttribute('data-port-tab');
      resetPortItemForm();
      renderPortManagerTab();
    });
  });

  elements.btnResetPortItem?.addEventListener('click', () => {
    resetPortItemForm();
  });

  elements.btnSavePortItem?.addEventListener('click', () => {
    const title = elements.portInputTitle ? elements.portInputTitle.value.trim() : '';
    if (!title) {
      alert('항목명은 필수 입력 항목입니다.');
      return;
    }

    const editId = elements.portItemId ? elements.portItemId.value : '';
    if (editId) {
      const idx = tempPortfolioList.findIndex(it => it.id === editId);
      if (idx !== -1) {
        tempPortfolioList[idx] = {
          ...tempPortfolioList[idx],
          title: title,
          date: elements.portInputDate ? elements.portInputDate.value.trim() : '',
          description: elements.portInputDesc ? elements.portInputDesc.value.trim() : '',
          category: elements.portInputCat ? elements.portInputCat.value.trim() : '',
          level: elements.portInputLevel ? elements.portInputLevel.value.trim() : '',
          percent: elements.portInputPercent ? Number(elements.portInputPercent.value) || 0 : 0
        };
      }
    } else {
      const newItem = {
        id: `${currentPortTab}-${Date.now()}`,
        type: currentPortTab,
        title: title,
        date: elements.portInputDate ? elements.portInputDate.value.trim() : '',
        description: elements.portInputDesc ? elements.portInputDesc.value.trim() : '',
        category: elements.portInputCat ? elements.portInputCat.value.trim() : '',
        level: elements.portInputLevel ? elements.portInputLevel.value.trim() : '',
        percent: elements.portInputPercent ? Number(elements.portInputPercent.value) || 0 : 0,
        sortOrder: tempPortfolioList.length + 1
      };
      tempPortfolioList.push(newItem);
    }

    resetPortItemForm();
    renderPortManagerTab();
  });

  elements.btnSubmitAllPortfolio?.addEventListener('click', async () => {
    if (appState.isAdmin && appState.adminPassword) {
      try {
        await sendToGasApi('savePortfolio', { items: tempPortfolioList });
      } catch (err) {
        alert(err.message);
        return;
      }
    }

    appState.portfolio = tempPortfolioList;
    localStorage.setItem('portfolio', JSON.stringify(tempPortfolioList));
    renderPortfolio();
    if (elements.editPortfolioModal) elements.editPortfolioModal.style.display = 'none';
    alert('포트폴리오가 성공적으로 저장되었습니다.');
  });

  setupHealthEventListeners();
}

// ==========================================
// Health & Fitness Module (Phase 2)
// ==========================================

let healthCharts = {
  calorieBalance: null,
  bodyComposition: null,
  bodyDetailTrend: null
};

let currentDietImageBase64 = '';
let currentDietImageMime = 'image/jpeg';

// Toggle between Security Blog ('sec') and Health & Fitness ('health')
function toggleAppMode(targetMode) {
  if (!targetMode) {
    targetMode = (appState.mode === 'health') ? 'sec' : 'health';
  }
  appState.mode = targetMode;

  if (targetMode === 'health') {
    if (elements.navSec) elements.navSec.style.display = 'none';
    if (elements.navHealth) elements.navHealth.style.display = 'flex';
    if (elements.modeHealthToggleBtn) {
      elements.modeHealthToggleBtn.innerHTML = '<i class="fa-solid fa-shield-halved" style="color: #38bdf8;"></i>';
      elements.modeHealthToggleBtn.title = '보안 블로그 모드로 복귀';
      elements.modeHealthToggleBtn.classList.add('active-health');
    }
    if (elements.geminiSettingsBtn) {
      elements.geminiSettingsBtn.style.display = appState.isAdmin ? 'inline-flex' : 'none';
    }
    
    // Switch to health dashboard or saved tab
    const targetHealthTab = appState.currentHealthTab || 'health-dashboard';
    switchTab(targetHealthTab);
    loadHealthData();
  } else {
    if (elements.navSec) elements.navSec.style.display = 'flex';
    if (elements.navHealth) elements.navHealth.style.display = 'none';
    if (elements.modeHealthToggleBtn) {
      elements.modeHealthToggleBtn.innerHTML = '<i class="fa-solid fa-heart" style="color: #10b981;"></i>';
      elements.modeHealthToggleBtn.title = 'Health & Fitness 모드로 전환';
      elements.modeHealthToggleBtn.classList.remove('active-health');
    }
    if (elements.geminiSettingsBtn) {
      elements.geminiSettingsBtn.style.display = 'none';
    }
    switchTab('dashboard');
  }
}

// Fetch all Health Data from Google Apps Script with Local Cache
async function loadHealthData(forceRefresh = false) {
  try {
    const cached = localStorage.getItem('health_data');
    if (cached && cached !== 'undefined' && !forceRefresh) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          appState.healthData = {
            db: Array.isArray(parsed.db) ? parsed.db : [],
            body: Array.isArray(parsed.body) ? parsed.body : [],
            activity: Array.isArray(parsed.activity) ? parsed.activity : [],
            sleep: Array.isArray(parsed.sleep) ? parsed.sleep : [],
            vitals: Array.isArray(parsed.vitals) ? parsed.vitals : []
          };
          if (appState.mode === 'health') {
            renderHealthSection(appState.currentHealthTab);
          }
        }
      } catch (e) {
        console.warn('Local health data parse error:', e);
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(`${HEALTH_GAS_API_URL}?action=getAllData`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      if (json && json.status === 'success' && json.data) {
        appState.healthData = {
          db: Array.isArray(json.data.db) ? json.data.db : [],
          body: Array.isArray(json.data.body) ? json.data.body : [],
          activity: Array.isArray(json.data.activity) ? json.data.activity : [],
          sleep: Array.isArray(json.data.sleep) ? json.data.sleep : [],
          vitals: Array.isArray(json.data.vitals) ? json.data.vitals : []
        };
        localStorage.setItem('health_data', JSON.stringify(appState.healthData));
        if (appState.mode === 'health') {
          renderHealthSection(appState.currentHealthTab);
        }
      }
    }
  } catch (err) {
    console.warn('Health data fetch failed or timed out:', err);
    if (appState.mode === 'health') {
      renderHealthSection(appState.currentHealthTab);
    }
  }
}

// Send Mutation Requests to Health GAS API
async function sendToHealthGasApi(action, payload = {}) {
  const body = {
    action,
    ...payload,
    password: appState.adminPassword
  };

  showDeployOverlay('데이터 저장 중...', 'Health Google Sheets에 안전하게 동기화하고 있습니다.');
  try {
    const res = await fetch(HEALTH_GAS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (data.status === 'error') {
      throw new Error(data.message || '요청 처리 중 오류가 발생했습니다.');
    }
    return data;
  } finally {
    hideDeployOverlay();
  }
}

// Route to specific health render function
function renderHealthSection(tabId) {
  if (!tabId) tabId = appState.currentHealthTab || 'health-dashboard';
  switch (tabId) {
    case 'health-dashboard':
      renderHealthDashboard();
      break;
    case 'health-diet':
      renderHealthDiet();
      break;
    case 'health-workout':
      renderHealthWorkout();
      break;
    case 'health-body':
      renderHealthBody();
      break;
  }
}

// 1. Health Main Dashboard
function renderHealthDashboard() {
  const today = new Date().toISOString().split('T')[0];
  
  // 1-1. Activity (Samsung Health)
  const activities = appState.healthData.activity || [];
  const todayAct = activities.find(a => a.date && a.date.startsWith(today)) || (activities.length > 0 ? activities[activities.length - 1] : null);
  if (todayAct) {
    if (elements.healthCardSteps) {
      elements.healthCardSteps.innerHTML = `${(Number(todayAct.steps) || 0).toLocaleString()} <span class="unit">보</span>`;
    }
    if (elements.healthCardActiveCal) {
      elements.healthCardActiveCal.textContent = `활동 소모: ${(Number(todayAct.activeCalories) || 0).toLocaleString()} kcal`;
    }
  } else {
    if (elements.healthCardSteps) elements.healthCardSteps.innerHTML = `0 <span class="unit">보</span>`;
    if (elements.healthCardActiveCal) elements.healthCardActiveCal.textContent = `활동 소모: 0 kcal`;
  }

  // 1-2. Diet Intake
  const dbItems = appState.healthData.db || [];
  const dietItems = dbItems.filter(item => (item.category || '').toLowerCase() === 'diet');
  const todayDiets = dietItems.filter(item => item.date && item.date.startsWith(today));
  
  const totalDietCal = todayDiets.reduce((sum, item) => sum + (Number(item.calories) || 0), 0);
  const totalCarbs = todayDiets.reduce((sum, item) => sum + (Number(item.carbs) || 0), 0);
  const totalProtein = todayDiets.reduce((sum, item) => sum + (Number(item.protein) || 0), 0);
  const totalFat = todayDiets.reduce((sum, item) => sum + (Number(item.fat) || 0), 0);

  if (elements.healthCardCalories) {
    elements.healthCardCalories.innerHTML = `${totalDietCal.toLocaleString()} <span class="unit">kcal</span>`;
  }
  if (elements.healthCardMacros) {
    elements.healthCardMacros.textContent = `탄 ${totalCarbs}g | 단 ${totalProtein}g | 지 ${totalFat}g`;
  }

  // 1-3. Body Composition
  const bodyRecords = [...(appState.healthData.body || [])];
  bodyRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
  const latestBody = bodyRecords[0] || null;

  if (latestBody) {
    if (elements.healthCardWeight) {
      elements.healthCardWeight.innerHTML = `${latestBody.weight || '--'} <span class="unit">kg</span>`;
    }
    if (elements.healthCardBodyDetail) {
      elements.healthCardBodyDetail.textContent = `골격근 ${latestBody.muscleMass || '--'} kg | 체지방 ${latestBody.bodyFatPercent || '--'} %`;
    }
  } else {
    if (elements.healthCardWeight) elements.healthCardWeight.innerHTML = `-- <span class="unit">kg</span>`;
    if (elements.healthCardBodyDetail) elements.healthCardBodyDetail.textContent = `골격근 -- kg | 체지방 -- %`;
  }

  // 1-4. Sleep & Vitals
  const sleepList = appState.healthData.sleep || [];
  const latestSleep = sleepList.length > 0 ? sleepList[sleepList.length - 1] : null;
  if (latestSleep && latestSleep.durationMinutes) {
    const mins = Number(latestSleep.durationMinutes) || 0;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (elements.healthCardSleep) {
      elements.healthCardSleep.innerHTML = `${hrs}시간 ${remMins}분 <span class="unit">(${latestSleep.sleepScore ? latestSleep.sleepScore + '점' : '기록됨'})</span>`;
    }
  } else {
    if (elements.healthCardSleep) elements.healthCardSleep.innerHTML = `-- <span class="unit">시간</span>`;
  }

  const vitalsList = appState.healthData.vitals || [];
  const latestVitals = vitalsList.length > 0 ? vitalsList[vitalsList.length - 1] : null;
  if (latestVitals) {
    if (elements.healthCardHr) {
      elements.healthCardHr.textContent = `평균 심박수: ${latestVitals.heartRate || '--'} bpm`;
    }
  } else {
    if (elements.healthCardHr) elements.healthCardHr.textContent = `평균 심박수: -- bpm`;
  }

  // 1-5. Today's Diet List Feed
  if (elements.healthTodayDietList) {
    if (todayDiets.length === 0) {
      elements.healthTodayDietList.innerHTML = `<div class="empty-state" style="padding: 2rem 1rem; color: var(--text-muted); font-size: 0.85rem; text-align: center;"><i class="fa-solid fa-utensils" style="font-size: 1.5rem; margin-bottom: 6px; opacity: 0.5;"></i><p>오늘 기록된 식단이 없습니다.<br>상단 '식단 관리'에서 끼니를 추가해보세요.</p></div>`;
    } else {
      elements.healthTodayDietList.innerHTML = todayDiets.map(item => {
        const subTypeColors = {
          '아침': 'badge-orange',
          '점심': 'badge-blue',
          '저녁': 'badge-purple',
          '간식': 'badge-green'
        };
        const badgeCls = subTypeColors[item.subType] || 'badge-blue';
        return `
          <div class="recent-item diet-recent-item" data-date="${escapeHtml(item.date || '')}" style="padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color); cursor: pointer; transition: background 0.2s ease;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="badge ${badgeCls}" style="font-size: 0.75rem;">${escapeHtml(item.subType || '식사')}</span>
              <div>
                <strong style="color: var(--text-color); font-size: 0.9rem;">${escapeHtml(item.title || '')}</strong>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(item.time || '')} | 탄 ${item.carbs || 0}g 단 ${item.protein || 0}g 지 ${item.fat || 0}g</div>
              </div>
            </div>
            <div style="font-weight: 700; color: #f59e0b; font-size: 0.9rem;">
              ${(Number(item.calories) || 0).toLocaleString()} kcal
            </div>
          </div>
        `;
      }).join('');

      elements.healthTodayDietList.querySelectorAll('.diet-recent-item').forEach(el => {
        el.addEventListener('click', () => {
          const d = el.getAttribute('data-date');
          if (d) window.location.hash = `#/health-diet/${d}`;
        });
      });
    }
  }

  // 1-6. Today's Workout List Feed
  const workoutItems = dbItems.filter(item => (item.category || '').toLowerCase() === 'workout');
  const todayWorkouts = workoutItems.filter(item => item.date && item.date.startsWith(today));
  if (elements.healthTodayWorkoutList) {
    if (todayWorkouts.length === 0) {
      elements.healthTodayWorkoutList.innerHTML = `<div class="empty-state" style="padding: 2rem 1rem; color: var(--text-muted); font-size: 0.85rem; text-align: center;"><i class="fa-solid fa-dumbbell" style="font-size: 1.5rem; margin-bottom: 6px; opacity: 0.5;"></i><p>오늘 기록된 운동 일지가 없습니다.<br>'운동 기록'에서 루틴을 추가해보세요.</p></div>`;
    } else {
      elements.healthTodayWorkoutList.innerHTML = todayWorkouts.map(item => {
        return `
          <div class="recent-item" style="padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color);">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="badge badge-green" style="font-size: 0.75rem;">${escapeHtml(item.subType || '운동')}</span>
              <div>
                <strong style="color: var(--text-color); font-size: 0.9rem;">${escapeHtml(item.title || '')}</strong>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(item.time || '')} | ${item.duration || 0}분</div>
              </div>
            </div>
            <div style="font-weight: 700; color: #10b981; font-size: 0.9rem;">
              ${(Number(item.calories) || 0).toLocaleString()} kcal
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // 1-7. Chart.js: Calorie Balance & Body Composition
  renderDashboardCharts(activities, dietItems, bodyRecords);
}

// Render Dashboard Chart.js Charts
function renderDashboardCharts(activities, dietItems, bodyRecords) {
  if (typeof window.Chart === 'undefined') return;

  const isLight = document.body.classList.contains('light-theme');
  const textColor = isLight ? '#475569' : '#94a3b8';
  const gridColor = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)';

  // Chart 1: Calorie Balance (Last 7 Days)
  const canvasCalorie = document.getElementById('chart-calorie-balance');
  if (canvasCalorie) {
    if (healthCharts.calorieBalance) {
      healthCharts.calorieBalance.destroy();
      healthCharts.calorieBalance = null;
    }

    // Generate last 7 days date strings
    const days = [];
    const dateLabels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      days.push(iso);
      dateLabels.push(`${d.getMonth() + 1}/${d.getDate()}`);
    }

    const intakeData = days.map(day => {
      const dayDiets = dietItems.filter(it => it.date && it.date.startsWith(day));
      return dayDiets.reduce((sum, it) => sum + (Number(it.calories) || 0), 0);
    });

    const burnData = days.map(day => {
      const dayAct = activities.find(it => it.date && it.date.startsWith(day));
      return dayAct ? (Number(dayAct.activeCalories) || 0) : 0;
    });

    healthCharts.calorieBalance = new window.Chart(canvasCalorie, {
      type: 'bar',
      data: {
        labels: dateLabels,
        datasets: [
          {
            label: '섭취 칼로리 (kcal)',
            data: intakeData,
            backgroundColor: 'rgba(245, 158, 11, 0.75)',
            borderColor: '#f59e0b',
            borderWidth: 1.5,
            borderRadius: 4
          },
          {
            label: '활동 소모 칼로리 (kcal)',
            data: burnData,
            backgroundColor: 'rgba(16, 185, 129, 0.75)',
            borderColor: '#10b981',
            borderWidth: 1.5,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: textColor, font: { size: 11 } }
          }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { size: 11 } }
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { size: 11 } },
            beginAtZero: true
          }
        }
      }
    });
  }

  // Chart 2: Body Composition Trend (Recent records)
  const canvasBody = document.getElementById('chart-body-composition');
  if (canvasBody) {
    if (healthCharts.bodyComposition) {
      healthCharts.bodyComposition.destroy();
      healthCharts.bodyComposition = null;
    }

    const sortedBody = [...bodyRecords].reverse().slice(-7); // Last 7 records chronological
    const labels = sortedBody.map(b => {
      if (!b.date) return '';
      const parts = b.date.split('-');
      return parts.length >= 3 ? `${Number(parts[1])}/${Number(parts[2])}` : b.date;
    });
    const weightData = sortedBody.map(b => Number(b.weight) || null);
    const muscleData = sortedBody.map(b => Number(b.muscleMass) || null);

    healthCharts.bodyComposition = new window.Chart(canvasBody, {
      type: 'line',
      data: {
        labels: labels.length > 0 ? labels : ['기록 없음'],
        datasets: [
          {
            label: '체중 (kg)',
            data: weightData.length > 0 ? weightData : [0],
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            tension: 0.3,
            fill: true,
            pointRadius: 4
          },
          {
            label: '골격근량 (kg)',
            data: muscleData.length > 0 ? muscleData : [0],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.3,
            fill: true,
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: textColor, font: { size: 11 } }
          }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { size: 11 } }
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { size: 11 } }
          }
        }
      }
    });
  }
}

// // Utility: Format Date for Diet List (e.g. '2026-09-15 (화)')
function formatDietDate(dateStr) {
  if (!dateStr) return '';
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  const dayName = days[d.getDay()];
  return `${dateStr} (${dayName})`;
}

// Utility: Long Format Date (e.g. '2026년 9월 15일 (화) 식단 일지')
function formatDietDateLong(dateStr) {
  if (!dateStr) return '식단 상세 일지';
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const date = d.getDate();
  const dayName = days[d.getDay()];
  return `${year}년 ${month}월 ${date}일 (${dayName}) 식단 일지`;
}

// Utility: Get Daily Recommended Calorie Target (SSOT)
function getDailyTargetCalories(date) {
  // 1. Samsung Health activity total calories for the date
  const activities = appState.healthData.activity || [];
  const act = activities.find(a => a.date && a.date.startsWith(date));
  if (act && Number(act.totalCalories) > 0) {
    return Math.round(Number(act.totalCalories));
  }

  // 2. Latest Body BMR * 1.35
  const bodyRecords = appState.healthData.body || [];
  if (bodyRecords.length > 0) {
    const latest = bodyRecords[0];
    const bmr = Number(latest.bmr) || 0;
    if (bmr > 0) {
      return Math.round(bmr * 1.35);
    }
  }

  // 3. Fallback standard adult recommendation
  return 2400;
}

// 2. Health Diet Tab (Master: 날짜별 2줄 요약 목록)
function renderHealthDiet() {
  // If activeDietDate is specified and we're navigating directly
  if (appState.activeDietDate) {
    showDietDateDetail(appState.activeDietDate);
    return;
  }

  if (elements.dietDateDetailView) elements.dietDateDetailView.style.display = 'none';
  if (elements.dietDateListView) elements.dietDateListView.style.display = 'block';

  const container = elements.dietDateList || elements.healthDietGrid;
  if (!container) return;

  const dbItems = appState.healthData.db || [];
  const dietItems = dbItems.filter(item => (item.category || '').toLowerCase() === 'diet');

  if (dietItems.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card" style="padding: 3rem 1rem; text-align: center; background: var(--bg-card); border-radius: 12px; border: 1px dashed var(--border-color);">
        <i class="fa-solid fa-utensils" style="font-size: 2.5rem; color: #10b981; margin-bottom: 12px; opacity: 0.7;"></i>
        <h3 style="color: var(--text-color); margin-bottom: 6px;">기록된 식단이 없습니다</h3>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.25rem;">음식 사진을 찍어 올리거나 먹은 메뉴를 적으면 Gemini AI가 칼로리를 자동 분석합니다.</p>
        <button class="btn-primary" id="btn-empty-add-diet"><i class="fa-solid fa-plus"></i> 첫 식단 기록하기</button>
      </div>
    `;
    document.getElementById('btn-empty-add-diet')?.addEventListener('click', () => {
      openAddDietModal();
    });
    return;
  }

  // Group by date: { 'YYYY-MM-DD': [ items... ] }
  const dateGroups = {};
  dietItems.forEach(item => {
    const d = item.date || '날짜 미지정';
    if (!dateGroups[d]) dateGroups[d] = [];
    dateGroups[d].push(item);
  });

  // Sort dates descending
  let sortedDates = Object.keys(dateGroups).sort((a, b) => b.localeCompare(a));

  // Filter by Subtype if selected
  if (appState.dietFilter && appState.dietFilter !== 'all') {
    sortedDates = sortedDates.filter(d => {
      return dateGroups[d].some(it => it.subType === appState.dietFilter);
    });
  }

  if (sortedDates.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card" style="padding: 2.5rem 1rem; text-align: center; background: var(--bg-card); border-radius: 12px; border: 1px dashed var(--border-color);">
        <p style="color: var(--text-muted); font-size: 0.9rem;">선택하신 끼니('${escapeHtml(appState.dietFilter)}')가 포함된 날짜의 식단 기록이 없습니다.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = sortedDates.map(dateStr => {
    const items = dateGroups[dateStr];
    let totalCal = 0;
    let totalCarb = 0;
    let totalProt = 0;
    let totalFat = 0;

    // Map meals by subtype
    const mealMap = { '아침': [], '점심': [], '저녁': [], '간식': [] };

    items.forEach(it => {
      totalCal += Number(it.calories) || 0;
      totalCarb += Number(it.carbs) || 0;
      totalProt += Number(it.protein) || 0;
      totalFat += Number(it.fat) || 0;

      const sub = it.subType || '기타';
      if (mealMap[sub]) {
        mealMap[sub].push(it.title || '메뉴');
      } else {
        mealMap[sub] = [it.title || '메뉴'];
      }
    });

    const targetCal = getDailyTargetCalories(dateStr);
    const calPct = Math.round((totalCal / targetCal) * 100);
    const isOver = calPct > 100;
    const formattedDate = formatDietDate(dateStr);

    // Build bottom line meals string
    const subTypes = ['아침', '점심', '저녁', '간식'];
    const subTypeClasses = {
      '아침': 'morning',
      '점심': 'lunch',
      '저녁': 'dinner',
      '간식': 'snack'
    };

    const mealSummariesHtml = subTypes.map((st, idx) => {
      const cls = subTypeClasses[st] || 'lunch';
      const menus = mealMap[st];
      const menuText = (menus && menus.length > 0) ? escapeHtml(menus.join(', ')) : null;
      return `
        <span class="meal-segment">
          <span class="meal-tag ${cls}">${st}</span>
          ${menuText ? `<span class="meal-title-text" title="${menuText}">${menuText}</span>` : `<span class="meal-none">-</span>`}
        </span>
        ${idx < subTypes.length - 1 ? `<span class="meal-divider">|</span>` : ''}
      `;
    }).join('');

    return `
      <div class="diet-date-row" data-date="${escapeHtml(dateStr)}">
        <!-- 윗줄: 해당 날짜, 전체 영양성분, 전체 칼로리/일일권장소비칼로리 -->
        <div class="date-row-top">
          <div class="date-row-title-wrap">
            <i class="fa-regular fa-calendar-check date-icon"></i>
            <span class="date-text">${escapeHtml(formattedDate)}</span>
            <span class="date-meal-badge">${items.length}끼</span>
          </div>

          <div class="date-row-macros-wrap">
            <span>탄 <strong>${Math.round(totalCarb)}g</strong></span>
            <span class="macro-dot">·</span>
            <span>단 <strong>${Math.round(totalProt)}g</strong></span>
            <span class="macro-dot">·</span>
            <span>지 <strong>${Math.round(totalFat)}g</strong></span>
          </div>

          <div class="date-row-calories-wrap">
            <span class="cal-val">${totalCal.toLocaleString()}</span>
            <span class="cal-slash">/</span>
            <span class="cal-target">${targetCal.toLocaleString()} kcal</span>
            <span class="cal-pct-badge ${isOver ? 'over' : ''}">${calPct}%</span>
            <i class="fa-solid fa-chevron-right arrow-icon"></i>
          </div>
        </div>

        <!-- 아랫줄: 아침: ~ | 점심: ~ | 저녁: ~ | 간식: ~ -->
        <div class="date-row-bottom">
          ${mealSummariesHtml}
        </div>
      </div>
    `;
  }).join('');

  // Attach click listener on each date row to open Detail Post View
  container.querySelectorAll('.diet-date-row').forEach(row => {
    row.addEventListener('click', () => {
      const date = row.getAttribute('data-date');
      if (date) {
        window.location.hash = `#/health-diet/${date}`;
      }
    });
  });
}

// 2-B. Health Diet Detail View (Detail: 날짜별 게시글 상세 화면, 명함형 세로 1열 카드)
function showDietDateDetail(date) {
  appState.activeDietDate = date;

  if (elements.dietDateListView) elements.dietDateListView.style.display = 'none';
  if (elements.dietDateDetailView) elements.dietDateDetailView.style.display = 'block';

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Update Detail Title
  if (elements.dietDetailDateTitle) {
    elements.dietDetailDateTitle.innerHTML = `<i class="fa-regular fa-calendar-days" style="color: #10b981;"></i> ${escapeHtml(formatDietDateLong(date))}`;
  }

  const dbItems = appState.healthData.db || [];
  const dateMeals = dbItems.filter(item => (item.category || '').toLowerCase() === 'diet' && item.date === date);

  if (dateMeals.length === 0) {
    backToDietList();
    return;
  }

  // Sort meals in logical meal order (아침 -> 점심 -> 저녁 -> 간식), then time
  const orderWeight = { '아침': 1, '점심': 2, '저녁': 3, '간식': 4 };
  dateMeals.sort((a, b) => {
    const wA = orderWeight[a.subType] || 99;
    const wB = orderWeight[b.subType] || 99;
    if (wA !== wB) return wA - wB;
    return (a.time || '').localeCompare(b.time || '');
  });

  // Calculate Daily Totals
  let totalCal = 0;
  let totalCarb = 0;
  let totalProt = 0;
  let totalFat = 0;

  dateMeals.forEach(m => {
    totalCal += Number(m.calories) || 0;
    totalCarb += Number(m.carbs) || 0;
    totalProt += Number(m.protein) || 0;
    totalFat += Number(m.fat) || 0;
  });

  const targetCal = getDailyTargetCalories(date);
  const calPct = Math.round((totalCal / targetCal) * 100);
  const totalMacroGrams = (totalCarb + totalProt + totalFat) || 1;
  const dayCarbPct = Math.round((totalCarb / totalMacroGrams) * 100);
  const dayProtPct = Math.round((totalProt / totalMacroGrams) * 100);
  const dayFatPct = Math.max(0, 100 - dayCarbPct - dayProtPct);

  // Render Daily Summary Banner
  if (elements.dietDailySummaryBanner) {
    elements.dietDailySummaryBanner.innerHTML = `
      <div class="summary-banner-top">
        <div class="summary-cal-headline">
          <span class="cal-big">${totalCal.toLocaleString()}</span>
          <span class="cal-sub">/ 권장 소비 ${targetCal.toLocaleString()} kcal (${calPct}%)</span>
        </div>
        <div style="font-size: 0.85rem; color: var(--text-muted);">
          총 <strong>${dateMeals.length}</strong>회의 끼니 기록
        </div>
      </div>

      <!-- Macro Visual Bar -->
      <div class="macro-bar" style="height: 10px;">
        <div class="macro-segment carb" style="width: ${dayCarbPct}%;" title="탄수화물 ${Math.round(totalCarb)}g (${dayCarbPct}%)"></div>
        <div class="macro-segment prot" style="width: ${dayProtPct}%;" title="단백질 ${Math.round(totalProt)}g (${dayProtPct}%)"></div>
        <div class="macro-segment fat" style="width: ${dayFatPct}%;" title="지방 ${Math.round(totalFat)}g (${dayFatPct}%)"></div>
      </div>

      <!-- Macro Details Grid -->
      <div class="summary-macros-grid">
        <div class="summary-macro-card">
          <span class="sm-label">탄수화물 (Carbs)</span>
          <span class="sm-val" style="color: #38bdf8;">${Math.round(totalCarb)}g <small style="font-size: 0.75rem; opacity: 0.8;">(${dayCarbPct}%)</small></span>
        </div>
        <div class="summary-macro-card">
          <span class="sm-label">단백질 (Protein)</span>
          <span class="sm-val" style="color: #10b981;">${Math.round(totalProt)}g <small style="font-size: 0.75rem; opacity: 0.8;">(${dayProtPct}%)</small></span>
        </div>
        <div class="summary-macro-card">
          <span class="sm-label">지방 (Fat)</span>
          <span class="sm-val" style="color: #ec4899;">${Math.round(totalFat)}g <small style="font-size: 0.75rem; opacity: 0.8;">(${dayFatPct}%)</small></span>
        </div>
      </div>
    `;
  }

  // Render Horizontal Meal Cards (명함형 세로 1열 카드)
  if (elements.dietDetailMealsStack) {
    const subTypeClasses = {
      '아침': { badge: 'badge-orange', icon: 'fa-sun', tag: 'morning' },
      '점심': { badge: 'badge-blue', icon: 'fa-cloud-sun', tag: 'lunch' },
      '저녁': { badge: 'badge-purple', icon: 'fa-moon', tag: 'dinner' },
      '간식': { badge: 'badge-green', icon: 'fa-mug-hot', tag: 'snack' }
    };

    elements.dietDetailMealsStack.innerHTML = dateMeals.map(meal => {
      const info = subTypeClasses[meal.subType] || { badge: 'badge-blue', icon: 'fa-utensils', tag: 'lunch' };
      const hasImage = !!meal.imageUrl;

      const c = Number(meal.carbs) || 0;
      const p = Number(meal.protein) || 0;
      const f = Number(meal.fat) || 0;
      const totalG = (c + p + f) || 1;
      const cPct = Math.round((c / totalG) * 100);
      const pPct = Math.round((p / totalG) * 100);
      const fPct = Math.max(0, 100 - cPct - pPct);

      return `
        <div class="diet-card-horizontal">
          <!-- 좌측 전체: 음식 이미지 (사진 전체 꽉 찬 형태 또는 플레이스홀더) -->
          <div class="diet-card-left">
            <span class="badge ${info.badge} diet-card-img-badge">${escapeHtml(meal.subType || '식단')}</span>
            ${hasImage ? `
              <img src="${escapeHtml(meal.imageUrl)}" alt="${escapeHtml(meal.title)}" class="diet-card-cover-img" loading="lazy">
            ` : `
              <div class="diet-card-placeholder">
                <i class="fa-solid ${info.icon}"></i>
                <span>${escapeHtml(meal.subType || '식단')} 사진 없음</span>
              </div>
            `}
          </div>

          <!-- 우측: 메뉴명, 영양성분표, 칼로리, 상세설명, AI분석 등 -->
          <div class="diet-card-right">
            <div>
              <div class="diet-card-meta">
                <div class="diet-card-meta-left">
                  <span class="badge ${info.badge}">${escapeHtml(meal.subType || '식단')}</span>
                  <span class="diet-card-time">
                    <i class="fa-regular fa-clock"></i> ${escapeHtml(meal.time || '--:--')}
                  </span>
                </div>
                <div class="diet-card-calories">
                  <span class="val">${(Number(meal.calories) || 0).toLocaleString()}</span>
                  <span class="unit">kcal</span>
                </div>
              </div>

              <h3 class="diet-card-title" style="margin-top: 8px;">${escapeHtml(meal.title || '식단')}</h3>
            </div>

            <!-- 영양성분표 (프로그레스 바 & 세부 수치) -->
            <div class="diet-card-macros-section">
              <div class="macro-bar">
                <div class="macro-segment carb" style="width: ${cPct}%;" title="탄수화물 ${c}g (${cPct}%)"></div>
                <div class="macro-segment prot" style="width: ${pPct}%;" title="단백질 ${p}g (${pPct}%)"></div>
                <div class="macro-segment fat" style="width: ${fPct}%;" title="지방 ${f}g (${fPct}%)"></div>
              </div>
              <div class="macro-labels">
                <span>탄수화물 <strong>${c}g</strong> <small>(${cPct}%)</small></span>
                <span>단백질 <strong>${p}g</strong> <small>(${pPct}%)</small></span>
                <span>지방 <strong>${f}g</strong> <small>(${fPct}%)</small></span>
              </div>
            </div>

            <!-- 상세설명 및 AI 분석 피드백 -->
            ${meal.content ? `
              <div class="diet-card-ai-box">
                <div class="ai-box-title">
                  <i class="fa-solid fa-wand-magic-sparkles"></i>
                  <span>AI 영양 분석 & 피드백</span>
                </div>
                <p class="ai-box-content">${escapeHtml(meal.content)}</p>
              </div>
            ` : ''}

            <!-- 관리자 액션 버튼 (수정, 삭제) -->
            ${appState.isAdmin ? `
              <div class="diet-card-footer">
                <button type="button" class="btn-secondary btn-sm btn-edit-diet" data-id="${escapeHtml(meal.id)}">
                  <i class="fa-regular fa-pen-to-square"></i> 수정
                </button>
                <button type="button" class="btn-danger btn-sm btn-delete-diet" data-id="${escapeHtml(meal.id)}">
                  <i class="fa-regular fa-trash-can"></i> 삭제
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Attach Edit & Delete Listeners
    elements.dietDetailMealsStack.querySelectorAll('.btn-edit-diet').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        openEditDietModal(id);
      });
    });

    elements.dietDetailMealsStack.querySelectorAll('.btn-delete-diet').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        deleteDietItem(id);
      });
    });
  }
}

// Back to Diet List
function backToDietList() {
  appState.activeDietDate = null;
  if (elements.dietDateDetailView) elements.dietDateDetailView.style.display = 'none';
  if (elements.dietDateListView) elements.dietDateListView.style.display = 'block';
  if (window.location.hash.startsWith('#/health-diet/')) {
    window.location.hash = '#/tab/health-diet';
  } else {
    renderHealthDiet();
  }
}

function openAddDietModal(presetDate = null) {
  if (elements.formHealthDiet) elements.formHealthDiet.reset();
  if (elements.dietEditId) elements.dietEditId.value = '';
  if (elements.dietModalTitle) {
    elements.dietModalTitle.innerHTML = '<i class="fa-solid fa-utensils" style="color: #10b981;"></i> 식단 기록 추가 (AI)';
  }

  // Auto set current date and time
  const now = new Date();
  if (elements.dietInputDate) {
    elements.dietInputDate.value = presetDate || appState.activeDietDate || now.toISOString().split('T')[0];
  }
  if (elements.dietInputTime) {
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    elements.dietInputTime.value = `${hours}:${minutes}`;
  }

  currentDietImageBase64 = '';
  currentDietImageMime = 'image/jpeg';
  if (elements.dietImagePreviewBox) elements.dietImagePreviewBox.style.display = 'none';
  if (elements.dietImageFilename) elements.dietImageFilename.textContent = '선택된 사진 없음';
  if (elements.dietAiStatus) elements.dietAiStatus.textContent = '사진이나 텍스트를 입력해 보세요';

  if (elements.modalHealthDiet) elements.modalHealthDiet.style.display = 'flex';
}

function openEditDietModal(id) {
  const dbItems = appState.healthData.db || [];
  const target = dbItems.find(it => it.id === id);
  if (!target) return;

  if (elements.dietEditId) elements.dietEditId.value = target.id;
  if (elements.dietModalTitle) {
    elements.dietModalTitle.innerHTML = `<i class="fa-solid fa-pen-to-square" style="color: #10b981;"></i> 식단 기록 수정 (${escapeHtml(target.title || '')})`;
  }
  if (elements.dietInputDate) elements.dietInputDate.value = target.date || '';
  if (elements.dietInputTime) elements.dietInputTime.value = target.time || '';
  if (elements.dietInputSubtype) elements.dietInputSubtype.value = target.subType || '점심';
  if (elements.dietInputTitle) elements.dietInputTitle.value = target.title || '';
  if (elements.dietInputCalories) elements.dietInputCalories.value = target.calories || 0;
  if (elements.dietInputCarbs) elements.dietInputCarbs.value = target.carbs || 0;
  if (elements.dietInputProtein) elements.dietInputProtein.value = target.protein || 0;
  if (elements.dietInputFat) elements.dietInputFat.value = target.fat || 0;
  if (elements.dietInputContent) elements.dietInputContent.value = target.content || '';

  if (target.imageUrl) {
    currentDietImageBase64 = target.imageUrl;
    if (elements.dietImagePreview) elements.dietImagePreview.src = target.imageUrl;
    if (elements.dietImagePreviewBox) elements.dietImagePreviewBox.style.display = 'inline-flex';
    if (elements.dietImageFilename) elements.dietImageFilename.textContent = '기존 사진 등록됨';
  } else {
    currentDietImageBase64 = '';
    if (elements.dietImagePreviewBox) elements.dietImagePreviewBox.style.display = 'none';
    if (elements.dietImageFilename) elements.dietImageFilename.textContent = '선택된 사진 없음';
  }

  if (elements.dietAiStatus) elements.dietAiStatus.textContent = '수정 모드입니다';
  if (elements.modalHealthDiet) elements.modalHealthDiet.style.display = 'flex';
}

async function saveDietItem() {
  const title = elements.dietInputTitle ? elements.dietInputTitle.value.trim() : '';
  const date = elements.dietInputDate ? elements.dietInputDate.value.trim() : '';
  if (!title || !date) {
    alert('날짜와 메뉴명은 필수 입력 항목입니다.');
    return;
  }

  const editId = elements.dietEditId ? elements.dietEditId.value : '';
  const item = {
    id: editId || `diet-${Date.now()}`,
    category: 'Diet',
    date: date,
    time: elements.dietInputTime ? elements.dietInputTime.value.trim() : '',
    subType: elements.dietInputSubtype ? elements.dietInputSubtype.value : '점심',
    title: title,
    calories: elements.dietInputCalories ? Number(elements.dietInputCalories.value) || 0 : 0,
    carbs: elements.dietInputCarbs ? Number(elements.dietInputCarbs.value) || 0 : 0,
    protein: elements.dietInputProtein ? Number(elements.dietInputProtein.value) || 0 : 0,
    fat: elements.dietInputFat ? Number(elements.dietInputFat.value) || 0 : 0,
    imageUrl: currentDietImageBase64 || '',
    content: elements.dietInputContent ? elements.dietInputContent.value.trim() : '',
    created_at: new Date().toISOString()
  };

  if (appState.isAdmin && appState.adminPassword) {
    try {
      await sendToHealthGasApi('saveDBItem', { item });
    } catch (err) {
      alert(err.message);
      return;
    }
  }

  const db = appState.healthData.db || [];
  if (editId) {
    const idx = db.findIndex(it => it.id === editId);
    if (idx !== -1) db[idx] = item;
  } else {
    db.unshift(item);
  }
  appState.healthData.db = db;
  localStorage.setItem('health_data', JSON.stringify(appState.healthData));

  if (elements.modalHealthDiet) elements.modalHealthDiet.style.display = 'none';
  if (appState.activeDietDate) {
    showDietDateDetail(appState.activeDietDate);
  }
  renderHealthDiet();
  if (appState.currentHealthTab === 'health-dashboard') {
    renderHealthDashboard();
  }
  alert('식단 기록이 성공적으로 저장되었습니다.');
}

async function deleteDietItem(id) {
  if (!confirm('이 식단 기록을 삭제하시겠습니까?')) return;

  if (appState.isAdmin && appState.adminPassword) {
    try {
      await sendToHealthGasApi('deleteDBItem', { id });
    } catch (err) {
      alert(err.message);
      return;
    }
  }

  appState.healthData.db = (appState.healthData.db || []).filter(it => it.id !== id);
  localStorage.setItem('health_data', JSON.stringify(appState.healthData));

  if (appState.activeDietDate) {
    const remaining = appState.healthData.db.filter(it => (it.category || '').toLowerCase() === 'diet' && it.date === appState.activeDietDate);
    if (remaining.length > 0) {
      showDietDateDetail(appState.activeDietDate);
    } else {
      backToDietList();
    }
  }
  renderHealthDiet();
  if (appState.currentHealthTab === 'health-dashboard') {
    renderHealthDashboard();
  }
  alert('식단 기록이 삭제되었습니다.');
}

// Multimodal Nutrition Analysis with Google AI Studio Gemini API
async function analyzeDietWithGemini() {
  if (!appState.geminiApiKey) {
    alert('Google AI Studio Gemini API 키가 설정되지 않았습니다.\n우측 상단의 톱니바퀴(⚙️) 버튼을 눌러 API 키를 등록해 주세요.');
    if (elements.modalGeminiSettings) elements.modalGeminiSettings.style.display = 'flex';
    return;
  }

  const promptText = elements.dietTextPrompt ? elements.dietTextPrompt.value.trim() : '';
  if (!promptText && !currentDietImageBase64) {
    alert('분석할 음식 사진을 업로드하거나, 무엇을 먹었는지 텍스트로 설명해 주세요.');
    return;
  }

  if (elements.dietAiStatus) {
    elements.dietAiStatus.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="color: #10b981;"></i> Gemini AI가 사진과 메뉴를 분석하고 있습니다...';
  }
  if (elements.btnRunDietAi) elements.btnRunDietAi.disabled = true;

  try {
    const parts = [];

    // If image exists, add inline data
    if (currentDietImageBase64 && currentDietImageBase64.includes(',')) {
      const base64Data = currentDietImageBase64.split(',')[1];
      parts.push({
        inline_data: {
          mime_type: currentDietImageMime || 'image/jpeg',
          data: base64Data
        }
      });
    }

    const systemInstruction = `당신은 최고 수준의 임상 영양사 및 식단 분석 전문가입니다.
제공된 음식 사진과 사용자 설명을 바탕으로 음식 종류, 예상 칼로리(kcal), 3대 영양소(탄수화물g, 단백질g, 지방g)를 전문적으로 분석해 주세요.
반드시 아래의 유효한 JSON 형식으로만 응답해야 하며, 어떠한 마크다운 코드블록(\`\`\`json 등)이나 서문/결문 없이 오직 순수한 JSON 문자열 하나만 출력해야 합니다:
{
  "title": "대표 메뉴명 (예: 소고기 구이와 된장찌개)",
  "subType": "아침 | 점심 | 저녁 | 간식",
  "calories": 650,
  "carbs": 45,
  "protein": 52,
  "fat": 28,
  "content": "영양 평가 및 식단 균형에 대한 전문적 피드백 한 줄"
}`;

    parts.push({
      text: `${systemInstruction}\n\n사용자 식단 설명: ${promptText || '사진 속 음식의 영양 성분과 칼로리를 정확히 분석해줘.'}`
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${appState.geminiModel}:generateContent?key=${appState.geminiApiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: parts }]
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData?.error?.message || `API 호출 오류 (${response.status})`);
    }

    const result = await response.json();
    const candidateText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean markdown code blocks if Gemini returned them
    const cleanJson = candidateText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    // Auto-fill form fields
    if (elements.dietInputTitle && parsed.title) elements.dietInputTitle.value = parsed.title;
    if (elements.dietInputSubtype && parsed.subType) {
      const validSubTypes = ['아침', '점심', '저녁', '간식'];
      if (validSubTypes.includes(parsed.subType)) {
        elements.dietInputSubtype.value = parsed.subType;
      }
    }
    if (elements.dietInputCalories && parsed.calories !== undefined) elements.dietInputCalories.value = parsed.calories;
    if (elements.dietInputCarbs && parsed.carbs !== undefined) elements.dietInputCarbs.value = parsed.carbs;
    if (elements.dietInputProtein && parsed.protein !== undefined) elements.dietInputProtein.value = parsed.protein;
    if (elements.dietInputFat && parsed.fat !== undefined) elements.dietInputFat.value = parsed.fat;
    if (elements.dietInputContent && parsed.content) elements.dietInputContent.value = parsed.content;

    if (elements.dietAiStatus) {
      elements.dietAiStatus.innerHTML = '<i class="fa-solid fa-circle-check" style="color: #10b981;"></i> AI 분석 완료! 아래 영양 정보를 확인해 보세요.';
    }
  } catch (err) {
    console.error('Gemini Analysis error:', err);
    if (elements.dietAiStatus) {
      elements.dietAiStatus.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: #ef4444;"></i> AI 분석 실패: ${escapeHtml(err.message)}`;
    }
  } finally {
    if (elements.btnRunDietAi) elements.btnRunDietAi.disabled = false;
  }
}

// 3. Health Workout Tab
function renderHealthWorkout() {
  const activities = appState.healthData.activity || [];
  const latestAct = activities.length > 0 ? activities[activities.length - 1] : null;

  if (latestAct) {
    if (elements.samsungSteps) elements.samsungSteps.textContent = `${(Number(latestAct.steps) || 0).toLocaleString()} 보`;
    if (elements.samsungDistance) elements.samsungDistance.textContent = `${(Number(latestAct.distanceKm) || 0).toFixed(1)} km`;
    if (elements.samsungActiveCal) elements.samsungActiveCal.textContent = `${(Number(latestAct.activeCalories) || 0).toLocaleString()} kcal`;
    if (elements.samsungActiveTime) elements.samsungActiveTime.textContent = `${(Number(latestAct.activeMinutes) || 0)} 분`;
    if (elements.samsungStatsDate) elements.samsungStatsDate.textContent = latestAct.date ? `${latestAct.date} 기준` : '최신 연동';
  }

  const dbItems = appState.healthData.db || [];
  const workoutItems = dbItems.filter(item => (item.category || '').toLowerCase() === 'workout');

  workoutItems.sort((a, b) => {
    const dtA = `${a.date || ''} ${a.time || ''}`;
    const dtB = `${b.date || ''} ${b.time || ''}`;
    return dtB.localeCompare(dtA);
  });

  if (!elements.healthWorkoutGrid) return;

  if (workoutItems.length === 0) {
    elements.healthWorkoutGrid.innerHTML = `
      <div class="empty-state-card" style="grid-column: 1 / -1; padding: 3rem 1rem; text-align: center; background: var(--bg-card); border-radius: 12px; border: 1px dashed var(--border-color);">
        <i class="fa-solid fa-dumbbell" style="font-size: 2.5rem; color: #10b981; margin-bottom: 12px; opacity: 0.7;"></i>
        <h3 style="color: var(--text-color); margin-bottom: 6px;">작성된 추가 운동 일지가 없습니다</h3>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.25rem;">웨이트 트레이닝 세트, 런닝, 크로스핏 루틴을 상세하게 기록해 보세요.</p>
        <button class="btn-primary" id="btn-empty-add-workout"><i class="fa-solid fa-plus"></i> 첫 운동 일지 작성</button>
      </div>
    `;
    document.getElementById('btn-empty-add-workout')?.addEventListener('click', () => {
      openAddWorkoutModal();
    });
    return;
  }

  elements.healthWorkoutGrid.innerHTML = workoutItems.map(item => {
    return `
      <div class="card health-feed-card">
        <div class="health-card-header">
          <span class="badge badge-green">${escapeHtml(item.subType || '웨이트')}</span>
          <span class="health-date-time"><i class="fa-regular fa-clock"></i> ${escapeHtml(item.date || '')} ${escapeHtml(item.time || '')}</span>
        </div>
        <h3 class="health-item-title">${escapeHtml(item.title || '운동')}</h3>
        
        <div class="health-workout-stats-row">
          <div class="stat-pill"><i class="fa-regular fa-hourglass-half"></i> ${item.duration || 0}분</div>
          <div class="stat-pill cal"><i class="fa-solid fa-fire"></i> ${(Number(item.calories) || 0).toLocaleString()} kcal</div>
        </div>

        ${item.content ? `
          <div class="workout-sets-box">
            ${escapeHtml(item.content).replace(/\n/g, '<br>')}
          </div>
        ` : ''}

        ${appState.isAdmin ? `
          <div class="health-item-actions">
            <button type="button" class="btn-secondary btn-sm btn-edit-workout" data-id="${escapeHtml(item.id)}"><i class="fa-regular fa-pen-to-square"></i> 수정</button>
            <button type="button" class="btn-danger btn-sm btn-delete-workout" data-id="${escapeHtml(item.id)}"><i class="fa-regular fa-trash-can"></i> 삭제</button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  elements.healthWorkoutGrid.querySelectorAll('.btn-edit-workout').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      openEditWorkoutModal(id);
    });
  });

  elements.healthWorkoutGrid.querySelectorAll('.btn-delete-workout').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      deleteWorkoutItem(id);
    });
  });
}

function openAddWorkoutModal() {
  if (elements.formHealthWorkout) elements.formHealthWorkout.reset();
  if (elements.workoutEditId) elements.workoutEditId.value = '';
  if (elements.workoutModalTitle) {
    elements.workoutModalTitle.innerHTML = '<i class="fa-solid fa-dumbbell" style="color: #10b981;"></i> 추가 운동 일지 작성';
  }

  const now = new Date();
  if (elements.workoutInputDate) elements.workoutInputDate.value = now.toISOString().split('T')[0];
  if (elements.workoutInputTime) {
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    elements.workoutInputTime.value = `${hours}:${minutes}`;
  }

  if (elements.modalHealthWorkout) elements.modalHealthWorkout.style.display = 'flex';
}

function openEditWorkoutModal(id) {
  const dbItems = appState.healthData.db || [];
  const target = dbItems.find(it => it.id === id);
  if (!target) return;

  if (elements.workoutEditId) elements.workoutEditId.value = target.id;
  if (elements.workoutModalTitle) {
    elements.workoutModalTitle.innerHTML = `<i class="fa-solid fa-pen-to-square" style="color: #10b981;"></i> 운동 일지 수정 (${escapeHtml(target.title || '')})`;
  }
  if (elements.workoutInputDate) elements.workoutInputDate.value = target.date || '';
  if (elements.workoutInputTime) elements.workoutInputTime.value = target.time || '';
  if (elements.workoutInputSubtype) elements.workoutInputSubtype.value = target.subType || '웨이트';
  if (elements.workoutInputTitle) elements.workoutInputTitle.value = target.title || '';
  if (elements.workoutInputDuration) elements.workoutInputDuration.value = target.duration || 60;
  if (elements.workoutInputCalories) elements.workoutInputCalories.value = target.calories || 0;
  if (elements.workoutInputContent) elements.workoutInputContent.value = target.content || '';

  if (elements.modalHealthWorkout) elements.modalHealthWorkout.style.display = 'flex';
}

async function saveWorkoutItem() {
  const title = elements.workoutInputTitle ? elements.workoutInputTitle.value.trim() : '';
  const date = elements.workoutInputDate ? elements.workoutInputDate.value.trim() : '';
  if (!title || !date) {
    alert('날짜와 운동 종목명은 필수 입력 항목입니다.');
    return;
  }

  const editId = elements.workoutEditId ? elements.workoutEditId.value : '';
  const item = {
    id: editId || `workout-${Date.now()}`,
    category: 'Workout',
    date: date,
    time: elements.workoutInputTime ? elements.workoutInputTime.value.trim() : '',
    subType: elements.workoutInputSubtype ? elements.workoutInputSubtype.value : '웨이트',
    title: title,
    duration: elements.workoutInputDuration ? Number(elements.workoutInputDuration.value) || 0 : 0,
    calories: elements.workoutInputCalories ? Number(elements.workoutInputCalories.value) || 0 : 0,
    content: elements.workoutInputContent ? elements.workoutInputContent.value.trim() : '',
    created_at: new Date().toISOString()
  };

  if (appState.isAdmin && appState.adminPassword) {
    try {
      await sendToHealthGasApi('saveDBItem', { item });
    } catch (err) {
      alert(err.message);
      return;
    }
  }

  const db = appState.healthData.db || [];
  if (editId) {
    const idx = db.findIndex(it => it.id === editId);
    if (idx !== -1) db[idx] = item;
  } else {
    db.unshift(item);
  }
  appState.healthData.db = db;
  localStorage.setItem('health_data', JSON.stringify(appState.healthData));

  if (elements.modalHealthWorkout) elements.modalHealthWorkout.style.display = 'none';
  renderHealthWorkout();
  if (appState.currentHealthTab === 'health-dashboard') {
    renderHealthDashboard();
  }
  alert('운동 일지가 성공적으로 저장되었습니다.');
}

async function deleteWorkoutItem(id) {
  if (!confirm('이 운동 일지를 삭제하시겠습니까?')) return;

  if (appState.isAdmin && appState.adminPassword) {
    try {
      await sendToHealthGasApi('deleteDBItem', { id });
    } catch (err) {
      alert(err.message);
      return;
    }
  }

  appState.healthData.db = (appState.healthData.db || []).filter(it => it.id !== id);
  localStorage.setItem('health_data', JSON.stringify(appState.healthData));
  renderHealthWorkout();
  if (appState.currentHealthTab === 'health-dashboard') {
    renderHealthDashboard();
  }
}

// 4. Health Body Tab (InBody)
function renderHealthBody() {
  const bodyRecords = [...(appState.healthData.body || [])];
  bodyRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

  // 4-1. Latest Body Summary Card
  if (elements.bodyLatestSummary) {
    const latest = bodyRecords[0];
    if (latest) {
      const weight = Number(latest.weight) || 0;
      const muscle = Number(latest.muscleMass) || 0;
      const fat = Number(latest.bodyFatPercent) || 0;
      const bmi = latest.bmi || (weight ? (weight / (1.75 * 1.75)).toFixed(1) : '--');
      const bmr = latest.bmr || (weight ? Math.round(10 * weight + 6.25 * 175 - 5 * 28 + 5) : '--');

      elements.bodyLatestSummary.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="stat-box" style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px;">
            <div style="font-size: 0.8rem; color: var(--text-muted);">현재 체중</div>
            <div style="font-size: 1.4rem; font-weight: 700; color: #38bdf8;">${weight} <span style="font-size: 0.85rem;">kg</span></div>
          </div>
          <div class="stat-box" style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px;">
            <div style="font-size: 0.8rem; color: var(--text-muted);">골격근량</div>
            <div style="font-size: 1.4rem; font-weight: 700; color: #10b981;">${muscle} <span style="font-size: 0.85rem;">kg</span></div>
          </div>
          <div class="stat-box" style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px;">
            <div style="font-size: 0.8rem; color: var(--text-muted);">체지방률</div>
            <div style="font-size: 1.4rem; font-weight: 700; color: #f59e0b;">${fat} <span style="font-size: 0.85rem;">%</span></div>
          </div>
          <div class="stat-box" style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px;">
            <div style="font-size: 0.8rem; color: var(--text-muted);">BMI 지수</div>
            <div style="font-size: 1.4rem; font-weight: 700; color: var(--text-color);">${bmi}</div>
          </div>
        </div>
        <div style="padding: 10px; background: rgba(16, 185, 129, 0.08); border-radius: 8px; font-size: 0.85rem; color: #10b981; text-align: center;">
          <i class="fa-solid fa-bolt"></i> 추정 기초대사량(BMR): <strong>${bmr} kcal</strong>
        </div>
      `;
    } else {
      elements.bodyLatestSummary.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 1.5rem 0;">
          <i class="fa-solid fa-weight-scale" style="font-size: 2rem; margin-bottom: 8px; opacity: 0.5;"></i>
          <p>등록된 신체 지표가 없습니다.<br>우측 상단 '신체 지표 기록' 버튼을 눌러보세요.</p>
        </div>
      `;
    }
  }

  // 4-2. History Table
  if (elements.healthBodyTableBody) {
    if (bodyRecords.length === 0) {
      elements.healthBodyTableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">기록된 신체 데이터가 없습니다.</td></tr>`;
    } else {
      elements.healthBodyTableBody.innerHTML = bodyRecords.map(item => {
        const weight = Number(item.weight) || 0;
        const bmi = item.bmi || (weight ? (weight / (1.75 * 1.75)).toFixed(1) : '--');
        const bmr = item.bmr || (weight ? Math.round(10 * weight + 6.25 * 175 - 5 * 28 + 5) : '--');
        return `
          <tr>
            <td><strong>${escapeHtml(item.date || '')}</strong></td>
            <td><span style="color: #38bdf8; font-weight: 600;">${item.weight || '--'}</span> kg</td>
            <td><span style="color: #10b981; font-weight: 600;">${item.muscleMass || '--'}</span> kg</td>
            <td><span style="color: #f59e0b; font-weight: 600;">${item.bodyFatPercent || '--'}</span> %</td>
            <td>${bmi}</td>
            <td>${bmr} kcal</td>
            <td style="color: var(--text-muted); font-size: 0.85rem;">${escapeHtml(item.notes || '-')}</td>
            <td>
              ${appState.isAdmin ? `
                <button type="button" class="btn-secondary btn-sm btn-edit-body" data-id="${escapeHtml(item.id)}" title="수정"><i class="fa-regular fa-pen-to-square"></i></button>
                <button type="button" class="btn-danger btn-sm btn-delete-body" data-id="${escapeHtml(item.id)}" title="삭제"><i class="fa-regular fa-trash-can"></i></button>
              ` : '-'}
            </td>
          </tr>
        `;
      }).join('');

      elements.healthBodyTableBody.querySelectorAll('.btn-edit-body').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          openEditBodyModal(id);
        });
      });

      elements.healthBodyTableBody.querySelectorAll('.btn-delete-body').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          deleteBodyItem(id);
        });
      });
    }
  }

  // 4-3. Trend Chart
  renderBodyDetailTrendChart(bodyRecords);
}

function renderBodyDetailTrendChart(bodyRecords) {
  if (typeof window.Chart === 'undefined') return;

  const canvas = document.getElementById('chart-body-detail-trend');
  if (!canvas) return;

  if (healthCharts.bodyDetailTrend) {
    healthCharts.bodyDetailTrend.destroy();
    healthCharts.bodyDetailTrend = null;
  }

  const isLight = document.body.classList.contains('light-theme');
  const textColor = isLight ? '#475569' : '#94a3b8';
  const gridColor = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)';

  const sortedBody = [...bodyRecords].reverse().slice(-10); // Chronological
  const labels = sortedBody.map(b => {
    if (!b.date) return '';
    const parts = b.date.split('-');
    return parts.length >= 3 ? `${Number(parts[1])}/${Number(parts[2])}` : b.date;
  });

  const muscleData = sortedBody.map(b => Number(b.muscleMass) || null);
  const fatData = sortedBody.map(b => Number(b.bodyFatPercent) || null);

  healthCharts.bodyDetailTrend = new window.Chart(canvas, {
    type: 'line',
    data: {
      labels: labels.length > 0 ? labels : ['기록 없음'],
      datasets: [
        {
          label: '골격근량 (kg)',
          data: muscleData.length > 0 ? muscleData : [0],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3,
          pointRadius: 5,
          yAxisID: 'y'
        },
        {
          label: '체지방률 (%)',
          data: fatData.length > 0 ? fatData : [0],
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.3,
          pointRadius: 5,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: textColor, font: { size: 11 } }
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { size: 11 } }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: { display: true, text: '골격근량 (kg)', color: textColor },
          grid: { color: gridColor },
          ticks: { color: textColor }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: { display: true, text: '체지방률 (%)', color: textColor },
          grid: { drawOnChartArea: false },
          ticks: { color: textColor }
        }
      }
    }
  });
}

function openAddBodyModal() {
  if (elements.formHealthBody) elements.formHealthBody.reset();
  if (elements.bodyEditId) elements.bodyEditId.value = '';
  if (elements.bodyModalTitle) {
    elements.bodyModalTitle.innerHTML = '<i class="fa-solid fa-weight-scale" style="color: #38bdf8;"></i> 신체 데이터 기록 (인바디)';
  }

  const now = new Date();
  if (elements.bodyInputDate) elements.bodyInputDate.value = now.toISOString().split('T')[0];
  if (elements.modalHealthBody) elements.modalHealthBody.style.display = 'flex';
}

function openEditBodyModal(id) {
  const bodyRecords = appState.healthData.body || [];
  const target = bodyRecords.find(it => it.id === id);
  if (!target) return;

  if (elements.bodyEditId) elements.bodyEditId.value = target.id;
  if (elements.bodyModalTitle) {
    elements.bodyModalTitle.innerHTML = `<i class="fa-solid fa-pen-to-square" style="color: #38bdf8;"></i> 신체 지표 수정 (${escapeHtml(target.date || '')})`;
  }
  if (elements.bodyInputDate) elements.bodyInputDate.value = target.date || '';
  if (elements.bodyInputWeight) elements.bodyInputWeight.value = target.weight || '';
  if (elements.bodyInputMuscle) elements.bodyInputMuscle.value = target.muscleMass || '';
  if (elements.bodyInputFat) elements.bodyInputFat.value = target.bodyFatPercent || '';
  if (elements.bodyInputNotes) elements.bodyInputNotes.value = target.notes || '';

  if (elements.modalHealthBody) elements.modalHealthBody.style.display = 'flex';
}

async function saveBodyItem() {
  const date = elements.bodyInputDate ? elements.bodyInputDate.value.trim() : '';
  const weight = elements.bodyInputWeight ? Number(elements.bodyInputWeight.value) || 0 : 0;
  if (!date || !weight) {
    alert('측정 일자와 체중은 필수 입력 항목입니다.');
    return;
  }

  const editId = elements.bodyEditId ? elements.bodyEditId.value : '';
  const muscle = elements.bodyInputMuscle ? Number(elements.bodyInputMuscle.value) || 0 : 0;
  const fat = elements.bodyInputFat ? Number(elements.bodyInputFat.value) || 0 : 0;
  const bmi = (weight / (1.75 * 1.75)).toFixed(1);
  const bmr = Math.round(10 * weight + 6.25 * 175 - 5 * 28 + 5);

  const item = {
    id: editId || `body-${Date.now()}`,
    date: date,
    weight: weight,
    muscleMass: muscle,
    bodyFatPercent: fat,
    bmi: Number(bmi),
    bmr: bmr,
    notes: elements.bodyInputNotes ? elements.bodyInputNotes.value.trim() : '',
    created_at: new Date().toISOString()
  };

  if (appState.isAdmin && appState.adminPassword) {
    try {
      await sendToHealthGasApi('saveBodyItem', { item });
    } catch (err) {
      alert(err.message);
      return;
    }
  }

  const bodyList = appState.healthData.body || [];
  if (editId) {
    const idx = bodyList.findIndex(it => it.id === editId);
    if (idx !== -1) bodyList[idx] = item;
  } else {
    bodyList.unshift(item);
  }
  appState.healthData.body = bodyList;
  localStorage.setItem('health_data', JSON.stringify(appState.healthData));

  if (elements.modalHealthBody) elements.modalHealthBody.style.display = 'none';
  renderHealthBody();
  if (appState.currentHealthTab === 'health-dashboard') {
    renderHealthDashboard();
  }
  alert('신체 지표가 성공적으로 저장되었습니다.');
}

async function deleteBodyItem(id) {
  if (!confirm('이 신체 측정 기록을 삭제하시겠습니까?')) return;

  if (appState.isAdmin && appState.adminPassword) {
    try {
      await sendToHealthGasApi('deleteBodyItem', { id });
    } catch (err) {
      alert(err.message);
      return;
    }
  }

  appState.healthData.body = (appState.healthData.body || []).filter(it => it.id !== id);
  localStorage.setItem('health_data', JSON.stringify(appState.healthData));
  renderHealthBody();
  if (appState.currentHealthTab === 'health-dashboard') {
    renderHealthDashboard();
  }
}

// 5. Setup Health Event Listeners
function setupHealthEventListeners() {
  // Mode Toggle Button (Green Heart / Shield)
  elements.modeHealthToggleBtn?.addEventListener('click', () => {
    toggleAppMode();
  });

  // Gemini Settings Button (Gear / Magic Sparkles)
  elements.geminiSettingsBtn?.addEventListener('click', () => {
    if (elements.geminiApiKeyInput) elements.geminiApiKeyInput.value = appState.geminiApiKey || '';
    if (elements.geminiModelSelect) elements.geminiModelSelect.value = appState.geminiModel || 'gemini-1.5-flash';
    if (elements.geminiKeyStatus) {
      elements.geminiKeyStatus.textContent = appState.geminiApiKey ? 'API 키 등록됨' : '미설정';
      elements.geminiKeyStatus.style.color = appState.geminiApiKey ? '#10b981' : 'var(--text-muted)';
    }
    if (elements.modalGeminiSettings) elements.modalGeminiSettings.style.display = 'flex';
  });

  elements.btnCloseGeminiModal?.addEventListener('click', () => {
    if (elements.modalGeminiSettings) elements.modalGeminiSettings.style.display = 'none';
  });

  elements.btnCancelGeminiSettings?.addEventListener('click', () => {
    if (elements.modalGeminiSettings) elements.modalGeminiSettings.style.display = 'none';
  });

  elements.btnSaveGeminiSettings?.addEventListener('click', () => {
    const key = elements.geminiApiKeyInput ? elements.geminiApiKeyInput.value.trim() : '';
    const model = elements.geminiModelSelect ? elements.geminiModelSelect.value : 'gemini-1.5-flash';
    
    appState.geminiApiKey = key;
    appState.geminiModel = model;
    localStorage.setItem('gemini_api_key', key);
    localStorage.setItem('gemini_model', model);

    if (elements.modalGeminiSettings) elements.modalGeminiSettings.style.display = 'none';
    alert('Gemini API 설정이 저장되었습니다.');
  });

  // Diet Modal Controls
  elements.btnOpenAddDiet?.addEventListener('click', () => {
    openAddDietModal();
  });

  elements.btnCloseDietModal?.addEventListener('click', () => {
    if (elements.modalHealthDiet) elements.modalHealthDiet.style.display = 'none';
  });

  elements.btnCancelDiet?.addEventListener('click', () => {
    if (elements.modalHealthDiet) elements.modalHealthDiet.style.display = 'none';
  });

  // Image Upload / Preview / Remove
  elements.dietImageInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    currentDietImageMime = file.type || 'image/jpeg';
    if (elements.dietImageFilename) elements.dietImageFilename.textContent = file.name;

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      currentDietImageBase64 = loadEvt.target.result;
      if (elements.dietImagePreview) elements.dietImagePreview.src = currentDietImageBase64;
      if (elements.dietImagePreviewBox) elements.dietImagePreviewBox.style.display = 'inline-flex';
    };
    reader.readAsDataURL(file);
  });

  elements.btnRemoveDietImage?.addEventListener('click', () => {
    currentDietImageBase64 = '';
    if (elements.dietImageInput) elements.dietImageInput.value = '';
    if (elements.dietImagePreview) elements.dietImagePreview.src = '';
    if (elements.dietImagePreviewBox) elements.dietImagePreviewBox.style.display = 'none';
    if (elements.dietImageFilename) elements.dietImageFilename.textContent = '선택된 사진 없음';
  });

  // Support Image Paste directly into Diet Modal
  elements.modalHealthDiet?.addEventListener('paste', (e) => {
    const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
    if (!items) return;
    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        currentDietImageMime = file.type;
        if (elements.dietImageFilename) elements.dietImageFilename.textContent = '클립보드 붙여넣은 이미지';
        const reader = new FileReader();
        reader.onload = (loadEvt) => {
          currentDietImageBase64 = loadEvt.target.result;
          if (elements.dietImagePreview) elements.dietImagePreview.src = currentDietImageBase64;
          if (elements.dietImagePreviewBox) elements.dietImagePreviewBox.style.display = 'inline-flex';
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  });

  // Run AI Analysis Button
  elements.btnRunDietAi?.addEventListener('click', () => {
    analyzeDietWithGemini();
  });

  // Diet Form Submit
  elements.formHealthDiet?.addEventListener('submit', (e) => {
    e.preventDefault();
    saveDietItem();
  });

  // Diet Subtype Filter Bar
  elements.dietFilterBar?.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      elements.dietFilterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.dietFilter = btn.getAttribute('data-diet-filter') || 'all';
      renderHealthDiet();
    });
  });

  // Diet Detail View Controls (Back to list & Add meal on active date)
  elements.btnBackToDietList?.addEventListener('click', () => {
    backToDietList();
  });

  elements.btnDetailAddMeal?.addEventListener('click', () => {
    openAddDietModal(appState.activeDietDate);
  });

  // Workout Modal Controls
  elements.btnOpenAddWorkout?.addEventListener('click', () => {
    openAddWorkoutModal();
  });

  elements.btnCloseWorkoutModal?.addEventListener('click', () => {
    if (elements.modalHealthWorkout) elements.modalHealthWorkout.style.display = 'none';
  });

  elements.btnCancelWorkout?.addEventListener('click', () => {
    if (elements.modalHealthWorkout) elements.modalHealthWorkout.style.display = 'none';
  });

  elements.formHealthWorkout?.addEventListener('submit', (e) => {
    e.preventDefault();
    saveWorkoutItem();
  });

  // Body Modal Controls
  elements.btnOpenAddBody?.addEventListener('click', () => {
    openAddBodyModal();
  });

  elements.btnCloseBodyModal?.addEventListener('click', () => {
    if (elements.modalHealthBody) elements.modalHealthBody.style.display = 'none';
  });

  elements.btnCancelBody?.addEventListener('click', () => {
    if (elements.modalHealthBody) elements.modalHealthBody.style.display = 'none';
  });

  elements.formHealthBody?.addEventListener('submit', (e) => {
    e.preventDefault();
    saveBodyItem();
  });

  // Dashboard "전체보기" buttons to navigate to diet/workout tabs
  document.querySelectorAll('.btn-more[data-target-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target-tab');
      if (target) switchTab(target);
    });
  });
}


