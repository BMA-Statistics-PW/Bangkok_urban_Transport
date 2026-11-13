/* ════════════════════════════════════════════════════════════════════
   shell.js — เปลือกแดชบอร์ด (sidebar · top bar · tabs · dark mode) + ส่วนหัว/KPI ที่คำนวณจากข้อมูล
   พฤติกรรมเหมือน dashboard-shell.js ของ BMA-travel-time-dashboard-TH
   (เกณฑ์อุปกรณ์เดียวกัน · ใช้ localStorage คีย์เดียวกัน: bma-theme, bma_sb)
   ต้องโหลดหลังสคริปต์ข้อมูลใน index.html (ใช้ DATA, FERRY, YEARS, MODAL_*, C, themeCharts)
   © Prapawadee_W.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };

  /* ───────── Icons (stroke, 24×24 — แบบเดียวกับ ico() ใน travel-time) ───────── */
  const ICON = {
    overview: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    ridership: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    modal: '<path d="M21 12A9 9 0 1112 3v9z"/><path d="M15 3.5A9 9 0 0120.5 9H15z"/>',
    annual: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    sources: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    train: '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M9 21l2-4M15 21l-2-4"/>',
    bus: '<rect x="4" y="3" width="16" height="14" rx="2"/><path d="M4 11h16M7 21v-4M17 21v-4"/>',
    plane: '<path d="M21 15l-8-4V5a1.5 1.5 0 00-3 0v6l-8 4v2l8-2v4l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-4l8 2z"/>',
    total: '<path d="M3 17l5-6 4 4 4-8 5 6"/>',
    share: '<path d="M21 12A9 9 0 1112 3v9z"/>'
  };
  const ico = (n, s) => '<svg class="ico" viewBox="0 0 24 24" width="' + (s || 22) + '" height="' + (s || 22) + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[n] + '</svg>';

  /* ───────── Tabs (WAI-ARIA Tabs) ───────── */
  const TABS = [
    { id: 'overview', label: 'ภาพรวม' },
    { id: 'ridership', label: 'ผู้โดยสารรายสาย' },
    { id: 'modal', label: 'สัดส่วนรูปแบบการเดินทาง' },
    { id: 'annual', label: 'วิเคราะห์รายปี' },
    { id: 'sources', label: 'แหล่งข้อมูลและข้อจำกัด' }
  ];
  function setupTabs() {
    const host = $('#sideTabs');
    if (!host) return;
    const list = document.createElement('div');
    list.className = 'tab-bar is-side';
    list.setAttribute('role', 'tablist');
    list.setAttribute('aria-orientation', 'vertical');
    list.setAttribute('aria-label', 'เลือกหน้าต่างเนื้อหา');
    const tabs = TABS.map((t) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tab-btn'; b.id = 'tab-' + t.id;
      b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', 'panel-' + t.id);
      b.setAttribute('aria-selected', 'false'); b.tabIndex = -1; b.dataset.panel = t.id;
      b.innerHTML = ico(t.id, 20) + '<span class="sb-label">' + t.label + '</span>';
      list.appendChild(b);
      return b;
    });
    host.appendChild(list);

    function activate(id, opts) {
      opts = opts || {};
      let idx = TABS.findIndex((t) => t.id === id);
      if (idx < 0) idx = 0;
      tabs.forEach((t, i) => {
        const on = i === idx;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const p = $('#panel-' + TABS[i].id);
        if (p) p.hidden = !on;
      });
      if (opts.focus) tabs[idx].focus();
      if (opts.hash !== false) { try { history.replaceState(null, '', '#panel-' + TABS[idx].id); } catch (e) { /* file:// */ } }
      const h = $('#tbTitle'); if (h) h.textContent = TABS[idx].label;
      document.dispatchEvent(new CustomEvent('panel:show', { detail: { id: TABS[idx].id } }));
      // Chart.js ในแผงที่เพิ่งแสดงต้องวัดขนาดใหม่
      if (window.Chart) setTimeout(() => Object.values(Chart.instances).forEach((c) => c.resize()), 30);
    }
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => activate(t.dataset.panel));
      t.addEventListener('keydown', (e) => {
        const k = e.key; let n = -1;
        if (k === 'ArrowDown' || k === 'ArrowRight') n = (i + 1) % tabs.length;
        else if (k === 'ArrowUp' || k === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        else if (k === 'Home') n = 0; else if (k === 'End') n = tabs.length - 1;
        if (n >= 0) { e.preventDefault(); activate(tabs[n].dataset.panel, { focus: true }); }
      });
    });
    const fromHash = () => (location.hash.match(/^#panel-(\w+)/) || [])[1];
    window.addEventListener('hashchange', () => { const h = fromHash(); if (h) activate(h, { hash: false }); });
    activate(fromHash() || 'overview', { hash: false });
  }

  /* ───────── Sidebar / drawer (เหมือน setupShell ของ travel-time) ───────── */
  function setupShell() {
    const shell = $('#appShell'), sb = $('#sidebar'), tgl = $('#sbToggle'), menu = $('#menuBtn'), back = $('#sbBackdrop');
    if (!shell || !sb) return;
    // Mobile ≤767 · Tablet 768–1199 · PC ≥1200 (ต้องตรงกับ dashboard-shell.css)
    const mq = window.matchMedia('(max-width: 767px)');
    const mqTab = window.matchMedia('(min-width: 768px) and (max-width: 1199px)');
    const device = () => mq.matches ? 'mobile' : (mqTab.matches ? 'tablet' : 'pc');
    function sync() {
      const dev = device();
      document.documentElement.setAttribute('data-device', dev);
      if (dev === 'tablet') shell.classList.add('sb-collapsed');
      else if (dev === 'pc') shell.classList.toggle('sb-collapsed', store.get('bma_sb') === '1');
      const mobile = mq.matches, open = shell.classList.contains('sb-open'), collapsed = shell.classList.contains('sb-collapsed');
      if (menu) menu.setAttribute('aria-expanded', String(mobile && open));
      if (tgl) {
        tgl.setAttribute('aria-expanded', String(mobile ? open : !collapsed));
        tgl.setAttribute('aria-label', mobile ? 'ปิดเมนู' : (collapsed ? 'ขยายเมนู' : 'ย่อเมนู'));
      }
      if (back) back.hidden = !(mobile && open);
      $$('.tab-btn', sb).forEach((b) => { if (collapsed && !mobile) b.title = b.textContent.trim(); else b.removeAttribute('title'); });
      if (mobile && !open) sb.setAttribute('inert', ''); else sb.removeAttribute('inert');
      if (window.Chart) setTimeout(() => Object.values(Chart.instances).forEach((c) => c.resize()), 230);
    }
    const closeMobile = () => { shell.classList.remove('sb-open'); sync(); };
    if (store.get('bma_sb') === '1') shell.classList.add('sb-collapsed');
    if (tgl) tgl.addEventListener('click', () => {
      if (mq.matches) { closeMobile(); if (menu) menu.focus(); return; }
      shell.classList.toggle('sb-collapsed');
      store.set('bma_sb', shell.classList.contains('sb-collapsed') ? '1' : '0'); sync();
    });
    if (menu) menu.addEventListener('click', () => { shell.classList.add('sb-open'); sync(); const a = $('.tab-btn[aria-selected="true"]', sb) || $('.tab-btn', sb); if (a) a.focus(); });
    if (back) back.addEventListener('click', closeMobile);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && shell.classList.contains('sb-open')) { closeMobile(); if (menu) menu.focus(); } });
    document.addEventListener('click', (e) => { if (mq.matches && e.target.closest('.tab-btn')) closeMobile(); });
    [mq, mqTab].forEach((m) => (m.addEventListener ? m.addEventListener('change', sync) : m.addListener(sync)));
    sync();
  }

  /* ───────── Dark mode (คีย์ bma-theme เดียวกับ travel-time) ───────── */
  function setupTheme() {
    const btn = $('#themeToggle');
    const apply = (dark) => {
      if (dark) document.documentElement.setAttribute('data-theme', 'dark'); else document.documentElement.removeAttribute('data-theme');
      if (btn) btn.setAttribute('aria-pressed', String(dark));
      if (window.themeCharts) window.themeCharts();
    };
    if (btn) btn.addEventListener('click', () => {
      const dark = document.documentElement.getAttribute('data-theme') !== 'dark';
      store.set('bma-theme', dark ? 'dark' : 'light'); apply(dark);
    });
    apply(document.documentElement.getAttribute('data-theme') === 'dark');
  }

  /* ───────── Hero + KPI (คำนวณจาก DATA ไม่ใช้ตัวเลขที่พิมพ์ไว้) ───────── */
  const sum = (keys, i) => keys.reduce((s, k) => s + (DATA[k][i] || 0), 0);
  const f1 = (v) => v.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const pct = (cur, prev) => (prev ? (cur - prev) / prev * 100 : null);
  function badge(p) {
    if (p === null || !isFinite(p)) return '<span class="badge neutral">—</span>';
    const up = p >= 0;
    return '<span class="badge ' + (up ? 'up' : 'down') + '">' + (up ? '▲ +' : '▼ −') + Math.abs(p).toFixed(1) + '%</span>';
  }
  const RAIL = ['btsG', 'btsGold', 'mrtB', 'mrtP', 'mrtY', 'mrtPk', 'arl', 'srtN', 'srtW'];
  const ALL = Object.keys(DATA);

  function renderHome() {
    const host = $('#dash-home');
    if (!host) return;
    const li = YEARS.length - 1, pi = li - 1, yr = YEARS[li], pyr = YEARS[pi];
    const total = (i) => sum(ALL, i) + (FERRY[i] || 0);
    const tCur = total(li), tPrev = total(pi);
    const rCur = sum(RAIL, li), rPrev = sum(RAIL, pi);
    const mi = MODAL_PT.length - 1;

    const tile = (icon, label, val, unit, sub) =>
      '<li class="hb-tile"><div class="hb-tile-h"><span class="hb-ico">' + ico(icon, 18) + '</span>' + label + '</div>' +
      '<div class="hb-tile-v">' + val + ' <span class="hb-unit">' + unit + '</span></div><div class="hb-tile-s">' + sub + '</div></li>';
    const sgn = (p) => (p >= 0 ? '+' : '−') + Math.abs(p).toFixed(1) + '%';
    const hero =
      '<section class="hero-banner" aria-labelledby="heroTitle"><div class="hb-top"><div>' +
      '<div class="hb-line"><h2 class="hb-title" id="heroTitle">สถิติผู้โดยสารระบบขนส่งสาธารณะ กรุงเทพมหานคร</h2>' +
      '<span class="hb-chip">ปี 2556–' + yr + '</span></div>' +
      '<p class="hb-sub">ข้อมูล ณ 16 เมษายน 2569 · หน่วย: ล้านเที่ยวคน/ปี · ที่มา: สจส. กทม. รฟม. รฟท. กรมเจ้าท่า</p></div></div>' +
      '<ul class="hb-tiles">' +
      tile('total', 'ผู้โดยสารรวมทุกระบบ ' + yr, f1(tCur), 'ล้านเที่ยวคน', sgn(pct(tCur, tPrev)) + ' จากปี ' + pyr + ' (' + f1(tPrev) + ')') +
      tile('train', 'ระบบราง (BTS · MRT · ARL · SRT)', f1(rCur), 'ล้านเที่ยวคน', sgn(pct(rCur, rPrev)) + ' จากปี ' + pyr + ' (' + f1(rPrev) + ')') +
      tile('bus', 'รถโดยสาร ขสมก.', f1(DATA.bmta[li]), 'ล้านเที่ยวคน', sgn(pct(DATA.bmta[li], DATA.bmta[pi])) + ' จากปี ' + pyr + ' (' + f1(DATA.bmta[pi]) + ')') +
      tile('share', 'สัดส่วนผู้ใช้ขนส่งสาธารณะ ปี ' + MODAL_YEARS[mi], MODAL_PT[mi].toFixed(2), '%', 'ปี ' + MODAL_YEARS[mi - 1] + ' = ' + MODAL_PT[mi - 1].toFixed(2) + '% (ปรับ methodology) · สนข.') +
      '</ul></section>';

    const k = (name, color, icon, cur, prev) =>
      '<article class="kpi" style="--lc:' + color + '"><div class="kpi-top"><span class="kpi-ico">' + ico(icon, 24) + '</span>' + badge(pct(cur, prev)) + '</div>' +
      '<div><span class="kpi-v">' + f1(cur) + '</span> <span class="kpi-u">ล้านเที่ยวคน</span></div>' +
      '<h3 class="kpi-l">' + name + '</h3><p class="kpi-s">ปี ' + pyr + ': <b>' + f1(prev) + '</b> ล้านเที่ยวคน</p><div class="kpi-bar2" aria-hidden="true"></div></article>';
    const srt = (i) => DATA.srtN[i] + DATA.srtW[i];
    const kpis =
      '<section aria-label="ตัวชี้วัดสำคัญ ปี ' + yr + '"><h2 class="sec">ตัวชี้วัดสำคัญ ปี ' + yr + ' (ล่าสุด)<span class="sec-badge">ข้อมูล สจส.</span></h2>' +
      '<div class="kpi-grid kpi5" style="margin-top:16px">' +
      k('BTS สายสีเขียว', C.btsG, 'train', DATA.btsG[li], DATA.btsG[pi]) +
      k('MRT สายสีน้ำเงิน', C.mrtB, 'train', DATA.mrtB[li], DATA.mrtB[pi]) +
      k('รถโดยสาร ขสมก.', C.bmta, 'bus', DATA.bmta[li], DATA.bmta[pi]) +
      k('SRT สายสีแดง (รวม)', C.srtN, 'train', srt(li), srt(pi)) +
      k('Airport Rail Link', C.arl, 'plane', DATA.arl[li], DATA.arl[pi]) +
      '</div></section>';
    host.innerHTML = hero + kpis;
  }

  function init() {
    setupTabs();
    setupShell();
    setupTheme();
    try { renderHome(); } catch (e) { console.error('[urban shell]', e); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
