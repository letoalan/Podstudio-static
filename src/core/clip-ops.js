/**
 * Rôle : opérations pures de manipulation des clips audio (déplacement, rognage début/fin, scission, suppression).
 * Exemple : const [c1, c2] = splitClip(clip, 4.5); const moved = moveClip(clip, { start: 2 });
 */
import { generateId } from './block-model.js';

export function moveClip(clip, patch = {}) {
  const startVal = typeof patch?.start === 'object' && patch.start !== null ? patch.start.start : patch?.start;
  const trackVal = typeof patch?.start === 'object' && patch.start !== null && patch.start.trackId
    ? patch.start.trackId
    : patch?.trackId;
  const numStart = startVal != null ? Number(startVal) : NaN;
  const nextStart = !Number.isNaN(numStart) ? Math.max(0, numStart) : clip.start;
  const nextTrackId = trackVal != null ? String(trackVal) : clip.trackId;
  return { ...clip, start: nextStart, trackId: nextTrackId };
}

export function trimClipStart(clip, newStart, minDuration = 0.1) {
  const currentEnd = clip.start + clip.duration;
  let targetStart = Math.min(Math.max(0, Number(newStart)), currentEnd - minDuration);
  let delta = targetStart - clip.start;
  if (clip.offset + delta < 0) {
    delta = -clip.offset;
    targetStart = clip.start + delta;
  }
  const nextDuration = Math.max(minDuration, currentEnd - targetStart);
  return {
    ...clip,
    start: targetStart,
    offset: Math.max(0, clip.offset + delta),
    duration: nextDuration,
  };
}

export function trimClipEnd(clip, newEnd, maxDuration = Infinity, minDuration = 0.1) {
  const targetEnd = Math.max(clip.start + minDuration, Number(newEnd));
  let duration = targetEnd - clip.start;
  if (Number.isFinite(maxDuration)) {
    const maxAvailable = Math.max(minDuration, maxDuration - clip.offset);
    duration = Math.min(duration, maxAvailable);
  }
  return { ...clip, duration };
}

export function splitClip(clip, splitPoint, minDuration = 0.05) {
  const splitSec = Number(splitPoint);
  if (splitSec <= clip.start + minDuration || splitSec >= clip.start + clip.duration - minDuration) {
    return [clip];
  }
  const leftDuration = splitSec - clip.start;
  const rightDuration = clip.duration - leftDuration;
  const left = { ...clip, duration: leftDuration };
  const right = {
    ...clip,
    id: generateId('clip'),
    start: splitSec,
    offset: clip.offset + leftDuration,
    duration: rightDuration,
    name: `${clip.name || 'Clip'} (suite)`,
  };
  return [left, right];
}

export function deleteClip(clips, clipId) {
  return clips.filter((c) => c.id !== clipId);
}

export function updateClip(clips, clipId, patchOrUpdater) {
  return clips.map((c) => {
    if (c.id !== clipId) return c;
    return typeof patchOrUpdater === 'function' ? patchOrUpdater(c) : { ...c, ...patchOrUpdater };
  });
}
