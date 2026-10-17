/**
 * Rôle : vue Éditeur unifié — connectée aux blocs du projet, intégrant multipiste, transport, zoom, historique et inspecteur.
 * Exemple : mountEditor(document.getElementById('view-editor'));
 */
import { on, emit } from '../../core/bus.js';
import { mountEditorShell } from '../editor/editor-shell.js';
import { h } from '../dom.js';

function renderEmptyState() {
  const btn = h('button', {
    type: 'button', class: 'btn primary btn-sm',
    onClick: () => emit('view:go', 'studio'),
  }, '← Revenir aux blocs');
  return h('div', { class: 'empty-editor-state' },
    h('p', {}, 'Aucun bloc actif sélectionné à éditer. Sélectionnez une carte dans le studio.'),
    btn);
}

function mountActiveBlockShell(shellContainer, { block, rank, onUpdateBlock, onClose }) {
  shellContainer.innerHTML = '';
  if (!block) {
    shellContainer.append(renderEmptyState());
    return null;
  }
  return mountEditorShell(shellContainer, { block, rank, onUpdateBlock, onClose });
}

function bindEditorBusEvents(state, render) {
  on('editor:open', ({ block, rank, onUpdateBlock }) => {
    if (onUpdateBlock) state.deps.onUpdateBlock = onUpdateBlock;
    render(block, rank || 1);
  });
  on('block:selected', ({ block, rank }) => {
    if (!state.activeBlock || state.activeBlock.id !== block?.id) render(block, rank || 1);
  });
}

export function mountEditor(container, deps = {}) {
  const state = { activeBlock: deps.block || null, activeRank: deps.rank || 1, currentShell: null, deps };
  const wrapper = h('div', { class: 'unified-editor-view' });
  const shellContainer = h('div', { class: 'editor-shell-container' });
  wrapper.append(shellContainer);
  container.innerHTML = '';
  container.append(wrapper);

  function render(block, rank) {
    state.activeBlock = block;
    state.activeRank = rank;
    state.currentShell = mountActiveBlockShell(shellContainer, {
      block: state.activeBlock,
      rank: state.activeRank,
      onUpdateBlock: (updated) => {
        state.activeBlock = updated;
        state.deps.onUpdateBlock?.(updated);
        emit('block:updated', updated);
      },
      onClose: () => emit('view:go', 'studio'),
    });
  }

  bindEditorBusEvents(state, render);
  render(state.activeBlock, state.activeRank);
  return {
    destroy: () => state.currentShell?.destroy?.(),
    openBlock: (b, r) => render(b, r),
  };
}
