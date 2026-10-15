import { it, expect, vi } from 'vitest';
import { renderMix, exportMp3, EXPORT_SAMPLE_RATE } from '../src/audio/render.js';

function fakeOffline() {
  const created = [];
  class FakeOffline {
    constructor(channels, length, rate) {
      this.args = [channels, length, rate];
      this.destination = {};
      created.push(this);
    }
    createGain() {
      return { gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() }, connect: vi.fn() };
    }
    createBufferSource() {
      this.source = { connect: vi.fn(), start: vi.fn() };
      return this.source;
    }
    async startRendering() {
      return { numberOfChannels: 2, getChannelData: () => new Float32Array(4) };
    }
  }
  return { FakeOffline, created };
}

const track = (duration, offset = 0) => ({ buffer: { duration }, offset, volume: 1, fadeIn: 0, fadeOut: 0 });

it('refuse de rendre une timeline vide', async () => {
  await expect(renderMix([])).rejects.toThrow('EMPTY_TIMELINE');
});

it('dimensionne le contexte sur la durée totale', async () => {
  const { FakeOffline, created } = fakeOffline();
  const out = await renderMix([track(2), track(3, 4)], { OfflineContext: FakeOffline });
  expect(created[0].args).toEqual([2, 7 * EXPORT_SAMPLE_RATE, EXPORT_SAMPLE_RATE]);
  expect(out.duration).toBe(7);
  expect(out.channels).toHaveLength(2);
});

it('planifie chaque piste à son décalage', async () => {
  const { FakeOffline, created } = fakeOffline();
  await renderMix([track(2, 1.5)], { OfflineContext: FakeOffline });
  expect(created[0].source.start).toHaveBeenCalledWith(1.5);
});

it('exporte en MP3 via l\'encodeur fourni', async () => {
  const { FakeOffline } = fakeOffline();
  const blob = new Blob(['mp3']);
  const encode = vi.fn(async () => blob);
  const result = await exportMp3([track(2)], { render: { OfflineContext: FakeOffline }, encode });
  expect(result.blob).toBe(blob);
  expect(result.duration).toBe(2);
  expect(encode).toHaveBeenCalledWith(expect.any(Array), EXPORT_SAMPLE_RATE, expect.any(Object));
});
