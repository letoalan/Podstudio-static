/**
 * Rôle : pastille numérotée et segment de rail vertical pour un bloc de podcast.
 * Exemple : const rail = createBlockRail({ rank: 1, color: '#8940fa', isFirst: true, isLast: false, onSelect });
 */
import { h } from './dom.js';
import { textColorFor } from '../core/palette.js';

export function createBlockBadge({ rank, color, onColorPick }) {
  const textColor = textColorFor(color);
  const badge = h('div', {
    class: 'block-rail-badge',
    style: `background-color: ${color}; color: ${textColor};`,
    'aria-label': `Bloc ${rank}`,
    title: `Bloc ${rank}${onColorPick ? ' — Cliquer pour changer la couleur' : ''}`,
  }, String(rank));

  if (onColorPick) {
    const input = h('input', {
      type: 'color',
      class: 'block-rail-color-picker',
      value: color,
      'aria-label': `Couleur du bloc ${rank}`,
    });
    input.addEventListener('change', (e) => onColorPick(e.target.value));
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      input.click();
    });
    badge.append(input);
  }
  return badge;
}

export function createBlockRail({ rank, color, isFirst = false, isLast = false, onColorPick }) {
  const badge = createBlockBadge({ rank, color, onColorPick });
  const lineTop = h('div', { class: `rail-line rail-line-top${isFirst ? ' is-hidden' : ''}` });
  const lineBottom = h('div', { class: `rail-line rail-line-bottom${isLast ? ' is-hidden' : ''}` });

  return h('div', {
    class: 'block-rail-node',
    'data-rank': String(rank),
  }, lineTop, badge, lineBottom);
}
