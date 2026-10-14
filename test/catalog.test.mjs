import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BOOKS, CATEGORY_IDS, OVERDUE_MEMBERS, REGULAR_MEMBERS } from '../src/catalog.mjs';

test('there are at least 40 books, as T-21 asks', () => {
  assert.ok(BOOKS.length >= 40);
});

test('every ISBN has 13 digits and is unique', () => {
  const isbns = BOOKS.map((b) => b.isbn);
  assert.ok(isbns.every((isbn) => /^\d{13}$/.test(isbn)));
  assert.equal(new Set(isbns).size, isbns.length);
});

test('every book belongs to one of the five fixed categories and has at least one copy', () => {
  const ids = new Set(Object.values(CATEGORY_IDS));
  assert.equal(ids.size, 5);
  assert.ok(BOOKS.every((b) => ids.has(b.category_id) && b.total_copies >= 1));
});

test('members have unique documents and there are enough of them', () => {
  const documents = [...OVERDUE_MEMBERS, ...REGULAR_MEMBERS].map((m) => m.document_number);
  assert.equal(new Set(documents).size, documents.length);
  assert.equal(OVERDUE_MEMBERS.length, 3);
  assert.ok(REGULAR_MEMBERS.length >= 10);
});
