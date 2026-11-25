const SERIES = { hydro: '#3b82f6', solar: '#f59e0b', wind: '#14b8a6' };
const THEME_COLORS = {
  light: { text: '#55635b', grid: 'rgba(13,27,23,0.08)', other: '#d7ddd7' },
  dark: { text: '#93a79c', grid: 'rgba(231,239,233,0.10)', other: '#2a3f36' },
};

const CHART_DEFS = [
  { id: 'mix', titleKey: 'chart.mix.title', descKey: 'chart.mix.desc' },
  { id: 'area', titleKey: 'chart.area.title', descKey: 'chart.area.desc' },
  { id: 'solar', titleKey: 'chart.solar.title', descKey: 'chart.solar.desc' },
  { id: 'geo', titleKey: 'chart.geo.title', descKey: 'chart.geo.desc' },
];

const el = (id) => document.getElementById(id);
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const theme = () => (document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

function lastIndexWithData(arr) {
  for (let i = arr.length - 1; i >= 0; i--) if (arr[i] != null) return i;
  return -1;
}

const Charts = {
  entity: 'World',
  cmpA: 'Colombia',
  cmpB: 'Germany',
  instances: {},

  // Countries (no aggregates) ranked by their latest renewable share.
  rankingData() {
    return DATA.entities
      .filter((e) => !AGGREGATES.includes(e))
      .map((e) => {
        const d = DATA.shareByEntity[e];
        const i = lastIndexWithData(d.renewables);
        return { entity: e, share: d.renewables[i] ?? 0, year: d.years[i] };
      })
      .sort((a, b) => b.share - a.share);
  },

  renderRank() {
    const c = THEME_COLORS[theme()];
    const accent = cssVar('--accent') || '#1f9d6b';
    const strong = cssVar('--accent-strong') || '#1a855b';
    const text = cssVar('--text') || '#0d1b17';
    const rows = this.rankingData();
    this.instances.rank?.destroy();
    this.instances.rank = new Chart(el('rankChart'), {
      type: 'bar',
      data: { labels: rows.map((r) => i18n.region(r.entity)),
        datasets: [{ label: i18n.t('kpi.share'), data: rows.map((r) => +r.share.toFixed(1)),
          backgroundColor: rows.map((r) => (r.entity === this.entity ? strong : accent)),
          borderColor: rows.map((r) => (r.entity === this.entity ? text : 'transparent')),
          borderWidth: rows.map((r) => (r.entity === this.entity ? 1.5 : 0)), borderRadius: 5 }] },
      options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.x}%` } } },
        scales: { x: { grid: { color: c.grid }, beginAtZero: true, ticks: { callback: (v) => v + '%' } }, y: { grid: { display: false } } } },
    });
  },

  renderCompare() {
    const c = THEME_COLORS[theme()];
    const colorA = cssVar('--accent-strong') || '#1a855b';
    const colorB = '#f59e0b';
    const da = DATA.shareByEntity[this.cmpA];
    const db = DATA.shareByEntity[this.cmpB];
    const labels = da.years.length >= db.years.length ? da.years : db.years;
    const align = (d) => labels.map((y) => { const k = d.years.indexOf(y); return k >= 0 ? d.renewables[k] : null; });
    this.instances.cmp?.destroy();
    this.instances.cmp = new Chart(el('cmpChart'), {
      type: 'line',
      data: { labels, datasets: [
        { label: i18n.region(this.cmpA), data: align(da), borderColor: colorA, backgroundColor: colorA + '22', tension: 0.3, pointRadius: 0, borderWidth: 2 },
        { label: i18n.region(this.cmpB), data: align(db), borderColor: colorB, backgroundColor: colorB + '22', tension: 0.3, pointRadius: 0, borderWidth: 2 },
      ] },
      options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1)}%` } } },
        scales: { y: { grid: { color: c.grid }, beginAtZero: true, ticks: { callback: (v) => v + '%' } }, x: { grid: { display: false } } } },
    });
  },

  renderMix() {
    const c = THEME_COLORS[theme()];
    const d = DATA.shareByEntity[this.entity];
    const i = lastIndexWithData(d.renewables);
    el('mix-sub').textContent = i >= 0 ? `· ${d.years[i]}` : '';
    const values = [d.hydro[i] || 0, d.solar[i] || 0, d.wind[i] || 0];
    const other = Math.max(0, 100 - values.reduce((a, b) => a + b, 0));
    this.instances.mix?.destroy();
    this.instances.mix = new Chart(el('mixChart'), {
      type: 'doughnut',
      data: {
        labels: [i18n.t('series.hydro'), i18n.t('series.solar'), i18n.t('series.wind'), i18n.t('series.other')],
        datasets: [{ data: [...values.map((v) => +v.toFixed(1)), +other.toFixed(1)],
          backgroundColor: [SERIES.hydro, SERIES.solar, SERIES.wind, c.other], borderWidth: 0, hoverOffset: 6 }],
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '60%',
        plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed}%` } } } },
    });
  },

  renderArea() {
    const c = THEME_COLORS[theme()];
    const d = DATA.shareByEntity[this.entity];
    el('area-sub').textContent = '';
    const series = [
      [i18n.t('series.hydro'), d.hydro, SERIES.hydro],
      [i18n.t('series.solar'), d.solar, SERIES.solar],
      [i18n.t('series.wind'), d.wind, SERIES.wind],
    ];
    this.instances.area?.destroy();
    this.instances.area = new Chart(el('areaChart'), {
      type: 'line',
      data: { labels: d.years, datasets: series.map(([label, data, color]) => ({
        label, data, borderColor: color, backgroundColor: color + '33', fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2 })) },
      options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1)}%` } } },
        scales: { y: { stacked: true, grid: { color: c.grid }, ticks: { callback: (v) => v + '%' } }, x: { grid: { display: false } } } },
    });
  },

  renderSolar() {
    const c = THEME_COLORS[theme()];
    const accent = cssVar('--accent') || '#1f9d6b';
    const d = DATA.solarCapacity[this.entity];
    el('solar-sub').textContent = '';
    this.instances.solar?.destroy();
    const box = el('solarChart').parentElement;
    let note = box.querySelector('.no-data');
    if (!d) {
      el('solarChart').style.display = 'none';
      if (!note) {
        note = document.createElement('p');
        note.className = 'no-data grid h-full place-items-center text-sm';
        note.style.color = 'var(--muted)';
        box.appendChild(note);
      }
      note.textContent = i18n.t('chart.noSolar');
      return;
    }
    el('solarChart').style.display = '';
    note?.remove();
    this.instances.solar = new Chart(el('solarChart'), {
      type: 'line',
      data: { labels: d.years, datasets: [{ label: i18n.t('series.solarPv'), data: d.values, borderColor: accent,
        backgroundColor: accent + '22', fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
        scales: { y: { grid: { color: c.grid }, beginAtZero: true }, x: { grid: { display: false } } } },
    });
  },

  renderGeo() {
    const c = THEME_COLORS[theme()];
    const accent = cssVar('--accent') || '#1f9d6b';
    const g = DATA.geoRanking;
    el('geo-sub').textContent = `· ${g.year}`;
    this.instances.geo?.destroy();
    this.instances.geo = new Chart(el('geoChart'), {
      type: 'bar',
      data: { labels: g.countries.map((n) => i18n.region(n)),
        datasets: [{ label: `${i18n.t('series.capacity')} (MW)`, data: g.values, backgroundColor: accent, borderRadius: 5 }] },
      options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
        scales: { x: { grid: { color: c.grid }, beginAtZero: true }, y: { grid: { display: false } } } },
    });
  },

  renderAll() {
    Chart.defaults.color = THEME_COLORS[theme()].text;
    Chart.defaults.font.family = 'Inter, sans-serif';
    this.renderMix();
    this.renderArea();
    this.renderSolar();
    this.renderGeo();
    this.renderRank();
    this.renderCompare();
  },

  setEntity(entity) {
    this.entity = entity;
    this.renderAll();
  },

  // Returns { caption, headers, rows } for CSV export and the table view.
  exportData(id) {
    const e = this.entity;
    const region = i18n.region(e);
    if (id === 'mix') {
      const d = DATA.shareByEntity[e];
      const i = lastIndexWithData(d.renewables);
      const other = Math.max(0, 100 - (d.hydro[i] || 0) - (d.solar[i] || 0) - (d.wind[i] || 0));
      return {
        caption: `${i18n.t('chart.mix.title')} — ${region} (${d.years[i]})`,
        headers: [i18n.t('tbl.source'), i18n.t('tbl.share')],
        rows: [
          [i18n.t('series.hydro'), (d.hydro[i] || 0).toFixed(1)],
          [i18n.t('series.solar'), (d.solar[i] || 0).toFixed(1)],
          [i18n.t('series.wind'), (d.wind[i] || 0).toFixed(1)],
          [i18n.t('series.other'), other.toFixed(1)],
        ],
      };
    }
    if (id === 'area') {
      const d = DATA.shareByEntity[e];
      return {
        caption: `${i18n.t('chart.area.title')} — ${region}`,
        headers: [i18n.t('tbl.year'), i18n.t('series.hydro'), i18n.t('series.solar'), i18n.t('series.wind')],
        rows: d.years.map((y, k) => [y, d.hydro[k]?.toFixed(1) ?? '', d.solar[k]?.toFixed(1) ?? '', d.wind[k]?.toFixed(1) ?? '']),
      };
    }
    if (id === 'solar') {
      const d = DATA.solarCapacity[e];
      return {
        caption: `${i18n.t('chart.solar.title')} — ${region}`,
        headers: [i18n.t('tbl.year'), i18n.t('tbl.capacity')],
        rows: d ? d.years.map((y, k) => [y, d.values[k]]) : [],
      };
    }
    if (id === 'rank') {
      const rows = this.rankingData();
      return {
        caption: i18n.t('ranking.title'),
        headers: [i18n.t('tbl.rank'), i18n.t('tbl.region'), i18n.t('tbl.share')],
        rows: rows.map((r, k) => [k + 1, i18n.region(r.entity), r.share.toFixed(1)]),
      };
    }
    const g = DATA.geoRanking;
    return {
      caption: `${i18n.t('chart.geo.title')} (${g.year})`,
      headers: [i18n.t('tbl.country'), i18n.t('tbl.capacity')],
      rows: g.countries.map((n, k) => [i18n.region(n), g.values[k]]),
    };
  },
};
