/**
 * Rôle : carte transition (arc de cercle avec flèche par défaut, dépliable en mode fantôme avec bouton -).
 * Exemple : const card = createTransitionCard(block, { onUpdate, onDelete });
 */
import { h } from './dom.js';
import { TRANSITION_TYPES, normalizeTransition } from '../core/transition-model.js';
import { previewTransition } from '../audio/transitions.js';

let activePreview = null;

function renderTypeSelect(currentType, onChangeType) {
  const select = h('select', { class: 'form-control transition-select', 'aria-label': 'Type de transition' });
  for (const t of TRANSITION_TYPES) {
    const opt = h('option', { value: t.id }, `${t.icon} ${t.label}`);
    if (t.id === currentType) opt.selected = true;
    select.append(opt);
  }
  select.addEventListener('change', (e) => onChangeType(e.target.value));
  return select;
}

function renderDurationControl(duration, onChangeDuration) {
  const durLabel = h('span', { class: 'transition-dur-val' }, `${duration.toFixed(1)}s`);
  const slider = h('input', {
    type: 'range', class: 'transition-slider', min: '0.2', max: '5.0', step: '0.1', value: duration,
    'aria-label': 'Durée de la transition',
  });
  slider.addEventListener('input', (e) => {
    durLabel.textContent = `${Number(e.target.value).toFixed(1)}s`;
    onChangeDuration(Number(e.target.value));
  });
  return h('div', { class: 'transition-dur-group' }, h('span', { class: 'transition-dur-hint' }, 'Durée :'), slider, durLabel);
}

function handlePreviewToggle(btn, transition) {
  if (activePreview) {
    activePreview.stop();
    activePreview = null;
    btn.textContent = '▶ Écouter';
    btn.classList.remove('is-playing');
    return;
  }
  btn.textContent = '⏹ Arrêter';
  btn.classList.add('is-playing');
  previewTransition(transition).then((handle) => {
    activePreview = handle;
    setTimeout(() => {
      if (activePreview === handle) {
        activePreview = null;
        btn.textContent = '▶ Écouter';
        btn.classList.remove('is-playing');
      }
    }, (transition.duration || 1) * 1000 + 300);
  }).catch(() => {
    btn.textContent = '▶ Écouter';
    btn.classList.remove('is-playing');
  });
}

function renderGhostCardContent(transition, callbacks, onCollapse) {
  const rail = h('div', { class: 'transition-rail' }, h('span', { class: 'transition-rail-icon' }, transition.icon));
  const select = renderTypeSelect(transition.type, (newType) => callbacks.onUpdate?.({ transition: { ...transition, type: newType } }));
  const durControl = renderDurationControl(transition.duration, (newDur) => callbacks.onUpdate?.({ transition: { ...transition, duration: newDur } }));

  const btnPreview = h('button', { type: 'button', class: 'btn-tool btn-transition-preview' }, '▶ Écouter');
  btnPreview.addEventListener('click', (e) => { e.stopPropagation(); handlePreviewToggle(btnPreview, transition); });

  const btnMinus = h('button', { type: 'button', class: 'btn-icon transition-btn-collapse', title: 'Réduire en arc de transition (−)' }, '−');
  btnMinus.addEventListener('click', (e) => { e.stopPropagation(); onCollapse(); });

  const btnDel = h('button', { type: 'button', class: 'btn-icon transition-btn-del', title: 'Supprimer' }, '🗑️');
  btnDel.addEventListener('click', (e) => { e.stopPropagation(); callbacks.onDelete(); });

  const head = h('div', { class: 'transition-header' }, h('strong', { class: 'transition-title' }, '⚡ Transition (Fantôme)'), select, btnMinus, btnDel);
  const body = h('div', { class: 'transition-body' }, durControl, btnPreview);
  const main = h('div', { class: 'transition-main' }, head, body);
  return [rail, main];
}

function createLateralArrowSvg(side = 'right') {
  const isRight = side === 'right';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', `lateral-arrow-svg arrow-${side}`);
  svg.setAttribute('viewBox', '0 0 60 100');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');

  const gradId = `lateralGrad_${side}`;
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  grad.setAttribute('id', gradId);
  grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
  grad.setAttribute('x2', '0%'); grad.setAttribute('y2', '100%');

  const c1 = isRight ? '#ec4899' : '#06b6d4';
  const c3 = isRight ? '#06b6d4' : '#ec4899';
  const stops = [['0%', c1], ['50%', '#8b5cf6'], ['100%', c3]].map(([off, col]) => {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    s.setAttribute('offset', off); s.setAttribute('stop-color', col);
    return s;
  });
  grad.append(...stops);
  defs.append(grad);

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', isRight ? 'M 8,4 C 58,24 54,78 19,92' : 'M 52,4 C 2,24 6,78 41,92');
  path.setAttribute('stroke', `url(#${gradId})`);
  path.setAttribute('stroke-width', '2.8');
  path.setAttribute('vector-effect', 'non-scaling-stroke');
  path.setAttribute('stroke-linecap', 'round');

  const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  arrow.setAttribute('points', isRight ? '18,87 7,96 22,97' : '42,87 53,96 38,97');
  arrow.setAttribute('fill', c3);

  svg.append(defs, path, arrow);
  return svg;
}

function renderArcBridge(transition, onExpand) {
  const typeDef = TRANSITION_TYPES.find((t) => t.id === transition.type) || TRANSITION_TYPES[0];
  const arcTrigger = h('button', {
    type: 'button',
    class: 'transition-arc-trigger',
    title: 'Cliquez pour ouvrir la transition en mode fantôme',
  },
    h('span', { class: 'arc-icon' }, typeDef.icon),
    h('span', { class: 'arc-label' }, `${typeDef.label} • ${transition.duration.toFixed(1)}s`),
    h('span', { class: 'arc-expand-arrow' }, '⚡'),
  );
  arcTrigger.addEventListener('click', (e) => { e.stopPropagation(); onExpand(); });

  const leftContainer = h('div', { class: 'lateral-arrow-container arrow-left' }, createLateralArrowSvg('left'));
  const rightContainer = h('div', { class: 'lateral-arrow-container arrow-right' }, createLateralArrowSvg('right'));
  const center = h('div', { class: 'arc-center-wrapper' },
    h('div', { class: 'arc-spine-line' }),
    arcTrigger,
    h('div', { class: 'arc-spine-line' }),
  );
  return h('div', { class: 'transition-arc-curve' }, leftContainer, center, rightContainer);
}

export function createTransitionCard(block, callbacks = {}) {
  const transition = normalizeTransition(block.transition);
  let isGhost = Boolean(block.isGhost);

  const card = h('div', {
    class: `block-card transition-card${isGhost ? ' is-ghost-mode' : ' is-arc-mode'}`,
    'data-block-id': block.id,
    draggable: 'true',
  });

  const render = () => {
    card.innerHTML = '';
    card.className = `block-card transition-card${isGhost ? ' is-ghost-mode' : ' is-arc-mode'}`;
    if (isGhost) {
      const parts = renderGhostCardContent(transition, {
        onUpdate: callbacks.onUpdate,
        onDelete: () => callbacks.onDelete?.(block.id),
      }, () => { isGhost = false; render(); });
      card.append(...parts);
    } else {
      card.append(renderArcBridge(transition, () => { isGhost = true; render(); }));
    }
  };

  card.addEventListener('dragstart', (e) => {
    card.classList.add('is-dragging');
    e.dataTransfer.setData('text/plain', block.id);
    e.dataTransfer.effectAllowed = 'move';
  });
  card.addEventListener('dragend', () => card.classList.remove('is-dragging'));

  render();
  return card;
}
