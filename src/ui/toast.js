/**
 * Rôle : notifications éphémères accessibles (zone aria-live) à la place des alert().
 * Exemple : showToast('Enregistrement ajouté', { type: 'success' });
 */
import { h } from './dom.js';

function ensureRegion(root) {
  let region = root.querySelector('#toasts');
  if (!region) {
    region = h('div', { id: 'toasts', class: 'toasts', role: 'status', 'aria-live': 'polite' });
    root.append(region);
  }
  return region;
}

export function showToast(message, options = {}) {
  const { type = 'info', duration = 3500, root = document.body, action } = options;
  const toast = h('div', { class: `toast toast--${type}` }, message);
  if (action?.label && action?.onClick) {
    const btn = h('button', { type: 'button', class: 'btn btn-sm btn-toast-action' }, action.label);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toast.remove();
      action.onClick();
    });
    toast.append(btn);
  }
  ensureRegion(root).append(toast);
  if (duration > 0) setTimeout(() => toast.remove(), duration);
  return toast;
}
