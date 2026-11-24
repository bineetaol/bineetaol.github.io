/** App bootstrap: load data, render sections, wire up interactions. */
import { loadAll } from './dataSource.js';
import * as R from './render.js';
import { esc, formatCount } from './utils.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

async function main() {
  if (location.protocol === 'file:') {
    showBanner('Open this site through a web server (see README: <code>python3 -m http.server</code>). Browsers block reading CSV files from <code>file://</code>.');
  }

  const { data, errors } = await loadAll();
  const { site } = data;

  if (site.page_title) document.title = site.page_title;
  if (site.meta_description) $('meta[name="description"]')?.setAttribute('content', site.meta_description);

  $('#nav').innerHTML = R.renderNav(site);
  $('#hero').innerHTML = R.renderHero(site);
  $('#about').innerHTML = R.renderAbout(site);
  $('#stats').innerHTML = R.renderStats(site, data.stats);
  $('#journey').innerHTML = R.renderJourney(site, data.journey);
  $('#highlights').innerHTML = R.renderHighlights(site, data.highlights);
  $('#programs').innerHTML = R.renderCourses(site, data.courses);
  $('#wisdom').innerHTML = R.renderJournal(site, data.journal);
  $('#media').innerHTML = R.renderMedia(site, data.youtube, data.reels);
  $('#testimonials').innerHTML = R.renderTestimonials(site, data.testimonials);
  $('#connect').innerHTML = R.renderFooter(site, data.social);

  if (errors.length && location.protocol !== 'file:') {
    showBanner(`Some data could not be loaded: ${errors.map(esc).join('; ')}`);
  }
  document.body.classList.remove('is-loading');

  initImageFallbacks();
  initNav();
  initReveal();
  initCounters();
  $$('[data-carousel]').forEach(initCarousel);
  initCourseFilter();
  initVideoModal();
}

function showBanner(html) {
  const el = $('#banner');
  el.innerHTML = html;
  el.hidden = false;
}

/** Swap broken images for the placeholder box. */
function initImageFallbacks() {
  $$('img[data-fallback]').forEach((img) => {
    const fail = () => {
      const box = document.createElement('div');
      box.className = `img-ph ${img.className}`;
      box.setAttribute('role', 'img');
      box.setAttribute('aria-label', img.alt || img.dataset.fallback);
      box.innerHTML = `<span>${esc(img.dataset.fallback)}</span>`;
      img.replaceWith(box);
    };
    if (img.complete && img.naturalWidth === 0) fail();
    else img.addEventListener('error', fail, { once: true });
  });
}

function initNav() {
  const nav = $('#nav');
  const toggle = $('.nav-toggle', nav);
  const links = $('.nav-links', nav);
  const setOpen = (open) => {
    links.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setOpen(!links.classList.contains('is-open')));
  links.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Highlight the nav link of the section in view.
  const map = new Map($$('a[href^="#"]', links).map((a) => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting && map.has(en.target.id)) {
        map.forEach((a) => a.classList.remove('is-current'));
        map.get(en.target.id).classList.add('is-current');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
}

function initReveal() {
  const els = $$('.reveal');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  els.forEach((el) => io.observe(el));
}

function initCounters() {
  const els = $$('[data-count]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const run = (el) => {
    const target = Number(el.dataset.count) || 0;
    if (reduce) { el.textContent = formatCount(target); return; }
    const start = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - start) / 1600);
      el.textContent = formatCount(target * (1 - (1 - p) ** 3));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
  }, { threshold: 0.5 });
  els.forEach((el) => io.observe(el));
}

function initCarousel(root) {
  const slides = $$('.slide', root);
  const dots = $$('.dots button', root);
  if (slides.length < 2) return;
  let i = 0;
  let timer;
  const go = (n) => {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
    dots.forEach((d, k) => d.classList.toggle('is-active', k === i));
  };
  const restart = () => { clearInterval(timer); timer = setInterval(() => go(i + 1), 6000); };
  $('.prev', root)?.addEventListener('click', () => { go(i - 1); restart(); });
  $('.next', root)?.addEventListener('click', () => { go(i + 1); restart(); });
  dots.forEach((d, k) => d.addEventListener('click', () => { go(k); restart(); }));
  root.addEventListener('mouseenter', () => clearInterval(timer));
  root.addEventListener('mouseleave', restart);
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) restart();
}

function initCourseFilter() {
  const chips = $$('.course-filter .chip');
  const empty = $('.filter-empty');
  chips.forEach((chip) => chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    chips.forEach((c) => c.classList.toggle('is-active', c === chip));
    let shown = 0;
    $$('.month').forEach((m) => {
      let inMonth = 0;
      $$('.course', m).forEach((c) => {
        const ok = f === 'all' || c.dataset.mode === f;
        c.hidden = !ok;
        if (ok) inMonth += 1;
      });
      m.hidden = inMonth === 0;
      shown += inMonth;
    });
    if (empty) empty.hidden = shown > 0 || !$$('.month').length;
  }));
}

function initVideoModal() {
  const modal = $('#video-modal');
  const frame = $('.modal-frame', modal);
  const close = () => { modal.close(); frame.innerHTML = ''; };
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-video]');
    if (!btn) return;
    const id = encodeURIComponent(btn.dataset.video);
    frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="YouTube video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    modal.showModal();
  });
  $('.modal-close', modal).addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  modal.addEventListener('close', () => { frame.innerHTML = ''; });
}

main().catch((err) => {
  console.error(err);
  showBanner(`Something went wrong while loading the page: ${esc(err.message)}`);
  document.body.classList.remove('is-loading');
});
