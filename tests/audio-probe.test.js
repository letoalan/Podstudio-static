import { it, expect, vi, beforeEach } from 'vitest';
import { probeDuration } from '../src/audio/probe.js';

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
