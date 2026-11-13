/* ════════════════════════════════════════════════════════════════════
   i18n.js — สลับภาษา ไทย / English (ปุ่ม ไทย | EN ที่ top bar)
   • ข้อความต้นฉบับเป็นภาษาไทย → แปลด้วยพจนานุกรม (GLOSSARY) + กฎรูปแบบ (ปี พ.ศ., วันที่)
   • ครอบคลุมข้อความที่ JS สร้างทีหลังด้วย (MutationObserver) · กราฟ (ชื่อชุดข้อมูล/แกน) · aria-label/title
   • ภาษาเริ่มต้น: ?lang=en|th → localStorage 'bma-dashboard-lang' (คีย์เดียวกับ travel-time) → ไทย
   • โหมด EN: แปลงปี พ.ศ. → ค.ศ. (พ.ศ. 2569 = ค.ศ. 2026) ทั้งข้อความ กราฟ และปุ่มเลือกปี
   © Prapawadee_W.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const KEY = 'bma-dashboard-lang';
  const THAI = /[฀-๿]/;

  /* ── 1) ข้อความเต็ม (ต้องตรงทั้งข้อความ) ── */
  const EXACT = {
    'ภาพรวม': 'Overview', 'ผู้โดยสารรายสาย': 'Ridership by Line', 'สัดส่วนรูปแบบการเดินทาง': 'Travel Mode Share',
    'วิเคราะห์รายปี': 'Annual Analysis', 'แหล่งข้อมูลและข้อจำกัด': 'Sources & Limitations',
    'ระบบ': 'System', 'ไฟล์': 'File', 'ที่มา': 'Source', 'หน่วยงาน': 'Agency', 'ปีที่มีข้อมูล': 'Years available',
    'รถไฟ': 'Intercity train', 'รถตู้': 'Vans', 'รถประจำทาง': 'Buses', 'เรือ': 'Boats', 'เที่ยวคน': 'passenger-trips',
    'ล.': 'M', 'ไทย': 'ไทย', 'สัดส่วนการเดินทาง': 'Travel mode share', 'ข้อมูลทางการ': 'Official data',
    'ข้อมูล สจส.': 'TTD data', 'ผู้จัดทำ': 'Author', 'ย่อเมนู': 'Collapse menu', 'ขยายเมนู': 'Expand menu',
    'ปิดเมนู': 'Close menu', 'เปิดเมนู': 'Open menu', 'เมนูหลัก': 'Main menu', 'เมนูหน้าต่างเนื้อหา': 'Content menu',
    'เลือกหน้าต่างเนื้อหา': 'Select a content panel', 'สลับโหมด': 'Toggle theme', 'สลับโหมดมืด/สว่าง': 'Toggle dark/light mode',
    'ข้ามไปยังเนื้อหาหลัก': 'Skip to main content'
  };

  /* ── 2) พจนานุกรมวลี (แทนที่แบบ substring · ยาวก่อน) ── */
  const G = [
    // ประโยค/หมายเหตุยาว
    ['สถิติผู้โดยสารระบบขนส่งสาธารณะ กรุงเทพมหานคร', 'Bangkok Public Transport Ridership Statistics'],
    ['กลุ่มงานสถิติและวิจัย · กองนโยบายและแผนงาน · สำนักการจราจรและขนส่ง · กทม.', 'Statistics and Research Group · Policy and Planning Division · Traffic and Transportation Department · BMA'],
    ['กลุ่มงานสถิติและวิจัย สจส.', 'Statistics & Research Group, TTD'],
    ['ข้อมูล: สถิติผู้โดยสารระบบขนส่งสาธารณะ สจส. และสัดส่วนการเดินทาง สนข. (BTDM)', 'Data: public transport ridership statistics (TTD) and travel mode share (OTP, BTDM)'],
    ['อัปเดตล่าสุด:', 'Last updated:'],
    ['— การแพร่ระบาดของโรคติดเชื้อไวรัสโคโรนา 2019 (COVID-19) ส่งผลให้ผู้โดยสารลดลงในทุกระบบขนส่งสาธารณะ โดยเฉพาะ', '— The COVID-19 pandemic reduced ridership across all public transport systems, especially'],
    ['ที่มีมาตรการล็อกดาวน์ ส่งผลให้ตัวเลขต่ำกว่าปกติ ไม่ควรนำมาเปรียบเทียบกับปีอื่น |', 'which had lockdown measures; figures are unusually low and should not be compared with other years |'],
    ['— การระบาดของโรคติดเชื้อไวรัสโคโรนา 2019 มาตรการล็อกดาวน์ส่งผลให้ตัวเลขต่ำกว่าปกติ ไม่ควรนำมาเปรียบเทียบกับปีอื่น', '— The COVID-19 pandemic and lockdown measures left figures below normal; do not compare with other years'],
    ['ข้อมูลเรือโดยสาร รวม 5 ประเภท (40.72 ล้านเที่ยว)', 'Passenger boat data covers all 5 types (40.72 million trips)'],
    ['ได้รับผลกระทบจาก COVID-19 — ตัวเลขต่ำกว่าปกติอย่างมีนัยสำคัญ', 'affected by COVID-19 — figures significantly below normal'],
    ['ผลกระทบ COVID-19 ทำให้ตัวเลขต่ำกว่าปกติ ไม่ควรเปรียบเทียบกับปีอื่น', 'COVID-19 impact: figures below normal, do not compare with other years'],
    ['ได้รับผลกระทบ COVID-19 ปลายปี', 'COVID-19 impact late in the year'],
    ['เหตุการณ์ COVID-19', 'COVID-19 event'],
    ['BRT ปี 2567 มีข้อมูลเฉพาะ 2 เดือน (ปรับเปลี่ยนระบบ) ไม่ควรเทียบรายปี', 'BRT BE 2567 has only 2 months of data (system changeover); do not compare year-on-year'],
    ['เรือ 2568 (5 ประเภท)', 'Boats 2568 (5 types)'],
    ['BRT ปี 2567 มีข้อมูลเฉพาะ 2 เดือน เนื่องจากปรับเปลี่ยนระบบการให้บริการ ม.ค.–ต.ค. 2567 จึงไม่ควรเทียบรายปี', 'BRT BE 2567 has only 2 months of data because the service system was changed (Jan–Oct 2567); do not compare year-on-year'],
    ['(2567 เฉพาะ 2 เดือน)', '(2567: 2 months only)'],
    ['หมายเหตุ: "—" = ยังไม่เปิดให้บริการ · N/A = ไม่มีข้อมูล', 'Note: "—" = not yet in service · N/A = no data'],
    ['หน่วยต่างกัน: ไฟล์ผู้โดยสาร =', 'Different units: ridership file ='],
    ['· ไฟล์สัดส่วน =', '· mode-share file ='],
    ['(ปรับด้วย trip rate)', '(adjusted by trip rate)'],
    ['MRT เหลือง/ชมพู เริ่มปี 2567 (เปิดให้บริการปี 2566 ปลายปี)', 'MRT Yellow/Pink lines start in BE 2567 (opened late in BE 2566)'],
    ['เรือโดยสาร ปี 2560–2568: รวม 5 ประเภท · ปี 2556–2559: เฉพาะเรือข้ามฟาก', 'Passenger boats BE 2560–2568: all 5 types · BE 2556–2559: cross-river ferries only'],
    ['ปี 2563–2564: ผลกระทบ COVID-19 ทำให้ตัวเลขต่ำกว่าปกติ ไม่ควรเปรียบเทียบกับปีอื่น', 'BE 2563–2564: COVID-19 impact left figures below normal; do not compare with other years'],
    ['ไม่รวม: รถตู้โดยสาร รถไฟระหว่างเมือง สองแถว มอเตอร์ไซค์รับจ้าง', 'Excludes: passenger vans, intercity trains, songthaews, motorcycle taxis'],
    ['ข้อมูลปีปฏิทิน 1 ม.ค. – 31 ธ.ค.', 'Calendar-year data, 1 Jan – 31 Dec'],
    ['สนข. ใช้แบบจำลอง BTDM (Bangkok Travel Demand Model) ปีฐาน 2565 จากโครงการสำรวจการเดินทางในเขตกรุงเทพฯ และปริมณฑล', 'OTP uses the BTDM (Bangkok Travel Demand Model), base year 2565, from the travel survey project in Bangkok and vicinity'],
    ['Trip Rate ปี 2566 = 1.49 เที่ยว/คน/วัน · ปี 2567: รถไฟฟ้า 1.15 / ขนส่งอื่น 1.38', 'Trip rate BE 2566 = 1.49 trips/person/day · BE 2567: rail 1.15 / other modes 1.38'],
    ['สัดส่วนปี 2567 (11.7%) ต่ำกว่าปี 2566 เนื่องจากปรับ methodology การคำนวณ ไม่ใช่ผู้โดยสารลดลงจริง', 'The BE 2567 share (11.7%) is lower than BE 2566 because the calculation methodology was adjusted, not because ridership actually fell'],
    ['Chart และข้อมูลรายเดือน 11 sheets', 'Chart and monthly data, 11 sheets'],
    ['สถิติผู้โดยสารระบบขนส่งสาธารณะ', 'Public transport ridership statistics'],
    // หัวข้อ/การ์ด
    ['จำนวนผู้โดยสารรายปี เปรียบเทียบทุกระบบ', 'Annual ridership, all systems compared'],
    ['สัดส่วนผู้ใช้ระบบขนส่งสาธารณะ และ รถส่วนบุคคล', 'Public transport vs private vehicle share'],
    ['สัดส่วนผู้ใช้ระบบขนส่งสาธารณะ', 'Public transport share'],
    ['สัดส่วนผู้ใช้ขนส่งสาธารณะ', 'Public transport share'],
    ['สัดส่วนรูปแบบการเดินทาง กรุงเทพฯ และปริมณฑล', 'Travel Mode Share — Bangkok and vicinity'],
    ['สัดส่วนผู้โดยสาร', 'Ridership share'],
    ['รถไฟฟ้า BTS, MRT, ARL, SRT — แนวโน้มรายปี', 'BTS, MRT, ARL, SRT rail — annual trend'],
    ['รถโดยสาร ขสมก. & เรือโดยสาร — แนวโน้มรายปี', 'BMTA buses & passenger boats — annual trend'],
    ['ตารางผู้โดยสารรายสาย รายปี', 'Ridership by line — annual table'],
    ['ผู้โดยสาร — รายปี', 'Ridership — annual'],
    ['วิเคราะห์รายปี — เลือกปีเพื่อดูรายละเอียด', 'Annual analysis — select a year for details'],
    ['ผู้โดยสารรายระบบ', 'Ridership by system'],
    ['ปริมาณการเดินทางสาธารณะ', 'Public transport travel volume'],
    ['รายละเอียดปี 2566', 'Details for BE 2566'],
    ['รายละเอียดปี 2567', 'Details for BE 2567'],
    ['หมายเหตุ Methodology', 'Methodology notes'],
    ['ข้อจำกัดของข้อมูล', 'Data limitations'],
    ['ไฟล์ข้อมูลที่ใช้', 'Data files used'],
    ['แหล่งข้อมูลรายระบบ', 'Sources by system'],
    ['ตัวชี้วัดสำคัญ', 'Key indicators'], ['(ล่าสุด)', '(latest)'],
    ['ผู้โดยสารรวมทุกระบบ', 'Total ridership, all systems'],
    ['ระบบราง (BTS · MRT · ARL · SRT)', 'Rail systems (BTS · MRT · ARL · SRT)'],
    ['รถโดยสาร ขสมก.', 'BMTA buses'],
    ['รวมทุกระบบ (ข้อมูลที่มี)', 'Total, all systems (available data)'],
    ['รวมทั้งสิ้น', 'Grand total'],
    ['ปีที่แสดงข้อมูล', 'Year shown'], ['● ข้อมูลล่าสุด', '● Latest data'],
    ['ข้อสังเกต:', 'Note:'],
    ['ปรับ methodology', 'methodology adjusted'],
    ['(ปรับ methodology)', '(methodology adjusted)'],
    ['จากแบบจำลอง BTDM ปีฐาน 2565', 'from the BTDM model, base year 2565'],
    ['แบบจำลอง BTDM', 'BTDM model'],
    ['ข้อมูล ณ', 'Data as of'], ['หน่วย:', 'Unit:'], ['ที่มา:', 'Source:'],
    // หน่วย
    ['ล้านเที่ยวคน/ปี', 'million trips/yr'], ['ล้านคน-เที่ยว/ปี', 'million person-trips/yr'],
    ['ล้านเที่ยวคน', 'million trips'], ['ล้านคน-เที่ยว', 'million person-trips'], ['ล้านเที่ยว', 'million trips'],
    ['ของรวม', 'of total'],
    // ระบบ/สาย
    ['MRT สายสีน้ำเงิน', 'MRT Blue Line'], ['MRT สายสีม่วง', 'MRT Purple Line'], ['MRT สายสีเหลือง', 'MRT Yellow Line'], ['MRT สายสีชมพู', 'MRT Pink Line'],
    ['BTS สายสีเขียว', 'BTS Green Line'], ['BTS สายสีทอง', 'BTS Gold Line'], ['SRT สายสีแดง', 'SRT Red Line'],
    ['SRT สายเหนือ (Dark Red)', 'SRT Northern Line (Dark Red)'], ['SRT สายตะวันตก (Light Red)', 'SRT Western Line (Light Red)'],
    ['MRT น้ำเงิน', 'MRT Blue'], ['MRT ม่วง', 'MRT Purple'], ['MRT เหลือง', 'MRT Yellow'], ['MRT ชมพู', 'MRT Pink'],
    ['BTS สีเขียว', 'BTS Green'], ['BTS สีทอง', 'BTS Gold'], ['MRT สีน้ำเงิน', 'MRT Blue'], ['MRT สีม่วง', 'MRT Purple'],
    ['MRT สีเหลือง', 'MRT Yellow'], ['MRT สีชมพู', 'MRT Pink'], ['SRT สีแดง', 'SRT Red'], ['SRT เหนือ', 'SRT North'],
    ['SRT (รวม)', 'SRT (total)'], ['(รวม)', '(total)'],
    ['ขสมก. (รถประจำทาง)', 'BMTA (buses)'], ['ขสมก. / กรมการขนส่งทางบก', 'BMTA / Dept. of Land Transport'],
    ['ขสมก./กรมขนส่ง', 'BMTA/DLT'], ['กทม./กรมการขนส่งทางราง', 'BMA/Dept. of Rail Transport'],
    ['กรมการขนส่งทางราง', 'Dept. of Rail Transport'], ['กรมการขนส่งทางบก', 'Dept. of Land Transport'], ['กรมเจ้าท่า', 'Marine Dept.'],
    ['เรือโดยสาร กทม.', 'BMA passenger boats'], ['เรือโดยสาร', 'Passenger boats'], ['เรือข้ามฟาก', 'Cross-river ferry'],
    ['รถส่วนบุคคล', 'Private vehicles'], ['ขนส่งสาธารณะ', 'Public transport'],
    ['รฟฟท.', 'SRTET'], ['รฟท.', 'SRT'], ['รฟม.', 'MRTA'], ['ขสมก.', 'BMTA'], ['สจส.', 'TTD'], ['สนข.', 'OTP'], ['กทม.', 'BMA'],
    ['กรุงเทพมหานคร', 'Bangkok'], ['กรุงเทพฯ', 'Bangkok'], ['ปริมณฑล', 'vicinity'], ['ปีฐาน', 'base year'],
    ['รถโดยสาร', 'Bus']
  ].map(([a, b]) => [a.replace(/\s+/g, ' '), b]).sort((x, y) => y[0].length - x[0].length);

  const MONTH_FULL = { 'มกราคม': 'January', 'กุมภาพันธ์': 'February', 'มีนาคม': 'March', 'เมษายน': 'April', 'พฤษภาคม': 'May', 'มิถุนายน': 'June', 'กรกฎาคม': 'July', 'สิงหาคม': 'August', 'กันยายน': 'September', 'ตุลาคม': 'October', 'พฤศจิกายน': 'November', 'ธันวาคม': 'December' };
  const MONTH_ABBR = { 'ม.ค.': 'Jan', 'ก.พ.': 'Feb', 'มี.ค.': 'Mar', 'เม.ย.': 'Apr', 'พ.ค.': 'May', 'มิ.ย.': 'Jun', 'ก.ค.': 'Jul', 'ส.ค.': 'Aug', 'ก.ย.': 'Sep', 'ต.ค.': 'Oct', 'พ.ย.': 'Nov', 'ธ.ค.': 'Dec' };
  const reFull = new RegExp('(\\d{1,2}) (' + Object.keys(MONTH_FULL).join('|') + ') (\\d{4})', 'g');
  const reAbbr = new RegExp('(\\d{1,2}) (' + Object.keys(MONTH_ABBR).map((s) => s.replace(/\./g, '\\.')).join('|') + ') (\\d{4})', 'g');
  const reMonthOnly = new RegExp('(' + Object.keys(MONTH_ABBR).map((s) => s.replace(/\./g, '\\.')).join('|') + ')', 'g');

  // พ.ศ. → ค.ศ. (ลบ 543) · ไม่แตะตัวเลขข้อมูลที่มีทศนิยม/คอมมา
  const toCE = (t) => t.replace(/\bBE (25\d{2})/g, '$1')
    .replace(/(^|[^\d.,])(25\d{2})(?!\d|[.,]\d)/g, (m, p, y) => p + String(+y - 543));

  function trText(raw) {
    const m = raw.match(/^(\s*)([\s\S]*?)(\s*)$/);
    let core = m[2].replace(/\s+/g, ' ');
    if (!core || !THAI.test(core)) return raw;
    let out;
    if (Object.prototype.hasOwnProperty.call(EXACT, core)) out = EXACT[core];
    else {
      out = core;
      for (const [th, en] of G) if (out.indexOf(th) >= 0) out = out.split(th).join(en);
      out = out.replace(reFull, (_, d, mo, y) => d + ' ' + MONTH_FULL[mo] + ' ' + y)
        .replace(reAbbr, (_, d, mo, y) => d + ' ' + MONTH_ABBR[mo] + ' ' + y)
        .replace(reMonthOnly, (x) => MONTH_ABBR[x])
        .replace(/จากปี (\d{4})/g, 'vs BE $1')
        .replace(/ปี พ\.ศ\. (\d{4})/g, 'BE $1').replace(/พ\.ศ\. (\d{4})/g, 'BE $1').replace(/ปี (\d{4})/g, 'BE $1')
        .replace(/ปี(\d{4})/g, 'BE $1').replace(/ปี/g, 'year');
      out = toCE(out);
    }
    return m[1] + out + m[3];
  }
  const state = { lang: 'th' };
  const orig = new WeakMap();   // text node → ไทยเดิม
  const wrote = new WeakMap();  // text node → อังกฤษที่เขียนล่าสุด
  const attrOrig = new WeakMap(); // element → {attr: ไทยเดิม}
  const ATTRS = ['aria-label', 'title', 'placeholder'];
  const skip = (n) => { const e = n.nodeType === 1 ? n : n.parentElement; return !e || e.closest('[data-no-i18n],script,style'); };

  function doText(n) {
    if (skip(n)) return;
    const v = n.nodeValue;
    if (wrote.has(n) && wrote.get(n) === v) return;       // เรากำหนดเอง
    if (!THAI.test(v)) {   // ปุ่มเลือกปี (ตัวเลขล้วน)
      if (n.parentElement && ((/^\s*25\d{2}\s*$/.test(v) && n.parentElement.closest('.yr-btn')) || (/^[\sA-Za-z,]*25\d{2}(?:\s*[–,-]\s*25\d{2})*\s*$/.test(v) && n.parentElement.closest('td')))) { orig.set(n, v); const t = toCE(v); wrote.set(n, t); n.nodeValue = t; }
      return;
    }
    orig.set(n, v);
    const t = trText(v);
    wrote.set(n, t);
    if (t !== v) n.nodeValue = t;
  }
  function doAttrs(e) {
    if (skip(e)) return;
    for (const a of ATTRS) {
      const v = e.getAttribute(a);
      if (!v) continue;
      let o = attrOrig.get(e);
      if (o && o[a] !== undefined && e.getAttribute(a) === (o['_' + a])) continue;
      if (!THAI.test(v)) continue;
      if (!o) { o = {}; attrOrig.set(e, o); }
      o[a] = v; const t = trText(v); o['_' + a] = t;
      e.setAttribute(a, t);
    }
  }
  function walk(root) {
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1) return;
    if (skip(root)) return;
    doAttrs(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) doText(n); else doAttrs(n); }
  }
  function restore(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      if (n.nodeType === 3) { if (orig.has(n) && wrote.get(n) === n.nodeValue) { n.nodeValue = orig.get(n); wrote.delete(n); } }
      else { const o = attrOrig.get(n); if (o) { ATTRS.forEach((a) => { if (o[a] !== undefined && n.getAttribute(a) === o['_' + a]) n.setAttribute(a, o[a]); }); attrOrig.delete(n); } }
    }
  }

  /* ── กราฟ: ชื่อชุดข้อมูล · ป้ายแกน · ชื่อแกน ── */
  function labelTr(s) {
    if (typeof s !== 'string') return s;
    if (/^ปี \d{4}$/.test(s)) return toCE(s.slice(3));       // แกน x: แสดงเฉพาะเลขปี (ค.ศ.)
    return trText(s);
  }
  function langCharts() {
    if (!window.Chart) return;
    Object.values(Chart.instances).forEach((ch) => {
      const cfg = ch.config, d = cfg.data;
      if (!d._th) d._th = { labels: (d.labels || []).slice(), ds: d.datasets.map((x) => x.label) };
      const en = state.lang === 'en';
      if (d.labels) d.labels = d._th.labels.map((s) => en ? labelTr(s) : s);
      d.datasets.forEach((x, i) => { x.label = en ? labelTr(d._th.ds[i]) : d._th.ds[i]; });
      Object.values((cfg.options || {}).scales || {}).forEach((sc) => {
        if (sc.title && sc.title.text) { if (sc.title._th === undefined) sc.title._th = sc.title.text; sc.title.text = en ? trText(sc.title._th) : sc.title._th; }
      });
      ch.update('none');
    });
  }
  window.um = () => (state.lang === 'en' ? ' M' : ' ล.');   // หน่วยย่อใน tooltip

  /* ── เปลี่ยนภาษา ── */
  function setLang(lang, persist) {
    state.lang = lang === 'en' ? 'en' : 'th';
    document.documentElement.lang = state.lang;
    document.title = state.lang === 'en' ? 'Bangkok Public Transport — Dashboard' : 'ระบบขนส่งสาธารณะกรุงเทพมหานคร — Dashboard';
    if (state.lang === 'en') walk(document.body); else restore(document.body);
    langCharts();
    document.querySelectorAll('.lang-btn').forEach((b) => {
      const on = b.dataset.lang === state.lang;
      b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on));
    });
    if (persist) { try { localStorage.setItem(KEY, state.lang); } catch (e) { /* ignore */ } }
    document.dispatchEvent(new CustomEvent('i18n:change', { detail: { lang: state.lang } }));
  }
  function initial() {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'en' || q === 'th') return q;
    try { const s = localStorage.getItem(KEY); if (s === 'en' || s === 'th') return s; } catch (e) { /* ignore */ }
    return 'th';
  }

  function init() {
    document.querySelectorAll('.lang-btn').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang, true)));
    new MutationObserver((muts) => {
      if (state.lang !== 'en') return;
      for (const m of muts) {
        if (m.type === 'childList') m.addedNodes.forEach(walk);
        else if (m.type === 'characterData') doText(m.target);
        else if (m.type === 'attributes') doAttrs(m.target);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    setLang(initial(), false);
  }
  window.BMA_I18N = { setLang, tr: trText, get lang() { return state.lang; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
