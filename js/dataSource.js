/**
 * Data access layer.
 *
 * Every section of the page asks this module for its data by name
 * ("site", "courses", "youtube", ...). Today the data comes from CSV files in
 * /data. To move to a database/API later, implement another source with the
 * same `load(name)` contract (returning an array of plain objects) and switch
 * ACTIVE_SOURCE below — no rendering code needs to change.
 */
import { parseCSV } from './csv.js';

/** Section name -> CSV file. Each section lives in its own file. */
export const COLLECTIONS = {
  site: 'site.csv',
  stats: 'stats.csv',
  journey: 'journey.csv',
  highlights: 'highlights.csv',
  courses: 'courses.csv',
  journal: 'journal.csv',
  youtube: 'youtube.csv',
  reels: 'reels.csv',
  testimonials: 'testimonials.csv',
  social: 'social.csv',
};

export function csvSource(baseUrl = 'data/') {
  return {
    async load(name) {
      const file = COLLECTIONS[name];
      if (!file) throw new Error(`Unknown collection "${name}"`);
      const res = await fetch(baseUrl + file, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
      return parseCSV(await res.text());
    },
  };
}

/**
 * Example of the future database source (not used yet):
 *
 * export function apiSource(baseUrl = '/api/') {
 *   return { async load(name) { return (await fetch(baseUrl + name)).json(); } };
 * }
 */

const ACTIVE_SOURCE = csvSource();

/**
 * Load all collections in parallel. A collection that fails to load becomes an
 * empty list (its section then shows placeholders) and is reported in `errors`.
 */
export async function loadAll(source = ACTIVE_SOURCE) {
  const names = Object.keys(COLLECTIONS);
  const results = await Promise.allSettled(names.map((n) => source.load(n)));
  const data = {};
  const errors = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') data[names[i]] = r.value;
    else { data[names[i]] = []; errors.push(`${names[i]}: ${r.reason.message}`); }
  });
  data.site = toKeyValue(data.site);
  return { data, errors };
}

/** Turn key,value rows into a single object. */
export function toKeyValue(rows) {
  const out = {};
  for (const r of rows || []) if (r.key) out[r.key] = r.value ?? '';
  return out;
}
