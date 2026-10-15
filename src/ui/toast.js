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
  const { type = 'info', duration = 3500, root = document.body } = options;
  const toast = h('div', { class: `toast toast--${type}` }, message);
  ensureRegion(root).append(toast);
  if (duration > 0) setTimeout(() => toast.remove(), duration);
  return toast;
}
