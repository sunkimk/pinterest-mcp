import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resizeUrl } from '../src/pinterest.js';

const png = 'https://i.pinimg.com/originals/dd/15/81/dd1581cc60a151699f03f3a0d8dd90c2.png';

test('thumbnails of PNG originals are JPEG', () => {
  assert.equal(resizeUrl(png, '236x'), 'https://i.pinimg.com/236x/dd/15/81/dd1581cc60a151699f03f3a0d8dd90c2.jpg');
});

test('originals keep their extension', () => {
  assert.equal(resizeUrl(png, 'originals'), png);
});

test('JPEG thumbnails swap size only', () => {
  assert.equal(
    resizeUrl('https://i.pinimg.com/736x/aa/bb/cc/hash.jpg', '474x'),
    'https://i.pinimg.com/474x/aa/bb/cc/hash.jpg'
  );
});
