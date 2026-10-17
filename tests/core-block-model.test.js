import { it, expect } from 'vitest';
import {
  createBlock,
  createClip,
  createDefaultTracks,
  validateBlock,
  isBlockEmpty,
  getBlockContentDuration,
  getBlockTotalDuration,
} from '../src/core/block-model.js';

it('creates default tracks with 2 tracks', () => {
  const tracks = createDefaultTracks();
  expect(tracks).toHaveLength(2);
  expect(tracks[0].name).toBe('Piste 1');
  expect(tracks[1].name).toBe('Piste 2');
  expect(tracks[0].volume).toBe(1);
  expect(tracks[0].muted).toBe(false);
});

it('creates a nameless block: color null, 2 tracks, edited=false', () => {
  const block = createBlock();
  expect(block.color).toBeNull();
  expect(block.tracks).toHaveLength(2);
  expect(block.clips).toEqual([]);
  expect(block.edited).toBe(false);
  expect(block.padBefore).toBe(0);
  expect(block.padAfter).toBe(0);
  expect(block).not.toHaveProperty('title');
  expect(block).not.toHaveProperty('subtitle');
  expect(block).not.toHaveProperty('kind');
});

it('keeps a valid color (hex or palette index) and drops invalid ones', () => {
  expect(createBlock({ color: '#FF0055' }).color).toBe('#ff0055');
  expect(createBlock({ color: 3 }).color).toBe(3);
  expect(createBlock({ color: 'rouge' }).color).toBeNull();
  expect(createBlock({ color: -2 }).color).toBeNull();
});

it('creates and clamps clip attributes', () => {
  const clip = createClip({
    trackId: 't-1',
    sourceId: 'src-1',
    start: -5,
    offset: -2,
    duration: 10,
    gain: 0.8,
  });
  expect(clip.start).toBe(0);
  expect(clip.offset).toBe(0);
  expect(clip.duration).toBe(10);
  expect(clip.gain).toBe(0.8);
  expect(clip.fadeIn).toBe(0);
  expect(clip.fadeOut).toBe(0);
});

it('validates a block, ignoring legacy title / kind, and rejects invalid objects', () => {
  const legacy = { ...createBlock({ id: 'b-1' }), title: 'Intro', subtitle: 'x', kind: 'jingle', color: '#8940fa' };
  const validated = validateBlock(legacy);
  expect(validated.id).toBe('b-1');
  expect(validated.color).toBe('#8940fa');
  expect(validated.tracks).toHaveLength(2);
  expect(validated).not.toHaveProperty('title');
  expect(validated).not.toHaveProperty('kind');

  expect(() => validateBlock(null)).toThrow('BLOCK_INVALID');
  expect(() => validateBlock({})).toThrow('BLOCK_MISSING_ID');
  expect(() => validateBlock({ id: 'b-2', tracks: null })).toThrow('BLOCK_TRACKS_ARRAY_REQUIRED');
  expect(() => validateBlock({ id: 'b-2', tracks: [], clips: null })).toThrow('BLOCK_CLIPS_ARRAY_REQUIRED');
});

it('calculates content and total duration with padding', () => {
  const block = createBlock({
    padBefore: 1.5,
    padAfter: 2,
    clips: [
      { start: 0, duration: 4 },
      { start: 2, duration: 5 },
    ],
  });
  expect(getBlockContentDuration(block)).toBe(7);
  expect(getBlockTotalDuration(block)).toBe(10.5);
  expect(getBlockContentDuration(null)).toBe(0);
  expect(getBlockTotalDuration(null)).toBe(0);
});

it('treats an empty block as ignored: zero duration even with padding', () => {
  const empty = createBlock({ padBefore: 2, padAfter: 3 });
  expect(isBlockEmpty(empty)).toBe(true);
  expect(isBlockEmpty(null)).toBe(true);
  expect(getBlockTotalDuration(empty)).toBe(0);
  expect(isBlockEmpty(createBlock({ clips: [{ duration: 1 }] }))).toBe(false);
});
