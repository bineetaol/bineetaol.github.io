# Mahesh Sharma — Art of Living Teacher Website

A browser-based, CSV-driven website for Art of Living teacher **Mahesh Sharma**.
All page content (text, stats, photos, courses, YouTube videos, reels,
testimonials, social links) is read at runtime from CSV files in [`data/`](data/),
so the site can be updated without touching any code. When a value is missing,
the page shows a clearly marked placeholder instead of leaving a gap.

It's plain HTML, CSS and JavaScript (ES modules): no framework, no build step
and no dependencies. It runs on GitHub Pages as-is.

---

## Quick start

```bash
git clone https://github.com/bineetaol/bineetaol.github.io.git
cd bineetaol.github.io
python3 -m http.server 8080        # or: npm start
```

Open <http://localhost:8080>.

> The site **must be opened through a web server**. Browsers block JavaScript
> from reading CSV files when a page is opened straight from disk (`file://`).
> The page shows a warning banner if you try. Any static server works
> (`python3 -m http.server`, `npx serve`, VS Code Live Server, GitHub Pages, …).

### Run the tests

Requires Node.js 18 or newer.

```bash
npm test        # runs: node --test tests/
```

The tests cover the CSV parser, date, price and URL helpers, HTML escaping and
URL safety, the section renderers, and a check of every file in `data/`
(valid course dates and links, and no leftover names from the reference site).

### Deploy

Push to the `main` branch of `bineetaol/bineetaol.github.io`. GitHub Pages
serves the repository root, so the site appears at
<https://bineetaol.github.io/> a minute or two later.

---

## Editing content (the CSV files)

Every page section has **its own CSV file**. Edit them in any spreadsheet app
(Excel, Google Sheets, Numbers) and export or save as **CSV, UTF-8**, or edit
them in a text editor. Values that contain commas must be wrapped in double
quotes, which spreadsheet apps do automatically.

Rows with an `order` column are shown in ascending order. **Leave a cell empty
to show a placeholder.**

| File | Section | Columns |
| --- | --- | --- |
| `site.csv` | Page-wide text and settings: name, headings, bio, photos, contact details | `key`, `value`, `notes` |
| `stats.csv` | "Journey so far" counters (animated) | `order`, `value`, `suffix`, `label` |
| `journey.csv` | "Journey with the Master" photo carousel | `order`, `image_url`, `alt`, `caption` |
| `highlights.csv` | Program highlights photo grid | `order`, `title`, `location`, `image_url`, `link_url` |
| `courses.csv` | **Upcoming programs / course schedule** | `id`, `title`, `code`, `start_date`, `end_date`, `start_time`, `end_time`, `mode`, `location`, `city`, `language`, `price_inr`, `register_url`, `details_url`, `poster_url` |
| `journal.csv` | Featured reflection ("Inner Journal") | `order`, `featured`, `title`, `excerpt`, `quote`, `image_url`, `link_url` |
| `youtube.csv` | **YouTube videos** | `order`, `title`, `video_id`, `thumbnail_url` |
| `reels.csv` | Instagram reels | `order`, `title`, `reel_url`, `thumbnail_url` |
| `testimonials.csv` | Testimonials slider | `order`, `quote`, `name`, `designation` |
| `social.csv` | Footer social icons | `order`, `platform`, `url` |

### `site.csv`

A key/value list. The `notes` column is only for people editing the file and
never appears on the page. Useful keys:

- `teacher_name`, `role`, `page_title`, `meta_description`
- `hero_eyebrow`, `hero_heading`, `hero_subtitle`, `hero_image`
- `about_heading`, `about_text`, `about_image`, `about_photos_url`
- `*_heading` and `*_text` for each section's title and intro
- `contact_email`, `contact_phone`, `contact_whatsapp` (digits with country
  code, e.g. `919876543210`), `whatsapp_channel_url`, `youtube_channel_url`,
  `instagram_profile_url`
- `footer_quote`, `copyright` (the current year is added automatically)

### `courses.csv`

- `start_date` and `end_date` use **`YYYY-MM-DD`** (e.g. `2026-12-24`). For a
  one-day course, use the same date in both columns.
- `start_time` and `end_time` look like `6:30 AM`.
- `mode` is `Online` or `In Person`. Online courses ignore `location`.
- `price_inr` is a plain number (`3000` is shown as ₹3,000).
- Courses are grouped by month and sorted by date and time. **Courses whose
  `end_date` has passed are hidden automatically**, so old rows can stay in
  the file.
- The Online / In Person buttons above the list filter it.
- `register_url` is required for an active **Register** button. `details_url`
  and `poster_url` are optional extra buttons.

The current rows were taken from
<https://www.artofliving.org/in-en/t/mahesh-sharma> on 24 Nov 2026. The course
coordinators' personal phone numbers and emails listed there were left out on
purpose; each course links to its official registration page instead.

### `youtube.csv`

`video_id` accepts the 11-character ID (`FQ64QXW8_cg`) or any YouTube link
(`watch?v=`, `youtu.be/`, `shorts/`, `embed/`, `live/`). The thumbnail is
fetched from YouTube automatically unless you set `thumbnail_url`. Clicking a
video plays it in a pop-up using `youtube-nocookie.com`.

### Images

Image columns take a full `https://` URL or a path relative to the site root.
Local photos live in [`data/images/`](data/images/) and are referenced like
`data/images/IMG-20260908-WA0005.jpg`. `npm test` fails if a CSV points to a
local image that doesn't exist. If an image fails to load in the browser, a
placeholder box is shown instead.

### What's still a placeholder

Hero heading, four of the five stats numbers, the journey carousel photos
(photos with Gurudev), section intros for the journey and highlights sections,
the journal entry, Instagram reels, testimonials, contact email/phone/WhatsApp
number, and the official-photos download link.

---

## Project structure

```
index.html            Page shell: empty <section>s filled in by JavaScript
css/styles.css        All styles: design tokens, layout, responsive rules
js/app.js             Bootstrap: loads data, renders sections, wires up interactions
js/dataSource.js      Data layer: section name → CSV file (swap point for a database)
js/csv.js             RFC 4180 CSV parser (quotes, commas, newlines, BOM)
js/render.js          One render function per section; placeholders for missing data
js/utils.js           Pure helpers: escaping, URL safety, dates, prices, YouTube IDs
js/icons.js           Inline SVG icons
data/*.csv            Content, one file per section
tests/*.test.js       Node built-in test runner (no dependencies)
```

### How a page load works

1. `app.js` calls `loadAll()` in `dataSource.js`, which fetches all ten CSV files
   in parallel and parses them with `csv.js`.
2. If one file fails, only that section falls back to placeholders, and a
   banner names the file that failed.
3. Each `render*()` function in `render.js` returns HTML for its section. Every
   CSV value is HTML-escaped, and links are limited to `http(s)`, `mailto`,
   `tel` and relative paths, so a CSV cannot inject scripts.
4. `app.js` then adds the interactions: mobile menu, active-section highlighting
   in the nav, scroll-reveal animations, animated counters, carousels with
   autoplay, the course filter, and the video pop-up. Animations are turned off
   when the visitor has reduced motion enabled.

---

## Moving to a database later

All data access goes through one function, `load(name)`, in
[`js/dataSource.js`](js/dataSource.js). It must return an array of plain objects
whose keys match the CSV column names. To switch to a database or API:

1. Build an endpoint per collection (e.g. `GET /api/courses`) that returns JSON
   rows with the same field names as the CSV columns. The CSV headers are the
   database schema; `site` stays a list of `{ key, value }` rows.
2. Add a source next to `csvSource()`:

   ```js
   export function apiSource(baseUrl = '/api/') {
     return {
       async load(name) {
         const res = await fetch(baseUrl + name);
         if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
         return res.json();
       },
     };
   }
   ```

3. Change `const ACTIVE_SOURCE = csvSource();` to `apiSource()`.

No rendering code needs to change. The current CSV files can be imported
directly as the first database tables.

---

## Reference-site analysis (summary)

This site was designed after studying <https://www.amolnwagle.com/>. All code
here was written from scratch; no code or assets from that site are used.

- **How the reference site is built:** a React 18 single-page app (Vite build,
  generated with Lovable), styled with Tailwind CSS and shadcn-style colour
  tokens, with lucide icons. Its content is fetched at runtime from Sanity
  (a hosted content management system) using nine GROQ query types:
  `hero`, `about`, `statsSection`, `inspiration`, `eventHighlightsSection`,
  `program`, `innerJournal`, `listenSection`, `footerSection`. Fonts are
  Cormorant Garamond and DM Sans; colours are navy and gold.
- **Page flow:** sticky nav → hero → about → animated stats → journey carousel →
  event highlights → schedule grouped by month → journal → YouTube and reels →
  testimonials → contact footer.
- **What this rebuild changes:**
  - Sanity CMS → local CSV files behind a swappable data layer.
  - React and Tailwind → dependency-free vanilla JS and CSS, so there's no
    build step.
  - New: an Online / In Person filter for courses and automatic hiding of
    finished courses.
  - New: visible placeholders for missing content.
  - New: a privacy-friendly YouTube player (`youtube-nocookie.com`).

The analysis used headless Chrome to render the page, plus manual inspection of
the downloaded JS and CSS bundle. REA's static JavaScript analyser
(`rea analyze-javascript-application`) could not run on the development Mac:
the macOS Command Line Tools there define the `SwiftBridging` Swift module
twice, so REA's helper failed to compile.

## Credits

Course data belongs to The Art of Living. The photo and social links come from
Mahesh Sharma's public Art of Living profile.
