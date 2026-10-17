/**
 * Rôle : barre d'outils de l'éditeur timeline (transport, copier/couper/coller, scinder, annuler/rétablir, zoom).
 * Exemple : const tb = createEditorToolbar({ onPlay, onSplit, onUndo });
 */
import { h } from '../dom.js';
import { isToolEnabled, LEVELS } from '../../core/level.js';

function makeBtn(title, text, action, cls = 'btn secondary btn-sm') {
  const btn = h('button', { type: 'button', class: cls, title, 'aria-label': title }, text);
  btn.addEventListener('click', action);
  return btn;
}

export function createEditorToolbar(actions = {}, level = LEVELS.ADVANCED) {
  const bar = h('div', { class: 'editor-toolbar' });
  const transport = h('div', { class: 'transport-group' },
    makeBtn('Lecture (Espace)', '▶ Lecture', () => actions.onPlay?.(), 'btn primary btn-sm'),
    makeBtn('Arrêt', '⏹ Arrêt', () => actions.onStop?.()));
  bar.append(transport);

  const historyGroup = h('div', { class: 'history-group' },
    makeBtn('Annuler (Ctrl+Z)', '↶ Annuler', () => actions.onUndo?.()),
    makeBtn('Rétablir (Ctrl+Y)', '↷ Rétablir', () => actions.onRedo?.()));
  bar.append(historyGroup);

  if (isToolEnabled(level, 'advancedEditing')) {
    const editGroup = h('div', { class: 'edit-group' },
      makeBtn('Copier (Ctrl+C)', '📋 Copier', () => actions.onCopy?.()),
      makeBtn('Couper (Ctrl+X)', '✂️ Couper', () => actions.onCut?.()),
      makeBtn('Coller (Ctrl+V)', '📥 Coller', () => actions.onPaste?.()),
      makeBtn('Dupliquer (Ctrl+D)', '⎘ Dupliquer', () => actions.onDuplicate?.()),
      makeBtn('Scinder (S)', '✂️ Scinder', () => actions.onSplit?.()),
      makeBtn('Supprimer (Suppr)', '🗑️ Supprimer', () => actions.onDelete?.()));
    bar.append(editGroup);
  }

  if (isToolEnabled(level, 'zoomControls')) {
    const zoomGroup = h('div', { class: 'zoom-group' },
      makeBtn('Zoom arrière', '🔍 −', () => actions.onZoomOut?.()),
      makeBtn('Zoom avant', '🔍 +', () => actions.onZoomIn?.()));
    bar.append(zoomGroup);
  }

  if (isToolEnabled(level, 'unlimitedTracks')) {
    bar.append(makeBtn('Ajouter une piste', '+ Piste', () => actions.onAddTrack?.()));
  }

  return bar;
}
