import { it, expect, vi } from 'vitest';
import { stopPlayback, togglePlayBlock, togglePlayAll } from '../src/ui/block-playback.js';
import { createBlock, createClip } from '../src/core/block-model.js';
import { createProject, addBlock } from '../src/core/project.js';

function fakePlayer() {
  return {
    play: vi.fn(),
    stop: vi.fn(),
    setBuffers: vi.fn(),
    isPlaying: vi.fn(() => false),
  };
}

it('stops active playback and resets state', () => {
  const state = { playingBlockId: 'b1', isGlobalPlaying: true };
  const player = fakePlayer();
  const render = vi.fn();

  stopPlayback(state, player, render);
  expect(player.stop).toHaveBeenCalled();
  expect(state.playingBlockId).toBeNull();
  expect(state.isGlobalPlaying).toBe(false);
  expect(render).toHaveBeenCalled();
});

it('stops if toggling an already playing block', async () => {
  const block = createBlock({ id: 'b1', clips: [createClip({ duration: 2 })] });
  const state = { playingBlockId: 'b1', isGlobalPlaying: false };
  const player = fakePlayer();
  const render = vi.fn();

  await togglePlayBlock(block, { state, storage: {}, player, render });
  expect(player.stop).toHaveBeenCalled();
  expect(state.playingBlockId).toBeNull();
});

it('plays a block with clips and updates state', async () => {
  const block = createBlock({ id: 'b2', clips: [createClip({ sourceId: 's1', duration: 2 })] });
  const state = { playingBlockId: null, isGlobalPlaying: false };
  const player = fakePlayer();
  const render = vi.fn();
  const storage = { getRecording: vi.fn() };

  await togglePlayBlock(block, { state, storage, player, render });
  expect(state.playingBlockId).toBe('b2');
  expect(player.play).toHaveBeenCalledWith(block, 0);
});

it('toggles global sequential playback', async () => {
  let p = createProject();
  p = addBlock(p, createBlock({ id: 'b1', clips: [createClip({ duration: 1 })] }));
  const state = { playingBlockId: null, isGlobalPlaying: false };
  const player = fakePlayer();
  const render = vi.fn();

  await togglePlayAll(p, { state, storage: { getRecording: vi.fn() }, player, render });
  expect(state.isGlobalPlaying).toBe(true);
  expect(player.play).toHaveBeenCalled();

  await togglePlayAll(p, { state, storage: {}, player, render });
  expect(state.isGlobalPlaying).toBe(false);
  expect(player.stop).toHaveBeenCalled();
});
