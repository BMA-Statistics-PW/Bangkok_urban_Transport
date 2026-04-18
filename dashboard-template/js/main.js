// Main Dashboard Logic — Local CSV Data

class Dashboard {
  constructor(configPath = 'config/config.json') {
    this.config = null;
    this.activeDs = null;   // active dataset config object
    this.rawRows = [];
    this.dataset = [];
    this.years = [];
    this.systems = [];
    this.charts = [];
    this.init(configPath);
  }

  normalizeDigits(text) {
    const thaiDigits = '๐๑๒๓๔๕๖๗๘๙';
    return String(text).replace(/[๐-๙]/g, ch => String(thaiDigits.indexOf(ch)));
  }

  extractYear(value) {
    const normalized = this.normalizeDigits(value);
    const match = normalized.match(/(25\d{2})/);
    return match ? Number(match[1]) : NaN;
  }

  async init(configPath) {
    try {
      this.config = await this.loadConfig(configPath);
      await this.switchDataset(this.config.activeDataset || this.config.datasets[0].id);
    } catch (error) {
      console.error('Dashboard init failed:', error);
      this.showError(error.message);
    }
  }

  async switchDataset(datasetId) {
    try {
      const ds = this.config.datasets.find(d => d.id === datasetId) || this.config.datasets[0];
      this.activeDs = ds;

      const rawRows = await this.loadCSV(ds.dataPath);
      const transformed = this.transformReportRows(rawRows, ds.systemCol || 0);
      this.dataset = transformed.dataset;
      this.years = transformed.years;
      this.systems = transformed.systems;

      if (this.dataset.length === 0) throw new Error(`ไม่พบข้อมูลในชุดข้อมูล: ${ds.label}`);

      this.renderAll();
      this.renderDatasetSwitcher();
      console.log('Dataset loaded:', ds.id, { rows: this.dataset.length, years: this.years });
    } catch (error) {
      console.error('Dataset switch failed:', error);
      this.showError(error.message);
    }
  }

  renderDatasetSwitcher() {
    let switcher = document.getElementById('dataset-switcher');
    if (!switcher) {
      // Create switcher bar and insert before kpi-container
      switcher = document.createElement('div');
      switcher.id = 'dataset-switcher';
      switcher.style.cssText = 'display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;';
      const kpi = document.getElementById('kpi-container');
      if (kpi && kpi.parentNode) kpi.parentNode.insertBefore(switcher, kpi);
    }
    switcher.innerHTML = this.config.datasets.map(ds => {
      const active = ds.id === this.activeDs.id;
      return `<button onclick="window.__dashboard.switchDataset('${ds.id}')"
        style="padding:6px 14px;border-radius:20px;border:1px solid ${active ? '#3b82f6' : 'var(--border)'};
        background:${active ? '#3b82f6' : 'var(--surf)'};color:${active ? '#fff' : 'var(--text)'};
        cursor:pointer;font-family:inherit;font-size:0.85rem;">${ds.label}</button>`;
    }).join('');
  }

  async loadConfig(configPath) {
    const res = await fetch(configPath);
    if (!res.ok) throw new Error(`Cannot load config: ${configPath}`);
    return await res.json();
  }

  async loadCSV(dataPath) {
    const res = await fetch(dataPath);
    if (!res.ok) throw new Error(`Cannot load data: ${dataPath}`);
    const text = await res.text();
    return this.parseCSV(text);
  }

  parseCSV(csv) {
    const clean = csv.replace(/^\uFEFF/, '');
    const lines = clean.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const parseLine = (line) => {
      const out = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i += 1) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i += 1;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === ',' && !inQuotes) {
          out.push(cur);
          cur = '';
        } else {
          cur += ch;
        }
      }
      out.push(cur);
      return out.map(v => v.trim());
    };

    const headers = parseLine(lines[0]);
    return lines.slice(1).map(line => {
      const values = parseLine(line);
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = values[i] || '';
      });
      return obj;
    });
  }

  transformReportRows(rows, systemColIndex = 0) {
    if (!rows.length) return { dataset: [], years: [], systems: [] };

    const headers = Object.keys(rows[0]);
    if (headers.length < 3) return { dataset: [], years: [], systems: [] };

    const systemHeader = headers[systemColIndex] || headers[0];  // configurable column index
    const yearHeaders = headers.filter((h, i) => i !== systemColIndex && Number.isFinite(this.extractYear(h)));
    const years = yearHeaders
      .map(h => this.extractYear(h))
      .filter(n => Number.isFinite(n));

    const targetYear = Number(this.config?.targetYear);
    if (Number.isFinite(targetYear)) {
      years.push(targetYear);
    }

    // Summary/aggregate rows to exclude from main transport systems
    const SKIP_PATTERNS = ['รวม', 'ค่าเฉลี่ย', 'สัดส่วน', 'ปริมาณผู้เดินทาง', 'หมายเหตุ'];

    const dataset = [];
    rows.forEach(row => {
      const system = (row[systemHeader] || '').trim();
      if (!system) return;
      if (SKIP_PATTERNS.some(p => system.startsWith(p) || system.includes(p))) return;
      // Skip percentage rows
      const firstVal = Object.values(row).slice(1).find(v => v && v.trim());
      if (firstVal && firstVal.includes('%')) return;

      yearHeaders.forEach(yh => {
        const year = this.extractYear(yh);
        const value = this.parseNumber(row[yh]);
        if (!Number.isFinite(year) || !Number.isFinite(value) || value <= 0) return;
        dataset.push({ system, year, value });
      });
    });

    const systems = [...new Set(dataset.map(d => d.system))];
    return { dataset, years: [...new Set(years)].sort((a, b) => a - b), systems };
  }

  parseNumber(value) {
    if (typeof value === 'number') return value;
    if (value == null) return NaN;
    const normalized = String(value).replace(/,/g, '').replace(/\s+/g, '').trim();
    if (normalized === '' || normalized === '-') return NaN;
    const n = Number(normalized);
    return Number.isFinite(n) ? n : NaN;
  }

  renderAll() {
    this.renderKPI();
    this.renderTable();
    this.renderCharts();
    this.renderSources();
  }

  latestYear() {
    return this.years[this.years.length - 1];
  }

  getYearRows(year) {
    return this.dataset.filter(d => d.year === year);
  }

  sumByYear(year) {
    return this.getYearRows(year).reduce((sum, d) => sum + d.value, 0);
  }

  renderKPI() {
    const container = document.getElementById('kpi-container');
    if (!container) return;

    const latestDataYear = [...new Set(this.dataset.map(d => d.year))].sort((a, b) => a - b).pop();
    const latest = latestDataYear || this.latestYear();
    const prev = this.years[this.years.length - 2];
    const latestRows = this.getYearRows(latest).sort((a, b) => b.value - a.value).slice(0, 5);
    const targetYear = Number(this.config?.targetYear);
    const targetRows = Number.isFinite(targetYear) ? this.getYearRows(targetYear) : [];
    const readinessCard = Number.isFinite(targetYear)
      ? `
        <div class="kpi" style="border-left-color:${targetRows.length ? '#22c55e' : '#f59e0b'}">
          <div class="kpi-label">สถานะปี ${targetYear}</div>
          <div class="kpi-val" style="color:${targetRows.length ? '#22c55e' : '#f59e0b'}">${targetRows.length ? 'พร้อม' : 'รอข้อมูล'}</div>
          <div class="kpi-unit">${targetRows.length ? `${targetRows.length} ระบบ` : 'ยังไม่พบข้อมูลปีเป้าหมาย'}</div>
          <div class="kpi-delta ${targetRows.length ? 'up' : 'warn'}">${targetRows.length ? '● โหลดข้อมูลเรียบร้อย' : '● เพิ่มคอลัมน์/ข้อมูลปีใหม่ในชุดข้อมูลที่เลือก'}</div>
        </div>
      `
      : '';

    container.innerHTML = latestRows.map((row, idx) => {
      const prevValue = this.dataset.find(d => d.system === row.system && d.year === prev)?.value || 0;
      const delta = prevValue > 0 ? ((row.value - prevValue) / prevValue) * 100 : 0;
      const deltaClass = delta >= 0 ? 'up' : 'down';
      const color = ['#22c55e', '#3b82f6', '#f97316', '#ef4444', '#06b6d4'][idx % 5];

      return `
        <div class="kpi" style="border-left-color:${color}">
          <div class="kpi-label">${row.system}</div>
          <div class="kpi-val" style="color:${color}">${this.formatDisplayValue(row.value)}</div>
          <div class="kpi-unit">${this.activeDs?.dataUnit || '-'} ปี ${latest}</div>
          <div class="kpi-delta ${deltaClass}">${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta).toFixed(1)}% จากปี ${prev || '-'}</div>
        </div>
      `;
    }).join('') + readinessCard;
  }

  renderTable() {
    const table = document.getElementById('data-table');
    if (!table) return;

    const grouped = this.groupBySystem();
    const systems = Object.keys(grouped).sort((a, b) => {
      const av = grouped[a][this.latestYear()] || 0;
      const bv = grouped[b][this.latestYear()] || 0;
      return bv - av;
    });

    let html = '<thead><tr><th>ระบบ</th>';
    this.years.forEach(y => { html += `<th style="text-align:right">ปี ${y}</th>`; });
    html += '</tr></thead><tbody>';

    systems.forEach(system => {
      html += `<tr><td>${system}</td>`;
      this.years.forEach(y => {
        const value = grouped[system][y];
        html += `<td style="text-align:right">${Number.isFinite(value) ? this.formatNumber(value) : '-'}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody>';

    table.innerHTML = html;
  }

  renderCharts() {
    this.destroyCharts();
    if (typeof Chart === 'undefined') return;

    const latest = this.latestYear();
    const latestRows = this.getYearRows(latest).sort((a, b) => b.value - a.value);

    this.renderMainBar(latestRows, latest);
    this.renderDonut(latestRows, latest);
    this.renderTopSystemsTrend();
    this.renderYearTotals();
  }

  renderMainBar(latestRows, latest) {
    const canvas = document.getElementById('main-chart');
    if (!canvas) return;

    const top = latestRows.slice(0, 10);
    const chart = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: top.map(d => d.system),
        datasets: [{
          label: `ปี ${latest}`,
          data: top.map(d => d.value),
          backgroundColor: '#3b82f6cc',
          borderColor: '#3b82f6',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => `${this.formatDisplayValue(ctx.parsed.y)} ${this.activeDs?.dataUnit || ''}` } }
        },
        scales: {
          x: { ticks: { maxRotation: 40, minRotation: 30 } },
          y: { ticks: { callback: value => this.formatCompact(value) } }
        }
      }
    });
    this.charts.push(chart);
  }

  renderDonut(latestRows) {
    const canvas = document.getElementById('donut-chart');
    const legend = document.getElementById('donut-legend');
    if (!canvas || !legend) return;

    const top = latestRows.slice(0, 6);
    const others = latestRows.slice(6).reduce((sum, d) => sum + d.value, 0);
    const labels = top.map(d => d.system);
    const values = top.map(d => d.value);
    if (others > 0) {
      labels.push('อื่นๆ');
      values.push(others);
    }

    const colors = ['#22c55e', '#3b82f6', '#f97316', '#ef4444', '#06b6d4', '#a855f7', '#94a3b8'];
    const total = values.reduce((a, b) => a + b, 0);

    const chart = new Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: '#fff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.label}: ${(ctx.parsed / total * 100).toFixed(1)}%`
            }
          }
        }
      }
    });
    this.charts.push(chart);

    legend.innerHTML = labels.map((label, i) => {
      const pct = total > 0 ? (values[i] / total) * 100 : 0;
      return `<div class="leg"><div class="leg-dot" style="background:${colors[i]}"></div>${label}: ${pct.toFixed(1)}%</div>`;
    }).join('');
  }

  renderTopSystemsTrend() {
    const canvas = document.getElementById('chart-1');
    if (!canvas) return;

    const latest = this.latestYear();
    const topSystems = this.getYearRows(latest).sort((a, b) => b.value - a.value).slice(0, 5).map(d => d.system);
    const grouped = this.groupBySystem();
    const palette = ['#22c55e', '#3b82f6', '#f97316', '#ef4444', '#06b6d4'];

    const chart = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: this.years.map(y => `ปี ${y}`),
        datasets: topSystems.map((system, idx) => ({
          label: system,
          data: this.years.map(y => grouped[system][y] || null),
          borderColor: palette[idx % palette.length],
          backgroundColor: `${palette[idx % palette.length]}33`,
          tension: 0.3,
          pointRadius: 3,
          borderWidth: 2
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { ticks: { callback: value => this.formatCompact(value) } } }
      }
    });
    this.charts.push(chart);
  }

  renderYearTotals() {
    const canvas = document.getElementById('chart-2');
    if (!canvas) return;
    const totals = this.years.map(y => this.sumByYear(y));

    const chart = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: this.years.map(y => `ปี ${y}`),
        datasets: [{
          label: 'รวมทุกระบบ',
          data: totals,
          backgroundColor: '#22c55e99',
          borderColor: '#22c55e',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => `${this.formatDisplayValue(ctx.parsed.y)} ${this.activeDs?.dataUnit || ''}` } }
        },
        scales: { y: { ticks: { callback: value => this.formatCompact(value) } } }
      }
    });
    this.charts.push(chart);
  }

  renderSources() {
    const tbody = document.getElementById('sources-table');
    if (!tbody) return;
    const minYear = this.years[0] || '-';
    const maxYear = this.years[this.years.length - 1] || '-';
    const targetYear = Number(this.config?.targetYear);
    const targetNote = Number.isFinite(targetYear) ? ` · เตรียมปี ${targetYear}` : '';
    tbody.innerHTML = `
      <tr>
        <td>${this.activeDs?.label || 'ข้อมูลขนส่งสาธารณะ'}</td>
        <td>สำนักการจราจรและขนส่ง กรุงเทพมหานคร</td>
        <td>ปี ${minYear} - ปี ${maxYear}${targetNote}</td>
      </tr>
    `;
  }

  groupBySystem() {
    const grouped = {};
    this.dataset.forEach(item => {
      if (!grouped[item.system]) grouped[item.system] = {};
      grouped[item.system][item.year] = item.value;
    });
    return grouped;
  }

  destroyCharts() {
    this.charts.forEach(c => {
      if (c && typeof c.destroy === 'function') c.destroy();
    });
    this.charts = [];
  }

  // Returns true if active dataset values are already in millions
  isMillionUnit() {
    return (this.activeDs?.dataUnit || '').includes('ล้าน');
  }

  formatDisplayValue(value) {
    return this.isMillionUnit() ? this.formatMillions(value) : this.formatNumber(value);
  }

  formatNumber(value) {
    if (this.isMillionUnit()) {
      return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    }
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
  }

  formatCompact(value) {
    if (this.isMillionUnit()) {
      if (value >= 1000) return `${(value / 1000).toFixed(1)}พัน`;
      if (value >= 1)    return `${value.toFixed(0)}`;
      return value.toFixed(2);
    }
    if (value >= 1e8) return `${(value / 1e6).toFixed(0)}M`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
    return `${value}`;
  }

  formatMillions(value) {
    if (this.isMillionUnit()) {
      if (value >= 1000) return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
      return value % 1 === 0 ? value.toFixed(0) : value.toFixed(2);
    }
    // raw integers → convert to millions for KPI display
    const m = value / 1e6;
    return m >= 10 ? m.toFixed(1) : m.toFixed(2);
  }

  showError(message) {
    const container = document.getElementById('kpi-container');
    if (container) {
      container.innerHTML = `
        <div class="card" style="border-left:4px solid #ef4444;grid-column:1/-1">
          <div class="card-title">โหลดข้อมูลไม่สำเร็จ</div>
          <div style="color:#b91c1c">${message}</div>
        </div>
      `;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.__dashboard = new Dashboard();
});
