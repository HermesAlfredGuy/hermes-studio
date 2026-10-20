# Hermes Studio refresh — plan (2026-10-20)

Goal: show ALL the work, and keep the page current automatically. Identity, hero, statement
and the horizontal reel stay; the reel becomes the centrepiece and the work becomes data.

## Baseline (measured on the live site, studio-qa)
- 5 clipped glyphs: "Made by", "an agent", "Rijal Almaa", "Every project gets", "its own page"
  — all clipped by `<div.split-line-mask>` (site has the OLD mask padding, the kit has the new one).
- a11y serious ×2: `aria-prohibited-attr` (3× `span[aria-label]` from GSAP SplitText aria-auto)
  and `color-contrast` (4× `.step__n`, accent #ff6a3d on inverse #ecebe4 = 2.38:1).
- 390 overflow: none. reduced motion: ok. 61 fps.

## Decisions
1. **Work is data.** `scripts/gen-work.mjs` (npm `prebuild`) reads REGISTRY.json, takes every
   entry with `showcase: true` AND at least one live link, merges curated editorial copy from
   `data/work.notes.json`, adds `extras` (projects the registry doesn't own, e.g. the Gallery),
   resolves each thumbnail, copies it into `public/media/work/`, and writes `src/work.json`.
   New projects appear on the next build with no hand edit.
   - Thumbnail resolution: repo-local `assets/thumbs/<id>.<ext>` first (bespoke captures),
     then the shared `hermes-gallery/thumbs/<id>.jpg`. No network at build time.
   - `auto:itlala-tunnel` is a rotating URL — never published into a static page; the Itlala
     entry gets its stable concepts link from the notes.
   - Deterministic output (no timestamps) so the daily cron can diff `src/work.json`.
2. **Page order:** hero → marquee → statement → REEL (centrepiece) → ALL WORK grid →
   DEEP CUTS (the five long-form write-ups) → HOW IT'S MADE → numbers → CTA → footer.
3. **Deep cuts stay** — the orbital film, the Rijal Almaa GLB and the ND96 before/after are
   proof a thumbnail grid cannot carry. The grid carries breadth.
4. **Clipped glyphs:** adopt the kit's mask padding verbatim
   (`.split-mask, .split-line-mask, .split-word-mask, .split-char-mask`).
5. **a11y:** (a) GSAP writes `aria-label` onto the split element — fine on a heading, prohibited
   on a span/p. Hoist the label to the nearest heading ancestor (captured before the split);
   for non-heading splits pass `aria: 'none'` so nothing prohibited is written.
   (b) `.section--inverse` gets a dark accent `--accent-deep: #a83806` (5.43:1) for step numbers.
6. **Motion is always full** — no `prefers-reduced-motion` read, no toggle (owner rule 2026-10-20).
7. **Counters are data-driven** — live-site count comes from `work.json`.

## Proof gate
`npm run build` → `qa.sh web` on the local build AND the live URL (text leaks 0, line clash 0,
clipped glyphs 0, no 390 overflow, reduced motion ok, a11y 0) → phone + desktop screenshots →
`publish-pages.sh` → curl the live URL.

## Automation
Cron "Studio site refresh", 04:00 daily, no-agent: regenerate, and rebuild/republish only when
`src/work.json` actually changed. Failures only → General.

## Result (2026-10-20)

Shipped to https://hermesalfredguy.github.io/hermes-studio/ — 11 projects generated from REGISTRY.json.

- `npm run build` → `scripts/gen-work.mjs` reads the registry + `data/work.notes.json`, copies
  thumbnails to `public/media/work/`, writes `src/work.json`; `src/render-work.js` renders the reel
  and the "All work" grid from it before motion init (the pin measures real card widths).
- QA (live): clipped glyphs 0, line clash 0, text leaks 0, axe serious 0, 390 px no overflow, 61 fps.
- Motion stays full: no `prefers-reduced-motion` reads, no toggle (owner rule 2026-10-20).
- `scripts/refresh.sh` + `scripts/refresh-cron.sh` run daily 04:00 UTC ("Studio site refresh"):
  regenerate, and republish ONLY if the work list changed; failures go to General.
