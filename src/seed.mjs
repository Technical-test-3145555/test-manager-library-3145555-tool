#!/usr/bin/env node
/**
 * Demo data seeder. It uses the API only, never SQL (data-model.md section 9).
 *
 *   --phase catalog   40 books and 13 members
 *   --phase overdue   3 loans that will be overdue; start the API with CLOCK_OFFSET_DAYS=-20 first (DT-21)
 *   --phase loans     12 ordinary loans, 4 of them with a returned line (restart the API without the offset)
 *   --phase check     prints what the API reports
 *
 * Every phase can be run again: what already exists is reused.
 */
import { createClient } from './api.mjs';
import { BOOKS, OVERDUE_MEMBERS, REGULAR_MEMBERS } from './catalog.mjs';

const BASE = process.env.API_URL ?? 'http://localhost:8080/api/v1';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const LIBRARIAN = { username: 'seed-librarian', password: process.env.SEED_LIBRARIAN_PASSWORD ?? 'seed-librarian-pass' };

const api = createClient(BASE);
const log = (message) => console.log(message);

function arg(name) {
  const at = process.argv.indexOf(`--${name}`);
  return at === -1 ? undefined : process.argv[at + 1];
}

async function sessions() {
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    throw new Error('Set ADMIN_USERNAME and ADMIN_PASSWORD in the environment.');
  }

  const admin = await api.login(ADMIN_USERNAME, ADMIN_PASSWORD);
  // 409 means the librarian already exists, which is fine when the seeder runs again.
  await api.post('/users', { ...LIBRARIAN, role: 'librarian' }, admin, [409]);
  const librarian = await api.login(LIBRARIAN.username, LIBRARIAN.password);

  return { admin, librarian };
}

async function allPages(path, token) {
  const items = [];
  for (let page = 1; ; page++) {
    const { json } = await api.get(`${path}${path.includes('?') ? '&' : '?'}page=${page}&size=50`, token);
    items.push(...json.items);
    if (items.length >= json.total) return items;
  }
}

async function catalog({ admin, librarian }) {
  let created = 0;
  for (const book of BOOKS) {
    const { status } = await api.post('/books', book, admin, [409]);
    created += status === 201 ? 1 : 0;
  }
  log(`books: ${created} created, ${BOOKS.length - created} already there`);

  created = 0;
  for (const member of [...OVERDUE_MEMBERS, ...REGULAR_MEMBERS]) {
    const { status } = await api.post('/members', member, librarian, [409]);
    created += status === 201 ? 1 : 0;
  }
  log(`members: ${created} created`);
}

async function lookups({ librarian }) {
  const books = await allPages('/books', librarian);
  const members = await allPages('/members?q=SEED', librarian);

  return {
    bookByIsbn: new Map(books.map((b) => [b.isbn, b])),
    memberByDocument: new Map(members.map((m) => [m.document_number, m])),
  };
}

async function lend(librarian, member, books) {
  const { json } = await api.post('/loans', { member_id: member.id, items: books.map((b) => ({ book_id: b.id })) }, librarian);
  return json;
}

async function overdue({ librarian }, { bookByIsbn, memberByDocument }) {
  let created = 0;
  for (const [i, spec] of OVERDUE_MEMBERS.entries()) {
    const member = memberByDocument.get(spec.document_number);
    if ((await api.get(`/members/${member.id}`, librarian)).json.active_loans > 0) continue;

    await lend(librarian, member, [bookByIsbn.get(BOOKS[i].isbn)]);
    created++;
  }
  log(`overdue loans: ${created} created (the API clock must have been shifted back 20 days)`);
}

async function loans({ librarian }, { bookByIsbn, memberByDocument }) {
  // 12 ordinary loans for 10 members: SEED-01..04 take two books and give one back, SEED-05..08 take one,
  // SEED-09 and SEED-10 take one book twice. With the 3 overdue ones the total is 15.
  const plan = REGULAR_MEMBERS.map((spec, i) => ({
    document: spec.document_number,
    loans: i >= 8 ? 2 : 1,
    booksPerLoan: i < 4 ? 2 : 1,
    returnsOne: i < 4,
  }));

  let created = 0;
  let returned = 0;
  let next = 3; // the first three books belong to the overdue members

  for (const entry of plan) {
    const member = memberByDocument.get(entry.document);
    const existing = (await api.get(`/loans?member_id=${member.id}`, librarian)).json.total;

    for (let n = existing; n < entry.loans; n++) {
      const picks = Array.from({ length: entry.booksPerLoan }, () => bookByIsbn.get(BOOKS[next++ % BOOKS.length].isbn));
      const loan = await lend(librarian, member, picks);
      created++;

      if (entry.returnsOne) {
        await api.post(`/loans/${loan.id}/items/${loan.items[0].id}/return`, undefined, librarian);
        returned++;
      }
    }
  }

  log(`ordinary loans: ${created} created, ${returned} lines returned`);
}

async function check({ admin, librarian }) {
  const overdueList = await api.get('/loans/overdue?size=50', librarian);
  const all = await api.get('/loans?size=1', librarian);
  const books = await api.get('/books?size=1', librarian);
  const members = await api.get('/members?size=1', librarian);
  const today = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const report = await api.get(`/reports/most-borrowed?from=${from}&to=${today}`, admin);

  log(`books: ${books.json.total}`);
  log(`members: ${members.json.total}`);
  log(`loans: ${all.json.total}`);
  log(`overdue lines: ${overdueList.json.total}`);
  log(`report rows (last 30 days): ${report.json.rows.length}`);
}

const phases = { catalog, overdue, loans, check };
const phase = arg('phase');

if (!phases[phase]) {
  console.error(`Usage: node src/seed.mjs --phase ${Object.keys(phases).join('|')}`);
  process.exit(2);
}

try {
  const tokens = await sessions();
  const context = phase === 'catalog' || phase === 'check' ? undefined : await lookups(tokens);
  await phases[phase](tokens, context);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
