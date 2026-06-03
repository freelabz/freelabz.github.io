# Freelabz website — developer guide

Static marketing site for **Freelabz**, a French offensive-cybersecurity company
(audit, pentest, Cloud/DevOps support, and the Secator tooling).

- **Hosting:** GitHub Pages, custom domain `freelabz.com` (see `CNAME`).
- **Stack:** plain HTML + Tailwind CSS (compiled). No framework, no bundler.
- **Primary file:** `index.html` — the entire site is one page (hero + sections).

---

## Repository layout

```
index.html              ← THE source of truth (French content baked in + i18n data)
en/index.html           ← GENERATED English page — DO NOT edit by hand
scripts/build-i18n.js   ← generates en/index.html from index.html
src/input.css           ← Tailwind entry
dist/style.css          ← compiled Tailwind output (committed; served to browsers)
tailwind.config.js
Makefile                ← build targets
package.json            ← npm scripts (build:css, build:i18n, build)
assets/                 ← images, logos, favicons, the Secator demo video
sitemap.xml, robots.txt, llms.txt   ← SEO / GEO files
CNAME                   ← freelabz.com
```

---

## Building

Tailwind must be recompiled when class names change; the EN page must be
regenerated when `index.html` changes.

```bash
npm run build         # CSS (minified) + EN page
npm run build:css     # Tailwind only  (or: make build_dev to watch)
npm run build:i18n    # regenerate en/index.html  (or: make build_i18n)
make build_prod       # minified CSS + EN page (production)
```

> ⚠️ After **any** edit to `index.html`, run `npm run build:i18n` so `en/index.html`
> stays in sync. CI does not do this automatically.

### Important Tailwind caveat
The compiled `dist/style.css` only contains the utility classes that existed when
it was last built. **Arbitrary / newly-introduced Tailwind classes frequently do
NOT take effect** unless you rebuild the CSS. For this reason much of the page uses
**inline `style="..."` attributes** instead of utility classes — this is
intentional and reliable, not an accident. When a layout tweak "doesn't apply,"
the cause is almost always an uncompiled Tailwind class; either rebuild the CSS or
use an inline style.

---

## Internationalization (i18n)

The site ships **two real, indexable URLs** (good for SEO), not a client-side
language swap:

- `/`     → French  (`index.html`, `<html lang="fr">`)
- `/en/`  → English (`en/index.html`, `<html lang="en">`)

### Single source of truth
`index.html` contains:
1. The **French** copy baked directly into the HTML (what crawlers see at `/`).
2. A `translations` object (inside the bottom `<script>`) with **both** `fr` and
   `en` strings, keyed by `data-i18n*` attributes.

Translatable elements are marked with:
- `data-i18n="key"`            → replaces `textContent`
- `data-i18n-html="key"`       → replaces `innerHTML` (use when the value contains
                                  markup such as `<span class="text-freelabz-yellow">`)
- `data-i18n-placeholder="key"`→ replaces an input/textarea `placeholder`

### The generator: `scripts/build-i18n.js`
Run via `npm run build:i18n`. It:
1. Reads `index.html`, extracts the `translations` object (brace-matched, then
   evaluated).
2. Loads the DOM with **cheerio** and swaps every `data-i18n*` node to its English
   value.
3. Sets `<html lang="en">`, the English `<title>` / meta description / Open Graph /
   Twitter tags, and the canonical + `hreflang` for `/en/`.
4. Rewrites root-relative asset paths `./…` → `../…` (because `/en/` is one
   directory deeper). It deepens `link[href]`, `script[src]`, `img[src]`,
   `source[srcset]`, `video[src]`, `video[poster]`.
5. Writes `en/index.html` with an "AUTO-GENERATED — do not edit" banner.

The English `<title>` and meta description are defined as constants near the top of
the script (`TITLE_EN`, `DESC_EN`) — edit them there, not in the generated file.
The generator warns about any `data-i18n` key missing an `en` translation.

### Adding or changing copy
1. Edit the French text in `index.html` (and give new elements a `data-i18n*` key).
2. Add/update the matching `fr` **and** `en` entries in the `translations` object.
3. Run `npm run build:i18n`.

### The language switcher (runtime)
Each page's language is fixed by its URL. The navbar/mobile dropdown
(`selectLang()`) simply **navigates**: French → `/`, English → `/en/`. There is no
runtime DOM text-swapping and no `localStorage`/browser auto-detection (removed on
purpose so the URL is authoritative for SEO). On load, a small IIFE only syncs the
dropdown's active state to `document.documentElement.lang`.

---

## Media & assets

- **Logo:** header uses `assets/logo_freelabz_256.webp` (+ `.png` fallback via
  `<picture>`, 12 KB). The full-res `assets/logo_freelabz.png` (835×835) is kept for
  Open Graph / schema / favicon source only.
- **Favicons:** `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`,
  `apple-touch-icon.png` — generated from the logo with ImageMagick.
- **Secator demo:** `assets/secator_demo.mp4` (1.2 MB) — converted from the original
  16 MB `demo.gif` with ffmpeg (1920×1080 → 900px wide, 12 fps, H.264). Shown as a
  muted/loop `<video preload="none">` that plays only when scrolled into view
  (IntersectionObserver), and opens enlarged in the lightbox. To regenerate from a
  new GIF:
  ```bash
  ffmpeg -y -i demo.gif -movflags +faststart -pix_fmt yuv420p -r 12 \
    -vf "scale='min(900,iw)':-2" -c:v libx264 -crf 30 -preset slow secator_demo.mp4
  ffmpeg -y -ss 5 -i secator_demo.mp4 -frames:v 1 \
    -vf "scale='min(900,iw)':-2" secator_demo_poster.jpg
  ```
- **Below-the-fold images** (employee photos, client logos, screenshot) use
  `loading="lazy" decoding="async"`.
- **Lightbox** (`#gif-lightbox`): one overlay reused for both the screenshot (img)
  and the demo (video); JS toggles which child is shown. `z-index:200`; the sticky
  header is `z-index:300` so the navbar stays clickable above it.

---

## SEO / GEO

- Title 50–60 chars; meta description ~150 chars (FR) / generated EN equivalent.
- `hreflang` (`fr`, `en`, `x-default`→FR) + `rel=canonical` on both pages.
- Open Graph + Twitter Card tags; `og:locale` per language with `:alternate`.
- **JSON-LD `Organization`** schema in `<head>` (identity / brand entity, `sameAs`
  social profiles). Same entity on both pages.
- `sitemap.xml` (both URLs with hreflang annotations), `robots.txt`, and `llms.txt`
  (GEO summary for LLM/AI search). Keep `llms.txt` in sync with services/products
  when they change.

Business identity is documented in the JSON-LD and the footer `<address>`:
Freelabz SAS, SIREN 990 919 359, 29 Avenue Denfert-Rochereau, 42000 Saint-Étienne;
founders Olivier Cervello (Président) & Wally Chaibi (Directeur Général); founded
2025-08-29. Source of record: https://www.pappers.fr/entreprise/freelabz-990919359

### Known open items (need off-site action or a decision, not code)
- Backlinks / link building (off-site).
- Analytics tool not installed (pick GA4 / Plausible / none).
- DMARC + SPF DNS records (set at the domain registrar/DNS, not in this repo).
- No public phone number (none on the registry); footer shows address + email only.
- "Mentions légales" / "Politique de confidentialité" footer links still point to `#`
  (no dedicated pages yet — legally expected for a French SAS).
- Many inline styles (flagged low-priority; see Tailwind caveat above for why).

---

## Conventions & gotchas

- The brand yellow is muted via CSS overrides at the top `<style>` block
  (`.text-freelabz-yellow`, etc. → `#DFB040`) and white text is softened — these
  `!important` rules override the Tailwind theme colors in `tailwind.config.js`.
- The hero is full-viewport-height (`100vh - 5.5rem` navbar) and vertically
  centred; a bouncing scroll-indicator chevron fades out on first scroll.
- Services section shows 6 cards, then a "Voir plus / See more" button reveals 3
  more (`#extra-cards`) and scrolls down slightly.
- Contact uses a modal (Formspree + reCAPTCHA). "Demander un devis" / "Nous
  contacter" links open it via JS.
- Section reveal-on-scroll animations use `.reveal` + IntersectionObserver.
