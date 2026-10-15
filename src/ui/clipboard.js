/**
 * Rôle : gestion du presse-papier (copier, couper, coller) et scission de clips audio.
 * Exemple : copyClip(track); pasteClip(timeline);
 */
import { emit } from '../core/bus.js';
import { clipDuration, snap } from '../core/timeline-math.js';
import { showToast } from './toast.js';

let clipboard = null;

const newClipId = () => `clip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export const hasClipboard = () => Boolean(clipboard);

export function copyClip(track) {
  if (!track) return false;
  clipboard = {
    buffer: track.buffer,
    title: track.title,
    volume: track.volume,
    fadeIn: track.fadeIn,
    fadeOut: track.fadeOut,
    lane: track.lane,
    kind: track.kind,
    trimStart: track.trimStart || 0,
    duration: track.duration ?? null,
  };
  showToast(`« ${track.title || 'Clip'} » copié`, { type: 'info' });
  emit('clipboard:change', clipboard);
  return true;
}

export function cutClip(track, timeline) {
  if (!track || !timeline) return false;
  copyClip(track);
  timeline.removeClip(track.id);
  showToast(`« ${track.title || 'Clip'} » coupé`, { type: 'info' });
  return true;
}

export function pasteClip(timeline, options = {}) {
  if (!clipboard || !timeline) return null;
  const lane = options.lane ?? clipboard.lane ?? 0;
  const offset = snap(options.offset ?? timeline.mixer.position());
  const id = newClipId();
  timeline.mixer.addBuffer(id, clipboard.buffer, { ...clipboard, offset, lane });
  timeline.render();
  timeline.select(id);
  showToast(`« ${clipboard.title || 'Clip'} » collé`, { type: 'success' });
  return id;
}

export function findTrackAtPosition(timeline, position, preferredId = null) {
  if (!timeline) return null;
  const tracks = timeline.mixer.getTracks();
  if (preferredId) {
    const pref = tracks.find((t) => t.id === preferredId);
    if (pref) {
      const dur = clipDuration(pref);
      if (position >= pref.offset && position <= pref.offset + dur) return pref;
    }
  }
  return tracks.find((t) => {
    const dur = clipDuration(t);
    return position >= t.offset && position <= t.offset + dur;
  }) || null;
}

export function splitClip(track, position, timeline) {
  if (!track || !timeline) return null;
  const dur = clipDuration(track);
  const splitSec = snap(position - track.offset);
  if (splitSec <= 0.05 || splitSec >= dur - 0.05) {
    showToast('Position du curseur trop proche de l’extrémité du morceau', { type: 'error' });
    return null;
  }
  const id2 = newClipId();
  const trim2 = (track.trimStart || 0) + splitSec;
  const dur2 = dur - splitSec;
  timeline.mixer.updateTrack(track.id, { duration: splitSec });
  timeline.mixer.addBuffer(id2, track.buffer, {
    ...track,
    id: id2,
    offset: track.offset + splitSec,
    trimStart: trim2,
    duration: dur2,
    title: `${track.title || 'Clip'} (suite)`,
  });
  timeline.render();
  timeline.select(id2);
  showToast('Morceau scindé au curseur rouge', { type: 'success' });
  return id2;
}

export function splitAtPlayhead(timeline) {
  if (!timeline) return null;
  const pos = timeline.mixer.position();
  const track = findTrackAtPosition(timeline, pos, timeline.selected);
  if (!track) {
    showToast('Placez le curseur rouge sur un morceau pour le scinder', { type: 'info' });
    return null;
  }
  return splitClip(track, pos, timeline);
}
