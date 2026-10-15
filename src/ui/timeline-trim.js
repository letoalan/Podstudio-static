/**
 * Rôle : poignées interactives de rognage (trim gauche/droite) sur les clips de la timeline.
 * Exemple : attachTrimHandles(clipEl, track, pps, handlers);
 */
import { h } from './dom.js';
import { clipDuration, pxToSeconds, secondsToPx, snap } from '../core/timeline-math.js';

function bindStartDrag(handle, el, track, pps, onTrim) {
  handle.addEventListener('pointerdown', (event) => {
    event.stopPropagation();
    handle.setPointerCapture?.(event.pointerId);
    const startX = event.clientX;
    const orig = { offset: track.offset, trim: track.trimStart || 0, dur: clipDuration(track) };
    const maxEnd = orig.offset + orig.dur;
    let res = null;
    const move = (ev) => {
      const dSec = pxToSeconds(ev.clientX - startX, pps);
      const newOffset = Math.min(maxEnd - 0.2, Math.max(0, orig.offset + dSec));
      const actualD = newOffset - orig.offset;
      const newTrim = Math.max(0, Math.min(track.buffer.duration - 0.2, orig.trim + actualD));
      const newDur = Math.max(0.2, orig.dur - actualD);
      res = { offset: snap(newOffset), trimStart: snap(newTrim), duration: snap(newDur) };
      el.style.left = `${secondsToPx(res.offset, pps)}px`;
      el.style.width = `${secondsToPx(res.duration, pps)}px`;
    };
    const up = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
      if (res) onTrim(track.id, res);
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
  });
}

function bindEndDrag(handle, el, track, pps, onTrim) {
  handle.addEventListener('pointerdown', (event) => {
    event.stopPropagation();
    handle.setPointerCapture?.(event.pointerId);
    const startX = event.clientX;
    const origDur = clipDuration(track);
    const maxDur = track.buffer.duration - (track.trimStart || 0);
    let res = null;
    const move = (ev) => {
      const dSec = pxToSeconds(ev.clientX - startX, pps);
      const newDur = Math.max(0.2, Math.min(maxDur, origDur + dSec));
      res = { duration: snap(newDur) };
      el.style.width = `${secondsToPx(res.duration, pps)}px`;
    };
    const up = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
      if (res) onTrim(track.id, res);
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
  });
}

export function attachTrimHandles(el, track, pps, { onTrim }) {
  const left = h('span', { class: 'clip-trim clip-trim--start', title: 'Glisser pour rogner le début' });
  const right = h('span', { class: 'clip-trim clip-trim--end', title: 'Glisser pour rogner la fin' });
  bindStartDrag(left, el, track, pps, onTrim);
  bindEndDrag(right, el, track, pps, onTrim);
  el.append(left, right);
}
