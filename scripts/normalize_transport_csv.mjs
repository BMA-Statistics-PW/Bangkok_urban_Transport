#!/usr/bin/env node
// Normalize transport CSV headers after download from Google Sheets.
// Safe by design: ONLY the header row (line 1) is rewritten. Data rows are
// left byte-for-byte unchanged. Idempotent.
//
// Fixes handled:
//   1. Year columns polluted with extra text, e.g.
//      "หน่วย: ล้านคน-เที่ยวต่อปี ปี 2566"  ->  "ปี 2566"
//   2. Stray leading/trailing whitespace in header cells.
//
// The system/label columns (index <= systemCol, from config.json) are only
// trimmed — never collapsed — so descriptive titles that contain a year range
// (e.g. "... ปี 2560 - ปี 2567") are preserved.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const configPath = path.join(root, 'dashboard-template/config/config.json');

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i += 1; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function quote(cell) {
  return `"${String(cell).replace(/"/g, '""')}"`;
}

function normalizeHeaderCell(cell, index, systemCol) {
  const trimmed = String(cell).trim().replace(/\s+/g, ' ');
  // Descriptive / system columns: trim only, never collapse.
  if (index <= systemCol) return trimmed;
  // Year columns: if a Thai-year token exists, reduce to a clean "ปี YYYY".
  const m = trimmed.match(/ปี\s*(25\d{2})/);
  return m ? `ปี ${m[1]}` : trimmed;
}

function normalizeFile(absPath, systemCol) {
  const raw = fs.readFileSync(absPath, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const bom = raw.startsWith('﻿') ? '﻿' : '';
  const body = bom ? raw.slice(1) : raw;
  const lines = body.split(/\r?\n/);
  if (!lines.length) return { changed: false };

  const headerCells = parseCsvLine(lines[0]);
  const cleaned = headerCells.map((c, i) => normalizeHeaderCell(c, i, systemCol));
  const newHeader = cleaned.map(quote).join(',');

  if (newHeader === lines[0]) return { changed: false };

  lines[0] = newHeader;
  fs.writeFileSync(absPath, bom + lines.join(eol), 'utf8');
  return { changed: true };
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
let anyChanged = false;
for (const ds of (config.datasets || [])) {
  const abs = path.join(root, 'dashboard-template', ds.dataPath);
  if (!fs.existsSync(abs)) {
    console.warn(`skip (not found): ${ds.dataPath}`);
    continue;
  }
  const systemCol = Number.isInteger(ds.systemCol) ? ds.systemCol : 0;
  const { changed } = normalizeFile(abs, systemCol);
  console.log(`${changed ? 'cleaned ' : 'ok      '} ${ds.dataPath} (systemCol=${systemCol})`);
  anyChanged = anyChanged || changed;
}
console.log(anyChanged ? 'Normalization applied.' : 'Nothing to normalize.');
