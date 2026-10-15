import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  copyClip,
  cutClip,
  pasteClip,
  splitClip,
  splitAtPlayhead,
  findTrackAtPosition,
  hasClipboard,
} from '../src/ui/clipboard.js';

function mockTrack(id = 't1', duration = 10, offset = 0) {
  return {
    id,
    buffer: { duration },
    title: 'Mon Enregistrement',
    volume: 0.8,
    fadeIn: 1,
    fadeOut: 1,
    lane: 0,
    kind: 'record',
    offset,
    trimStart: 0,
    duration: null,
  };
}

function mockTimeline() {
  const tracks = new Map();
  return {
    mixer: {
      tracks,
      position: vi.fn(() => 4),
      getTracks: vi.fn(() => [...tracks.values()]),
      addBuffer: vi.fn((id, buf, meta) => {
        tracks.set(id, { id, buffer: buf, ...meta });
        return tracks.get(id);
      }),
      updateTrack: vi.fn((id, patch) => {
        const t = tracks.get(id);
        if (t) Object.assign(t, patch);
        return t;
      }),
    },
    removeClip: vi.fn((id) => tracks.delete(id)),
    render: vi.fn(),
    select: vi.fn(),
  };
}

describe('ui/clipboard.js operations', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('copies clip and checks hasClipboard', () => {
    const track = mockTrack('t1', 10);
    expect(copyClip(track)).toBe(true);
    expect(hasClipboard()).toBe(true);
  });

  it('cuts clip from timeline', () => {
    const track = mockTrack('t1', 10);
    const timeline = mockTimeline();
    expect(cutClip(track, timeline)).toBe(true);
    expect(timeline.removeClip).toHaveBeenCalledWith('t1');
  });

  it('pastes clip onto timeline at playhead position', () => {
    const track = mockTrack('t1', 10);
    copyClip(track);
    const timeline = mockTimeline();
    const newId = pasteClip(timeline);
    expect(newId).toMatch(/^clip-/);
    expect(timeline.mixer.addBuffer).toHaveBeenCalled();
    expect(timeline.render).toHaveBeenCalled();
    expect(timeline.select).toHaveBeenCalledWith(newId);
  });
});

describe('ui/clipboard.js split', () => {
  it('splits clip in two pieces at playhead position', () => {
    const track = mockTrack('t1', 10, 0);
    const timeline = mockTimeline();
    const id2 = splitClip(track, 4, timeline);
    expect(id2).toMatch(/^clip-/);
    expect(timeline.mixer.updateTrack).toHaveBeenCalledWith('t1', { duration: 4 });
    expect(timeline.mixer.addBuffer).toHaveBeenCalled();
  });

  it('splits automatically the clip under the red playhead via splitAtPlayhead', () => {
    const timeline = mockTimeline();
    timeline.mixer.tracks.set('t1', mockTrack('t1', 10, 0));
    timeline.mixer.position = vi.fn(() => 3.5);
    const id2 = splitAtPlayhead(timeline);
    expect(id2).toMatch(/^clip-/);
    expect(timeline.mixer.updateTrack).toHaveBeenCalledWith('t1', { duration: 3.5 });
  });

  it('finds track at given position and handles out-of-bounds gracefully', () => {
    const timeline = mockTimeline();
    timeline.mixer.tracks.set('t1', mockTrack('t1', 10, 2));
    expect(findTrackAtPosition(timeline, 5)).not.toBeNull();
    expect(findTrackAtPosition(timeline, 15)).toBeNull();
    timeline.mixer.position = vi.fn(() => 20);
    expect(splitAtPlayhead(timeline)).toBeNull();
  });
});
