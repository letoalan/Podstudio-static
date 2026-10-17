import { it, expect } from 'vitest';
import {
  STORY_ROLES,
  getStoryRole,
  inferDefaultRole,
  calculateStoryTimeline,
} from '../src/core/story-role.js';
import { createBlock } from '../src/core/block-model.js';
import { createTransitionBlock } from '../src/core/transition-model.js';

it('provides 5 narrative story roles with icons and colors', () => {
  expect(STORY_ROLES).toHaveLength(5);
  expect(STORY_ROLES.map((r) => r.id)).toEqual(['intro', 'interview', 'chronique', 'virgule', 'outro']);
  expect(getStoryRole('intro').label).toBe('Intro');
  expect(getStoryRole('unknown').id).toBe('chronique');
});

it('infers role based on position: intro first, outro last, chronique middle', () => {
  expect(inferDefaultRole(0, 3)).toBe('intro');
  expect(inferDefaultRole(1, 3)).toBe('chronique');
  expect(inferDefaultRole(2, 3)).toBe('outro');
  expect(inferDefaultRole(0, 1)).toBe('intro');
});

it('calculates cumulative story timeline for blocks and transitions', () => {
  const b1 = createBlock({ clips: [{ duration: 10 }] });
  const trans = createTransitionBlock({ duration: 2 });
  const b2 = createBlock({ clips: [{ duration: 20 }] });
  const timeline = calculateStoryTimeline([b1, trans, b2]);

  expect(timeline).toHaveLength(3);
  expect(timeline[0].start).toBe(0);
  expect(timeline[0].end).toBe(10);
  expect(timeline[1].start).toBe(10);
  expect(timeline[1].end).toBe(12);
  expect(timeline[2].start).toBe(12);
  expect(timeline[2].end).toBe(32);
});
