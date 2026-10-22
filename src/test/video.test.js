import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickVideo } from '../src/pinterest.js';

test('story pins prefer the 720p MP4', () => {
  const v = pickVideo({
    story_pin_data: {
      pages: [{ blocks: [{ video: { video_list: {
        V_HLSV3_MOBILE: { url: 'https://v1.pinimg.com/videos/mc/hls/aa/bb/cc/x.m3u8', width: 1080, height: 1350, duration: 5933 },
        V_EXP3: { url: 'https://v1.pinimg.com/videos/mc/expMp4/aa/bb/cc/x_t1.mp4', width: 1080, height: 1350, duration: 5933 },
        V_EXP7: { url: 'https://v1.pinimg.com/videos/mc/720p/aa/bb/cc/x.mp4', width: 1080, height: 1350, duration: 5933 },
      } } }] }],
    },
  });
  assert.equal(v.video_url, 'https://v1.pinimg.com/videos/mc/720p/aa/bb/cc/x.mp4');
  assert.equal(v.video_seconds, 6);
});

test('HLS-only video pins get the matching 720p MP4', () => {
  const v = pickVideo({ videos: { video_list: { V_HLSV4: { url: 'https://v1.pinimg.com/videos/mc/hls/13/62/b1/abc.m3u8', width: 800, height: 600, duration: 23656 } } } });
  assert.equal(v.video_url, 'https://v1.pinimg.com/videos/mc/720p/13/62/b1/abc.mp4');
  assert.equal(v.video_hls, 'https://v1.pinimg.com/videos/mc/hls/13/62/b1/abc.m3u8');
});

test('iht HLS pins point at the 720w CMAF rendition', () => {
  const v = pickVideo({ videos: { video_list: { V_HLSV4: { url: 'https://v1.pinimg.com/videos/iht/hls/6e/90/b3/abc.m3u8' } } } });
  assert.equal(v.video_url, 'https://v1.pinimg.com/videos/iht/hls/6e/90/b3/abc_720w.cmfv');
});

test('streams without an MP4 rendition fall back to HLS', () => {
  const v = pickVideo({ videos: { video_list: { V_HLSV4: { url: 'https://v1.pinimg.com/videos/v2/hls/b0/14/76/x_mobile.m3u8' } } } });
  assert.equal(v.video_url, 'https://v1.pinimg.com/videos/v2/hls/b0/14/76/x_mobile.m3u8');
});

test('image pins have no video', () => {
  assert.equal(pickVideo({ images: {} }), undefined);
});
