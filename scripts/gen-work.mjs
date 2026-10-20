#!/usr/bin/env node
// Hermes Studio — work data build step. Runs on `npm run build` (and `npm run dev`).
//
//   REGISTRY.json  (which projects are live; showcase:true + a live link)
// + data/work.notes.json  (the voice: one line, what it shows off, order)
// + thumbnails (assets/thumbs/<id>.<ext> first, then the shared gallery thumbs)
// ──> src/work.json  + public/media/work/<id>.<ext>
//
// Deterministic on purpose: no timestamps, no network. The daily "Studio site refresh"
// cron diffs src/work.json and only republishes when it actually changed.
//
//   node scripts/gen-work.mjs [--check]   --check prints the would-be JSON and writes nothing

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, readdirSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY = process.env.HERMES_REGISTRY ?? '/opt/data/projects/REGISTRY.json';
const SHARED_THUMBS = '/opt/data/projects/hermes-gallery/thumbs/';
const LOCAL_THUMBS = path.join(ROOT, 'assets', 'thumbs');
const NOTES = path.join(ROOT, 'data', 'work.notes.json');
const OUT_JSON = path.join(ROOT, 'src', 'work.json');
const OUT_MEDIA = path.join(ROOT, 'public', 'media', 'work');

const check = process.argv.includes('--check');
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

// A rotating tunnel URL must never be baked into a static page; notes supply a stable link instead.
const isPublishable = (u) => typeof u === 'string' && /^https:\/\//.test(u) && !u.startsWith('auto:');

const firstSentence = (s = '') => {
  const t = String(s).replace(/\s+/g, ' ').trim();
  if (!t) return '';
  const m = t.match(/^(.*?[.;:])(\s|$)/);
  return (m ? m[1] : t).slice(0, 150);
};

// --- thumbnails -------------------------------------------------------------
// Repo-local bespoke capture wins; then the shared gallery thumb. Deterministic extension.
function findThumb(id, wanted) {
  const stem = wanted ?? id;
  for (const dir of [LOCAL_THUMBS, SHARED_THUMBS]) {
    if (!existsSync(dir)) continue;
    for (const ext of ['.jpg', '.jpeg', '.png', '.webp']) {
      const f = path.join(dir, stem + ext);
      if (existsSync(f)) return f;
    }
  }
  return null;
}

// --- collect ----------------------------------------------------------------
const registry = readJson(REGISTRY);
const notes = readJson(NOTES);
const note = notes.notes ?? {};
const extras = notes.extras ?? [];

const items = [];
const seen = new Set();

for (const p of registry.projects ?? []) {
  if (p.showcase !== true) continue;
  const live = (p.live ?? []).filter(([, u]) => isPublishable(u));
  const n = note[p.id] ?? {};
  const links = (n.links ?? live).filter(([, u]) => isPublishable(u));
  // An entry can be showcase:true but have no stable public URL (film-only, private, tunnel-only).
  if (!links.length && !n.links?.length) {
    console.log(`  skip ${p.id}: no publishable live link`);
    continue;
  }
  seen.add(p.id);
  items.push({
    id: p.id,
    title: n.title ?? p.title ?? p.id,
    medium: n.medium ?? 'Project',
    desc: n.desc ?? firstSentence(p.status) ?? '',
    shows: n.shows ?? [],
    links: links.map(([label, url]) => ({ label, url })),
    thumbKey: n.thumb ?? p.id,
    order: n.order ?? 50,
    repo: p.repo ?? null,
    // registry freshness, kept for the footer line
    status: firstSentence(p.status),
  });
}

for (const e of extras) {
  if (seen.has(e.id)) continue;
  seen.add(e.id);
  items.push({
    id: e.id,
    title: e.title ?? e.id,
    medium: e.medium ?? 'Project',
    desc: e.desc ?? '',
    shows: e.shows ?? [],
    links: (e.links ?? []).filter(([, u]) => isPublishable(u)).map(([label, url]) => ({ label, url })),
    thumbKey: e.thumb ?? e.id,
    order: e.order ?? 50,
    repo: e.repo ?? null,
    status: e.status ?? '',
  });
}

// sort by curated order, then title; stable across machines
items.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

// --- copy media + finalise --------------------------------------------------
mkdirSync(OUT_MEDIA, { recursive: true });
const wanted = new Set();
for (const it of items) {
  const src = findThumb(it.thumbKey, it.thumbKey);
  if (!src) {
    console.warn(`  WARNING ${it.id}: no thumbnail (looked for ${it.thumbKey}) — card falls back to type`);
    it.thumb = null;
    continue;
  }
  const ext = path.extname(src).toLowerCase() === '.png' ? '.png' : '.jpg';
  const name = it.id + ext;
  const dest = path.join(OUT_MEDIA, name);
  // Copy only when the bytes differ, so an unchanged rebuild touches nothing.
  const digest = (f) => createHash('sha1').update(readFileSync(f)).digest('hex');
  if (!existsSync(dest) || digest(dest) !== digest(src)) copyFileSync(src, dest);
  wanted.add(name);
  it.thumb = 'media/work/' + name;
  it.thumbAlt = it.title + ' — screenshot';
}
// drop thumbs for projects that are gone, so the deploy can't carry dead weight
for (const f of readdirSync(OUT_MEDIA)) if (!wanted.has(f)) unlinkSync(path.join(OUT_MEDIA, f));

const work = { count: items.length, items };
const json = JSON.stringify(work, null, 2) + '\n';
if (check) {
  process.stdout.write(json);
} else {
  const prev = existsSync(OUT_JSON) ? readFileSync(OUT_JSON, 'utf8') : null;
  writeFileSync(OUT_JSON, json);
  console.log(`work.json: ${work.count} items${prev === json ? ' (unchanged)' : prev ? ' (updated)' : ' (new)'}`);
  const missing = items.filter((i) => !i.thumb).map((i) => i.id);
  if (missing.length) console.warn(`  WARNING no thumbnail: ${missing.join(', ')}`);
}
