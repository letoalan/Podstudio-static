import { it, expect } from 'vitest';
import { createBlock, createClip } from '../src/core/block-model.js';
import {
  createClipboard,
  copyClips,
  cutClips,
  pasteClips,
  hasClips,
} from '../src/core/clipboard.js';

it('manages clipboard state and detects if empty', () => {
  const empty = createClipboard();
  expect(hasClips(empty)).toBe(false);

  const full = createClipboard([createClip({ id: 'c1' })]);
  expect(hasClips(full)).toBe(true);
});

it('copies multiple clips preserving relative timing offsets', () => {
  const c1 = createClip({ id: 'c1', start: 5, duration: 2 });
  const c2 = createClip({ id: 'c2', start: 9, duration: 3 });
  const cb = copyClips([c1, c2]);

  expect(cb.items).toHaveLength(2);
  expect(cb.items[0].relativeStart).toBe(0);
  expect(cb.items[1].relativeStart).toBe(4);
});

it('cuts clips from a block, updating block and returning clipboard', () => {
  const c1 = createClip({ id: 'c1', start: 1 });
  const c2 = createClip({ id: 'c2', start: 4 });
  const block = createBlock({ clips: [c1, c2], edited: false });

  const result = cutClips(block, ['c1']);
  expect(result.block.clips).toHaveLength(1);
  expect(result.block.clips[0].id).toBe('c2');
  expect(result.block.edited).toBe(true);
  expect(result.clipboard.items[0].id).toBe('c1');
});

it('pastes clips at target start and track with regenerated IDs', () => {
  const c1 = createClip({ id: 'c1', start: 10, duration: 2 });
  const c2 = createClip({ id: 'c2', start: 12, duration: 3 });
  const cb = copyClips([c1, c2]);

  const targetBlock = createBlock({
    tracks: [{ id: 'tr-dest', name: 'Dest' }],
    clips: [],
    edited: false,
  });

  const pastedBlock = pasteClips(cb, targetBlock, 'tr-dest', 3);
  expect(pastedBlock.clips).toHaveLength(2);
  expect(pastedBlock.edited).toBe(true);
  expect(pastedBlock.clips[0].id).not.toBe('c1');
  expect(pastedBlock.clips[0].start).toBe(3);
  expect(pastedBlock.clips[0].trackId).toBe('tr-dest');
  expect(pastedBlock.clips[1].start).toBe(5);
});

it('returns original block when clipboard is empty', () => {
  const block = createBlock();
  const result = pasteClips(null, block, 'tr-1', 0);
  expect(result).toBe(block);
});

it('pastes clip immediately behind the copied clip on the same track by default', () => {
  const c1 = createClip({ id: 'c1', trackId: 'tr-2', start: 5, duration: 4 });
  const cb = copyClips([c1]);
  const block = createBlock({ tracks: [{ id: 'tr-1' }, { id: 'tr-2' }], clips: [c1] });

  const pastedOnce = pasteClips(cb, block);
  expect(pastedOnce.clips).toHaveLength(2);
  const pasted1 = pastedOnce.clips[1];
  expect(pasted1.start).toBe(9);
  expect(pasted1.trackId).toBe('tr-2');

  const pastedTwice = pasteClips(cb, pastedOnce);
  expect(pastedTwice.clips).toHaveLength(3);
  const pasted2 = pastedTwice.clips[2];
  expect(pasted2.start).toBe(13);
  expect(pasted2.trackId).toBe('tr-2');
});
