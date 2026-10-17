import { it, expect, vi } from 'vitest';
import { BlockPlayer } from '../src/audio/block-player.js';
import { createBlock, createClip } from '../src/core/block-model.js';

function fakeContext() {
  const nodes = [];
  const gains = [];
  const ctx = {
    currentTime: 0,
    state: 'running',
    destination: {},
    resume: vi.fn(),
    createGain: () => {
      const g = { gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() }, connect: vi.fn() };
      gains.push(g);
      return g;
    },
    createBufferSource: () => {
      const source = { connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
      nodes.push(source);
      return source;
    },
  };
  return { ctx, nodes, gains };
}

it('manages play, pause, stop and playback state', () => {
  const { ctx, nodes } = fakeContext();
  const player = new BlockPlayer(ctx);
  const buf = { duration: 5 };
  player.setBuffers(new Map([['s1', buf]]));

  const block = createBlock({
    tracks: [{ id: 't1', volume: 1 }],
    clips: [createClip({ trackId: 't1', sourceId: 's1', start: 1, duration: 4 })],
  });

  expect(player.isPlaying()).toBe(false);
  player.play(block, 0);
  expect(player.isPlaying()).toBe(true);
  expect(nodes).toHaveLength(1);
  expect(nodes[0].start).toHaveBeenCalledWith(1, 0, 4);

  player.pause();
  expect(player.isPlaying()).toBe(false);
  expect(nodes[0].stop).toHaveBeenCalled();

  player.stop();
  expect(player.position()).toBe(0);
});

it('respects mute and solo track attributes', () => {
  const { ctx, gains } = fakeContext();
  const player = new BlockPlayer(ctx);
  player.setBuffers(new Map([['s1', { duration: 5 }], ['s2', { duration: 5 }]]));

  const block = createBlock({
    tracks: [
      { id: 't1', volume: 1, solo: true },
      { id: 't2', volume: 1, solo: false },
    ],
    clips: [
      createClip({ trackId: 't1', sourceId: 's1', start: 0, duration: 3 }),
      createClip({ trackId: 't2', sourceId: 's2', start: 0, duration: 3 }),
    ],
  });

  player.play(block, 0);
  expect(gains[0].gain.setValueAtTime).toHaveBeenCalledWith(1, 0);
  expect(gains[1].gain.setValueAtTime).toHaveBeenCalledWith(0, 0);
});
