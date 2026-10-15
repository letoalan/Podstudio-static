/**
 * Rôle : brique d'une piste sur la timeline, déplaçable à la souris/au doigt et au clavier.
 * Exemple : lane.append(buildClip(track, 10, { onSelect, onMove, onDelete, laneAt }));
 */
import { h } from './dom.js';
import { clipDuration, pxToSeconds, secondsToPx, snap, formatClock } from '../core/timeline-math.js';
import { attachTrimHandles } from './timeline-trim.js';

const NUDGE = 0.1;
const NUDGE_BIG = 1;

function attachDrag(el, track, pps, handlers) {
  el.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    handlers.onSelect(track.id);
    const startX = event.clientX;
    const result = { offset: track.offset, lane: track.lane };
    el.setPointerCapture?.(event.pointerId);
    el.classList.add('dragging');
    const move = (ev) => {
      result.offset = snap(track.offset + pxToSeconds(ev.clientX - startX, pps));
      result.lane = handlers.laneAt(ev.clientY);
      el.style.left = `${secondsToPx(result.offset, pps)}px`;
    };
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.classList.remove('dragging');
      handlers.onMove(track.id, result);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
  });
}

function handleClipHotkeys(event, track, handlers) {
  if (event.ctrlKey || event.metaKey) {
    const key = event.key.toLowerCase();
    if (key === 'c') { handlers.onCopy?.(track); event.preventDefault(); }
    else if (key === 'x') { handlers.onCut?.(track); event.preventDefault(); }
    return true;
  }
  return false;
}

function attachKeyboard(el, track, handlers) {
  el.addEventListener('keydown', (event) => {
    if (handleClipHotkeys(event, track, handlers)) return;
    const step = event.shiftKey ? NUDGE_BIG : NUDGE;
    if (event.key === 'ArrowLeft') handlers.onMove(track.id, { offset: Math.max(0, snap(track.offset - step)) });
    else if (event.key === 'ArrowRight') handlers.onMove(track.id, { offset: snap(track.offset + step) });
    else if (event.key === 'Delete' || event.key === 'Backspace') handlers.onDelete(track.id);
    else return;
    event.preventDefault();
  });
}

export function buildClip(track, pps, handlers) {
  const duration = clipDuration(track);
  const el = h('div', {
    class: `clip clip--${track.kind === 'import' ? 'import' : 'record'}`,
    tabindex: 0,
    role: 'button',
    'aria-label': `${track.title || 'Clip'}, début ${track.offset.toFixed(1)} s`,
    dataset: { id: track.id },
    style: {
      left: `${secondsToPx(track.offset, pps)}px`,
      width: `${Math.max(16, secondsToPx(duration, pps))}px`,
    },
  }, h('span', { class: 'clip-title' }, track.title || 'Clip'),
  h('span', { class: 'clip-dur' }, formatClock(duration)));
  attachTrimHandles(el, track, pps, { onTrim: (id, patch) => handlers.onMove(id, patch) });
  attachDrag(el, track, pps, handlers);
  attachKeyboard(el, track, handlers);
  el.addEventListener('focus', () => handlers.onSelect(track.id));
  return el;
}
