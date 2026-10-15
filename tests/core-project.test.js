import { describe, it, expect } from 'vitest';
import {
  PROJECT_FORMAT,
  PROJECT_VERSION,
  createProjectData,
  validateProject,
  sanitizeFileName,
} from '../src/core/project.js';

describe('core/project.js', () => {
  it('creates valid project structure', () => {
    const settings = { title: 'Test Podcast', author: 'Alan' };
    const tracks = [
      { id: 'c1', title: 'Intro', offset: 0, lane: 0, volume: 0.8, audioData: 'data:audio/wav;base64,...' },
    ];
    const project = createProjectData(settings, tracks);
    expect(project.format).toBe(PROJECT_FORMAT);
    expect(project.version).toBe(PROJECT_VERSION);
    expect(project.settings.title).toBe('Test Podcast');
    expect(project.tracks).toHaveLength(1);
    expect(project.tracks[0].id).toBe('c1');
    expect(project.tracks[0].offset).toBe(0);
  });

  it('validates project data correctly and rejects invalid formats', () => {
    const valid = {
      format: PROJECT_FORMAT,
      version: 1,
      settings: { title: 'Mon show' },
      tracks: [],
    };
    const validated = validateProject(valid);
    expect(validated.format).toBe(PROJECT_FORMAT);
    expect(validated.settings.title).toBe('Mon show');

    expect(() => validateProject(null)).toThrow('FORMAT_INVALID');
    expect(() => validateProject({ invalid: true })).toThrow('NOT_A_PODSTUDIO_PROJECT');
  });

  it('sanitizes filename with title and current date', () => {
    const filename = sanitizeFileName('Émission Spéciale !');
    expect(filename).toMatch(/^podstudio-emission-speciale-\d{4}-\d{2}-\d{2}\.json$/);
    expect(sanitizeFileName('')).toMatch(/^podstudio-projet-\d{4}-\d{2}-\d{2}\.json$/);
  });
});
