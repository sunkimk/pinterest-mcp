// Pinterest client built on the JSON "resource" endpoints the pinterest.com web app uses.
// Works without login and without a browser. Logged-out search results carry obfuscated
// pin ids ("e1_..."), so pin details and related pins need a real pin link or numeric id.
import { fetch, ProxyAgent } from 'undici';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export const BASE = 'https://www.pinterest.com';
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const LOCALE = process.env.MCP_PINTEREST_LOCALE || 'en-US';
const TIMEOUT_MS = Number(process.env.MCP_PINTEREST_TIMEOUT_MS) || 20000;
const MAX_PAGES = 12;

const proxyUrl =
  process.env.MCP_PINTEREST_PROXY ||
  process.env.HTTPS_PROXY ||
  process.env.https_proxy ||
  process.env.HTTP_PROXY ||
  process.env.http_proxy ||
  '';
const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;

export const DOWNLOAD_ROOT =
  process.env.MCP_PINTEREST_DOWNLOAD_DIR || path.join(os.homedir(), 'Downloads', 'pinterest-mcp');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function request(url, init = {}, retries = 2) {
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetch(url, {
        ...init,
        dispatcher,
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { 'User-Agent': UA, 'Accept-Language': LOCALE, ...init.headers },
      });
    } catch (err) {
      if (attempt < retries) {
        await sleep(600 * (attempt + 1));
        continue;
      }
      const hint = proxyUrl ? '' : ' (if pinterest.com is blocked on your network, set MCP_PINTEREST_PROXY)';
      throw new Error(`Network error reaching ${new URL(url).host}: ${err.cause?.message || err.message}${hint}`);
    }
    if ((res.status === 429 || res.status >= 500) && attempt < retries) {
      await sleep(1000 * (attempt + 1));
      continue;
    }
    return res;
  }
}

// Pinterest ties pagination bookmarks to the anonymous session cookie, so keep one jar
// for www.pinterest.com and send it back on every resource call.
const jar = new Map();
function remember(res) {
  for (const c of res.headers.getSetCookie?.() || []) {
    const [pair] = c.split(';');
    const i = pair.indexOf('=');
    if (i > 0) jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
  }
}
const cookieHeader = () => [...jar].map(([k, v]) => `${k}=${v}`).join('; ');

async function resource(name, options, sourceUrl, handler) {
  const qs = new URLSearchParams({
    source_url: sourceUrl,
    data: JSON.stringify({ options, context: {} }),
    _: String(Date.now()),
  });
  const res = await request(`${BASE}/resource/${name}/get/?${qs}`, {
    headers: {
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      'X-Pinterest-AppState': 'active',
      'X-Pinterest-PWS-Handler': handler,
      ...(jar.size ? { Cookie: cookieHeader() } : {}),
      ...(jar.get('csrftoken') ? { 'X-CSRFToken': jar.get('csrftoken') } : {}),
    },
  });
  remember(res);
  let body;
  try {
    body = await res.json();
  } catch {
    throw new Error(`Pinterest returned a non-JSON response (HTTP ${res.status}) for ${name}`);
  }
  const rr = body?.resource_response;
  if (!res.ok || rr?.error) {
    const msg = rr?.error?.message || rr?.message || `HTTP ${res.status}`;
    const err = new Error(`Pinterest ${name}: ${msg}`);
    err.status = rr?.error?.http_status || res.status;
    throw err;
  }
  return { data: rr?.data, bookmark: rr?.bookmark };
}

// ---------- normalisation ----------

const clean = (s, max = 280) => {
  if (!s || typeof s !== 'string') return undefined;
  const t = s.replace(/\s+/g, ' ').trim();
  if (!t) return undefined;
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
};

// Hashtag walls ("#ui #ux #design …") waste tokens; keep the prose and the first few tags.
function tidyTags(s) {
  if (!s) return s;
  const tags = s.match(/#[^\s#]+/g) || [];
  if (tags.length <= 5) return s;
  const prose = s.replace(/#[^\s#]+/g, '').replace(/\s+/g, ' ').trim();
  return `${prose} ${tags.slice(0, 5).join(' ')}`.trim();
}

function pickImage(images, ...keys) {
  for (const k of keys) if (images?.[k]?.url) return images[k];
  return undefined;
}

export function normalizePin(p) {
  if (!p || p.type !== 'pin' || p.is_promoted) return null;
  const orig = pickImage(p.images, 'orig', '736x', '564x', '474x', '236x');
  if (!orig) return null;
  const numeric = /^\d+$/.test(String(p.id));
  const saves = p.aggregated_pin_data?.aggregated_stats?.saves ?? p.repin_count;
  const reactions = p.reaction_counts
    ? Object.values(p.reaction_counts).reduce((a, b) => a + (Number(b) || 0), 0)
    : undefined;
  return strip({
    id: numeric ? String(p.id) : undefined,
    pin_url: numeric ? `${BASE}/pin/${p.id}/` : undefined,
    title: clean(p.title || p.grid_title, 140),
    description: clean(tidyTags(p.description), 160),
    alt_text: clean(p.auto_alt_text || p.seo_alt_text, 200),
    image_url: orig.url,
    width: orig.width,
    height: orig.height,
    dominant_color: p.dominant_color,
    is_video: Boolean(p.videos || p.story_pin_data?.pages?.some?.((pg) => pg?.blocks?.some?.((b) => b?.video))) || undefined,
    source_link: p.link || undefined,
    source_domain: p.domain && p.domain !== 'Uploaded by user' ? p.domain : undefined,
    board: p.board?.url ? strip({ name: p.board.name, url: `${BASE}${p.board.url}` }) : undefined,
    pinner: p.pinner?.username || undefined,
    saves: Number.isFinite(saves) && saves > 0 ? saves : undefined,
    reactions: reactions || undefined,
    created_at: p.created_at ? new Date(p.created_at).toISOString().slice(0, 10) : undefined,
  });
}

function strip(obj) {
  for (const k of Object.keys(obj)) if (obj[k] === undefined || obj[k] === null || obj[k] === '') delete obj[k];
  return obj;
}

function collect(items, out, seen, limit) {
  const before = out.length;
  for (const raw of items || []) {
    if (out.length >= limit) break;
    const pin = normalizePin(raw);
    if (!pin || seen.has(pin.image_url)) continue;
    seen.add(pin.image_url);
    out.push(pin);
  }
  return out.length - before;
}

// Paginates a resource until `limit` pins are collected or the feed ends.
// Pinterest now and then ignores the bookmark and replays page one marked "-end-";
// a page that adds nothing new, or an early "-end-" when `expected` says more exist,
// is retried with the same bookmark before giving up.
async function paged(fetchPage, limit, bookmark, expected = 0) {
  const out = [];
  const seen = new Set();
  let next = bookmark || undefined;
  let retries = 0;
  for (let page = 0; page < MAX_PAGES && out.length < limit; page++) {
    const { items, bookmark: bm } = await fetchPage(next);
    const added = collect(items, out, seen, limit);
    const endedEarly = (!bm || bm === '-end-') && out.length < Math.min(limit, expected * 0.9);
    if (((next && !added) || endedEarly) && retries < 3) {
      retries++;
      // A degraded session keeps serving the same short feed; start a fresh one.
      if (!next) jar.clear();
      await sleep(300 * retries);
      page--;
      continue;
    }
    retries = 0;
    next = bm && bm !== '-end-' ? bm : undefined;
    if (!next || !items?.length) break;
  }
  return { pins: out, next_bookmark: next };
}

// ---------- public API ----------

export async function searchPins(query, { limit = 20, bookmark } = {}) {
  const sourceUrl = `/search/pins/?q=${encodeURIComponent(query)}&rs=typed`;
  return paged(async (bm) => {
    const options = { query, scope: 'pins', rs: 'typed', redux_normalize_feed: true };
    if (bm) options.bookmarks = [bm];
    const { data, bookmark: next } = await resource('BaseSearchResource', options, sourceUrl, 'www/search/[scope].js');
    return { items: data?.results, bookmark: next };
  }, limit, bookmark);
}

// Accepts a numeric id, a pinterest.*/pin/<id> URL (any regional domain) or a pin.it short link.
export async function resolvePinId(input) {
  const s = String(input).trim();
  if (/^\d+$/.test(s)) return s;
  if (/^e1_/.test(s)) {
    throw new Error(
      'This is an anonymous search-result id, which Pinterest does not let logged-out clients look up. ' +
        'Everything it has is already in the search result; for details or related pins use a real pin link (pinterest.com/pin/<number>/).'
    );
  }
  let url;
  try {
    url = new URL(/^https?:\/\//.test(s) ? s : `https://${s}`);
  } catch {
    throw new Error(`Not a pin id or pin URL: ${s}`);
  }
  if (url.hostname === 'pin.it') {
    const res = await request(url.href, { redirect: 'follow' });
    url = new URL(res.url);
    await res.body?.cancel();
  }
  const m = url.pathname.match(/\/pin\/(?:[^/]*--)?(\d+)/);
  if (!m) throw new Error(`Could not find a pin id in ${s}`);
  return m[1];
}

export async function getPin(input) {
  const id = await resolvePinId(input);
  const { data } = await resource('PinResource', { id, field_set_key: 'detailed' }, `/pin/${id}/`, 'www/pin/[id].js');
  const pin = normalizePin({ ...data, is_promoted: false });
  if (!pin) throw new Error(`Pin ${id} has no image`);
  return strip({
    ...pin,
    description: clean(data.description, 2000),
    comments: data.comment_count || undefined,
    hashtags: data.hashtags?.length ? data.hashtags : undefined,
    rich_summary: data.rich_summary?.display_name ? clean(data.rich_summary.display_name, 200) : undefined,
  });
}

export async function relatedPins(input, { limit = 20, bookmark } = {}) {
  const id = await resolvePinId(input);
  return paged(async (bm) => {
    const options = {
      pin_id: id,
      context_pin_ids: [],
      search_query: '',
      source: 'deep_linking',
      top_level_source: 'deep_linking',
      top_level_source_depth: 1,
      is_pdp: false,
    };
    if (bm) options.bookmarks = [bm];
    const { data, bookmark: next } = await resource('RelatedModulesResource', options, `/pin/${id}/`, 'www/pin/[id].js');
    return { items: data, bookmark: next };
  }, limit, bookmark);
}

function parseBoard(input) {
  let s = String(input).trim();
  if (/^https?:\/\//.test(s) || /pinterest\./.test(s)) {
    s = new URL(/^https?:\/\//.test(s) ? s : `https://${s}`).pathname;
  }
  const parts = s.split('/').filter(Boolean);
  if (parts.length < 2) throw new Error(`Expected a board URL like pinterest.com/<user>/<board>/, got: ${input}`);
  return { username: decodeURIComponent(parts[0]), slug: decodeURIComponent(parts[1]), path: `/${parts[0]}/${parts[1]}/` };
}

export async function boardPins(input, { limit = 25, bookmark } = {}) {
  const b = parseBoard(input);
  const handler = 'www/[username]/[slug].js';
  const { data: board } = await resource(
    'BoardResource',
    { username: b.username, slug: b.slug, field_set_key: 'detailed' },
    b.path,
    handler
  );
  const result = await paged(async (bm) => {
    const options = { board_id: board.id, board_url: b.path, page_size: 100, field_set_key: 'react_grid_pin' };
    if (bm) options.bookmarks = [bm];
    const { data, bookmark: next } = await resource('BoardFeedResource', options, b.path, handler);
    return { items: data, bookmark: next };
  }, limit, bookmark, board.pin_count);
  return {
    board: strip({
      name: board.name,
      url: `${BASE}${b.path}`,
      description: clean(board.description),
      pin_count: board.pin_count,
      owner: board.owner?.username,
    }),
    ...result,
  };
}

// ---------- images ----------

function assertPinimg(u) {
  let url;
  try {
    url = new URL(u);
  } catch {
    throw new Error(`Invalid image URL: ${u}`);
  }
  if (url.protocol !== 'https:' || !/(^|\.)pinimg\.com$/.test(url.hostname)) {
    throw new Error(`Only https://*.pinimg.com image URLs are allowed: ${u}`);
  }
  return url;
}

// i.pinimg.com/<size>/aa/bb/cc/hash.jpg — swap the size segment. Resized renditions are
// always JPEG, even when the original is a PNG or GIF, so the extension changes with them.
export function resizeUrl(u, size) {
  const swapped = u.replace(/(pinimg\.com\/)(originals|\d+x\d*(?:_RS)?)\//, `$1${size}/`);
  return size === 'originals' ? swapped : swapped.replace(/\.(png|gif|webp)$/i, '.jpg');
}

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp' };

async function fetchImage(u, sizes) {
  assertPinimg(u);
  const candidates = [...new Set(sizes.map((s) => resizeUrl(u, s)).concat(u))];
  let lastErr;
  for (const c of candidates) {
    const res = await request(c, { headers: { Referer: `${BASE}/` } }, 1);
    const type = (res.headers.get('content-type') || '').split(';')[0];
    if (res.ok && type.startsWith('image/')) {
      return { url: c, type, buf: Buffer.from(await res.arrayBuffer()) };
    }
    await res.body?.cancel();
    lastErr = `HTTP ${res.status}`;
  }
  throw new Error(`Could not fetch ${u}: ${lastErr}`);
}

export async function fetchPreview(u, size = '236x') {
  const { type, buf } = await fetchImage(u, [size, '474x']);
  return { mimeType: type, data: buf.toString('base64') };
}

async function mapLimit(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx], idx);
      }
    })
  );
  return out;
}

const safeName = (s) =>
  String(s || '')
    .normalize('NFKC')
    .replace(/[\\/:*?"<>|\x00-\x1f]+/g, ' ')
    .replace(/\s+/g, '_')
    .replace(/^[._]+|[._]+$/g, '')
    .slice(0, 60);

export async function downloadImages(urls, { folder, size = 'originals', directory } = {}) {
  const root = path.resolve(directory || DOWNLOAD_ROOT);
  const dir = folder ? path.join(root, safeName(folder) || 'pins') : root;
  await fs.mkdir(dir, { recursive: true });
  const sizes = size === 'originals' ? ['originals', '736x'] : [size, '736x', 'originals'];
  const results = await mapLimit(urls, 4, async (u, idx) => {
    try {
      const img = await fetchImage(u, sizes);
      const hash = path.basename(new URL(img.url).pathname).replace(/\.\w+$/, '') ||
        crypto.createHash('sha1').update(img.url).digest('hex').slice(0, 16);
      const file = path.join(dir, `${String(idx + 1).padStart(2, '0')}_${hash}.${EXT[img.type] || 'jpg'}`);
      await fs.writeFile(file, img.buf);
      return { ok: true, url: img.url, path: file, bytes: img.buf.length };
    } catch (err) {
      return { ok: false, url: u, error: err.message };
    }
  });
  return { directory: dir, saved: results.filter((r) => r.ok), failed: results.filter((r) => !r.ok) };
}
