/**
 * Rôle : gestion des raccourcis clavier de l'éditeur de timeline (Ctrl+C, Ctrl+X, Ctrl+V, S, Suppr, Ctrl+Z, Ctrl+Y).
 * Exemple : const unbind = bindEditorShortcuts(window, { onCopy, onSplit, onUndo });
 */

function isEditableTarget(target) {
  if (!target) return false;
  const tag = target.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || target.isContentEditable;
}

export function bindEditorShortcuts(targetElement, handlers = {}) {
  const el = targetElement || window;

  function onKeyDown(e) {
    if (isEditableTarget(e.target)) return;
    const isCtrl = e.ctrlKey || e.metaKey;

    if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      handlers.onUndo?.();
    } else if (isCtrl && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
      e.preventDefault();
      handlers.onRedo?.();
    } else if (isCtrl && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      handlers.onCopy?.();
    } else if (isCtrl && e.key.toLowerCase() === 'x') {
      e.preventDefault();
      handlers.onCut?.();
    } else if (isCtrl && e.key.toLowerCase() === 'v') {
      e.preventDefault();
      handlers.onPaste?.();
    } else if (isCtrl && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      handlers.onDuplicate?.();
    } else if (e.key.toLowerCase() === 's' && !isCtrl) {
      e.preventDefault();
      handlers.onSplit?.();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      handlers.onDelete?.();
    } else if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      handlers.onPlay?.();
    }
  }

  el.addEventListener('keydown', onKeyDown);
  return () => el.removeEventListener('keydown', onKeyDown);
}
