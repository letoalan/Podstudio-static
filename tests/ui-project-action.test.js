import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportProject, importProject, createProjectControls } from '../src/ui/project-action.js';

function mockTimeline() {
  const tracks = new Map();
  return {
    mixer: {
      tracks,
      getTracks: vi.fn(() => [...tracks.values()]),
      halt: vi.fn(),
      addTrack: vi.fn(async (id, blob, meta) => {
        tracks.set(id, { id, buffer: { duration: 5 }, ...meta });
        return tracks.get(id);
      }),
    },
    render: vi.fn(),
    select: vi.fn(),
  };
}

describe('ui/project-action.js export', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    globalThis.URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  it('exports project to JSON and triggers download', async () => {
    const timeline = mockTimeline();
    timeline.mixer.tracks.set('c1', {
      id: 'c1',
      title: 'Intro',
      offset: 0,
      lane: 0,
      buffer: {
        numberOfChannels: 1,
        sampleRate: 44100,
        length: 10,
        getChannelData: () => new Float32Array(10),
      },
    });

    const data = await exportProject(timeline, { settings: { title: 'Test Export' } });
    expect(data.settings.title).toBe('Test Export');
    expect(data.tracks).toHaveLength(1);
    expect(data.tracks[0].audioData).toMatch(/^data:audio\/wav;base64,/);
    expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
  });
});

describe('ui/project-action.js import & controls', () => {
  it('imports valid JSON project file and restores timeline tracks', async () => {
    const timeline = mockTimeline();
    const saveSettingsFn = vi.fn();
    const fakeProject = {
      format: 'podstudio-project',
      version: 1,
      settings: { title: 'Projet Importé' },
      tracks: [
        { id: 'p1', title: 'Voix 1', offset: 2, lane: 0, audioData: 'data:audio/wav;base64,UklGRg==' },
      ],
    };
    const file = new File([JSON.stringify(fakeProject)], 'projet.json', { type: 'application/json' });

    const result = await importProject(timeline, file, { saveSettingsFn });
    expect(result).not.toBeNull();
    expect(saveSettingsFn).toHaveBeenCalledWith(expect.objectContaining({ title: 'Projet Importé' }));
    expect(timeline.mixer.addTrack).toHaveBeenCalled();
    expect(timeline.render).toHaveBeenCalled();
  });

  it('creates project controls DOM buttons', () => {
    const timeline = mockTimeline();
    const el = createProjectControls(timeline);
    expect(el.querySelector('button[title*="Sauvegarder"]')).not.toBeNull();
    expect(el.querySelector('button[title*="Ouvrir"]')).not.toBeNull();
    expect(el.querySelector('input[type="file"]')).not.toBeNull();
  });
});
