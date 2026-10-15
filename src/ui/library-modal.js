/**
 * Rôle : volet « bottom sheet » de la bibliothèque sur mobile (ouverture, fermeture, Échap).
 * Exemple : const modal = initLibraryModal(); modal.open();
 */
import { on } from '../core/bus.js';

export function initLibraryModal(root = document) {
  const modal = root.getElementById('library-modal');
  const toggle = root.getElementById('mob-library-toggle');
  const closeButton = root.getElementById('library-modal-close');
  if (!modal) return { open() {}, close() {}, isOpen: () => false };

  const setOpen = (open) => {
    modal.classList.toggle('open', open);
    modal.setAttribute('aria-hidden', String(!open));
    root.body.classList.toggle('no-scroll', open);
    if (open) closeButton?.focus();
    else toggle?.focus();
  };
  const open = () => setOpen(true);
  const close = () => setOpen(false);

  toggle?.addEventListener('click', open);
  closeButton?.addEventListener('click', close);
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('open')) close();
  });
  on('view:change', () => modal.classList.contains('open') && close());
  return { open, close, isOpen: () => modal.classList.contains('open') };
}
