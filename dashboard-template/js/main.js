// Main Dashboard Logic — Local CSV Data

class Dashboard {
  constructor(configPath = 'config/config.json') {
    this.config = null;
    this.activeDs = null;   // active dataset config object
    this.metadata = null;
    this.datasetStore = {};
    this.modalSeries = null;
    this.sanityReport = [];
    this.businessRules = {
      covidYears: [2563, 2564],
      preCovidYear: 2563,
      ferryOnlyYears: [2556, 2557, 2558, 2559],
      brtNoDataYears: [2567]
    };
    this.rawRows = [];
    this.dataset = [];
    this.years = [];
    this.systems = [];
    this.annualSelectedYear = null;
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
      this.metadata = await this.loadMetadata(this.config.metadataPath);
      await this.preloadDatasets();
      this.runSanityChecks();
      this.renderStaticContent();
      await this.switchDataset(this.config.activeDataset || this.config.datasets[0].id);
    } catch (error) {
      console.error('Dashboard init failed:', error);
      this.showError(error.message);
    }
  }

  async preloadDatasets() {
    this.datasetStore = {};
    for (const ds of (this.config.datasets || [])) {
      const rows = await this.loadCSV(ds.dataPath);
      const transformed = this.transformReportRows(rows, ds.systemCol || 0);
      const normalizedDataset = this.normalizeDatasetValues(transformed.dataset, ds.valueScale);
      this.datasetStore[ds.id] = {
        rawRows: rows,
        dataset: normalizedDataset,
        years: transformed.years,
        systems: transformed.systems,
        valueScale: this.getValueScale(ds.valueScale)
      };

      if (ds.id === 'share') {
        this.modalSeries = this.extractModalSeries(rows, ds.systemCol || 0);
      }
    }
  }

  getValueScale(scale) {
    const n = Number(scale);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }

  normalizeDatasetValues(dataset, scale) {
    const factor = this.getValueScale(scale);
    if (factor === 1) return dataset;
    return dataset.map(item => ({ ...item, value: item.value * factor }));
  }

  async switchDataset(datasetId) {
    try {
      const ds = this.config.datasets.find(d => d.id === datasetId) || this.config.datasets[0];
      this.activeDs = ds;
      const cached = this.datasetStore[ds.id];
      if (!cached) throw new Error(`ไม่พบข้อมูลชุด: ${ds.id}`);

      this.rawRows = cached.rawRows;
      this.dataset = cached.dataset;
      this.years = cached.years;
      this.systems = cached.systems;

      if (this.dataset.length === 0) throw new Error(`ไม่พบข้อมูลในชุดข้อมูล: ${ds.label}`);

      this.renderDatasetMeta();
      this.renderAll();
      this.renderDatasetSwitcher();
      this.renderSanityChecks();
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

  formatThaiDate(date = new Date()) {
    const thaiMonths = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    return `${date.getDate()} ${thaiMonths[date.getMonth()]} ${date.getFullYear() + 543}`;
  }

  formatThaiDateTime(dateInput) {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(date.getTime())) return '-';
    const thaiMonths = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${date.getDate()} ${thaiMonths[date.getMonth()]} ${date.getFullYear() + 543} ${hours}:${minutes} น.`;
  }

  setTextContent(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || '';
  }

  renderStaticContent() {
    document.title = `${this.config.dashboardTitle} — ${this.config.projectName}`;
    this.setTextContent('hdr-badge', this.config.organization);
    this.setTextContent('hdr-title', this.config.dashboardTitle);
    this.setTextContent('hdr-topic', this.config.dashboardTopic);
    this.setTextContent('hdr-sub', this.config.dashboardSubtitle);
    this.setTextContent('footer-org', this.config.organization);
    this.setTextContent('footer-owner', `© ${this.config.preparedBy}`);
    this.setTextContent('footer-role', this.config.preparedByRole);
    this.setTextContent('meta-date', '-');
    this.setTextContent('footer-updated', `อัปเดตล่าสุด: ${this.metadata?.generatedAt ? this.formatThaiDateTime(this.metadata.generatedAt) : '-'}`);
  }

  renderDatasetMeta() {
    this.setTextContent('meta-unit', this.activeDs?.dataUnit || '-');
    const datasetUpdatedAt = this.metadata?.datasets?.[this.activeDs?.id]?.updatedAt;
    this.setTextContent('meta-date', datasetUpdatedAt ? this.formatThaiDateTime(datasetUpdatedAt) : '-');
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

  async loadMetadata(metadataPath) {
    if (!metadataPath) return null;
    try {
      const res = await fetch(metadataPath);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
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

  extractModalSeries(rows, systemColIndex = 0) {
    if (!rows?.length) return null;
    const headers = Object.keys(rows[0]);
    const systemHeader = headers[systemColIndex] || headers[0];
    const yearHeaders = headers.filter((h, i) => i !== systemColIndex && Number.isFinite(this.extractYear(h)));

    const findRow = (keyword) => rows.find(r => String(r[systemHeader] || '').includes(keyword));
    const ptRow = findRow('สัดส่วนสาธารณะ');
    const pvRow = findRow('สัดส่วนระบบรถส่วนบุคคล');
    const ptVolRow = findRow('รวมจำนวนเที่ยวสาธารณะ');

    if (!ptRow || !pvRow || !ptVolRow) return null;

    const years = [];
    const pt = [];
    const pv = [];
    const ptVol = [];

    yearHeaders.forEach(h => {
      const y = this.extractYear(h);
      const ptVal = this.parseNumber(String(ptRow[h] || '').replace('%', ''));
      const pvVal = this.parseNumber(String(pvRow[h] || '').replace('%', ''));
      const volVal = this.parseNumber(ptVolRow[h]);
      if (!Number.isFinite(y)) return;
      years.push(y);
      pt.push(Number.isFinite(ptVal) ? ptVal : null);
      pv.push(Number.isFinite(pvVal) ? pvVal : null);
      ptVol.push(Number.isFinite(volVal) ? volVal : null);
    });

    return { years, pt, pv, ptVol };
  }

  runSanityChecks() {
    const checks = [];
    for (const ds of (this.config.datasets || [])) {
      const cached = this.datasetStore[ds.id];
      if (!cached) {
        checks.push({ level: 'error', msg: `Dataset ${ds.id} ไม่ถูก preload` });
        continue;
      }

      if (!cached.years.length) {
        checks.push({ level: 'error', msg: `Dataset ${ds.id}: ไม่พบปีข้อมูล` });
      } else {
        checks.push({ level: 'ok', msg: `Dataset ${ds.id}: ปีข้อมูล ${cached.years[0]}-${cached.years[cached.years.length - 1]}` });
      }

      const invalid = cached.dataset.filter(d => !Number.isFinite(d.value) || d.value < 0).length;
      if (invalid > 0) checks.push({ level: 'warn', msg: `Dataset ${ds.id}: พบค่าไม่ถูกต้อง ${invalid} รายการ` });
      else checks.push({ level: 'ok', msg: `Dataset ${ds.id}: ไม่พบค่าติดลบหรือ NaN` });

      if (ds.id === 'report') {
        const hasBrtNoData = !cached.dataset.some(d => String(d.system).includes('BRT') && d.year === 2567);
        checks.push({
          level: hasBrtNoData ? 'ok' : 'warn',
          msg: hasBrtNoData ? 'Rule check: BRT ปี 2567 ไม่มีข้อมูล (ผ่าน)' : 'Rule check: BRT ปี 2567 มีข้อมูล ควรตรวจสอบ'
        });
      }
    }

    if (!this.modalSeries) {
      checks.push({ level: 'warn', msg: 'ไม่พบข้อมูลสัดส่วนสาธารณะ (modal series)' });
    } else {
      checks.push({ level: 'ok', msg: `Modal series พร้อมใช้งาน ${this.modalSeries.years[0]}-${this.modalSeries.years[this.modalSeries.years.length - 1]}` });
    }

    this.sanityReport = checks;
  }

  renderSanityChecks() {
    const el = document.getElementById('sanity-checks');
    if (!el) return;
    if (!this.sanityReport.length) {
      el.innerHTML = 'ยังไม่มีผลการตรวจสอบ';
      return;
    }

    const color = { ok: '#15803d', warn: '#b45309', error: '#b91c1c' };
    el.innerHTML = this.sanityReport.map(item =>
      `<div style="margin-bottom:6px"><span style="color:${color[item.level] || '#334155'}">●</span> ${item.msg}</div>`
    ).join('');
  }

  renderAll() {
    this.renderKPI();
    this.renderOverviewNote();
    this.renderOverviewModeDisplay();
    this.renderTable();
    this.renderOverviewCharts();
    this.renderRidershipCharts();
    this.renderModalCharts();
    this.renderAnnualPanel();
    this.renderSources();
  }

  latestYear() {
    return this.years[this.years.length - 1];
  }

  getOverviewContext() {
    const reportCfg = (this.config?.datasets || []).find(d => d.id === 'report');
    const report = this.datasetStore?.report;
    if (report?.dataset?.length) {
      return {
        dataset: report.dataset,
        years: report.years,
        unit: reportCfg?.dataUnit || this.activeDs?.dataUnit || '-'
      };
    }
    return {
      dataset: this.dataset,
      years: this.years,
      unit: this.activeDs?.dataUnit || '-'
    };
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

    const overview = this.getOverviewContext();
    const overviewDataset = overview.dataset;
    const overviewYears = overview.years;

    const latestDataYear = [...new Set(overviewDataset.map(d => d.year))].sort((a, b) => a - b).pop();
    const latest = latestDataYear || overviewYears[overviewYears.length - 1];
    const prev = overviewYears[overviewYears.length - 2];
    const latestRows = overviewDataset.filter(d => d.year === latest).sort((a, b) => b.value - a.value).slice(0, 5);
    const targetYear = Number(this.config?.targetYear);
    const targetRows = Number.isFinite(targetYear) ? overviewDataset.filter(d => d.year === targetYear) : [];
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
      const prevValue = overviewDataset.find(d => d.system === row.system && d.year === prev)?.value || 0;
      const delta = prevValue > 0 ? ((row.value - prevValue) / prevValue) * 100 : 0;
      const deltaClass = delta >= 0 ? 'up' : 'down';
      const color = ['#22c55e', '#3b82f6', '#f97316', '#ef4444', '#06b6d4'][idx % 5];

      return `
        <div class="kpi" style="border-left-color:${color}">
          <div class="kpi-label">${row.system}</div>
          <div class="kpi-val" style="color:${color}">${this.formatDisplayValue(row.value)}</div>
          <div class="kpi-unit">${overview.unit || '-'} ปี ${latest}</div>
          <div class="kpi-delta ${deltaClass}">${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta).toFixed(1)}% จากปี ${prev || '-'}</div>
        </div>
      `;
    }).join('') + readinessCard;

    const sec = document.getElementById('overview-sec');
    if (sec) {
      sec.innerHTML = `ตัวชี้วัดสำคัญ — ปี ${latest} (ล่าสุด) <span class="sec-badge">● ข้อมูล สจส.</span>`;
    }
  }

  renderOverviewNote() {
    const el = document.getElementById('overview-note');
    if (!el) return;
    el.innerHTML = '⚠️ <strong>ปี 2563-2564: เหตุการณ์ COVID-19</strong> ข้อมูลผู้โดยสารลดลงผิดปกติ ไม่ควรเทียบตรงกับปีปกติ &nbsp;|&nbsp; ⚠️ <strong>ปี 2556-2559:</strong> ข้อมูลเรือเป็นเฉพาะเรือข้ามฟาก';
  }

  renderOverviewModeDisplay() {
    const tabs = document.getElementById('modeYrTabs');
    const display = document.getElementById('modeDisplay');
    if (!tabs || !display) return;
    if (!this.modalSeries || !this.modalSeries.years?.length) {
      tabs.innerHTML = '';
      display.innerHTML = '<div class="note">ไม่พบข้อมูลสัดส่วนรูปแบบการเดินทาง</div>';
      return;
    }

    if (!Number.isFinite(this.modeSelectedYear) || !this.modalSeries.years.includes(this.modeSelectedYear)) {
      this.modeSelectedYear = this.modalSeries.years[this.modalSeries.years.length - 1];
    }

    tabs.innerHTML = [...this.modalSeries.years].reverse().map(y =>
      `<button class="yr-btn ${y === this.modeSelectedYear ? 'active' : ''}" onclick="window.__dashboard.setModeYear(${y})">${y}</button>`
    ).join('');

    const idx = this.modalSeries.years.indexOf(this.modeSelectedYear);
    const pt = this.modalSeries.pt[idx];
    const pv = this.modalSeries.pv[idx];
    const vol = this.modalSeries.ptVol[idx];

    display.innerHTML = `
      <div class="g2" style="margin-bottom:0">
        <div class="card" style="padding:16px">
          <div class="card-title" style="margin-bottom:10px">ปี ${this.modeSelectedYear}</div>
          <div class="kpi-row" style="grid-template-columns:1fr 1fr;margin-bottom:0">
            <div class="kpi" style="border-left-color:#3b82f6"><div class="kpi-label">สาธารณะ</div><div class="kpi-val" style="color:#3b82f6">${Number.isFinite(pt) ? pt.toFixed(2) : '-'}</div><div class="kpi-unit">%</div></div>
            <div class="kpi" style="border-left-color:#ef4444"><div class="kpi-label">ส่วนบุคคล</div><div class="kpi-val" style="color:#ef4444">${Number.isFinite(pv) ? pv.toFixed(2) : '-'}</div><div class="kpi-unit">%</div></div>
          </div>
        </div>
        <div class="card" style="padding:16px">
          <div class="card-title" style="margin-bottom:10px">ปริมาณเดินทางสาธารณะ</div>
          <div class="kpi" style="border-left-color:#22c55e">
            <div class="kpi-label">รวมจำนวนเที่ยวสาธารณะ</div>
            <div class="kpi-val" style="color:#22c55e">${Number.isFinite(vol) ? this.formatDisplayValue(vol) : '-'}</div>
            <div class="kpi-unit">ล้านคน-เที่ยว/ปี</div>
          </div>
        </div>
      </div>
    `;
  }

  setModeYear(year) {
    this.modeSelectedYear = year;
    this.renderOverviewModeDisplay();
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

  renderOverviewCharts() {
    this.destroyCharts();
    if (typeof Chart === 'undefined') return;

    const overview = this.getOverviewContext();
    const latest = overview.years[overview.years.length - 1];
    const latestRows = overview.dataset.filter(d => d.year === latest).sort((a, b) => b.value - a.value);

    this.renderMainBar(latestRows, latest, overview.unit);
    this.renderDonut(latestRows, latest);
    this.renderTopSystemsTrend(overview);
    this.renderYearTotals(overview);
  }

  renderMainBar(latestRows, latest, unitLabel = this.activeDs?.dataUnit || '') {
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
          tooltip: { callbacks: { label: ctx => `${this.formatDisplayValue(ctx.parsed.y)} ${unitLabel}` } }
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

  renderTopSystemsTrend(overview = this.getOverviewContext()) {
    const canvas = document.getElementById('overview-chart-1');
    if (!canvas) return;

    const latest = overview.years[overview.years.length - 1];
    const latestRows = overview.dataset.filter(d => d.year === latest);
    const topSystems = latestRows.sort((a, b) => b.value - a.value).slice(0, 5).map(d => d.system);
    const grouped = this.groupBySystemDataset(overview.dataset);
    const palette = ['#22c55e', '#3b82f6', '#f97316', '#ef4444', '#06b6d4'];

    const chart = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: overview.years.map(y => `ปี ${y}`),
        datasets: topSystems.map((system, idx) => ({
          label: system,
          data: overview.years.map(y => grouped[system][y] || null),
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

  renderYearTotals(overview = this.getOverviewContext()) {
    const canvas = document.getElementById('overview-chart-2');
    if (!canvas) return;
    const grouped = this.groupBySystemDataset(overview.dataset);
    const totals = overview.years.map(y => {
      const systems = Object.keys(grouped);
      return systems.reduce((sum, s) => sum + (grouped[s][y] || 0), 0);
    });

    const chart = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: overview.years.map(y => `ปี ${y}`),
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
          tooltip: { callbacks: { label: ctx => `${this.formatDisplayValue(ctx.parsed.y)} ${overview.unit || ''}` } }
        },
        scales: { y: { ticks: { callback: value => this.formatCompact(value) } } }
      }
    });
    this.charts.push(chart);
  }

  renderRidershipCharts() {
    if (typeof Chart === 'undefined') return;

    const railCanvas = document.getElementById('ridership-rail');
    const busCanvas = document.getElementById('ridership-bus');
    if (!railCanvas || !busCanvas) return;

    const grouped = this.groupBySystem();
    const systems = Object.keys(grouped);
    const railSystems = systems.filter(s => /(BTS|MRT|ARL|SRT|รถไฟฟ้า|รถไฟ)/i.test(s)).slice(0, 6);
    const busSystems = systems.filter(s => /(ขสมก|BRT|เรือ|รถประจำทาง)/i.test(s)).slice(0, 4);
    const palette = ['#22c55e', '#3b82f6', '#f97316', '#ef4444', '#06b6d4', '#a855f7'];

    const railChart = new Chart(railCanvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: this.years.map(y => `ปี ${y}`),
        datasets: railSystems.map((system, idx) => ({
          label: system,
          data: this.years.map(y => grouped[system][y] || null),
          borderColor: palette[idx % palette.length],
          tension: 0.28,
          pointRadius: 2,
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
    this.charts.push(railChart);

    const busChart = new Chart(busCanvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: this.years.map(y => `ปี ${y}`),
        datasets: busSystems.map((system, idx) => ({
          label: system,
          data: this.years.map(y => grouped[system][y] || null),
          borderColor: palette[(idx + 2) % palette.length],
          tension: 0.28,
          pointRadius: 2,
          borderWidth: 2,
          borderDash: /BRT|เรือ/i.test(system) ? [4, 3] : []
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { ticks: { callback: value => this.formatCompact(value) } } }
      }
    });
    this.charts.push(busChart);

    const note = document.getElementById('ridership-note');
    if (note) {
      note.innerHTML = [
        'หมายเหตุ: ปี 2563-2564 ได้รับผลกระทบจาก COVID-19',
        'BRT ปี 2567 ไม่มีข้อมูล (ตามชุดข้อมูลหลัก)',
        'ปี 2556-2559 เรือโดยสารเป็นข้อมูลเฉพาะเรือข้ามฟาก'
      ].join(' · ');
    }
  }

  renderModalCharts() {
    if (typeof Chart === 'undefined') return;
    const shareCanvas = document.getElementById('modal-share');
    const volCanvas = document.getElementById('modal-volume');
    const note = document.getElementById('modal-note');
    if (!shareCanvas || !volCanvas) return;

    if (!this.modalSeries) {
      if (note) {
        note.style.display = 'block';
        note.textContent = 'ไม่พบข้อมูลสัดส่วนสาธารณะในชุดข้อมูล share';
      }
      return;
    }

    if (note) {
      note.style.display = 'block';
      note.textContent = 'ที่มา: สนข. จากแบบจำลอง BTDM ปีฐาน 2565';
    }

    const labels = this.modalSeries.years.map(y => `ปี ${y}`);
    const shareChart = new Chart(shareCanvas.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'สัดส่วนสาธารณะ (%)', data: this.modalSeries.pt, borderColor: '#3b82f6', tension: 0.3, borderWidth: 2 },
          { label: 'สัดส่วนรถส่วนบุคคล (%)', data: this.modalSeries.pv, borderColor: '#ef4444', tension: 0.3, borderWidth: 2 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { min: 0, max: 100, ticks: { callback: v => `${v}%` } } }
      }
    });
    this.charts.push(shareChart);

    const volChart = new Chart(volCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'รวมจำนวนเที่ยวสาธารณะ',
          data: this.modalSeries.ptVol,
          backgroundColor: '#22c55e99',
          borderColor: '#22c55e',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { ticks: { callback: value => this.formatCompact(value) } } }
      }
    });
    this.charts.push(volChart);
  }

  renderAnnualPanel() {
    const tabs = document.getElementById('annual-year-tabs');
    const detail = document.getElementById('annual-detail');
    if (!tabs || !detail) return;

    const annual = this.getAnnualContext();
    const annualYears = annual.years;
    const annualDataset = annual.dataset;
    const annualUnit = annual.unit;

    if (!this.annualSelectedYear || !annualYears.includes(this.annualSelectedYear)) {
      this.annualSelectedYear = annualYears.includes(2568)
        ? 2568
        : annualYears[annualYears.length - 1];
    }

    tabs.innerHTML = [...annualYears].reverse().map(y =>
      `<button class="yr-btn ${y === this.annualSelectedYear ? 'active' : ''}" onclick="window.__dashboard.setAnnualYear(${y})">ปี ${y}</button>`
    ).join('');

    const rows = annualDataset
      .filter(d => d.year === this.annualSelectedYear)
      .sort((a, b) => b.value - a.value);
    const total = rows.reduce((sum, r) => sum + r.value, 0);
    const maxValue = Math.max(...rows.map(r => r.value), 1);
    const note = this.getBusinessNoteForYear(this.annualSelectedYear);

    detail.innerHTML = `
      <div class="card">
        <div class="card-title">📊 ปี ${this.annualSelectedYear} — รายละเอียดรายระบบ</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px">
          ${rows.map(r => `
            <div style="background:#f8fafc;border:1px solid var(--border);border-left:4px solid #3b82f6;border-radius:10px;padding:14px">
              <div style="font-size:14px;color:#64748b;margin-bottom:6px;font-weight:600">${this.formatSystemLabel(r.system, this.annualSelectedYear)}</div>
              <div style="font-family:var(--mono);font-size:24px;font-weight:700;color:#1d4ed8">${this.formatDisplayValue(r.value)}</div>
              <div style="font-size:14px;color:var(--muted)">${annualUnit || '-'} · ${total > 0 ? (r.value / total * 100).toFixed(1) : '0.0'}%</div>
              <div class="pbar" style="margin-top:8px"><div class="pbar-fill" style="width:${(r.value / maxValue * 100).toFixed(0)}%;background:#1d4ed8"></div></div>
            </div>
          `).join('')}
        </div>
        <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border);display:flex;justify-content:space-between">
          <span style="color:var(--dim)">รวมทุกระบบ (ข้อมูลที่มี)</span>
          <span style="font-family:var(--mono);font-weight:700;color:#15803d">${this.formatDisplayValue(total)} ${annualUnit || ''}</span>
        </div>
        ${note ? `<div class="note" style="margin-top:14px">${note}</div>` : ''}
      </div>
    `;
  }

  getAnnualContext() {
    const reportCfg = (this.config?.datasets || []).find(d => d.id === 'report');
    const report = this.datasetStore?.report;
    if (report?.dataset?.length) {
      return {
        dataset: report.dataset,
        years: report.years,
        unit: reportCfg?.dataUnit || this.activeDs?.dataUnit || '-'
      };
    }

    return {
      dataset: this.dataset,
      years: this.years,
      unit: this.activeDs?.dataUnit || '-'
    };
  }

  setAnnualYear(year) {
    this.annualSelectedYear = year;
    this.renderAnnualPanel();
  }

  getBusinessNoteForYear(year) {
    const notes = [];
    if (this.businessRules.ferryOnlyYears.includes(year)) {
      notes.push('ข้อมูลเรือโดยสารปีนี้เป็นเฉพาะเรือข้ามฟาก');
    }
    if (this.businessRules.covidYears.includes(year)) {
      notes.push('ปีนี้ได้รับผลกระทบจาก COVID-19 ไม่ควรเทียบตรงกับปีปกติ');
    }
    if (this.businessRules.brtNoDataYears.includes(year)) {
      notes.push('BRT ปีนี้ไม่มีข้อมูลตามชุดหลัก');
    }
    return notes.join(' · ');
  }

  formatSystemLabel(system, year) {
    if (/เรือ/.test(system) && this.businessRules.ferryOnlyYears.includes(year)) {
      return 'เรือโดยสาร*';
    }
    return system;
  }

  renderSources() {
    const tbody = document.getElementById('sources-table');
    if (!tbody) return;
    const minYear = this.years[0] || '-';
    const maxYear = this.years[this.years.length - 1] || '-';
    const targetYear = Number(this.config?.targetYear);
    const targetNote = Number.isFinite(targetYear) ? ` · เตรียมปี ${targetYear}` : '';
    const updatedAt = this.metadata?.datasets?.[this.activeDs?.id]?.updatedAt;
    tbody.innerHTML = `
      <tr>
        <td>${this.activeDs?.sourceName || this.activeDs?.label || 'ข้อมูลขนส่งสาธารณะ'}</td>
        <td>สำนักการจราจรและขนส่ง กรุงเทพมหานคร</td>
        <td>ปี ${minYear} - ปี ${maxYear}${targetNote}${updatedAt ? ` · อัปเดต ${this.formatThaiDateTime(updatedAt)}` : ''}</td>
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

  groupBySystemDataset(dataset) {
    const grouped = {};
    dataset.forEach(item => {
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
