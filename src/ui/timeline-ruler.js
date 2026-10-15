/**
 * Rôle : dessine la règle graduée (secondes) au-dessus des lignes de la timeline.
 * Exemple : renderRuler(rulerEl, 90, 10); // 90 s à 10 px/s
 */
import { buildTicks, secondsToPx } from '../core/timeline-math.js';
import { h, clear } from './dom.js';

export function renderRuler(container, duration, pps) {
  clear(container);
  container.style.width = `${secondsToPx(duration, pps)}px`;
  for (const tick of buildTicks(duration, pps)) {
    container.append(h('div', {
      class: 'tick',
      style: { left: `${secondsToPx(tick.time, pps)}px` },
      'data-time': tick.time,
    }, h('span', {}, tick.label)));
  }
  return container;
}
