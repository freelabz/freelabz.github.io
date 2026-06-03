#!/usr/bin/env node
/**
 * build-i18n.js — generates the English page (en/index.html) from the French
 * source of truth (index.html).
 *
 * There is NO hand-maintained duplicate. index.html holds:
 *   - the French content baked into the HTML (default), and
 *   - the `translations` object (fr + en) used here at build time.
 *
 * This script swaps every [data-i18n*] node to its English value, rewrites the
 * <head> metadata, fixes relative asset paths (../ since /en/ is one level deep),
 * and writes en/index.html. Re-run it whenever index.html changes:
 *
 *   npm run build:i18n      (or: node scripts/build-i18n.js)
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'index.html');
const OUT_DIR = path.join(ROOT, 'en');
const OUT = path.join(OUT_DIR, 'index.html');
const SITE = 'https://freelabz.com';

const html = fs.readFileSync(SRC, 'utf8');

// --- 1. Extract the `translations` object from the inline script -------------
function extractTranslations(source) {
  const marker = 'const translations = ';
  const start = source.indexOf(marker);
  if (start === -1) throw new Error('Could not find `const translations =` in index.html');
  // Brace-match from the first "{" after the marker.
  let i = source.indexOf('{', start);
  const objStart = i;
  let depth = 0, inStr = null, prev = '';
  for (; i < source.length; i++) {
    const c = source[i];
    if (inStr) {
      if (c === inStr && prev !== '\\') inStr = null;
    } else if (c === '"' || c === "'" || c === '`') {
      inStr = c;
    } else if (c === '{') {
      depth++;
    } else if (c === '}') {
      depth--;
      if (depth === 0) { i++; break; }
    }
    prev = c;
  }
  const objText = source.slice(objStart, i);
  // eslint-disable-next-line no-new-func
  return Function('"use strict"; return (' + objText + ');')();
}

const translations = extractTranslations(html);
const en = translations.en;
if (!en) throw new Error('No `en` block found in translations');

// --- 2. Load DOM and swap content to English ---------------------------------
const $ = cheerio.load(html, { decodeEntities: false });

let missing = [];
function get(key) {
  if (en[key] === undefined) { missing.push(key); return undefined; }
  return en[key];
}

$('[data-i18n]').each((_, el) => {
  const v = get($(el).attr('data-i18n'));
  if (v !== undefined) $(el).text(v);
});
$('[data-i18n-html]').each((_, el) => {
  const v = get($(el).attr('data-i18n-html'));
  if (v !== undefined) $(el).html(v);
});
$('[data-i18n-placeholder]').each((_, el) => {
  const v = get($(el).attr('data-i18n-placeholder'));
  if (v !== undefined) $(el).attr('placeholder', v);
});

if (missing.length) {
  console.warn('⚠  Missing EN translations for keys:', [...new Set(missing)].join(', '));
}

// --- 3. <html lang> ----------------------------------------------------------
$('html').attr('lang', 'en');

// --- 4. Head metadata (English) ---------------------------------------------
const TITLE_EN = 'Freelabz - Offensive cybersecurity for everyone';
const DESC_EN = 'Freelabz: security audits, pentesting, Cloud & DevOps support and offensive cybersecurity tools like Secator. Protect your business.';

$('title').text(TITLE_EN);
$('meta[name="description"]').attr('content', DESC_EN);

// Canonical + hreflang (reciprocal of the French page)
$('link[rel="canonical"]').attr('href', SITE + '/en/');
$('link[rel="alternate"][hreflang="fr"]').attr('href', SITE + '/');
$('link[rel="alternate"][hreflang="en"]').attr('href', SITE + '/en/');
$('link[rel="alternate"][hreflang="x-default"]').attr('href', SITE + '/');

// Open Graph
$('meta[property="og:title"]').attr('content', TITLE_EN);
$('meta[property="og:description"]').attr('content', DESC_EN);
$('meta[property="og:url"]').attr('content', SITE + '/en/');
$('meta[property="og:locale"]').attr('content', 'en_US');
$('meta[property="og:locale:alternate"]').attr('content', 'fr_FR');

// Twitter
$('meta[name="twitter:title"]').attr('content', TITLE_EN);
$('meta[name="twitter:description"]').attr('content', DESC_EN);

// --- 5. Fix relative paths (/en/ is one directory deeper) ---------------------
function deepen(sel, attr) {
  $(sel).each((_, el) => {
    const val = $(el).attr(attr);
    if (val && val.startsWith('./')) $(el).attr(attr, '../' + val.slice(2));
  });
}
deepen('link[href^="./"]', 'href');
deepen('script[src^="./"]', 'src');
deepen('img[src^="./"]', 'src');
// Logo home link and any in-page anchors stay as-is (#... and / are root-absolute).

// --- 6. Write output ---------------------------------------------------------
fs.mkdirSync(OUT_DIR, { recursive: true });
const banner = '<!-- AUTO-GENERATED from ../index.html by scripts/build-i18n.js — do not edit by hand. -->\n';
fs.writeFileSync(OUT, banner + $.html());

console.log('✓ Generated en/index.html (' + Object.keys(en).length + ' keys applied)');
