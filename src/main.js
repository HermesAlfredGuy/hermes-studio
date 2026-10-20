import './styles/tokens.css';
import './styles/base.css';
import './styles/sections.css';

import { renderWork } from './render-work.js';
import { initSmoothScroll } from './motion/core.js';
import { initReveals, refreshOnFonts } from './motion/reveal.js';
import { initMarquees, initMagnetic, initCursor, initHorizontal, initCounters, initReelRail } from './motion/interactions.js';
import { playIntro } from './motion/intro.js';

// The reel and the grid are generated from src/work.json BEFORE anything measures the page —
// the horizontal pin distances itself off the real card widths.
renderWork();

initSmoothScroll();
initHorizontal(); // pins first, so later triggers measure the pinned layout
initReelRail();
initReveals();
initMarquees();
initMagnetic();
initCursor();
initCounters();
refreshOnFonts();

// Start the intro once display fonts are ready so split lines are measured correctly.
(document.fonts?.ready ?? Promise.resolve()).then(playIntro);
