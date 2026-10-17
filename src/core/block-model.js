/**
 * Rôle : fabrique et validation du modèle de bloc (couleur, 2 pistes par défaut, clips) ; un bloc n'a ni nom ni type.
 * Exemple : const block = createBlock({ color: '#ff0055' }); isBlockEmpty(block); // true
 */
import { normalizeBlockColor } from './palette.js';

export function generateId(prefix = 'b') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function createDefaultTracks() {
  return [
    { id: generateId('t'), name: 'Piste 1', volume: 1, muted: false, solo: false },
    { id: generateId('t'), name: 'Piste 2', volume: 1, muted: false, solo: false },
  ];
}

export function createClip(props = {}) {
  return {
    id: props.id || generateId('clip'),
    trackId: String(props.trackId || ''),
    sourceId: String(props.sourceId || ''),
    start: Math.max(0, Number(props.start) || 0),
    offset: Math.max(0, Number(props.offset) || 0),
    duration: Math.max(0, Number(props.duration) || 0),
    gain: props.gain != null ? Number(props.gain) : 1,
    fadeIn: Math.max(0, Number(props.fadeIn) || 0),
    fadeOut: Math.max(0, Number(props.fadeOut) || 0),
    name: props.name || 'Clip',
    acousticFeatures: props.acousticFeatures || null,
  };
}

export function createBlock(props = {}) {
  const tracks = Array.isArray(props.tracks) && props.tracks.length > 0 ? props.tracks : createDefaultTracks();
  const firstTrackId = tracks[0].id;
  const clips = Array.isArray(props.clips)
    ? props.clips.map((c) => createClip({
      ...c,
      trackId: c.trackId && tracks.some((t) => t.id === c.trackId) ? c.trackId : firstTrackId,
    }))
    : [];
  return {
    id: props.id || generateId('block'),
    type: props.type || 'block',
    transition: props.transition || null,
    color: normalizeBlockColor(props.color),
    tracks,
    clips,
    edited: Boolean(props.edited),
    padBefore: Math.max(0, Number(rawPad(props.padBefore))),
    padAfter: Math.max(0, Number(rawPad(props.padAfter))),
    customNature: props.customNature || null,
    acousticFeatures: props.acousticFeatures || null,
  };
}

const rawPad = (val) => Number(val) || 0;

function normalizeTrack(track, index) {
  return {
    id: String(track.id || `track-${index + 1}`),
    name: String(track.name || `Piste ${index + 1}`),
    volume: Number(track.volume ?? 1),
    muted: Boolean(track.muted),
    solo: Boolean(track.solo),
  };
}

export function validateBlock(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('BLOCK_INVALID');
  if (!raw.id || typeof raw.id !== 'string') throw new Error('BLOCK_MISSING_ID');
  if (!Array.isArray(raw.tracks)) throw new Error('BLOCK_TRACKS_ARRAY_REQUIRED');
  if (!Array.isArray(raw.clips)) throw new Error('BLOCK_CLIPS_ARRAY_REQUIRED');
  return {
    id: raw.id,
    type: raw.type || 'block',
    transition: raw.transition || null,
    color: normalizeBlockColor(raw.color),
    tracks: raw.tracks.map(normalizeTrack),
    clips: raw.clips.map((c) => createClip(c)),
    edited: Boolean(raw.edited),
    padBefore: Math.max(0, Number(raw.padBefore) || 0),
    padAfter: Math.max(0, Number(raw.padAfter) || 0),
    customNature: raw.customNature || null,
    acousticFeatures: raw.acousticFeatures || null,
  };
}

export const isBlockEmpty = (block) => (block?.type === 'transition' ? false : !block?.clips?.length);

export function getBlockContentDuration(block) {
  if (isBlockEmpty(block)) return 0;
  if (block?.type === 'transition') return block.transition?.duration || 0;
  return block.clips.reduce((max, c) => Math.max(max, (c.start || 0) + (c.duration || 0)), 0);
}

/** Durée dans le podcast : un bloc vide est ignoré, donc 0 (paddings compris). */
export function getBlockTotalDuration(block) {
  if (isBlockEmpty(block)) return 0;
  if (block?.type === 'transition') return block.transition?.duration || 0;
  return (block.padBefore || 0) + getBlockContentDuration(block) + (block.padAfter || 0);
}
