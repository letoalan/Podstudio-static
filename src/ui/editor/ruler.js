/**
 * Rôle : règle temporelle de l'éditeur de bloc avec graduations et déplacement de la tête de lecture au clic.
 * Exemple : const ruler = createRuler({ duration: 60, pps: 20, onSeek });
 */
import { h } from '../dom.js';
import { buildTicks, secondsToPx, pxToSeconds } from '../../core/timeline-math.js';

export function createRuler({ duration = 30, pps = 20, onSeek }) {
  const rulerEl = h('div', { class: 'timeline-ruler' });
  const ticks = buildTicks(Math.max(10, duration), pps);

  for (const tick of ticks) {
    const leftPx = secondsToPx(tick.time, pps);
    const tickEl = h('div', { class: 'ruler-tick major', style: `left:${leftPx}px` },
      h('span', { class: 'ruler-label' }, tick.label));
    rulerEl.append(tickEl);
  }

  rulerEl.addEventListener('click', (e) => {
    const rect = rulerEl.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const seekTime = Math.max(0, pxToSeconds(clickX, pps));
    onSeek?.(seekTime);
  });

  return rulerEl;
}
