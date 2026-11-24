/** Pure helpers shared by the renderer (no DOM access, unit-testable in Node). */

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape text for safe insertion into HTML. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
}

/** Allow only http(s), mailto, tel and relative URLs; anything else becomes ''. */
export function safeUrl(value) {
  const url = String(value ?? '').trim();
  if (!url) return '';
  if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return ''; // javascript:, data:, etc.
  return url; // relative path
}

export const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';

/** Sort rows by their numeric `order` column (rows without one keep file order). */
export function byOrder(rows) {
  return [...(rows || [])]
    .map((r, i) => ({ r, i }))
    .sort((a, b) => (Number(a.r.order) || a.i + 1e6) - (Number(b.r.order) || b.i + 1e6) || a.i - b.i)
    .map(({ r }) => r);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'];

/** Parse YYYY-MM-DD as a local calendar date (null if invalid). */
export function parseISODate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s ?? '').trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.getMonth() === Number(m[2]) - 1 ? d : null;
}

/** "27 – 29 Nov 2026", "30 Nov – 1 Dec 2026", "1 Dec 2026", "28 Dec 2026 – 2 Jan 2027". */
export function formatDateRange(startISO, endISO) {
  const a = parseISODate(startISO);
  const b = parseISODate(endISO) || a;
  if (!a) return '';
  const day = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  if (a.getTime() === b.getTime()) return `${day(a)} ${a.getFullYear()}`;
  if (a.getFullYear() !== b.getFullYear()) return `${day(a)} ${a.getFullYear()} – ${day(b)} ${b.getFullYear()}`;
  if (a.getMonth() === b.getMonth()) return `${a.getDate()} – ${day(b)} ${b.getFullYear()}`;
  return `${day(a)} – ${day(b)} ${b.getFullYear()}`;
}

/** Group courses by start month, sorted chronologically. Drops courses that already ended. */
export function groupCoursesByMonth(courses, today = new Date()) {
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const valid = (courses || [])
    .map((c) => ({ c, start: parseISODate(c.start_date), end: parseISODate(c.end_date) || parseISODate(c.start_date) }))
    .filter((x) => x.start && x.end >= startOfToday)
    .sort((x, y) => x.start - y.start || timeValue(x.c.start_time) - timeValue(y.c.start_time));
  const groups = new Map();
  for (const { c, start } of valid) {
    const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
    if (!groups.has(key)) groups.set(key, { key, label: `${MONTHS_LONG[start.getMonth()]} ${start.getFullYear()}`, courses: [] });
    groups.get(key).courses.push(c);
  }
  return [...groups.values()];
}

/** Minutes since midnight for "6:30 AM" style times (Infinity when unknown). */
export function timeValue(t) {
  const m = /^(\d{1,2}):(\d{2})\s*([AP]M)$/i.exec(String(t ?? '').trim());
  if (!m) return Infinity;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return h * 60 + Number(m[2]);
}

/** Indian-style currency formatting: 3000 -> "₹3,000". */
export function formatINR(value) {
  const n = Number(String(value ?? '').replace(/[^\d.]/g, ''));
  if (!value || Number.isNaN(n)) return '';
  return '₹' + n.toLocaleString('en-IN');
}

/** Extract a YouTube video id from an id or any common YouTube URL. */
export function youtubeId(value) {
  const v = String(value ?? '').trim();
  if (/^[\w-]{11}$/.test(v)) return v;
  const m = /(?:youtu\.be\/|v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/.exec(v);
  return m ? m[1] : '';
}

/** Format an integer with thousands separators ("80000" -> "80,000"). */
export function formatCount(n) {
  return Math.round(n).toLocaleString('en-IN');
}
