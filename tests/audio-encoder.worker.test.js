import { it, expect, vi, beforeEach } from 'vitest';

let posted;

beforeEach(async () => {
  vi.resetModules();
  posted = [];
  vi.spyOn(self, 'postMessage').mockImplementation((message) => posted.push(message));
  await import('../src/audio/encoder.worker.js');
});

const sine = () => Float32Array.from({ length: 4608 }, (_, i) => Math.sin(i / 20) * 0.5);

it('ignore les commandes inconnues', () => {
  self.onmessage({ data: { command: 'noop' } });
  expect(posted).toHaveLength(0);
});

it('encode, publie la progression puis le Blob final', () => {
  self.onmessage({ data: { command: 'encode', channels: [sine()], sampleRate: 44100 } });
  expect(posted.some((m) => m.type === 'progress')).toBe(true);
  const done = posted.at(-1);
  expect(done.type).toBe('done');
  expect(done.blob.type).toBe('audio/mpeg');
  expect(done.blob.size).toBeGreaterThan(0);
});

it('remonte une erreur au lieu de planter', () => {
  self.onmessage({ data: { command: 'encode', channels: [], sampleRate: 44100 } });
  expect(posted.at(-1).type).toBe('error');
});
