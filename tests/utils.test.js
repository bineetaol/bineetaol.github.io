import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esc, safeUrl, byOrder, formatDateRange, groupCoursesByMonth, timeValue, formatINR, youtubeId, parseISODate } from '../js/utils.js';

test('esc escapes HTML', () => {
  assert.equal(esc('<img src=x onerror="a">&\''), '&lt;img src=x onerror=&quot;a&quot;&gt;&amp;&#39;');
  assert.equal(esc(undefined), '');
});

test('safeUrl blocks dangerous schemes', () => {
  assert.equal(safeUrl('javascript:alert(1)'), '');
  assert.equal(safeUrl(' JavaScript:alert(1)'), '');
  assert.equal(safeUrl('data:text/html,x'), '');
  assert.equal(safeUrl('https://a.b/c'), 'https://a.b/c');
  assert.equal(safeUrl('mailto:a@b.c'), 'mailto:a@b.c');
  assert.equal(safeUrl('images/x.jpg'), 'images/x.jpg');
  assert.equal(safeUrl(''), '');
});

test('byOrder sorts numerically and keeps unordered rows last in file order', () => {
  const r = byOrder([{ order: '10', n: 'c' }, { order: '2', n: 'a' }, { n: 'x' }, { order: '3', n: 'b' }, { n: 'y' }]);
  assert.deepEqual(r.map((x) => x.n), ['a', 'b', 'c', 'x', 'y']);
});

test('parseISODate rejects invalid dates', () => {
  assert.equal(parseISODate('2026-02-30'), null);
  assert.equal(parseISODate('27 Nov'), null);
  assert.ok(parseISODate('2026-11-27'));
});

test('formatDateRange variants', () => {
  assert.equal(formatDateRange('2026-11-27', '2026-11-29'), '27 – 29 Nov 2026');
  assert.equal(formatDateRange('2026-11-30', '2026-12-01'), '30 Nov – 1 Dec 2026');
  assert.equal(formatDateRange('2026-12-01', '2026-12-01'), '1 Dec 2026');
  assert.equal(formatDateRange('2026-12-01', ''), '1 Dec 2026');
  assert.equal(formatDateRange('2026-12-30', '2027-01-02'), '30 Dec 2026 – 2 Jan 2027');
  assert.equal(formatDateRange('', ''), '');
});

test('groupCoursesByMonth sorts, groups and hides finished courses', () => {
  const today = new Date(2026, 10, 28); // 28 Nov 2026
  const g = groupCoursesByMonth([
    { title: 'Jan', start_date: '2027-01-15', end_date: '2027-01-17' },
    { title: 'Past', start_date: '2026-11-20', end_date: '2026-11-22' },
    { title: 'Running', start_date: '2026-11-27', end_date: '2026-11-29' },
    { title: 'Dec PM', start_date: '2026-12-01', end_date: '2026-12-01', start_time: '6:00 PM' },
    { title: 'Dec AM', start_date: '2026-12-01', end_date: '2026-12-01', start_time: '7:00 AM' },
    { title: 'Bad', start_date: 'TBA' },
  ], today);
  assert.deepEqual(g.map((x) => x.label), ['November 2026', 'December 2026', 'January 2027']);
  assert.deepEqual(g.map((x) => x.courses.map((c) => c.title)), [['Running'], ['Dec AM', 'Dec PM'], ['Jan']]);
});

test('timeValue', () => {
  assert.equal(timeValue('12:00 AM'), 0);
  assert.equal(timeValue('12:30 PM'), 750);
  assert.equal(timeValue('7:15 PM'), 1155);
  assert.equal(timeValue(''), Infinity);
});

test('formatINR', () => {
  assert.equal(formatINR('3000'), '₹3,000');
  assert.equal(formatINR('199'), '₹199');
  assert.equal(formatINR(''), '');
});

test('youtubeId handles ids and URLs', () => {
  assert.equal(youtubeId('FQ64QXW8_cg'), 'FQ64QXW8_cg');
  assert.equal(youtubeId('https://www.youtube.com/watch?v=FQ64QXW8_cg&t=3'), 'FQ64QXW8_cg');
  assert.equal(youtubeId('https://youtu.be/FQ64QXW8_cg'), 'FQ64QXW8_cg');
  assert.equal(youtubeId('https://www.youtube.com/shorts/FQ64QXW8_cg'), 'FQ64QXW8_cg');
  assert.equal(youtubeId('not a video'), '');
});
