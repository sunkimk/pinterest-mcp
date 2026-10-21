#!/usr/bin/env node
// Pinterest MCP server (stdio). Everything diagnostic goes to stderr: stdout carries JSON-RPC.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  DOWNLOAD_ROOT,
  boardPins,
  downloadImages,
  fetchPreview,
  getPin,
  relatedPins,
  searchPins,
} from './pinterest.js';

const MAX_PREVIEWS = 16;
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };

const server = new McpServer({ name: 'pinterest', version: '1.1.0' });

const json = (value) => ({ type: 'text', text: JSON.stringify(value) });

async function withPreviews(pins, count) {
  const picked = pins.slice(0, Math.min(count, MAX_PREVIEWS));
  const blocks = await Promise.all(
    picked.map(async (p, i) => {
      try {
        const img = await fetchPreview(p.image_url);
        const lowRes = p.low_res ? ` [low-res: ${p.width}×${p.height}]` : '';
        return [{ type: 'text', text: `#${i + 1}${p.title ? ` ${p.title}` : ''}${lowRes}` }, { type: 'image', ...img }];
      } catch {
        return [];
      }
    })
  );
  return blocks.flat();
}

function tool(name, config, handler) {
  server.registerTool(name, config, async (args) => {
    try {
      return await handler(args);
    } catch (err) {
      process.stderr.write(`[pinterest] ${name} failed: ${err.stack || err.message}\n`);
      return { isError: true, content: [{ type: 'text', text: err.message }] };
    }
  });
}

const limit = (def, max) =>
  z.number().int().min(1).max(max).default(def).describe(`How many pins to return (1-${max}, default ${def})`);
const bookmark = z
  .string()
  .optional()
  .describe('Pass next_bookmark from a previous call to get the next page');
const media = z
  .enum(['any', 'video', 'image'])
  .default('any')
  .describe('Only return video pins ("video"), only still images ("image"), or both (default)');
const previews = z
  .number()
  .int()
  .min(0)
  .max(MAX_PREVIEWS)
  .default(0)
  .describe(
    `Also attach small thumbnails of the first N pins so you can actually look at them (0-${MAX_PREVIEWS}, default 0). ` +
      'Use this when judging visual style, layout or colour matters.'
  );

tool(
  'pinterest_search',
  {
    title: 'Search Pinterest',
    description:
      'Search Pinterest pins by keyword (any language) for visual inspiration. Returns title, description, ' +
      'full-size image_url with width/height, dominant colour, source website, board and save count for each pin; ' +
      'video pins also get video_url (MP4) and video_seconds. Pins whose largest image is under 500px wide are marked ' +
      'low_res: true; skip them when you need a full-size reference. Set media to "video" for motion/interaction references. ' +
      'Promoted pins are filtered out. Use next_bookmark to page further. Tips: English keywords usually return more ' +
      'results; add words like "ui", "app", "dribbble", "poster", "moodboard" to steer the style.',
    inputSchema: { query: z.string().min(1).describe('Search keywords'), limit: limit(20, 100), bookmark, media, previews },
    annotations: READ_ONLY,
  },
  async ({ query, limit, bookmark, media, previews }) => {
    const res = await searchPins(query, { limit, bookmark, media });
    const content = [json({ query, count: res.pins.length, next_bookmark: res.next_bookmark, pins: res.pins })];
    if (previews) content.push(...(await withPreviews(res.pins, previews)));
    return { content };
  }
);

const pinRef = z
  .string()
  .min(1)
  .describe('A pin link (pinterest.com/pin/123…/, any regional domain, or a pin.it short link) or a numeric pin id');

tool(
  'pinterest_get_pin',
  {
    title: 'Get Pinterest pin',
    description:
      'Get full details for one pin from its link or numeric id: full description, image, source website, board, ' +
      'creator, saves, comments. Anonymous search ids (e1_…) cannot be looked up — their data is already in the search result.',
    inputSchema: { pin: pinRef, preview: z.boolean().default(false).describe('Attach a thumbnail of the image') },
    annotations: READ_ONLY,
  },
  async ({ pin, preview }) => {
    const p = await getPin(pin);
    const content = [json(p)];
    if (preview) content.push(...(await withPreviews([p], 1)));
    return { content };
  }
);

tool(
  'pinterest_related_pins',
  {
    title: 'Related Pinterest pins',
    description:
      'Find pins visually and topically similar to a given pin ("More like this"). Needs a real pin link or numeric id.',
    inputSchema: { pin: pinRef, limit: limit(20, 100), bookmark, media, previews },
    annotations: READ_ONLY,
  },
  async ({ pin, limit, bookmark, media, previews }) => {
    const res = await relatedPins(pin, { limit, bookmark, media });
    const content = [json({ count: res.pins.length, next_bookmark: res.next_bookmark, pins: res.pins })];
    if (previews) content.push(...(await withPreviews(res.pins, previews)));
    return { content };
  }
);

tool(
  'pinterest_board_pins',
  {
    title: 'Pins on a Pinterest board',
    description:
      'List the pins saved on a public board, e.g. one found in a search result\'s board.url. Accepts a board URL ' +
      '(pinterest.com/<user>/<board>/) or "<user>/<board>".',
    inputSchema: {
      board: z.string().min(1).describe('Board URL or "<user>/<board>"'),
      limit: limit(25, 200),
      bookmark,
      media,
      previews,
    },
    annotations: READ_ONLY,
  },
  async ({ board, limit, bookmark, media, previews }) => {
    const res = await boardPins(board, { limit, bookmark, media });
    const content = [json({ board: res.board, count: res.pins.length, next_bookmark: res.next_bookmark, pins: res.pins })];
    if (previews) content.push(...(await withPreviews(res.pins, previews)));
    return { content };
  }
);

tool(
  'pinterest_preview_images',
  {
    title: 'Look at Pinterest images',
    description:
      'Fetch small thumbnails of pin images (image_url values from other tools) so you can see them. ' +
      `Up to ${MAX_PREVIEWS} at a time.`,
    inputSchema: {
      image_urls: z.array(z.string()).min(1).max(MAX_PREVIEWS).describe('i.pinimg.com image URLs'),
      size: z.enum(['236x', '474x', '736x']).default('236x').describe('Thumbnail width; larger costs more tokens'),
    },
    annotations: READ_ONLY,
  },
  async ({ image_urls, size }) => {
    const content = [];
    for (const [i, u] of image_urls.entries()) {
      try {
        content.push({ type: 'text', text: `#${i + 1} ${u}` }, { type: 'image', ...(await fetchPreview(u, size)) });
      } catch (err) {
        content.push({ type: 'text', text: `#${i + 1} failed: ${err.message}` });
      }
    }
    return { content };
  }
);

tool(
  'pinterest_download',
  {
    title: 'Download Pinterest images and videos',
    description:
      'Save pin images (image_url) and videos (video_url MP4s) to disk; images at full resolution, falling back to 736px when ' +
      `the original is unavailable. Default location: ${DOWNLOAD_ROOT}/<folder>. Returns the saved file paths.`,
    inputSchema: {
      image_urls: z.array(z.string()).min(1).max(200).describe('image_url or video_url values from other tools (*.pinimg.com)'),
      folder: z.string().optional().describe('Sub-folder name, e.g. the search topic'),
      directory: z.string().optional().describe(`Absolute base directory (default ${DOWNLOAD_ROOT})`),
      size: z.enum(['originals', '736x', '474x']).default('originals').describe('Resolution to save'),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
  },
  async ({ image_urls, folder, directory, size }) => {
    const res = await downloadImages(image_urls, { folder, directory, size });
    return {
      content: [json({ directory: res.directory, saved_count: res.saved.length, ...res })],
      isError: res.saved.length === 0,
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
process.stderr.write('[pinterest] MCP server ready on stdio\n');
