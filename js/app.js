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

/* ---- Chart cards ---- */
function buildCards() {
  el('chartGrid').innerHTML = CHART_DEFS.map((d) => `
    <article class="card reveal p-5" data-card="${d.id}">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h3 class="font-semibold" id="t-${d.id}"><span data-i18n="${d.titleKey}"></span> <span class="font-normal text-[var(--muted)]" id="${d.id}-sub"></span></h3>
          <p class="mb-3 text-sm text-[var(--muted)]" data-i18n="${d.descKey}"></p>
        </div>
        <div class="chart-tools flex shrink-0 gap-1">
          <button class="tool-btn" data-toggle="${d.id}" aria-pressed="false"><span data-i18n="tools.table">Table</span></button>
          <button class="tool-btn" data-csv="${d.id}" data-i18n-aria="tools.csvLabel">CSV</button>
          <button class="tool-btn" data-png="${d.id}" data-i18n-aria="tools.pngLabel">PNG</button>
        </div>
      </div>
      <div class="chart-box" data-box="${d.id}"><canvas id="${d.id}Chart" aria-labelledby="t-${d.id}"></canvas></div>
      <div class="table-view hidden" data-table="${d.id}"><div class="table-wrap"><table class="data" id="${d.id}Table"></table></div></div>
    </article>`).join('');

  el('chartGrid').addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.toggle) toggleTable(t.dataset.toggle, t);
    else if (t.dataset.csv) downloadCsv(t.dataset.csv);
    else if (t.dataset.png) downloadPng(t.dataset.png);
  });
}

function buildTable(id) {
  const { caption, headers, rows } = Charts.exportData(id);
  const table = el(`${id}Table`);
  if (!rows.length) {
    table.innerHTML = `<caption>${caption}</caption><tbody><tr><td>${i18n.t('tbl.empty')}</td></tr></tbody>`;
    return;
  }
  table.innerHTML =
    `<caption>${caption}</caption>` +
    `<thead><tr>${headers.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead>` +
    `<tbody>${rows.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${c}</th>` : `<td>${c}</td>`)).join('')}</tr>`).join('')}</tbody>`;
}

function toggleTable(id, btn) {
  const showTable = btn.getAttribute('aria-pressed') !== 'true';
  btn.setAttribute('aria-pressed', String(showTable));
  const span = btn.querySelector('span');
  const key = showTable ? 'tools.chart' : 'tools.table';
  span.setAttribute('data-i18n', key);
  span.textContent = i18n.t(key);
  document.querySelector(`[data-box="${id}"]`).classList.toggle('hidden', showTable);
  document.querySelector(`[data-table="${id}"]`).classList.toggle('hidden', !showTable);
  if (showTable) buildTable(id);
}

function refreshOpenTables() {
  document.querySelectorAll('[data-toggle][aria-pressed="true"]').forEach((b) => buildTable(b.dataset.toggle));
}

function triggerDownload(href, name) {
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function downloadCsv(id) {
  const { headers, rows } = Charts.exportData(id);
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  triggerDownload(url, `ecodatos-${id}-${Charts.entity}.csv`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadPng(id) {
  const chart = Charts.instances[id];
  if (chart) triggerDownload(chart.toBase64Image('image/png', 1), `ecodatos-${id}-${Charts.entity}.png`);
}

/* ---- KPIs with count-up ---- */
function countUp(node, target, { decimals = 1, suffix = '', sign = false } = {}) {
  const start = performance.now();
  const dur = 700;
  const render = (now) => {
    const p = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    let val = target * eased;
    if (Math.abs(val) < 0.05) val = 0;
    node.textContent = (sign && val > 0 ? '+' : '') + val.toFixed(decimals) + suffix;
    if (p < 1) requestAnimationFrame(render);
  };
  requestAnimationFrame(render);
}

function updateKpis(e, animate) {
  const d = DATA.shareByEntity[e];
  const i = lastIndexWithData(d.renewables);
  const share = d.renewables[i] ?? 0;
  const first = d.renewables.find((v) => v != null) ?? share;
  const growth = share - first;
  const valid = d.renewables.filter((v) => v != null);
  const peak = valid.length ? Math.max(...valid) : 0;
  const peakYear = d.years[d.renewables.indexOf(peak)];
  const sources = [['series.hydro', d.hydro[i] || 0], ['series.solar', d.solar[i] || 0], ['series.wind', d.wind[i] || 0]]
    .sort((a, b) => b[1] - a[1]);

  el('kpiShareYear').textContent = d.years[i] || '';
  el('kpiPeakYear').textContent = peakYear || '';
  el('kpiTop').textContent = i18n.t(sources[0][0]);
  el('kpiTopVal').textContent = `${sources[0][1].toFixed(1)}%`;

  if (animate) {
    countUp(el('kpiShare'), share, { suffix: '%' });
    countUp(el('kpiGrowth'), growth, { sign: true });
    countUp(el('kpiPeak'), peak, { suffix: '%' });
  } else {
    const g = Math.abs(growth) < 0.05 ? 0 : growth;
    el('kpiShare').textContent = share.toFixed(1) + '%';
    el('kpiGrowth').textContent = (g > 0 ? '+' : '') + g.toFixed(1);
    el('kpiPeak').textContent = peak.toFixed(1) + '%';
  }
}

/* ---- Loading skeletons ---- */
function showSkeletons() {
  document.querySelectorAll('.chart-box').forEach((box) => {
    if (box.classList.contains('hidden') || box.querySelector('.skeleton')) return;
    const s = document.createElement('div');
    s.className = 'skeleton';
    box.appendChild(s);
  });
}
function hideSkeletons() {
  document.querySelectorAll('.chart-box .skeleton').forEach((s) => s.remove());
}

/* ---- i18n + theme ---- */
function applyI18n() {
  document.documentElement.lang = i18n.lang;
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.getAttribute('data-i18n');
    if (node.hasAttribute('data-i18n-html')) node.innerHTML = i18n.t(key);
    else node.textContent = i18n.t(key);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((node) =>
    node.setAttribute('aria-label', i18n.t(node.getAttribute('data-i18n-aria'))));
  const sel = el('entitySelect');
  sel.innerHTML = DATA.entities
    .map((e) => `<option value="${e}"${e === Charts.entity ? ' selected' : ''}>${i18n.region(e)}</option>`)
    .join('');
  el('ovRegion').textContent = i18n.region(Charts.entity);
  el('langToggle').textContent = i18n.lang.toUpperCase();
  el('langToggle').setAttribute('aria-label', i18n.t('toggle.lang'));
  el('themeToggle').setAttribute('aria-label', i18n.t('toggle.theme'));
}

function setLang(lang) {
  i18n.lang = lang;
  localStorage.setItem(LS.lang, lang);
  applyI18n();
  Charts.renderAll();
  updateKpis(Charts.entity, false);
  refreshOpenTables();
}

function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem(LS.theme, t);
  Charts.renderAll();
}

function setEntity(e) {
  Charts.entity = e;
  el('ovRegion').textContent = i18n.region(e);
  updateKpis(e, true);
  showSkeletons();
  setTimeout(() => {
    Charts.renderAll();
    hideSkeletons();
    refreshOpenTables();
  }, 260);
}

/* ---- Scrollspy ---- */
function initScrollspy() {
  const links = document.querySelectorAll('[data-nav]');
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) links.forEach((a) => a.classList.toggle('active', a.dataset.nav === en.target.id));
      });
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  ['overview', 'dashboard', 'methodology'].forEach((id) => { const s = el(id); if (s) obs.observe(s); });
}

function init() {
  initTheme();
  initLang();
  buildCards();
  applyI18n();
  updateKpis('World', true);
  Charts.renderAll();
  initScrollspy();

  el('entitySelect').addEventListener('change', (e) => setEntity(e.target.value));
  el('langToggle').addEventListener('click', () => setLang(i18n.lang === 'en' ? 'es' : 'en'));
  el('themeToggle').addEventListener('click', () =>
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, select, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 't') setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    else if (e.key === 'l') setLang(i18n.lang === 'en' ? 'es' : 'en');
  });

  document.addEventListener('visibilitychange', () =>
    document.body.classList.toggle('bg-paused', document.hidden));

  requestAnimationFrame(() => document.body.classList.add('ready'));
}

init();
