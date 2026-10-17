/**
 * Rôle : ligne verticale des blocs numérotés et cartes transitions (rail, insertion, sélection, glisser-déposer).
 * Exemple : mountBlockList(container, { project, selectedBlockId, onChange, onSelect, onOpenEditor });
 */
import { h } from './dom.js';
import { createBlock } from '../core/block-model.js';
import { createTransitionBlock } from '../core/transition-model.js';
import {
  addBlock, insertBlockAt, removeBlock, duplicateBlock, updateBlock, moveBlock,
  getBlockColor,
} from '../core/project.js';
import { createBlockCard } from './block-card.js';
import { createTransitionCard } from './transition-card.js';
import { calculateStoryTimeline } from '../core/story-role.js';

function createWingBtn(type, icon, label, title, onClick) {
  const btn = h('button', {
    type: 'button',
    class: `btn-insert-wing btn-insert-${type} ${type === 'block' ? 'btn-rail-insert' : 'btn-rail-insert-trans'}`,
    title,
  }, h('span', { class: 'wing-icon' }, icon), h('span', { class: 'wing-label' }, label));
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick();
  });
  return btn;
}

function renderInsertSlot(onInsertBlock, onInsertTransition, index, total = 0) {
  const slot = h('div', { class: 'rail-insert-slot' });
  const close = () => slot.classList.remove('is-open');

  const blockTitle = index < total ? `Insérer avant le bloc ${index + 1}` : 'Ajouter un nouveau bloc';
  const btnBlock = createWingBtn('block', '🔲', 'Nouveau bloc', blockTitle, () => {
    close();
    onInsertBlock();
  });

  const btnTrigger = h('button', {
    type: 'button', class: 'btn-insert-trigger',
    title: 'Ajouter un bloc ou une transition', 'aria-label': 'Menu insertion',
  }, '＋');
  btnTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    slot.classList.toggle('is-open');
  });

  const btnTrans = createWingBtn('trans', '⚡', 'Transition', 'Insérer une transition', () => {
    close();
    onInsertTransition();
  });

  slot.addEventListener('mouseleave', close);
  slot.append(h('div', { class: 'rail-insert-capsule' }, btnBlock, btnTrigger, btnTrans));
  return slot;
}

function setupDropZone(cardsList, project, onChange, onDropLibrary) {
  cardsList.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
  cardsList.addEventListener('drop', (e) => {
    e.preventDefault();
    const libId = e.dataTransfer.getData('text/podstudio-id');
    const targetCard = e.target.closest('.block-card');
    const targetIndex = targetCard ? project.blocks.findIndex((b) => b.id === targetCard.dataset.blockId) : project.blocks.length;
    if (libId && onDropLibrary) {
      onDropLibrary(libId, targetIndex);
      return;
    }
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || !targetCard || draggedId === targetCard.dataset.blockId) return;
    if (targetIndex !== -1) onChange(moveBlock(project, draggedId, targetIndex));
  });
}

function renderCardItem(project, block, index, meta, callbacks) {
  if (block.type === 'transition') {
    return createTransitionCard(block, {
      onUpdate: (patch) => callbacks.onChange(updateBlock(project, block.id, patch)),
      onDelete: (id) => callbacks.onChange(removeBlock(project, id)),
    });
  }
  return createBlockCard(block, {
    storage: callbacks.storage,
    rank: meta.rank,
    timeRange: meta.timeRange,
    color: getBlockColor(project, block.id),
    isFirst: index === 0,
    isLast: index === project.blocks.length - 1,
    isSelected: block.id === meta.selectedId,
    isPlaying: block.id === meta.playingBlockId,
    onSelect: callbacks.onSelect,
    onTogglePlay: callbacks.onTogglePlay,
    onOpen: (b) => callbacks.onOpenEditor(b, meta.rank),
    onUpdate: (patch) => callbacks.onChange(updateBlock(project, block.id, patch)),
    onDuplicate: (id) => callbacks.onChange(duplicateBlock(project, id)),
    onDelete: (id) => callbacks.onChange(removeBlock(project, id)),
    onColorPick: (color) => callbacks.onChange(updateBlock(project, block.id, { color })),
  });
}

function renderBlockCards(project, selectedId, playingBlockId, callbacks) {
  const frag = document.createDocumentFragment();
  const timeline = calculateStoryTimeline(project.blocks);
  let standardRank = 0;
  project.blocks.forEach((block, index) => {
    if (index > 0) {
      frag.append(renderInsertSlot(
        () => callbacks.onInsertAt(index, 'block'),
        () => callbacks.onInsertAt(index, 'transition'),
        standardRank,
        project.blocks.length,
      ));
    }
    if (block.type !== 'transition') standardRank++;
    frag.append(renderCardItem(project, block, index, {
      rank: standardRank, timeRange: timeline[index], selectedId, playingBlockId,
    }, callbacks));
  });
  return frag;
}

function renderEmptyState(project, onChange, onSelect) {
  const btnFirst = h('button', {
    type: 'button',
    class: 'btn primary btn-sm',
    style: 'margin-top: 12px;',
    onClick: () => {
      const nb = createBlock({ role: 'intro', topic: 'Introduction' });
      onChange(addBlock(project, nb));
      onSelect?.(nb.id);
    },
  }, '＋ Créer le chapitre d\'introduction');
  return h('div', { class: 'empty-block-state' },
    h('div', { style: 'font-size: 1.8rem; margin-bottom: 6px;' }, '🎙️'),
    h('strong', { style: 'display: block; font-size: 1.05rem; color: var(--text-main); margin-bottom: 4px;' }, 'Votre conducteur d\'épisode est vide'),
    h('span', { style: 'display: block; font-size: 0.82rem; color: var(--text-muted);' }, 'Ajoutez votre première carte de récit ou glissez un son depuis la bibliothèque.'),
    btnFirst,
  );
}

export function mountBlockList(container, deps) {
  const { project, selectedBlockId, playingBlockId, onChange, onSelect, onOpenEditor, onTogglePlay, onDropLibrary, storage } = deps;
  container.innerHTML = '';
  const stack = h('div', { class: 'block-cards-stack' });

  if (project.blocks.length === 0) {
    stack.append(renderEmptyState(project, onChange, onSelect));
  } else {
    stack.append(renderBlockCards(project, selectedBlockId, playingBlockId, {
      storage, onChange, onSelect, onOpenEditor, onTogglePlay,
      onInsertAt: (idx, type) => {
        const nb = type === 'transition' ? createTransitionBlock() : createBlock();
        onChange(insertBlockAt(project, idx, nb));
        if (type !== 'transition') onSelect?.(nb.id);
      },
    }));
  }

  setupDropZone(stack, project, onChange, onDropLibrary);
  const bottomAdd = renderInsertSlot(
    () => {
      const nb = createBlock();
      onChange(addBlock(project, nb));
      onSelect?.(nb.id);
    },
    () => onChange(addBlock(project, createTransitionBlock())),
    project.blocks.length,
  );
  bottomAdd.classList.add('rail-add-bottom');
  container.append(h('div', { class: 'block-list-container' }, stack, bottomAdd));
}
