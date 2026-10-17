/**
 * Rôle : curseur rouge de lecture (playhead) avec synchronisation de position et déplacement manuel au glisser.
 * Exemple : const ph = createPlayhead({ pps: 20, onSeek }); ph.setTime(4.5);
 */
import { h } from '../dom.js';
import { secondsToPx, pxToSeconds } from '../../core/timeline-math.js';

export function createPlayhead({ pps = 20, onSeek }) {
  let currentTime = 0;
  let currentPps = pps;

  const line = h('div', { class: 'timeline-playhead-line' });
  const handle = h('div', { class: 'timeline-playhead-handle', title: 'Tête de lecture' });
  const el = h('div', { class: 'timeline-playhead', style: 'left: 0px' }, handle, line);

  function setTime(timeSec) {
    currentTime = Math.max(0, timeSec);
    el.style.left = `${secondsToPx(currentTime, currentPps)}px`;
  }

  function setPps(newPps) {
    currentPps = newPps;
    setTime(currentTime);
  }

  handle.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    const parent = el.parentElement;
    if (!parent) return;

    const onMove = (ev) => {
      const rect = parent.getBoundingClientRect();
      const clickX = ev.clientX - rect.left;
      const targetTime = Math.max(0, pxToSeconds(clickX, currentPps));
      setTime(targetTime);
      onSeek?.(targetTime);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  });

  return {
    el,
    setTime,
    setPps,
    getTime: () => currentTime,
  };
}
