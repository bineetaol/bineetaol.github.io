import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseCSV } from '../js/csv.js';
import { COLLECTIONS, toKeyValue } from '../js/dataSource.js';
import { parseISODate } from '../js/utils.js';

const load = (name) => parseCSV(readFileSync(new URL(`../data/${COLLECTIONS[name]}`, import.meta.url), 'utf8'));

test('every collection file exists and parses', () => {
  for (const name of Object.keys(COLLECTIONS)) assert.ok(Array.isArray(load(name)), name);
});

test('site.csv names Mahesh Sharma and never Amol Wagle', () => {
  const site = toKeyValue(load('site'));
  assert.equal(site.teacher_name, 'Mahesh Sharma');
  for (const name of Object.keys(COLLECTIONS)) {
    const raw = readFileSync(new URL(`../data/${COLLECTIONS[name]}`, import.meta.url), 'utf8');
    assert.doesNotMatch(raw, /amol/i, name);
  }
});

test('courses.csv rows are well formed', () => {
  const rows = load('courses');
  assert.ok(rows.length >= 1);
  for (const c of rows) {
    assert.ok(c.title, `title for ${c.id}`);
    assert.ok(parseISODate(c.start_date), `start_date for ${c.id}`);
    assert.ok(parseISODate(c.end_date) >= parseISODate(c.start_date), `end >= start for ${c.id}`);
    assert.match(c.mode, /^(Online|In Person)$/);
    assert.match(c.register_url, /^https:\/\//);
  }
});
