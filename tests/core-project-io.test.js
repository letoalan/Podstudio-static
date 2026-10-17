import { it, expect } from 'vitest';
import { createBlock } from '../src/core/block-model.js';
import { DEFAULT_PALETTE } from '../src/core/palette.js';
import {
  PROJECT_FORMAT,
  PROJECT_VERSION,
  sanitizeFileName,
  serializeProject,
  deserializeProject,
  validateProjectData,
} from '../src/core/project-io.js';

it('sanitizes file names for export', () => {
  expect(sanitizeFileName('Mon Grand Show !')).toMatch(/^podstudio-mon-grand-show-\d{4}-\d{2}-\d{2}\.json$/);
});

it('serializes and deserializes a v3 project without loss', () => {
  const block = createBlock({ color: '#ff0055' });
  const palette = ['#111111', '#222222'];
  const project = {
    id: 'proj-123',
    title: 'Projet Test',
    settings: { author: 'Alan', palette, colorMode: 'fixed' },
    blocks: [block],
  };

  const loaded = deserializeProject(serializeProject(project));
  expect(loaded.format).toBe(PROJECT_FORMAT);
  expect(loaded.version).toBe(3);
  expect(PROJECT_VERSION).toBe(3);
  expect(loaded.id).toBe('proj-123');
  expect(loaded.settings.palette).toEqual(palette);
  expect(loaded.settings.colorMode).toBe('fixed');
  expect(loaded.blocks).toHaveLength(1);
  expect(loaded.blocks[0].color).toBe('#ff0055');
});

it('adds the default 8-color palette when a project has none', () => {
  const loaded = validateProjectData({ format: PROJECT_FORMAT, blocks: [], settings: { palette: ['x'], colorMode: '?' } });
  expect(loaded.settings.palette).toEqual([...DEFAULT_PALETTE]);
  expect(loaded.settings.palette).toHaveLength(8);
  expect(loaded.settings.colorMode).toBe('cycle');
});

it('migrates v2 named blocks: titles and kinds are dropped, order gives the number', () => {
  const v2 = {
    format: PROJECT_FORMAT,
    version: 2,
    blocks: [
      { ...createBlock({ id: 'b1' }), title: 'Introduction', subtitle: 's', kind: 'voice', color: '#8940fa' },
      { ...createBlock({ id: 'b2' }), title: 'Jingle', kind: 'jingle', color: '#22d3a5' },
    ],
  };
  const loaded = validateProjectData(v2);
  expect(loaded.version).toBe(3);
  expect(loaded.blocks.map((b) => b.id)).toEqual(['b1', 'b2']);
  expect(loaded.blocks[0]).not.toHaveProperty('title');
  expect(loaded.blocks[1]).not.toHaveProperty('kind');
  expect(loaded.blocks[1].color).toBe('#22d3a5');
});

it('migrates legacy track projects into one block whose clips match its tracks', () => {
  const legacy = {
    format: PROJECT_FORMAT,
    version: 1,
    settings: { title: 'Legacy Show' },
    tracks: [
      { id: 't1', title: 'Voix', offset: 0, duration: 10, lane: 0 },
      { id: 't2', title: 'Musique', offset: 2, duration: 15, lane: 1 },
    ],
  };

  const converted = validateProjectData(legacy);
  const [block] = converted.blocks;
  expect(converted.blocks).toHaveLength(1);
  expect(block.clips.map((c) => c.name)).toEqual(['Voix', 'Musique']);
  expect(block.edited).toBe(true);
  const trackIds = block.tracks.map((t) => t.id);
  expect(block.clips.every((c) => trackIds.includes(c.trackId))).toBe(true);
});

it('rejects invalid or corrupted project payloads', () => {
  expect(() => validateProjectData(null)).toThrow('FORMAT_INVALID');
  expect(() => validateProjectData({ unknown: true })).toThrow('NOT_A_PODSTUDIO_PROJECT');
});
