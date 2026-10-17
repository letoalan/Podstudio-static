import { it, expect, vi, beforeEach } from 'vitest';
import { probeDuration, probeAudioFeatures } from '../src/audio/probe.js';

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:fake');
  URL.revokeObjectURL = vi.fn();
});

function fakeAudio() {
  const audio = {};
  Object.defineProperty(audio, 'src', {
    set() {
      queueMicrotask(() => audio.trigger());
    },
  });
  return audio;
}

it('retourne la durée des métadonnées et libère l\'URL', async () => {
  const audio = fakeAudio();
  audio.trigger = () => {
    audio.duration = 12.5;
    audio.onloadedmetadata();
  };
  expect(await probeDuration(new Blob(['x']), () => audio)).toBe(12.5);
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake');
});

it('retourne 0 si la durée est infinie (webm)', async () => {
  const audio = fakeAudio();
  audio.trigger = () => {
    audio.duration = Infinity;
    audio.onloadedmetadata();
  };
  expect(await probeDuration(new Blob(['x']), () => audio)).toBe(0);
});

it('retourne 0 si le fichier est illisible', async () => {
  const audio = fakeAudio();
  audio.trigger = () => audio.onerror();
  expect(await probeDuration(new Blob(['x']), () => audio)).toBe(0);
});

it('probeAudioFeatures returns acoustic features when AudioContext decodes data', async () => {
  const fakeChannel = new Float32Array(500).fill(0.1);
  const fakeCtx = {
    decodeAudioData: vi.fn().mockResolvedValue({
      duration: 5,
      getChannelData: () => fakeChannel,
    }),
  };
  const blob = { arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)) };
  const feat = await probeAudioFeatures(blob, fakeCtx);
  expect(feat).not.toBeNull();
  expect(feat.silenceRatio).toBe(0);
});

it('probeAudioFeatures returns null when blob is null or decoding fails', async () => {
  expect(await probeAudioFeatures(null)).toBeNull();
  const failingCtx = {
    decodeAudioData: vi.fn().mockRejectedValue(new Error('fail')),
  };
  const blob = { arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)) };
  expect(await probeAudioFeatures(blob, failingCtx)).toBeNull();
});
