/**
 * Minimal RFC 4180 CSV parser.
 * Handles quoted fields, escaped quotes (""), commas and newlines inside quotes,
 * CRLF / LF line endings and a leading UTF-8 BOM.
 */

/** Parse CSV text into an array of rows (arrays of strings). */
export function parseRows(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  while (i < src.length) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i += 1; continue;
      }
      field += ch; i += 1; continue;
    }
    if (ch === '"') { inQuotes = true; i += 1; continue; }
    if (ch === ',') { row.push(field); field = ''; i += 1; continue; }
    if (ch === '\r' || ch === '\n') {
      row.push(field); rows.push(row); row = []; field = '';
      i += ch === '\r' && src[i + 1] === '\n' ? 2 : 1;
      continue;
    }
    field += ch; i += 1;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  // Drop fully empty lines (e.g. trailing newline, blank separators).
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

/** Parse CSV text into objects keyed by the (trimmed) header row. */
export function parseCSV(text) {
  const [header, ...body] = parseRows(text);
  if (!header) return [];
  const keys = header.map((h) => h.trim());
  return body.map((cells) => {
    const obj = {};
    keys.forEach((k, idx) => { obj[k] = (cells[idx] ?? '').trim(); });
    return obj;
  });
}
