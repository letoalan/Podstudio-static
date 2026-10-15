/**
 * Rôle : ajout d'un enregistrement sur la timeline (bouton ＋ ou glisser-déposer depuis la bibliothèque).
 * Exemple : bindDrop(timeline); await addRecordingToTimeline(timeline, item, { lane: 1 });
 */
import * as defaultStorage from '../core/storage.js';
import { laneEnd, clipDuration } from '../core/timeline-math.js';
import { DRAG_MIME } from './library-item.js';
import { showToast } from './toast.js';

const newClipId = () => `clip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const defaultLane = (item) => (item.source === 'import' ? 1 : 0);

export async function addRecordingToTimeline(timeline, item, options = {}) {
  const lane = options.lane ?? defaultLane(item);
  const spans = timeline.mixer.getTracks().map((t) => ({ ...t, duration: clipDuration(t) }));
  const offset = options.offset ?? laneEnd(spans, lane);
  const id = newClipId();
  try {
    await timeline.mixer.addTrack(id, item.audio, {
      offset, lane, title: item.title, kind: item.source ?? 'record',
    });
  } catch {
    showToast(`Impossible de décoder « ${item.title} »`, { type: 'error' });
    return null;
  }
  timeline.render();
  timeline.select(id);
  return id;
}

export async function handleDrop(timeline, event, storage = defaultStorage) {
  event.preventDefault();
  timeline.scroll.classList.remove('drag-over');
  const id = event.dataTransfer?.getData(DRAG_MIME);
  if (!id) return null;
  const item = await storage.getRecording(id);
  if (!item) return null;
  const offset = timeline.offsetAtX(event.clientX);
  return addRecordingToTimeline(timeline, item, { offset, lane: timeline.laneAt(event.clientY) });
}

export function bindDrop(timeline, storage = defaultStorage) {
  const { scroll } = timeline;
  scroll.addEventListener('dragover', (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    scroll.classList.add('drag-over');
  });
  scroll.addEventListener('dragleave', () => scroll.classList.remove('drag-over'));
  scroll.addEventListener('drop', (event) => handleDrop(timeline, event, storage));
}
