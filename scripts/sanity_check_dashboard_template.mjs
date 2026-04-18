import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const configPath = path.join(root, 'dashboard-template/config/config.json');
const sharePath = path.join(root, 'dashboard-template/data/transport_share.csv');
const reportPath = path.join(root, 'dashboard-template/data/transport_report.csv');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parseCsvLine(line) {
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
}

function readCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });
  return { headers, rows };
}

function extractYears(headers) {
  return headers
    .map(h => {
      const m = String(h).match(/(25\d{2})/);
      return m ? Number(m[1]) : NaN;
    })
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
assert(Array.isArray(config.datasets) && config.datasets.length >= 2, 'datasets config must contain at least 2 datasets');

const share = readCsv(sharePath);
const report = readCsv(reportPath);

const shareYears = extractYears(share.headers);
const reportYears = extractYears(report.headers);

assert(shareYears[0] <= 2560, 'share dataset should include year 2560 or earlier');
assert(shareYears[shareYears.length - 1] >= 2567, 'share dataset should include year 2567 or later');
assert(reportYears[0] <= 2556, 'report dataset should include year 2556 or earlier');

const shareSystemHeader = share.headers[0];
const reportSystemHeader = report.headers[1] || report.headers[0];
const shareRows = share.rows.filter(r => String(r[shareSystemHeader]).trim() !== '');
const reportRows = report.rows.filter(r => String(r[reportSystemHeader]).trim() !== '');

assert(shareRows.length >= 10, 'share dataset should have at least 10 non-empty rows');
assert(reportRows.length >= 10, 'report dataset should have at least 10 non-empty rows');

const hasPublicShare = shareRows.some(r => String(r[shareSystemHeader]).includes('สัดส่วนสาธารณะ'));
const hasPrivateShare = shareRows.some(r => String(r[shareSystemHeader]).includes('สัดส่วนระบบรถส่วนบุคคล'));
assert(hasPublicShare && hasPrivateShare, 'share dataset must contain public/private modal share rows');

const hasBrtRow = reportRows.some(r => String(r[reportSystemHeader]).includes('BRT'));
assert(hasBrtRow, 'report dataset should contain BRT row');

console.log('Sanity checks passed');