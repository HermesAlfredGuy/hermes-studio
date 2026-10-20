// Renders the reel and the work grid from src/work.json (written by scripts/gen-work.mjs).
// Runs before any motion init: the horizontal pin measures the real card widths, so the
// cards have to exist first. The markup reuses the kit's own classes (.h-card, .media,
// .tags, .link) so the generated cards are indistinguishable from hand-written ones.
import work from './work.json';

const pad = (n) => String(n).padStart(2, '0');
const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// The reel card: the kit's own pattern — media, then a row of title + medium label.
function reelCard(it) {
  const href = it.links[0]?.url;
  const tag = href ? 'a' : 'div';
  const attrs = href ? ` href="${esc(href)}" data-cursor="View"` : '';
  return `
    <${tag} class="h-card"${attrs}>
      <div class="h-card__media">
        ${
          it.thumb
            ? `<img src="${esc(it.thumb)}" alt="${esc(it.thumbAlt)}" loading="lazy" decoding="async" />`
            : `<span class="label">${esc(it.title.slice(0, 2))}</span>`
        }
      </div>
      <div class="h-card__row"><span class="h-card__title">${esc(it.title)}</span><span class="label">${esc(it.medium)}</span></div>
    </${tag}>`;
}

// The grid card: screenshot, one line, what it shows off, the live links.
function gridCard(it, i) {
  const [primary, ...rest] = it.links;
  // Every card repeats "Open" / "Repo", so the visible label is short but the accessible name
  // carries the project — otherwise a screen-reader user hears eleven identical "Open" links.
  const link = (l, secondary) =>
    `<a class="link${secondary ? ' link--2' : ''}" href="${esc(l.url)}" target="_blank" rel="noopener" aria-label="${esc(l.label)} — ${esc(it.title)}">${esc(l.label)} →</a>`;
  return `
    <article class="wcard" data-reveal>
      <div class="media" data-clip>
        ${
          it.thumb
            ? `<img src="${esc(it.thumb)}" alt="${esc(it.thumbAlt)}" loading="lazy" decoding="async" width="1280" height="800" />`
            : `<span class="label">${esc(it.title)}</span>`
        }
      </div>
      <div class="wcard__body">
        <span class="label">${pad(i + 1)} — ${esc(it.medium)}</span>
        <h3 class="display wcard__title">${esc(it.title)}</h3>
        <p class="wcard__desc">${esc(it.desc)}</p>
        <div class="tags">${it.shows.map((s) => `<span>${esc(s)}</span>`).join('')}</div>
        <p class="wcard__links">
          ${primary ? link({ url: primary.url, label: 'Open' }, false) : ''}
          ${rest.map((l) => link(l, true)).join('')}
          ${it.repo ? `<a class="link link--2" href="${esc(it.repo)}" target="_blank" rel="noopener" aria-label="Source repository — ${esc(it.title)}">Repo →</a>` : ''}
        </p>
      </div>
    </article>`;
}

export function renderWork() {
  const reel = document.querySelector('[data-reel]');
  if (reel) reel.innerHTML = work.items.map(reelCard).join('');
  const grid = document.querySelector('[data-work-grid]');
  if (grid) grid.innerHTML = work.items.map(gridCard).join('');

  // Counters read the data, not a number someone typed into the HTML.
  const links = work.items.reduce((n, it) => n + it.links.length, 0);
  for (const el of document.querySelectorAll('[data-work-count]')) el.dataset.counter = String(work.count);
  for (const el of document.querySelectorAll('[data-work-links]')) el.dataset.counter = String(links);
  return work;
}

export { work };
