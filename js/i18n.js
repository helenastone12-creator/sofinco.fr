/**
 * SOrloz i18n System
 * Loads translations and applies them to the DOM
 */

const SUPPORTED_LANGS = ['fr', 'en', 'sv', 'de', 'pl', 'lt', 'fi', 'pt', 'it'];
const LANG_NAMES = {
  fr: 'Français',
  en: 'English',
  sv: 'Svenska',
  de: 'Deutsch',
  pl: 'Polski',
  lt: 'Lietuvių',
  fi: 'Suomi',
  pt: 'Português',
  it: 'Italiano'
};

let currentLang = 'fr';
let translations = {};

// Detect base path for i18n files
function getBasePath() {
  const scripts = document.querySelectorAll('script[src]');
  for (const script of scripts) {
    if (script.src.includes('i18n.js')) {
      const src = script.src;
      // Remove 'js/i18n.js' from path
      return src.replace(/js\/i18n\.js.*$/, '');
    }
  }
  // fallback: try to detect from current URL depth
  const path = window.location.pathname;
  const depth = (path.match(/\//g) || []).length - 1;
  if (depth <= 1) return './';
  return '../'.repeat(depth - 1);
}

/**
 * Load a translation file
 */
async function loadTranslation(lang) {
  if (translations[lang]) return translations[lang];
  try {
    const base = getBasePath();
    const response = await fetch(`${base}i18n/${lang}.json`);
    if (!response.ok) throw new Error(`Failed to load ${lang}.json`);
    translations[lang] = await response.json();
    return translations[lang];
  } catch (err) {
    console.warn(`[i18n] Could not load ${lang}:`, err);
    // fallback to fr
    if (lang !== 'fr' && translations['fr']) return translations['fr'];
    return {};
  }
}

/**
 * Apply translations to the DOM
 */
function applyTranslations(t) {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) {
      el.textContent = t[key];
    }
  });

  // Handle placeholders
  const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
  placeholders.forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key] !== undefined) {
      el.placeholder = t[key];
    }
  });

  // Handle aria-labels
  const ariaLabels = document.querySelectorAll('[data-i18n-aria]');
  ariaLabels.forEach(el => {
    const key = el.getAttribute('data-i18n-aria');
    if (t[key] !== undefined) {
      el.setAttribute('aria-label', t[key]);
    }
  });

  // Update html lang attribute
  document.documentElement.lang = currentLang;

  // Update page title if key exists
  if (t['page_title']) {
    document.title = t['page_title'];
  }
}

/**
 * Set language and apply
 */
async function setLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) {
    console.warn(`[i18n] Unsupported language: ${lang}`);
    lang = 'fr';
  }
  currentLang = lang;
  localStorage.setItem('sorloz_lang', lang);

  const t = await loadTranslation(lang);
  applyTranslations(t);
  updateLangSelector(lang);

  // Emit event
  document.dispatchEvent(new CustomEvent('langChange', { detail: { lang, translations: t } }));
}

/**
 * Get a translation key
 */
function t(key, fallback) {
  const t = translations[currentLang] || translations['fr'] || {};
  return t[key] !== undefined ? t[key] : (fallback || key);
}

/**
 * Update lang selector UI
 */
function updateLangSelector(lang) {
  // Update button text
  const langBtns = document.querySelectorAll('.lang-current');
  langBtns.forEach(btn => {
    btn.textContent = LANG_NAMES[lang] || lang.toUpperCase();
  });

  // Update active state in dropdown
  const langLinks = document.querySelectorAll('.lang-dropdown a');
  langLinks.forEach(link => {
    link.classList.toggle('active', link.dataset.lang === lang);
  });
}

/**
 * Inject language selector into header
 */
function injectLangSelector() {
  const headerActions = document.querySelector('.header-actions');
  if (!headerActions) return;

  // Check if already injected
  if (headerActions.querySelector('.lang-selector')) return;

  const selector = document.createElement('div');
  selector.className = 'lang-selector';
  selector.setAttribute('role', 'navigation');
  selector.setAttribute('aria-label', 'Language selector');

  const dropdownItems = SUPPORTED_LANGS.map(lang =>
    `<a href="#" data-lang="${lang}" ${lang === currentLang ? 'class="active"' : ''}>${LANG_NAMES[lang]}</a>`
  ).join('');

  selector.innerHTML = `
    <button class="lang-btn" aria-expanded="false" aria-haspopup="true">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="8" cy="8" r="7"/>
        <path d="M8 1C8 1 5 4 5 8s3 7 3 7M8 1c0 0 3 3 3 7s-3 7-3 7M1 8h14"/>
      </svg>
      <span class="lang-current">${LANG_NAMES[currentLang]}</span>
      <span style="font-size:10px; opacity:0.6">▾</span>
    </button>
    <div class="lang-dropdown" role="menu">
      ${dropdownItems}
    </div>
  `;

  headerActions.insertBefore(selector, headerActions.firstChild);

  // Wire events
  const btn = selector.querySelector('.lang-btn');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    selector.classList.toggle('open');
    btn.setAttribute('aria-expanded', selector.classList.contains('open'));
  });

  selector.querySelectorAll('.lang-dropdown a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      setLanguage(link.dataset.lang);
      selector.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', () => {
    selector.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  });
}

/**
 * Initialize i18n
 */
async function initI18n() {
  // Detect saved language or browser preference
  const savedLang = localStorage.getItem('sorloz_lang');
  const browserLang = navigator.language?.split('-')[0];
  const detectedLang = savedLang || (SUPPORTED_LANGS.includes(browserLang) ? browserLang : 'fr');

  // Pre-load French as fallback
  await loadTranslation('fr');

  // Set initial language
  await setLanguage(detectedLang);

  // Inject selector after DOM is set up
  injectLangSelector();
}

// Auto-init on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initI18n);
} else {
  initI18n();
}

// Export for use in other scripts
window.i18n = { setLanguage, t, currentLang: () => currentLang, SUPPORTED_LANGS, LANG_NAMES };
