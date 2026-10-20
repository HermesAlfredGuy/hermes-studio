// Shared motion setup: GSAP plugins, Lenis smooth scroll, reduced-motion state.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

// Motion is FULL by default, even when the OS reports prefers-reduced-motion: work PCs ship with
// Windows "Animation effects" off, and the site then looked dead (owner decision, 2026-10-20).
// Only the viewer's own choice — the "Reduce motion" toggle below — calms the page: fades stay,
// parallax, big travel and scroll inertia go. Nothing here flashes more than 3 times a second.
const MOTION_KEY = 'site-motion';
export const reduced = (() => {
  try { return localStorage.getItem(MOTION_KEY) === 'reduced'; } catch { return false; }
})();

function mountMotionToggle() {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'motion-toggle';
  b.textContent = reduced ? 'Full motion' : 'Reduce motion';
  b.setAttribute('aria-pressed', String(reduced));
  b.title = reduced ? 'Bring full motion back' : 'Calm the page: no parallax, big travel or scroll inertia';
  b.addEventListener('click', () => {
    try { localStorage.setItem(MOTION_KEY, reduced ? 'full' : 'reduced'); } catch {}
    location.reload();
  });
  document.body.appendChild(b);
}
if (document.body) mountMotionToggle();
else document.addEventListener('DOMContentLoaded', mountMotionToggle);

export const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

document.documentElement.classList.add('js');
if (reduced) document.documentElement.classList.add('reduced');

gsap.defaults({ ease: 'expo.out', duration: 1.1 });

export let lenis = null;

export function initSmoothScroll() {
  if (reduced) return null; // the viewer asked for calm: native scrolling, no inertia
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  // in-page anchors scroll smoothly through Lenis
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: 0, duration: 1.4 });
    });
  });
  return lenis;
}

export { gsap, ScrollTrigger, SplitText };
