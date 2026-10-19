import './styles/tokens.css';
import './styles/base.css';
import './styles/sections.css';

import { initSmoothScroll } from './motion/core.js';
import { initReveals, refreshOnFonts } from './motion/reveal.js';
import { initMarquees, initMagnetic, initCursor, initHorizontal, initCounters } from './motion/interactions.js';
import { playIntro } from './motion/intro.js';

initSmoothScroll();
initHorizontal(); // pins first, so later triggers measure the pinned layout
initReveals();
initMarquees();
initMagnetic();
initCursor();
initCounters();
refreshOnFonts();

// Start the intro once display fonts are ready so split lines are measured correctly.
(document.fonts?.ready ?? Promise.resolve()).then(playIntro);
