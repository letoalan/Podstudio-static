import { it, expect, vi } from 'vitest';
import { encodeInWorker } from '../src/audio/encoder-client.js';

function fakeWorker() {
  const worker = { terminate: vi.fn(), postMessage: vi.fn(), onmessage: null, onerror: null };
  return worker;
}

const channels = () => [new Float32Array(8)];

it('envoie la commande avec transfert des buffers', () => {
  const worker = fakeWorker();
  const chans = channels();
  encodeInWorker(chans, 44100, { createWorker: () => worker });
  const [message, transfer] = worker.postMessage.mock.calls[0];
  expect(message).toMatchObject({ command: 'encode', sampleRate: 44100 });
  expect(transfer).toEqual([chans[0].buffer]);
});

it('relaie la progression puis résout avec le Blob', async () => {
  const worker = fakeWorker();
  const onProgress = vi.fn();
  const promise = encodeInWorker(channels(), 44100, { createWorker: () => worker, onProgress });
  const blob = new Blob(['x']);
  worker.onmessage({ data: { type: 'progress', ratio: 0.5 } });
  worker.onmessage({ data: { type: 'done', blob } });
  expect(await promise).toBe(blob);
  expect(onProgress).toHaveBeenCalledWith(0.5);
  expect(worker.terminate).toHaveBeenCalled();
});

it('rejette sur message d\'erreur du worker', async () => {
  const worker = fakeWorker();
  const promise = encodeInWorker(channels(), 44100, { createWorker: () => worker });
  worker.onmessage({ data: { type: 'error', message: 'boom' } });
  await expect(promise).rejects.toThrow('boom');
});

it('rejette sur erreur de chargement du worker', async () => {
  const worker = fakeWorker();
  const promise = encodeInWorker(channels(), 44100, { createWorker: () => worker });
  worker.onerror({ message: 'crash' });
  await expect(promise).rejects.toThrow('crash');
  expect(worker.terminate).toHaveBeenCalled();
});
