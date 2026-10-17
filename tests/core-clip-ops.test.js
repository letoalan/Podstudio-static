import { it, expect } from 'vitest';
import { createClip } from '../src/core/block-model.js';
import {
  moveClip,
  trimClipStart,
  trimClipEnd,
  splitClip,
  deleteClip,
  updateClip,
} from '../src/core/clip-ops.js';

it('moves clip to new start position and/or track', () => {
  const clip = createClip({ start: 2, trackId: 't1' });
  const moved = moveClip(clip, { start: 5, trackId: 't2' });
  expect(moved.start).toBe(5);
  expect(moved.trackId).toBe('t2');

  const clamped = moveClip(clip, { start: -10 });
  expect(clamped.start).toBe(0);
  expect(clamped.trackId).toBe('t1');

  const nested = moveClip(clip, { start: { start: 8, trackId: 't3' } });
  expect(nested.start).toBe(8);
  expect(nested.trackId).toBe('t3');
});

it('trims start handle correctly adjusting start, offset and duration', () => {
  const clip = createClip({ start: 2, offset: 1, duration: 5 });
  const trimmedForward = trimClipStart(clip, 3);
  expect(trimmedForward.start).toBe(3);
  expect(trimmedForward.offset).toBe(2);
  expect(trimmedForward.duration).toBe(4);

  const trimmedBackward = trimClipStart(clip, 1);
  expect(trimmedBackward.start).toBe(1);
  expect(trimmedBackward.offset).toBe(0);
  expect(trimmedBackward.duration).toBe(6);

  const clampedBackward = trimClipStart(clip, 0);
  expect(clampedBackward.offset).toBe(0);
  expect(clampedBackward.start).toBe(1);
});

it('trims end handle respecting duration and source bounds', () => {
  const clip = createClip({ start: 1, offset: 2, duration: 4 });
  const trimmed = trimClipEnd(clip, 8);
  expect(trimmed.duration).toBe(7);

  const boundTrimmed = trimClipEnd(clip, 15, 10);
  expect(boundTrimmed.duration).toBe(8);

  const minTrimmed = trimClipEnd(clip, 0.5, 10, 0.5);
  expect(minTrimmed.duration).toBe(0.5);
});

it('splits clip into two parts at split point', () => {
  const clip = createClip({ id: 'c1', name: 'Voix', start: 2, offset: 1, duration: 6 });
  const [left, right] = splitClip(clip, 4);
  expect(left.id).toBe('c1');
  expect(left.start).toBe(2);
  expect(left.offset).toBe(1);
  expect(left.duration).toBe(2);

  expect(right.id).not.toBe('c1');
  expect(right.start).toBe(4);
  expect(right.offset).toBe(3);
  expect(right.duration).toBe(4);
  expect(right.name).toBe('Voix (suite)');

  const unmodifiable = splitClip(clip, 2.01);
  expect(unmodifiable).toHaveLength(1);
  expect(unmodifiable[0]).toBe(clip);
});

it('deletes and updates clips immutably', () => {
  const clips = [
    createClip({ id: 'c1', name: 'Premier' }),
    createClip({ id: 'c2', name: 'Deuxieme' }),
  ];
  const deleted = deleteClip(clips, 'c1');
  expect(deleted).toHaveLength(1);
  expect(deleted[0].id).toBe('c2');

  const updated = updateClip(clips, 'c2', { name: 'Modifié' });
  expect(updated[1].name).toBe('Modifié');
  expect(clips[1].name).toBe('Deuxieme');
});
