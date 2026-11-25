import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../js/render.js';

test('empty values render placeholders, not blanks', () => {
  const html = R.renderAbout({ teacher_name: 'Mahesh Sharma' });
  assert.match(html, /class="ph"/);
  assert.match(html, /Biography placeholder/);
  assert.match(html, /Profile photo placeholder/);
  assert.match(html, /is-disabled/); // download photos button without URL
});

test('CSV values are escaped and unsafe URLs dropped', () => {
  const html = R.renderHighlights({}, [{ title: '<script>x</script>', link_url: 'javascript:alert(1)', image_url: 'javascript:x' }]);
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /javascript:/);
  assert.match(html, /&lt;script&gt;/);
});

test('course card shows formatted data and registration link', () => {
  const html = R.renderCourseCard({ title: 'Sahaj Samadhi', start_date: '2026-11-27', end_date: '2026-11-29', start_time: '6:30 AM', end_time: '8:30 AM',
    mode: 'Online', language: 'English, Hindi', price_inr: '3000', register_url: 'https://example.org/r' });
  assert.match(html, /27 – 29 Nov 2026/);
  assert.match(html, /₹3,000/);
  assert.match(html, /data-mode="online"/);
  assert.match(html, /href="https:\/\/example.org\/r"/);
});

test('course card placeholders for missing data', () => {
  const html = R.renderCourseCard({ mode: 'In Person' });
  for (const s of ['Course title', 'Date TBA', 'Venue TBA', 'Fee TBA']) assert.match(html, new RegExp(s));
  assert.match(html, /Register<\/span>/); // disabled register button
});

test('courses section with no upcoming courses shows placeholder', () => {
  const html = R.renderCourses({}, [{ title: 'old', start_date: '2020-01-01', end_date: '2020-01-02' }], new Date(2026, 0, 1));
  assert.match(html, /No upcoming programs/);
});

test('YouTube rows with id become playable, others placeholders', () => {
  const html = R.renderMedia({}, [{ title: 'Talk', video_id: 'https://youtu.be/FQ64QXW8_cg' }, {}], []);
  assert.match(html, /data-video="FQ64QXW8_cg"/);
  assert.match(html, /i\.ytimg\.com\/vi\/FQ64QXW8_cg/);
  assert.match(html, /Video title placeholder/);
});

test('footer builds tel/wa links only when data exists', () => {
  const withData = R.renderFooter({ contact_phone: '+91 98765 43210', contact_whatsapp: '+91 98765-43210', contact_email: 'a@b.c' }, [], 2026);
  assert.match(withData, /href="tel:\+919876543210"/);
  assert.match(withData, /href="https:\/\/wa.me\/919876543210"/);
  const empty = R.renderFooter({}, [{ platform: 'youtube', url: '' }], 2026);
  assert.match(empty, /Phone placeholder/);
  assert.match(empty, /youtube link coming soon/);
  assert.match(empty, /© 2026/);
});

test('multi-line about_text becomes escaped paragraphs', () => {
  const html = R.renderAbout({ about_text: 'First <b>line</b>\n\nSecond line' });
  assert.match(html, /<p>First &lt;b&gt;line&lt;\/b&gt;<\/p><p>Second line<\/p>/);
});
