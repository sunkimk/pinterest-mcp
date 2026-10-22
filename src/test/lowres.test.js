import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePin } from '../src/pinterest.js';

const pin = (orig) => ({ type: 'pin', id: '123', images: { orig } });

test('pins whose original is only thumbnail-sized are marked low_res', () => {
  const p = normalizePin(pin({ url: 'https://i.pinimg.com/originals/79/46/10/x.png', width: 236, height: 512 }));
  assert.equal(p.low_res, true);
});

test('full-size pins carry no low_res field', () => {
  const p = normalizePin(pin({ url: 'https://i.pinimg.com/originals/aa/bb/cc/x.jpg', width: 1400, height: 1866 }));
  assert.equal('low_res' in p, false);
});

test('pins without a known width are not flagged', () => {
  const p = normalizePin(pin({ url: 'https://i.pinimg.com/originals/aa/bb/cc/x.jpg' }));
  assert.equal('low_res' in p, false);
});
