import { describe, it, expect, vi } from 'vitest';
import { renderTransitionBuffer, previewTransition } from '../src/audio/transitions.js';

describe('audio/transitions.js', () => {
  it('renders silence buffer for pause transition', () => {
    const buf = renderTransitionBuffer({ type: 'pause', duration: 1.0 }, 44100);
    expect(buf.numberOfChannels).toBe(2);
    expect(buf.length).toBe(44100);
    const ch0 = buf.getChannelData(0);
    expect(ch0[0]).toBe(0);
  });

  it('synthesizes audio waveform for whoosh transition', () => {
    const buf = renderTransitionBuffer({ type: 'whoosh', duration: 1.0 }, 44100);
    expect(buf.length).toBe(44100);
    const ch0 = buf.getChannelData(0);
    const hasNonZero = Array.from(ch0).some((v) => v !== 0);
    expect(hasNonZero).toBe(true);
  });

  it('synthesizes musical waveform for jingle transition', () => {
    const buf = renderTransitionBuffer({ type: 'jingle', duration: 1.5 }, 44100);
    expect(buf.length).toBe(Math.ceil(1.5 * 44100));
    const ch0 = buf.getChannelData(0);
    const hasNonZero = Array.from(ch0).some((v) => v !== 0);
    expect(hasNonZero).toBe(true);
  });

  it('previews transition using AudioContext and returns a stop handle', async () => {
    const fakeCtx = {
      state: 'running',
      sampleRate: 44100,
      destination: {},
      createBufferSource: () => ({ buffer: null, connect: vi.fn(), start: vi.fn(), stop: vi.fn() }),
      createGain: () => ({ gain: { value: 1 }, connect: vi.fn() }),
      resume: vi.fn(),
    };
    const handle = await previewTransition({ type: 'whoosh', duration: 0.5 }, fakeCtx);
    expect(handle).toHaveProperty('stop');
    expect(() => handle.stop()).not.toThrow();
  });
});
