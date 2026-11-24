import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCSV, parseRows } from '../js/csv.js';

test('parses quoted fields with commas, quotes and newlines', () => {
  const rows = parseCSV('a,b,c\r\n"x, y","he said ""hi""","line1\nline2"\n');
  assert.deepEqual(rows, [{ a: 'x, y', b: 'he said "hi"', c: 'line1\nline2' }]);
});

test('strips BOM, trims headers and skips blank lines', () => {
  const rows = parseCSV('﻿ key , value\n\nname,Mahesh\n\n');
  assert.deepEqual(rows, [{ key: 'name', value: 'Mahesh' }]);
});

test('missing trailing cells become empty strings', () => {
  assert.deepEqual(parseCSV('a,b,c\n1'), [{ a: '1', b: '', c: '' }]);
});

test('empty input', () => {
  assert.deepEqual(parseCSV(''), []);
  assert.deepEqual(parseRows('\n\n'), []);
});
