const SERIES = { hydro: '#3b82f6', solar: '#f59e0b', wind: '#14b8a6' };
const THEME_COLORS = {
  light: { text: '#55635b', grid: 'rgba(13,27,23,0.08)', other: '#d7ddd7' },
  dark: { text: '#93a79c', grid: 'rgba(231,239,233,0.10)', other: '#2a3f36' },
};

const el = (id) => document.getElementById(id);
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const theme = () => (document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

function lastIndexWithData(arr) {
  for (let i = arr.length - 1; i >= 0; i--) if (arr[i] != null) return i;
  return -1;
}

const Charts = {
  entity: 'World',
  instances: {},

  renderMix() {
    const c = THEME_COLORS[theme()];
    const d = DATA.shareByEntity[this.entity];
    const i = lastIndexWithData(d.renewables);
    el('mixYear').textContent = i >= 0 ? `· ${d.years[i]}` : '';
    const values = [d.hydro[i] || 0, d.solar[i] || 0, d.wind[i] || 0];
    const other = Math.max(0, 100 - values.reduce((a, b) => a + b, 0));
    this.instances.mix?.destroy();
    this.instances.mix = new Chart(el('mixChart'), {
      type: 'doughnut',
      data: {
        labels: [i18n.t('series.hydro'), i18n.t('series.solar'), i18n.t('series.wind'), i18n.t('series.other')],
        datasets: [{
          data: [...values.map((v) => +v.toFixed(1)), +other.toFixed(1)],
          backgroundColor: [SERIES.hydro, SERIES.solar, SERIES.wind, c.other],
          borderWidth: 0, hoverOffset: 6,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '60%',
        plugins: {
          legend: { position: 'bottom' },
          tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed}%` } },
        },
      },
    });
  },

  renderArea() {
    const c = THEME_COLORS[theme()];
    const d = DATA.shareByEntity[this.entity];
    const series = [
      [i18n.t('series.hydro'), d.hydro, SERIES.hydro],
      [i18n.t('series.solar'), d.solar, SERIES.solar],
      [i18n.t('series.wind'), d.wind, SERIES.wind],
    ];
    this.instances.area?.destroy();
    this.instances.area = new Chart(el('areaChart'), {
      type: 'line',
      data: {
        labels: d.years,
        datasets: series.map(([label, data, color]) => ({
          label, data, borderColor: color, backgroundColor: color + '33',
          fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2,
        })),
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'bottom' },
          tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1)}%` } },
        },
        scales: {
          y: { stacked: true, grid: { color: c.grid }, ticks: { callback: (v) => v + '%' } },
          x: { grid: { display: false } },
        },
      },
    });
  },

  renderSolar() {
    const c = THEME_COLORS[theme()];
    const accent = cssVar('--accent') || '#1f9d6b';
    const d = DATA.solarCapacity[this.entity];
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
      data: {
        labels: d.years,
        datasets: [{
          label: i18n.t('series.solarPv'), data: d.values, borderColor: accent,
          backgroundColor: accent + '22', fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { grid: { color: c.grid }, beginAtZero: true }, x: { grid: { display: false } } },
      },
    });
  },

  renderGeo() {
    const c = THEME_COLORS[theme()];
    const accent = cssVar('--accent') || '#1f9d6b';
    const g = DATA.geoRanking;
    this.instances.geo?.destroy();
    this.instances.geo = new Chart(el('geoChart'), {
      type: 'bar',
      data: {
        labels: g.countries.map((name) => i18n.region(name)),
        datasets: [{ label: `${i18n.t('series.capacity')} ${g.year} (MW)`, data: g.values, backgroundColor: accent, borderRadius: 5 }],
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { color: c.grid }, beginAtZero: true }, y: { grid: { display: false } } },
      },
    });
  },

  renderAll() {
    Chart.defaults.color = THEME_COLORS[theme()].text;
    Chart.defaults.font.family = 'Inter, sans-serif';
    this.renderMix();
    this.renderArea();
    this.renderSolar();
    this.renderGeo();
  },

  setEntity(entity) {
    this.entity = entity;
    this.renderAll();
  },
};
