/**
 * Rôle : carte d'un bloc de la ligne (rail vertical, pastille numérotée, aperçu, lecture, outils si sélectionné).
 * Exemple : const card = createBlockCard(block, { rank: 1, color: '#8940fa', isSelected: true, onSelect, onOpen, onUpdate, onDelete });
 */
import { h } from './dom.js';
import { formatHms } from '../core/timeline-math.js';
import { getBlockTotalDuration, isBlockEmpty } from '../core/block-model.js';
import { createBlockRail } from './block-rail.js';
import { mountBlockTools } from './block-tools.js';
import { renderBlockEqualizer } from './block-waveform.js';
import {
  renderStoryRoleBadge,
  renderStoryTopicInput,
  renderStoryTimecode,
  renderStoryNotes,
  renderNatureBadge,
} from './block-story-header.js';

function renderHeaderActions(block, callbacks) {
  const roleBadge = renderStoryRoleBadge(block, callbacks.onUpdate);
  const topicInput = renderStoryTopicInput(block, callbacks.onUpdate);
  const natureBadge = renderNatureBadge(block, callbacks.onUpdate);
  const tcBadge = renderStoryTimecode(callbacks.timeRange);

  const btnDel = h('button', { type: 'button', class: 'btn-icon block-btn-del', title: 'Supprimer le bloc' }, '🗑️');
  btnDel.addEventListener('click', (e) => {
    e.stopPropagation();
    callbacks.onDelete?.(block.id);
  });

  const leftMeta = h('div', { class: 'block-card-meta-left' }, tcBadge, roleBadge, natureBadge);
  const rightBtns = h('div', { class: 'block-card-actions' }, topicInput, btnDel);
  return h('div', { class: 'story-header-row' }, leftMeta, rightBtns);
}

function renderCardFooter(block, callbacks) {
  const durBadge = h('span', { class: 'block-duration-badge' }, formatHms(getBlockTotalDuration(block)));
  const btnPlay = h('button', {
    type: 'button',
    class: `block-pill-play block-btn-play${callbacks.isPlaying ? ' is-playing' : ''}`,
    title: callbacks.isPlaying ? 'Arrêter la lecture' : 'Écouter ce bloc',
  },
    h('span', { class: 'pill-play-icon' }, callbacks.isPlaying ? '⏹' : '▶'),
    h('span', { class: 'pill-play-text' }, callbacks.isPlaying ? 'Pause' : 'Play'),
  );
  btnPlay.addEventListener('click', (e) => {
    e.stopPropagation();
    callbacks.onTogglePlay?.(block);
  });

  const btnEdit = h('button', { type: 'button', class: 'btn-tool block-btn-edit', title: 'Éditer ce bloc' }, '✂️ Éditer');
  btnEdit.addEventListener('click', (e) => {
    e.stopPropagation();
    callbacks.onOpen?.(block);
  });

  const left = h('div', { class: 'block-footer-left' }, btnPlay, durBadge);
  const right = h('div', { class: 'block-footer-right' }, btnEdit);
  return h('div', { class: 'block-card-footer' }, left, right);
}

function renderCardBody(block, { isSelected }, callbacks) {
  const body = h('div', { class: 'block-card-body' });
  body.append(renderBlockEqualizer(block, callbacks));
  body.append(renderCardFooter(block, callbacks));
  body.append(renderStoryNotes(block, callbacks.onUpdate));

  if (isSelected) {
    const toolsBox = h('div', { class: 'block-selected-tools' });
    mountBlockTools(toolsBox, {
      block,
      storage: callbacks.storage,
      onUpdateBlock: callbacks.onUpdate,
      onOpenEditor: () => callbacks.onOpen?.(block),
      onDuplicate: callbacks.onDuplicate,
      onDelete: callbacks.onDelete,
      onOpenLibrary: () => {
        callbacks.onSelect?.(block.id);
        const mob = document.getElementById('mob-library-toggle');
        if (mob && window.getComputedStyle(mob).display !== 'none') mob.click();
        else document.querySelector('.app-library')?.scrollIntoView({ behavior: 'smooth' });
      },
    });
    body.append(toolsBox);
  }
  return body;
}

export function createBlockCard(block, callbacks = {}) {
  const rank = callbacks.rank ?? 1;
  const color = callbacks.color ?? '#8940fa';
  const isSelected = Boolean(callbacks.isSelected);

  const rail = createBlockRail({
    rank,
    color,
    isFirst: callbacks.isFirst,
    isLast: callbacks.isLast,
    onColorPick: callbacks.onColorPick,
  });

  const card = h('div', {
    class: `block-card${isBlockEmpty(block) ? ' is-empty' : ''}${isSelected ? ' is-selected' : ''}`,
    draggable: 'true',
    'data-block-id': block.id,
    style: `--block-accent: ${color}; border-left: 4px solid ${color}`,
  });

  const actions = renderHeaderActions(block, callbacks);
  const cardMain = h('div', { class: 'block-card-main' }, actions, renderCardBody(block, { color, isSelected }, callbacks));
  card.append(rail, cardMain);

  card.addEventListener('click', (e) => {
    if (e.target.closest('button, input, .btn-tool')) return;
    callbacks.onSelect?.(block.id);
  });

  card.addEventListener('dragstart', (e) => {
    card.classList.add('is-dragging');
    e.dataTransfer.setData('text/plain', block.id);
    e.dataTransfer.effectAllowed = 'move';
  });

  card.addEventListener('dragend', () => card.classList.remove('is-dragging'));
  return card;
}
