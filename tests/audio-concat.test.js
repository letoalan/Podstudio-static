import { it, expect } from 'vitest';
import { concatAudioBuffers } from '../src/audio/concat.js';

function mockBuffer(channelsData, sampleRate = 44100) {
  const numChannels = channelsData.length;
  const length = channelsData[0].length;
  return {
    numberOfChannels: numChannels,
    length,
    sampleRate,
    duration: length / sampleRate,
    getChannelData: (ch) => channelsData[ch],
  };
}

it('returns single buffer if only one is passed', () => {
  const b1 = mockBuffer([new Float32Array([1, 2])]);
  const res = concatAudioBuffers([b1]);
  expect(res).toBe(b1);
});

it('concatenates multiple buffers sequentially preserving channel data', () => {
  const b1 = mockBuffer([
    new Float32Array([1, 2]),
    new Float32Array([3, 4]),
  ]);
  const b2 = mockBuffer([
    new Float32Array([5, 6, 7]),
    new Float32Array([8, 9, 10]),
  ]);

  const res = concatAudioBuffers([b1, b2]);
  expect(res.numberOfChannels).toBe(2);
  expect(res.length).toBe(5);

  const ch0 = res.getChannelData(0);
  expect(Array.from(ch0)).toEqual([1, 2, 5, 6, 7]);

  const ch1 = res.getChannelData(1);
  expect(Array.from(ch1)).toEqual([3, 4, 8, 9, 10]);
});

it('handles empty buffer list gracefully', () => {
  const res = concatAudioBuffers([]);
  expect(res.length).toBe(0);
  expect(res.numberOfChannels).toBe(2);
});
