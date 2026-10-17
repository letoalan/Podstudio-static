/**
 * Rôle : affichage et interaction d'un clip sur la timeline (sélection, déplacement, poignées de rognage début et fin).
 * Exemple : const el = createClipView(clip, { pps: 20, onSelect, onTrim, onMove });
 */
import { h } from '../dom.js';
import { trimClipStart, trimClipEnd } from '../../core/clip-ops.js';

function setupTrimHandles(clipEl, clip, pps, onTrim) {
  const hStart = h('div', { class: 'clip-trim-handle start', title: 'Rogner le début' });
  const hEnd = h('div', { class: 'clip-trim-handle end', title: 'Rogner la fin' });

  hStart.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    const startX = e.clientX;
    const initialStart = clip.start;
    const onMove = (ev) => {
      const deltaSec = (ev.clientX - startX) / pps;
      const updated = trimClipStart(clip, initialStart + deltaSec);
      onTrim(updated);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  });

  hEnd.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    const startX = e.clientX;
    const initialEnd = clip.start + clip.duration;
    const onMove = (ev) => {
      const deltaSec = (ev.clientX - startX) / pps;
      const updated = trimClipEnd(clip, initialEnd + deltaSec);
      onTrim(updated);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  });

  clipEl.append(hStart, hEnd);
}

function detectTargetTrack(ev, clipEl) {
  clipEl.style.pointerEvents = 'none';
  const targetEl = document.elementFromPoint?.(ev.clientX, ev.clientY);
  clipEl.style.pointerEvents = '';
  return targetEl?.closest?.('[data-track-id]')?.dataset?.trackId || null;
}

function setupClipDrag(clipEl, clip, pps, onSelect, onMove) {
  clipEl.addEventListener('mousedown', (e) => {
    if (e.target.closest('.clip-trim-handle')) return;
    onSelect?.(clip);
    const startX = e.clientX;
    const initialStart = clip.start;
    let hasMoved = false;

    const onMouseMove = (ev) => {
      const deltaPx = ev.clientX - startX;
      if (Math.abs(deltaPx) > 3) {
        hasMoved = true;
        clipEl.classList.add('is-dragging');
      }
      const deltaSec = deltaPx / pps;
      const nextStart = Math.max(0, initialStart + deltaSec);
      clipEl.style.left = `${nextStart * pps}px`;
    };

    const onMouseUp = (ev) => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      clipEl.classList.remove('is-dragging');
      if (hasMoved) {
        const deltaSec = (ev.clientX - startX) / pps;
        const targetTrackId = detectTargetTrack(ev, clipEl);
        onMove?.(clip, Math.max(0, initialStart + deltaSec), targetTrackId);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  });
}

export function createClipView(clip, { pps = 20, isSelected = false, onSelect, onTrim, onMove }) {
  const leftPx = Math.max(0, clip.start * pps);
  const widthPx = Math.max(16, clip.duration * pps);

  const clipEl = h('div', {
    class: `timeline-clip ${isSelected ? 'selected' : ''}`,
    'data-clip-id': clip.id,
    style: `left:${leftPx}px; width:${widthPx}px;`,
  });

  const titleEl = h('span', { class: 'clip-title' }, clip.name || 'Clip');
  const durEl = h('span', { class: 'clip-duration' }, `${clip.duration?.toFixed(1)}s`);
  clipEl.append(titleEl, durEl);

  setupClipDrag(clipEl, clip, pps, onSelect, onMove);
  setupTrimHandles(clipEl, clip, pps, onTrim);
  return clipEl;
}
