import { it, expect } from 'vitest';
import { createBlock } from '../src/core/block-model.js';
import { DEFAULT_PALETTE } from '../src/core/palette.js';
import {
  PROJECT_FORMAT,
  PROJECT_VERSION,
  createProject,
  createProjectData,
  validateProject,
  sanitizeFileName,
  addBlock,
  insertBlockAt,
  removeBlock,
  moveBlock,
  duplicateBlock,
  updateBlock,
  getBlockNumber,
  getBlockColor,
  getPlayableBlocks,
  getProjectDuration,
} from '../src/core/project.js';

it('creates valid project structure and handles backward compatibility', () => {
  const settings = { title: 'Test Podcast', author: 'Alan' };
  const tracks = [{ id: 'c1', title: 'Intro', offset: 0, lane: 0, volume: 0.8 }];
  const project = createProjectData(settings, tracks);
  expect(project.format).toBe(PROJECT_FORMAT);
  expect(project.version).toBe(PROJECT_VERSION);
  expect(project.settings.title).toBe('Test Podcast');
  expect(project.settings.palette).toHaveLength(8);
  expect(project.blocks).toHaveLength(1);
  expect(project.tracks).toHaveLength(1);
});

it('validates project data correctly and rejects invalid formats', () => {
  const valid = { format: PROJECT_FORMAT, version: 1, settings: { title: 'Mon show' }, tracks: [] };
  const validated = validateProject(valid);
  expect(validated.format).toBe(PROJECT_FORMAT);
  expect(validated.settings.title).toBe('Mon show');
  expect(() => validateProject(null)).toThrow('FORMAT_INVALID');
  expect(() => validateProject({ invalid: true })).toThrow('NOT_A_PODSTUDIO_PROJECT');
});

it('sanitizes filename with title and current date', () => {
  expect(sanitizeFileName('Émission Spéciale !')).toMatch(/^podstudio-emission-speciale-\d{4}-\d{2}-\d{2}\.json$/);
  expect(sanitizeFileName('')).toMatch(/^podstudio-projet-\d{4}-\d{2}-\d{2}\.json$/);
});

it('creates a project with an 8-color palette and cycle mode', () => {
  const p = createProject();
  expect(p.settings.palette).toEqual([...DEFAULT_PALETTE]);
  expect(p.settings.palette).toHaveLength(8);
  expect(p.settings.colorMode).toBe('cycle');
});

it('manages immutable block operations (add, insert, remove, move, duplicate, update)', () => {
  let p = createProject();
  p = addBlock(p, createBlock({ id: 'b1' }));
  p = addBlock(p, createBlock({ id: 'b3' }));
  p = insertBlockAt(p, 1, createBlock({ id: 'b2' }));
  expect(p.blocks.map((b) => b.id)).toEqual(['b1', 'b2', 'b3']);

  p = moveBlock(p, 'b3', 0);
  expect(p.blocks.map((b) => b.id)).toEqual(['b3', 'b1', 'b2']);

  p = duplicateBlock(p, 'b1');
  expect(p.blocks).toHaveLength(4);
  expect(p.blocks[2].id).not.toBe('b1');

  p = updateBlock(p, 'b3', { color: '#ff0055' });
  expect(p.blocks[0].color).toBe('#ff0055');

  p = removeBlock(p, 'b1');
  expect(p.blocks.find((b) => b.id === 'b1')).toBeUndefined();
});

it('derives block numbers from position and renumbers after moves', () => {
  let p = createProject({ blocks: ['a', 'b', 'c'].map((id) => createBlock({ id })) });
  expect([getBlockNumber(p, 'a'), getBlockNumber(p, 'b'), getBlockNumber(p, 'c')]).toEqual([1, 2, 3]);
  p = moveBlock(p, 'c', 0);
  expect([getBlockNumber(p, 'c'), getBlockNumber(p, 'a'), getBlockNumber(p, 'b')]).toEqual([1, 2, 3]);
  p = removeBlock(p, 'c');
  expect(getBlockNumber(p, 'a')).toBe(1);
  expect(getBlockNumber(p, 'zzz')).toBe(0);
});

it('colors blocks by rank (cycle), explicit color and fixed mode', () => {
  const blocks = Array.from({ length: 9 }, (_, i) => createBlock({ id: `b${i}` }));
  blocks[1] = createBlock({ id: 'b1', color: '#123456' });
  const p = createProject({ blocks });
  expect(getBlockColor(p, 'b0')).toBe(DEFAULT_PALETTE[0]);
  expect(getBlockColor(p, 'b1')).toBe('#123456');
  expect(getBlockColor(p, 'b8')).toBe(DEFAULT_PALETTE[0]);
  expect(getBlockColor(p, 'absent')).toBeNull();
  const fixed = createProject({ blocks, settings: { colorMode: 'fixed' } });
  expect(getBlockColor(fixed, 'b5')).toBe(DEFAULT_PALETTE[0]);
});

it('ignores empty blocks in the podcast and its duration', () => {
  const full = (id, start, duration) => createBlock({ id, clips: [{ start, duration }] });
  const b1 = createBlock({ id: 'b1', padBefore: 1, padAfter: 1, clips: [{ start: 0, duration: 4 }] });
  const empty = createBlock({ id: 'vide', padBefore: 5 });
  const b2 = createBlock({ id: 'b2', padBefore: 0.5, clips: [{ start: 2, duration: 3 }] });
  const p = createProject({ blocks: [b1, empty, b2, full('b4', 0, 1)] });
  expect(getPlayableBlocks(p).map((b) => b.id)).toEqual(['b1', 'b2', 'b4']);
  expect(getProjectDuration(p)).toBe(6 + 5.5 + 1);
  expect(getProjectDuration(createProject())).toBe(0);
});

it('handles 1,000 blocks with high performance without mutation', () => {
  let project = createProject();
  const t0 = performance.now();
  for (let i = 0; i < 1000; i++) {
    project = addBlock(project, createBlock({ id: `block-${i}` }));
  }
  expect(project.blocks).toHaveLength(1000);
  project = moveBlock(project, 'block-0', 999);
  expect(getBlockNumber(project, 'block-0')).toBe(1000);
  project = removeBlock(project, 'block-500');
  expect(project.blocks).toHaveLength(999);
  expect(performance.now() - t0).toBeLessThan(500);
});
