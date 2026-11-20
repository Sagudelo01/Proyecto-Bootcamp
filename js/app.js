const LS = { lang: 'ecodatos:lang', theme: 'ecodatos:theme' };

function initTheme() {
  const saved = localStorage.getItem(LS.theme);
  const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', saved || (prefersDark ? 'dark' : 'light'));
}

function initLang() {
  const saved = localStorage.getItem(LS.lang);
  const browser = (navigator.language || 'en').toLowerCase().startsWith('es') ? 'es' : 'en';
  i18n.lang = saved || browser;
}

function applyI18n() {
  document.documentElement.lang = i18n.lang;
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.getAttribute('data-i18n');
    if (node.hasAttribute('data-i18n-html')) node.innerHTML = i18n.t(key);
    else node.textContent = i18n.t(key);
  });
  const sel = el('entitySelect');
  sel.innerHTML = DATA.entities
    .map((e) => `<option value="${e}"${e === Charts.entity ? ' selected' : ''}>${i18n.region(e)}</option>`)
    .join('');
  el('langToggle').textContent = i18n.lang.toUpperCase();
  el('langToggle').setAttribute('aria-label', i18n.t('toggle.lang'));
  el('themeToggle').setAttribute('aria-label', i18n.t('toggle.theme'));
}

function setLang(lang) {
  i18n.lang = lang;
  localStorage.setItem(LS.lang, lang);
  applyI18n();
  Charts.renderAll();
}

function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem(LS.theme, t);
  Charts.renderAll();
}

function setKpis() {
  const world = DATA.shareByEntity.World;
  el('kpiEntities').textContent = DATA.entities.length;
  el('kpiYears').textContent = `${world.years[0]}–${world.years.at(-1)}`;
  el('kpiGeo').textContent = DATA.geoRanking.values[0].toLocaleString();
}

function init() {
  initTheme();
  initLang();
  applyI18n();
  setKpis();
  Charts.renderAll();

  el('entitySelect').addEventListener('change', (e) => Charts.setEntity(e.target.value));
  el('langToggle').addEventListener('click', () => setLang(i18n.lang === 'en' ? 'es' : 'en'));
  el('themeToggle').addEventListener('click', () =>
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

  document.addEventListener('visibilitychange', () =>
    document.body.classList.toggle('bg-paused', document.hidden));

  requestAnimationFrame(() => document.body.classList.add('ready'));
}

init();
