import { describe, it, expect } from 'vitest';
import { audioBufferToWav, blobToDataUrl, dataUrlToBlob } from '../src/audio/wav.js';

describe('audio/wav.js', () => {
  it('encodes AudioBuffer to valid WAV Blob with 44-byte header', async () => {
    const mockBuffer = {
      numberOfChannels: 1,
      sampleRate: 44100,
      length: 50,
      getChannelData: () => new Float32Array(50),
    };
    const blob = audioBufferToWav(mockBuffer);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('audio/wav');
    expect(blob.size).toBe(44 + 50 * 2);
  });

  it('converts Blob to Data URL via blobToDataUrl', async () => {
    const blob = new Blob(['wav-data'], { type: 'audio/wav' });
    const url = await blobToDataUrl(blob);
    expect(url).toMatch(/^data:audio\/wav;base64,/);
  });

  it('converts Data URL to Blob via dataUrlToBlob', async () => {
    const original = new Blob(['hello-audio'], { type: 'text/plain' });
    const dataUrl = await blobToDataUrl(original);
    const restored = dataUrlToBlob(dataUrl);
    expect(restored).toBeInstanceOf(Blob);
    const text = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsText(restored);
    });
    expect(text).toBe('hello-audio');
  });
});
