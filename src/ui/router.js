/**
 * Rôle : routeur des 5 vues (Guide, Studio, Éditeur, Épisodes, Paramètres) via hash et événements.
 * Exemple : const router = initRouter(); router.go('studio'); // ou emit('view:go', 'studio')
 */
import { emit, on } from '../core/bus.js';

export const VIEWS = ['guide', 'studio', 'editor', 'episodes', 'settings'];

export const parseHash = (hash) => hash.replace(/^#\/?/, '') || VIEWS[0];

function applyView(root, target) {
  root.querySelectorAll('[data-view-name]').forEach((section) => {
    section.classList.toggle('hidden', section.dataset.viewName !== target);
  });
  root.querySelectorAll('[data-nav]').forEach((button) => {
    const active = button.dataset.nav === target;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
}

export function initRouter(root = document, win = window) {
  let current = null;
  const go = (name) => {
    const target = VIEWS.includes(name) ? name : VIEWS[0];
    if (target === current) return;
    current = target;
    applyView(root, target);
    if (win.location.hash !== `#/${target}`) win.history.replaceState(null, '', `#/${target}`);
    emit('view:change', target);
  };
  root.querySelectorAll('[data-nav]').forEach((button) => {
    button.addEventListener('click', () => go(button.dataset.nav));
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        go(button.dataset.nav);
      }
    });
  });
  on('view:go', go);
  win.addEventListener('hashchange', () => go(parseHash(win.location.hash)));
  go(parseHash(win.location.hash));
  return { go, current: () => current };
}
