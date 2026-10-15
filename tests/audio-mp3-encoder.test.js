// @vitest-environment node
import { it, expect, vi } from 'vitest';
import { Mp3Encoder } from '@breezystack/lamejs';
import { floatToInt16, encodeMp3, BLOCK_SIZE } from '../src/audio/mp3-encoder.js';

const sine = (length) => Float32Array.from({ length }, (_, i) => Math.sin(i / 20) * 0.5);

it('convertit Float32 en Int16 en bornant à [-1, 1]', () => {
  const out = floatToInt16(Float32Array.of(-2, -1, 0, 0.5, 1, 3));
  expect(Array.from(out)).toEqual([-32768, -32768, 0, 16383, 32767, 32767]);
});

it('encode du PCM mono en trames MP3 valides', () => {
  const chunks = encodeMp3([sine(BLOCK_SIZE * 20)], 44100, Mp3Encoder);
  const total = chunks.reduce((n, c) => n + c.length, 0);
  expect(total).toBeGreaterThan(1000);
  expect(chunks[0][0] & 0xff).toBe(0xff); // mot de synchronisation MP3 (octet signé -> masqué)
});

it('encode du stéréo et rapporte la progression', () => {
  const onProgress = vi.fn();
  const channels = [sine(BLOCK_SIZE * 5), sine(BLOCK_SIZE * 5)];
  const chunks = encodeMp3(channels, 44100, Mp3Encoder, { onProgress });
  expect(chunks.length).toBeGreaterThan(0);
  expect(onProgress).toHaveBeenLastCalledWith(1);
  expect(onProgress.mock.calls.length).toBe(5);
});

it('ignore les canaux au-delà du stéréo', () => {
  const FakeEncoder = vi.fn(function () {
    this.encodeBuffer = () => new Uint8Array(0);
    this.flush = () => new Uint8Array(0);
  });
  encodeMp3([sine(10), sine(10), sine(10)], 48000, FakeEncoder);
  expect(FakeEncoder).toHaveBeenCalledWith(2, 48000, 128);
});
