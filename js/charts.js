const COLORS = {
  hydro: '#3b82f6',
  solar: '#f59e0b',
  wind: '#14b8a6',
  accent: '#1f9d6b',
};
const GRID = 'rgba(13,27,23,0.08)';
Chart.defaults.font.family = 'Inter, sans-serif';
Chart.defaults.color = '#55635b';

const charts = {};
const el = (id) => document.getElementById(id);

function lastIndexWithData(arr) {
  for (let i = arr.length - 1; i >= 0; i--) if (arr[i] != null) return i;
  return -1;
}

function renderMix(entity) {
  const d = DATA.shareByEntity[entity];
  const i = lastIndexWithData(d.renewables);
  el('mixYear').textContent = i >= 0 ? `· ${d.years[i]}` : '';
  const values = [d.hydro[i] || 0, d.solar[i] || 0, d.wind[i] || 0];
  const other = Math.max(0, 100 - values.reduce((a, b) => a + b, 0));

  charts.mix?.destroy();
  charts.mix = new Chart(el('mixChart'), {
    type: 'doughnut',
    data: {
      labels: ['Hydro', 'Solar', 'Wind', 'Other sources'],
      datasets: [{
        data: [...values.map((v) => +v.toFixed(1)), +other.toFixed(1)],
        backgroundColor: [COLORS.hydro, COLORS.solar, COLORS.wind, '#d7ddd7'],
        borderWidth: 0,
      }],
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: '60%',
      plugins: { legend: { position: 'bottom' } } },
  });
}

function renderArea(entity) {
  const d = DATA.shareByEntity[entity];
  const series = [
    ['Hydro', d.hydro, COLORS.hydro],
    ['Solar', d.solar, COLORS.solar],
    ['Wind', d.wind, COLORS.wind],
  ];
  charts.area?.destroy();
  charts.area = new Chart(el('areaChart'), {
    type: 'line',
    data: {
      labels: d.years,
      datasets: series.map(([label, data, color]) => ({
        label, data, borderColor: color, backgroundColor: color + '33',
        fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2,
      })),
    },
    options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'bottom' } },
      scales: { y: { stacked: true, grid: { color: GRID }, ticks: { callback: (v) => v + '%' } }, x: { grid: { display: false } } } },
  });
}

function renderSolar(entity) {
  const d = DATA.solarCapacity[entity];
  charts.solar?.destroy();
  const box = el('solarChart').parentElement;
  let note = box.querySelector('.no-data');
  if (!d) {
    el('solarChart').style.display = 'none';
    if (!note) {
      note = document.createElement('p');
      note.className = 'no-data grid h-full place-items-center text-sm text-[#55635b]';
      note.textContent = 'No solar capacity data for this region.';
      box.appendChild(note);
    }
    return;
  }
  el('solarChart').style.display = '';
  note?.remove();
  charts.solar = new Chart(el('solarChart'), {
    type: 'line',
    data: {
      labels: d.years,
      datasets: [{ label: 'Solar PV (MW)', data: d.values, borderColor: COLORS.accent,
        backgroundColor: COLORS.accent + '22', fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2 }],
    },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { grid: { color: GRID }, beginAtZero: true }, x: { grid: { display: false } } } },
  });
}

function renderGeo() {
  const g = DATA.geoRanking;
  new Chart(el('geoChart'), {
    type: 'bar',
    data: {
      labels: g.countries,
      datasets: [{ label: `Capacity ${g.year} (MW)`, data: g.values, backgroundColor: COLORS.accent, borderRadius: 5 }],
    },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { grid: { color: GRID }, beginAtZero: true }, y: { grid: { display: false } } } },
  });
}

function update(entity) {
  renderMix(entity);
  renderArea(entity);
  renderSolar(entity);
}

function init() {
  const select = el('entitySelect');
  select.innerHTML = DATA.entities.map((e) => `<option${e === 'World' ? ' selected' : ''}>${e}</option>`).join('');
  select.addEventListener('change', (e) => update(e.target.value));

  const world = DATA.shareByEntity.World;
  el('kpiEntities').textContent = DATA.entities.length;
  el('kpiYears').textContent = `${world.years[0]}–${world.years.at(-1)}`;
  el('kpiGeo').textContent = DATA.geoRanking.values[0].toLocaleString();

  renderGeo();
  update('World');
}

init();
