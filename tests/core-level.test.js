import { it, expect } from 'vitest';
import { createBlock } from '../src/core/block-model.js';
import {
  LEVELS,
  LEVEL_LABELS,
  validateLevel,
  isToolEnabled,
  getVisibleTools,
  suggestLevelUpgrade,
} from '../src/core/level.js';

it('validates levels with fallback to simple', () => {
  expect(validateLevel(LEVELS.ADVANCED)).toBe('advanced');
  expect(validateLevel(LEVELS.INTERMEDIATE)).toBe('intermediate');
  expect(validateLevel('unknown')).toBe('simple');
  expect(validateLevel(null)).toBe('simple');
  expect(LEVEL_LABELS[LEVELS.SIMPLE]).toBe('Simple');
});

it('determines tool visibility based on progressive level', () => {
  expect(isToolEnabled(LEVELS.SIMPLE, 'quickRecord')).toBe(true);
  expect(isToolEnabled(LEVELS.SIMPLE, 'editorAccess')).toBe(false);
  expect(isToolEnabled(LEVELS.SIMPLE, 'advancedEditing')).toBe(false);
  expect(isToolEnabled(LEVELS.SIMPLE, 'blockColor')).toBe(false);
  expect(isToolEnabled(LEVELS.SIMPLE, 'paletteEditor')).toBe(false);

  expect(isToolEnabled(LEVELS.INTERMEDIATE, 'quickRecord')).toBe(true);
  expect(isToolEnabled(LEVELS.INTERMEDIATE, 'editorAccess')).toBe(true);
  expect(isToolEnabled(LEVELS.INTERMEDIATE, 'fadeControls')).toBe(true);
  expect(isToolEnabled(LEVELS.INTERMEDIATE, 'blockColor')).toBe(true);
  expect(isToolEnabled(LEVELS.INTERMEDIATE, 'paletteEditor')).toBe(false);
  expect(isToolEnabled(LEVELS.INTERMEDIATE, 'advancedEditing')).toBe(false);

  expect(isToolEnabled(LEVELS.ADVANCED, 'advancedEditing')).toBe(true);
  expect(isToolEnabled(LEVELS.ADVANCED, 'unlimitedTracks')).toBe(true);
  expect(isToolEnabled(LEVELS.ADVANCED, 'zoomControls')).toBe(true);
  expect(isToolEnabled(LEVELS.ADVANCED, 'blockColor')).toBe(true);
  expect(isToolEnabled(LEVELS.ADVANCED, 'paletteEditor')).toBe(true);
});

it('returns all visible tools for a level', () => {
  const simpleTools = getVisibleTools(LEVELS.SIMPLE);
  const advTools = getVisibleTools(LEVELS.ADVANCED);
  expect(simpleTools).toContain('quickRecord');
  expect(simpleTools).not.toContain('zoomControls');
  expect(advTools.length).toBeGreaterThan(simpleTools.length);
});

it('suggests upgrading level when a block exceeds simple or intermediate complexity', () => {
  const basicBlock = createBlock();
  expect(suggestLevelUpgrade(LEVELS.SIMPLE, basicBlock)).toBeNull();

  const manyClips = createBlock({ clips: [{}, {}, {}, {}, {}, {}] });
  expect(suggestLevelUpgrade(LEVELS.SIMPLE, manyClips)).toBe(LEVELS.INTERMEDIATE);

  const threeTracks = createBlock({ tracks: [{ id: 't1' }, { id: 't2' }, { id: 't3' }] });
  expect(suggestLevelUpgrade(LEVELS.SIMPLE, threeTracks)).toBe(LEVELS.ADVANCED);
  expect(suggestLevelUpgrade(LEVELS.INTERMEDIATE, threeTracks)).toBe(LEVELS.ADVANCED);
  expect(suggestLevelUpgrade(LEVELS.ADVANCED, threeTracks)).toBeNull();
});
