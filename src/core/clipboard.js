/**
 * Rôle : gestion pure du presse-papier interne (copier, couper, coller des clips audio avec conservation des décalages relatifs).
 * Exemple : const clipb = copyClips([clip]); const nextBlock = pasteClips(clipb, block, 'track-1', 5.0);
 */
import { generateId } from './block-model.js';

export function createClipboard(items = []) {
  return { items: Array.isArray(items) ? [...items] : [] };
}

export function copyClips(clips = []) {
  if (!clips.length) return createClipboard([]);
  const baseStart = clips.reduce((min, c) => Math.min(min, c.start), clips[0].start);
  const maxEnd = clips.reduce((max, c) => Math.max(max, c.start + (c.duration || 0)), clips[0].start);
  const items = clips.map((c) => ({
    ...c,
    relativeStart: Math.max(0, c.start - baseStart),
  }));
  const cb = createClipboard(items);
  cb.sourceEnd = maxEnd;
  cb.sourceTrackId = clips[0]?.trackId;
  return cb;
}

export function cutClips(block, clipIds = []) {
  const targetIds = new Set(clipIds);
  const selectedClips = block.clips.filter((c) => targetIds.has(c.id));
  const remainingClips = block.clips.filter((c) => !targetIds.has(c.id));
  const newBlock = { ...block, clips: remainingClips, edited: true };
  const clipboard = copyClips(selectedClips);
  return { block: newBlock, clipboard };
}

export function pasteClips(clipboard, block, targetTrackId, targetStart) {
  if (!clipboard?.items?.length) return block;
  const startSec = targetStart != null
    ? Math.max(0, Number(targetStart) || 0)
    : (clipboard.sourceEnd ?? 0);
  const trackId = targetTrackId || clipboard.sourceTrackId || block.tracks[0]?.id || 'track-1';

  const newClips = clipboard.items.map((item) => ({
    ...item,
    id: generateId('clip'),
    trackId: targetTrackId ? trackId : item.trackId || trackId,
    start: startSec + (item.relativeStart || 0),
  }));

  const maxEnd = newClips.reduce((max, c) => Math.max(max, c.start + (c.duration || 0)), startSec);
  clipboard.sourceEnd = maxEnd;

  return {
    ...block,
    clips: [...block.clips, ...newClips],
    edited: true,
  };
}

export function hasClips(clipboard) {
  return Boolean(clipboard?.items?.length);
}
