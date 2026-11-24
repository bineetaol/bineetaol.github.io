/**
 * Section renderers. Each function receives already-loaded data and returns an
 * HTML string. All CSV values pass through esc()/safeUrl(); empty values are
 * replaced by visible placeholders so missing content is obvious.
 */
import { esc, safeUrl, isBlank, byOrder, formatDateRange, groupCoursesByMonth, formatINR, youtubeId } from './utils.js';
import { icon } from './icons.js';

/** Visible placeholder text for a missing value. */
export const ph = (label) => `<span class="ph" title="Add this in the CSV file">${esc(label)}</span>`;

/** Text value or placeholder. */
const text = (v, label) => (isBlank(v) ? ph(label) : esc(v));

/** Image or a neutral placeholder box. */
function img(url, alt, cls = '', label = 'Image placeholder') {
  const src = safeUrl(url);
  if (!src) return `<div class="img-ph ${cls}" role="img" aria-label="${esc(alt || label)}"><span>${icon('image')}${esc(label)}</span></div>`;
  return `<img class="${cls}" src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async" data-fallback="${esc(label)}">`;
}

/** Link button, or a disabled-looking placeholder button when the URL is missing. */
function button(url, label, cls = 'btn', missing = 'Link coming soon') {
  const href = safeUrl(url);
  if (!href) return `<span class="${cls} is-disabled" aria-disabled="true" title="${esc(missing)}">${esc(label)}</span>`;
  const ext = /^https?:/i.test(href) ? ' target="_blank" rel="noopener"' : '';
  return `<a class="${cls}" href="${esc(href)}"${ext}>${esc(label)}</a>`;
}

const sectionHead = (eyebrow, heading, intro, headingLabel = 'Section heading') => `
  <header class="section-head reveal">
    ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
    <h2>${text(heading, headingLabel)}</h2>
    ${intro !== undefined ? `<p class="lead">${text(intro, 'Section introduction')}</p>` : ''}
  </header>`;

export function renderNav(site) {
  const links = [['hero', 'Home'], ['about', 'About'], ['programs', 'Programs'], ['wisdom', 'Wisdom'],
    ['media', 'Media'], ['testimonials', 'Testimonials'], ['connect', 'Contact']];
  return `
    <div class="nav-inner container">
      <a class="brand" href="#hero">${text(site.teacher_name, 'Teacher name')}</a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-links" aria-label="Open menu">${icon('menu')}</button>
      <ul class="nav-links" id="nav-links">
        ${links.map(([id, label]) => `<li><a href="#${id}">${label}</a></li>`).join('')}
        <li><a class="btn btn-gold btn-sm" href="#programs">Register Now</a></li>
      </ul>
    </div>`;
}

export function renderHero(site) {
  return `
    <div class="hero-glow" aria-hidden="true"></div>
    <div class="container hero-grid">
      <div class="hero-content reveal">
        <p class="eyebrow light">${text(site.hero_eyebrow, 'Hero eyebrow')}</p>
        <h1>${text(site.hero_heading, 'Hero heading placeholder')}</h1>
        <p class="hero-sub">${text(site.hero_subtitle, 'Hero subtitle')}</p>
        <div class="hero-actions">
          <a class="btn btn-gold" href="#programs">${icon('calendar')} Programs Schedule</a>
          <a class="btn btn-ghost" href="#media">${icon('play')} Watch Wisdom Talks</a>
        </div>
      </div>
      <div class="hero-portrait reveal">${img(site.hero_image, site.teacher_name, '', 'Photo placeholder')}</div>
    </div>`;
}

export function renderAbout(site) {
  return `
    <div class="container about-grid">
      <div class="about-photo reveal">${img(site.about_image, site.teacher_name, '', 'Profile photo placeholder')}</div>
      <div class="about-text reveal">
        <p class="eyebrow">About</p>
        <h2>${text(site.about_heading, 'About heading')}</h2>
        <p>${isBlank(site.about_text) ? ph('Biography placeholder — add about_text in data/site.csv') : esc(site.about_text)}</p>
        ${button(site.about_photos_url, 'Download Official Photos', 'btn btn-outline')}
      </div>
    </div>`;
}

export function renderStats(site, stats) {
  const rows = byOrder(stats);
  return `
    <div class="container">
      ${sectionHead('', site.stats_heading)}
      <div class="stats-grid">
        ${rows.length ? rows.map((s) => `
          <div class="stat reveal">
            <div class="stat-value">${isBlank(s.value)
              ? ph('—')
              : `<span data-count="${esc(String(s.value).replace(/[^\d]/g, ''))}">0</span>${esc(s.suffix)}`}</div>
            <div class="stat-label">${text(s.label, 'Stat label')}</div>
          </div>`).join('') : `<p class="empty">${ph('Add rows to data/stats.csv')}</p>`}
      </div>
    </div>`;
}

export function renderJourney(site, journey) {
  const slides = byOrder(journey);
  if (!slides.length) slides.push({});
  return `
    <div class="container">
      ${sectionHead('Gurudev & Me', site.journey_heading, site.journey_text)}
      <div class="carousel reveal" data-carousel>
        <div class="carousel-track">
          ${slides.map((s, i) => `
            <figure class="slide${i === 0 ? ' is-active' : ''}">
              ${img(s.image_url, s.alt, '', 'Journey photo placeholder')}
              <figcaption>${text(s.caption, 'Photo caption')}</figcaption>
            </figure>`).join('')}
        </div>
        ${slides.length > 1 ? `
          <button class="carousel-btn prev" type="button" aria-label="Previous photo">${icon('chevron-left')}</button>
          <button class="carousel-btn next" type="button" aria-label="Next photo">${icon('chevron-right')}</button>
          <div class="dots">${slides.map((_, i) => `<button type="button" aria-label="Go to photo ${i + 1}"${i === 0 ? ' class="is-active"' : ''}></button>`).join('')}</div>` : ''}
      </div>
    </div>`;
}

export function renderHighlights(site, items) {
  const rows = byOrder(items);
  return `
    <div class="container">
      ${sectionHead('Highlights', site.highlights_heading, site.highlights_text)}
      <div class="highlights-grid">
        ${rows.map((h) => {
          const inner = `${img(h.image_url, h.title, '', 'Event photo placeholder')}
            <div class="highlight-caption"><strong>${text(h.title, 'Event title')}</strong>${h.location ? `<span>${esc(h.location)}</span>` : ''}</div>`;
          const href = safeUrl(h.link_url);
          return href
            ? `<a class="highlight reveal" href="${esc(href)}" target="_blank" rel="noopener">${inner}</a>`
            : `<div class="highlight reveal">${inner}</div>`;
        }).join('') || `<p class="empty">${ph('Add rows to data/highlights.csv')}</p>`}
      </div>
    </div>`;
}

export function renderCourseCard(c) {
  const online = /online/i.test(c.mode);
  const time = [c.start_time, c.end_time].filter(Boolean).join(' – ');
  const price = formatINR(c.price_inr);
  return `
    <article class="course reveal" data-mode="${online ? 'online' : 'in-person'}">
      <div class="course-date">${text(formatDateRange(c.start_date, c.end_date), 'Date TBA')}</div>
      <div class="course-body">
        <h4>${text(c.title, 'Course title')}</h4>
        <ul class="course-meta">
          <li>${icon('clock')}${text(time, 'Time TBA')}</li>
          <li>${icon(online ? 'globe' : 'pin')}${online ? 'Online' : text(c.location, 'Venue TBA')}</li>
          <li>${icon('language')}${text(c.language, 'Language TBA')}</li>
        </ul>
      </div>
      <div class="course-side">
        <span class="badge ${online ? 'badge-online' : 'badge-inperson'}">${online ? 'Online' : 'In Person'}</span>
        ${price ? `<span class="price">${esc(price)}<small>*</small></span>` : ph('Fee TBA')}
        <div class="course-actions">
          ${safeUrl(c.poster_url) ? button(c.poster_url, 'Poster', 'btn btn-outline btn-sm') : ''}
          ${safeUrl(c.details_url) ? button(c.details_url, 'Details', 'btn btn-outline btn-sm') : ''}
          ${button(c.register_url, 'Register', 'btn btn-primary btn-sm', 'Registration link coming soon')}
        </div>
      </div>
    </article>`;
}

export function renderCourses(site, courses, today = new Date()) {
  const groups = groupCoursesByMonth(courses, today);
  const total = groups.reduce((n, g) => n + g.courses.length, 0);
  const last = groups.at(-1);
  return `
    <div class="container">
      ${sectionHead(last ? `Schedule till ${last.label}` : 'Schedule', site.courses_heading, site.courses_text)}
      <div class="course-filter reveal" role="group" aria-label="Filter programs">
        <button type="button" class="chip is-active" data-filter="all">All <span>${total}</span></button>
        <button type="button" class="chip" data-filter="online">Online</button>
        <button type="button" class="chip" data-filter="in-person">In Person</button>
      </div>
      <div class="course-list">
        ${groups.length ? groups.map((g) => `
          <section class="month" data-month="${esc(g.key)}">
            <h3 class="month-label">${esc(g.label)}</h3>
            ${g.courses.map(renderCourseCard).join('')}
          </section>`).join('') : `<p class="empty">${ph('No upcoming programs right now — add rows to data/courses.csv')}</p>`}
        <p class="empty filter-empty" hidden>No programs match this filter.</p>
      </div>
      <p class="fine-print">*Your contribution benefits a host of social projects. ${safeUrl(site.courses_source_url)
        ? `Course list from <a href="${esc(safeUrl(site.courses_source_url))}" target="_blank" rel="noopener">artofliving.org</a>.` : ''}</p>
    </div>`;
}

export function renderJournal(site, journal) {
  const rows = byOrder(journal);
  const f = rows.find((r) => /^(yes|true|1)$/i.test(r.featured)) || rows[0] || {};
  const link = safeUrl(f.link_url);
  return `
    <div class="container">
      ${sectionHead('Journal', site.journal_heading, site.journal_text)}
      <div class="journal reveal">
        <div class="journal-img">${img(f.image_url, f.title, '', 'Journal image placeholder')}</div>
        <div class="journal-body">
          <p class="eyebrow">Featured Reflection</p>
          <h3>${text(f.title, 'Reflection title placeholder')}</h3>
          <p>${text(f.excerpt, 'Reflection excerpt placeholder — add it in data/journal.csv')}</p>
          ${f.quote ? `<blockquote>“${esc(f.quote)}”</blockquote>` : ''}
          ${link ? button(link, 'Read more', 'btn btn-outline btn-sm') : ''}
        </div>
      </div>
      <div class="whatsapp-cta reveal">
        <div>
          <h3>Receive daily wisdom directly on WhatsApp</h3>
          <p>Join a growing community of seekers receiving reflections and inspiration every day.</p>
        </div>
        ${button(site.whatsapp_channel_url, 'Join WhatsApp Channel', 'btn btn-gold', 'WhatsApp channel link coming soon')}
      </div>
    </div>`;
}

export function renderMedia(site, videos, reels) {
  const vids = byOrder(videos);
  const rls = byOrder(reels);
  return `
    <div class="container">
      ${sectionHead('Media', site.media_heading, site.media_text)}
      <h3 class="sub-head">${icon('youtube')} YouTube</h3>
      <div class="video-grid">
        ${vids.map((v) => {
          const id = youtubeId(v.video_id);
          const thumb = safeUrl(v.thumbnail_url) || (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '');
          const inner = `<div class="thumb">${img(thumb, v.title, '', 'Video placeholder')}<span class="play">${icon('play')}</span></div>
            <p>${text(v.title, 'Video title placeholder')}</p>`;
          return id
            ? `<button type="button" class="video reveal" data-video="${esc(id)}" aria-label="Play ${esc(v.title || 'video')}">${inner}</button>`
            : `<div class="video is-placeholder reveal">${inner}</div>`;
        }).join('') || `<p class="empty">${ph('Add rows to data/youtube.csv')}</p>`}
      </div>
      <div class="center">${button(site.youtube_channel_url, 'View More on YouTube', 'btn btn-outline', 'YouTube channel link coming soon')}</div>

      <h3 class="sub-head">${icon('instagram')} Instagram Reels</h3>
      <div class="reel-grid">
        ${rls.map((r) => {
          const href = safeUrl(r.reel_url);
          const inner = `${img(r.thumbnail_url, r.title, '', 'Reel placeholder')}<span class="reel-title">${text(r.title, 'Reel title')}</span>`;
          return href
            ? `<a class="reel reveal" href="${esc(href)}" target="_blank" rel="noopener">${inner}</a>`
            : `<div class="reel reveal">${inner}</div>`;
        }).join('') || `<p class="empty">${ph('Add rows to data/reels.csv')}</p>`}
      </div>
      <div class="center">${button(site.instagram_profile_url, 'Follow on Instagram', 'btn btn-outline', 'Instagram link coming soon')}</div>
    </div>`;
}

export function renderTestimonials(site, testimonials) {
  const rows = byOrder(testimonials);
  if (!rows.length) rows.push({});
  return `
    <div class="container narrow">
      ${sectionHead('Voices', site.testimonials_heading)}
      <div class="testimonials reveal" data-carousel>
        <div class="carousel-track">
          ${rows.map((t, i) => `
            <blockquote class="slide testimonial${i === 0 ? ' is-active' : ''}">
              ${icon('quote')}
              <p>${isBlank(t.quote) ? ph('Testimonial placeholder — add quotes in data/testimonials.csv') : `“${esc(t.quote)}”`}</p>
              <footer><strong>${text(t.name, 'Name')}</strong><span>${text(t.designation, 'Designation')}</span></footer>
            </blockquote>`).join('')}
        </div>
        ${rows.length > 1 ? `
          <button class="carousel-btn prev" type="button" aria-label="Previous testimonial">${icon('chevron-left')}</button>
          <button class="carousel-btn next" type="button" aria-label="Next testimonial">${icon('chevron-right')}</button>
          <div class="dots">${rows.map((_, i) => `<button type="button" aria-label="Go to testimonial ${i + 1}"${i === 0 ? ' class="is-active"' : ''}></button>`).join('')}</div>` : ''}
      </div>
    </div>`;
}

export function renderFooter(site, social, year = new Date().getFullYear()) {
  const phone = String(site.contact_phone || '').replace(/[^\d+]/g, '');
  const wa = String(site.contact_whatsapp || '').replace(/[^\d]/g, '');
  const links = byOrder(social);
  return `
    <div class="container footer-grid">
      <div>
        <p class="brand light">${text(site.teacher_name, 'Teacher name')}</p>
        <p class="footer-quote">${text(site.footer_quote, 'Footer quote')}</p>
      </div>
      <div class="contact">
        <h3>Connect</h3>
        <p>${icon('mail')}${site.contact_email ? `<a href="mailto:${esc(site.contact_email)}">${esc(site.contact_email)}</a>` : ph('Email placeholder')}</p>
        <p>${icon('phone')}${phone ? `<a href="tel:${esc(phone)}">${esc(site.contact_phone)}</a>` : ph('Phone placeholder')}</p>
        ${button(wa ? `https://wa.me/${wa}` : '', 'Request a Session', 'btn btn-gold btn-sm', 'WhatsApp number coming soon')}
      </div>
      <div>
        <h3>Follow</h3>
        <ul class="social">
          ${links.map((s) => {
            const href = safeUrl(s.url);
            const name = String(s.platform || 'link').toLowerCase();
            return href
              ? `<li><a href="${esc(href)}" target="_blank" rel="noopener" aria-label="${esc(name)}">${icon(name)}</a></li>`
              : `<li><span class="is-disabled" title="${esc(name)} link coming soon" aria-label="${esc(name)} (coming soon)">${icon(name)}</span></li>`;
          }).join('')}
        </ul>
      </div>
    </div>
    <p class="copyright container">© ${year} ${text(site.copyright, 'Copyright')}</p>`;
}
