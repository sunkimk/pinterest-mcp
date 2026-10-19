// End-to-end: spawns the server over stdio and calls every tool against live pinterest.com.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const PIN = 'https://www.pinterest.com/pin/1128714725389331478/';
const BOARD = 'https://www.pinterest.com/awsmd_com/app-design/';
let client;
let tmp;

const call = async (name, args) => {
  const res = await client.callTool({ name, arguments: args });
  assert.ok(!res.isError, `${name} errored: ${res.content?.[0]?.text}`);
  return { data: JSON.parse(res.content[0].text), content: res.content };
};

before(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'pinterest-mcp-'));
  client = new Client({ name: 'smoke', version: '1.0.0' });
  await client.connect(
    new StdioClientTransport({ command: process.execPath, args: ['src/server.js'], env: { ...process.env, MCP_PINTEREST_DOWNLOAD_DIR: tmp } })
  );
});

after(async () => {
  await client?.close();
  await fs.rm(tmp, { recursive: true, force: true });
});

test('lists six tools', async () => {
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map((t) => t.name).sort(), [
    'pinterest_board_pins',
    'pinterest_download',
    'pinterest_get_pin',
    'pinterest_preview_images',
    'pinterest_related_pins',
    'pinterest_search',
  ]);
});

test('search paginates and attaches previews', async () => {
  const first = await call('pinterest_search', { query: '移动端 登录页 ui', limit: 30, previews: 2 });
  assert.equal(first.data.pins.length, 30);
  assert.ok(first.data.pins.every((p) => p.image_url.includes('pinimg.com')));
  assert.equal(first.content.filter((c) => c.type === 'image').length, 2);
  const second = await call('pinterest_search', { query: '移动端 登录页 ui', limit: 10, bookmark: first.data.next_bookmark });
  const seen = new Set(first.data.pins.map((p) => p.image_url));
  assert.ok(second.data.pins.some((p) => !seen.has(p.image_url)));
});

test('pin details and related pins', async () => {
  const { data: pin } = await call('pinterest_get_pin', { pin: PIN });
  assert.equal(pin.id, '1128714725389331478');
  assert.ok(pin.title && pin.image_url);
  const { data: rel } = await call('pinterest_related_pins', { pin: '1128714725389331478', limit: 15 });
  assert.ok(rel.pins.length >= 10);
});

test('anonymous search ids get a clear error', async () => {
  const res = await client.callTool({ name: 'pinterest_get_pin', arguments: { pin: 'e1_abc' } });
  assert.ok(res.isError);
  assert.match(res.content[0].text, /real pin link/);
});

test('board pins', async () => {
  const { data } = await call('pinterest_board_pins', { board: BOARD, limit: 30 });
  assert.equal(data.board.name, 'App Design');
  assert.equal(data.pins.length, 30);
});

test('download saves files and refuses non-pinimg hosts', async () => {
  const { data: s } = await call('pinterest_search', { query: 'poster design', limit: 3 });
  const { data } = await call('pinterest_download', {
    image_urls: [...s.pins.map((p) => p.image_url), 'https://example.com/a.jpg'],
    folder: 'poster design',
  });
  assert.equal(data.saved.length, 3);
  assert.equal(data.failed.length, 1);
  for (const f of data.saved) assert.ok((await fs.stat(f.path)).size > 1000);
});
