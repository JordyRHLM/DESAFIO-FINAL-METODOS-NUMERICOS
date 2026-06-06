/* ═══════════════════════════════════════════════════════════════
   CRISISNUM — app.js
   Router SPA: carga pages/*.html sin recargar la página
═══════════════════════════════════════════════════════════════ */

const mainContent = document.getElementById('mainContent');
const navbar      = document.getElementById('navbar');
const navToggle   = document.getElementById('navToggle');
const mainNav     = document.getElementById('mainNav');

/* ── Mapa de páginas ──────────────────────────────────────────── */
const PAGES = {
  'inicio':       'pages/inicio.html',
  'escenario-a':  'pages/escenario-a.html',
  'escenario-b':  'pages/escenario-b.html',
  'escenario-c':  'pages/escenario-c.html',
  'escenario-d':  'pages/escenario-d.html',
  'escenario-e':  'pages/escenario-e.html',
  'conclusiones': 'pages/conclusiones.html',
};

/* ── Módulos JS por página ────────────────────────────────────── */
const PAGE_MODULES = {
  'escenario-a': () => import('./modules/escenario-a-sistemas.js'),
  'escenario-b': () => import('./modules/escenario-b-ode.js'),
  'escenario-c': () => import('./modules/escenario-c-interpolacion.js'),
  'escenario-d': () => import('./modules/escenario-d-integracion.js'),
  'escenario-e': () => import('./modules/escenario-e-raices.js'),
};

/* ── Estado actual ────────────────────────────────────────────── */
let currentPage = null;

/* ── Loader HTML ──────────────────────────────────────────────── */
function showLoader() {
  mainContent.innerHTML = `
    <div class="page-loader">
      <div class="page-loader__dot"></div>
      <div class="page-loader__dot"></div>
      <div class="page-loader__dot"></div>
      <span>Cargando módulo…</span>
    </div>`;
}

/* ── Navegar a una página ─────────────────────────────────────── */
async function navigateTo(pageId) {
  if (pageId === currentPage) return;
  if (!PAGES[pageId]) pageId = 'inicio';

  showLoader();
  currentPage = pageId;
  updateNavActive(pageId);
  closeMobileNav();

  try {
    const res  = await fetch(PAGES[pageId]);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    mainContent.innerHTML = html;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Cargar módulo JS si existe
    if (PAGE_MODULES[pageId]) {
      const mod = await PAGE_MODULES[pageId]();
      if (typeof mod.init === 'function') mod.init();
    }

  } catch (err) {
    mainContent.innerHTML = `
      <div class="container" style="padding-top:4rem;padding-bottom:4rem;">
        <div class="alert alert-danger">
          <span class="alert-icon">⚠</span>
          <div>No se pudo cargar la sección <strong>${pageId}</strong>. ${err.message}</div>
        </div>
      </div>`;
  }
}

/* ── Actualizar nav activo ────────────────────────────────────── */
function updateNavActive(pageId) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === pageId);
  });
}

/* ── Navbar scroll ────────────────────────────────────────────── */
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

/* ── Toggle mobile nav ────────────────────────────────────────── */
navToggle.addEventListener('click', () => {
  mainNav.classList.toggle('open');
});

function closeMobileNav() {
  mainNav.classList.remove('open');
}

/* ── Delegación de clics en nav ──────────────────────────────── */
document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-page]');
  if (!link) return;
  e.preventDefault();
  navigateTo(link.dataset.page);
});

/* ── Soporte hash en URL ──────────────────────────────────────── */
function getPageFromHash() {
  const hash = location.hash.replace('#', '');
  return PAGES[hash] ? hash : 'inicio';
}

window.addEventListener('hashchange', () => {
  navigateTo(getPageFromHash());
});

/* ── Arranque ─────────────────────────────────────────────────── */
navigateTo(getPageFromHash());