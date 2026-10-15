import { it, expect, vi } from 'vitest';
import { Recorder, pickMimeType } from '../src/audio/recorder.js';

function fakeMediaRecorder() {
  return class FakeMedia {
    static isTypeSupported = (type) => type === 'audio/mp4';
    constructor(stream, options) {
      this.stream = stream;
      this.options = options;
      this.mimeType = options?.mimeType ?? '';
      this.start = vi.fn();
      this.pause = vi.fn();
      this.resume = vi.fn();
      this.stop = vi.fn(() => {
        this.ondataavailable({ data: new Blob(['abc'], { type: 'audio/mp4' }) });
        this.onstop();
      });
    }
  };
}

function makeRecorder() {
  const track = { stop: vi.fn() };
  const stream = { getTracks: () => [track] };
  const context = {
    createMediaStreamSource: () => ({ connect: vi.fn() }),
    createAnalyser: () => ({}),
    close: vi.fn(),
  };
  const recorder = new Recorder({
    getUserMedia: vi.fn(async () => stream),
    MediaRecorder: fakeMediaRecorder(),
    createContext: () => context,
  });
  return { recorder, track, context };
}

it('choisit le premier format supporté, avec repli Safari', () => {
  expect(pickMimeType(fakeMediaRecorder())).toBe('audio/mp4');
  expect(pickMimeType({ isTypeSupported: () => false })).toBe('');
  expect(pickMimeType(undefined)).toBe('');
});

it('démarre, expose l\'analyseur et passe en enregistrement', async () => {
  const { recorder } = makeRecorder();
  await recorder.start();
  expect(recorder.state).toBe('recording');
  expect(recorder.analyser).toBeTruthy();
  expect(recorder.media.start).toHaveBeenCalledWith(250);
});

it('ne redémarre pas pendant un enregistrement', async () => {
  const { recorder } = makeRecorder();
  await recorder.start();
  const media = recorder.media;
  await recorder.start();
  expect(recorder.media).toBe(media);
});

it('met en pause et reprend en gardant le temps accumulé', async () => {
  const { recorder } = makeRecorder();
  const now = vi.spyOn(performance, 'now');
  now.mockReturnValue(1000);
  await recorder.start();
  now.mockReturnValue(3000);
  recorder.pause();
  expect(recorder.state).toBe('paused');
  now.mockReturnValue(9000);
  expect(recorder.elapsed()).toBe(2);
  recorder.resume();
  now.mockReturnValue(10000);
  expect(recorder.elapsed()).toBe(3);
  now.mockRestore();
});

it('arrête, rend le Blob et libère micro et contexte', async () => {
  const { recorder, track, context } = makeRecorder();
  await recorder.start();
  const result = await recorder.stop();
  expect(result.blob.size).toBe(3);
  expect(result.mimeType).toBe('audio/mp4');
  expect(track.stop).toHaveBeenCalled();
  expect(context.close).toHaveBeenCalled();
  expect(recorder.state).toBe('idle');
});

it('stop sans enregistrement retourne null', async () => {
  const { recorder } = makeRecorder();
  expect(await recorder.stop()).toBeNull();
});

it('propage une erreur d\'accès au micro', async () => {
  const recorder = new Recorder({ getUserMedia: async () => { throw new Error('NotAllowedError'); } });
  await expect(recorder.start()).rejects.toThrow('NotAllowedError');
  expect(recorder.state).toBe('idle');
});
