/**
 * Rôle : construit la carte d'un enregistrement de la bibliothèque (pré-écoute, renommage, glisser, actions).
 * Exemple : list.append(buildLibraryItem(item, { onAdd, onRename, onDelete }));
 */
import { h, makeUrl } from './dom.js';
import { formatClock } from '../core/timeline-math.js';

export const DRAG_MIME = 'text/podstudio-id';

const kindIcon = (item) => (item.source === 'import' ? '🎵' : '🎙️');
const durationLabel = (item) => (item.duration > 0 ? formatClock(item.duration) : '');

function startRename(titleEl, item, onRename) {
  const input = h('input', { class: 'lib-rename', type: 'text', value: item.title || '', 'aria-label': 'Nouveau nom' });
  let finished = false;
  const finish = (commit) => {
    if (finished) return;
    finished = true;
    const value = input.value.trim();
    if (commit && value && value !== item.title) onRename(item, value);
    else input.replaceWith(titleEl);
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') finish(true);
    if (e.key === 'Escape') finish(false);
  });
  input.addEventListener('blur', () => finish(true));
  titleEl.replaceWith(input);
  input.focus();
  input.select();
}

function actionButton(label, className, onClick) {
  return h('button', { type: 'button', class: `btn btn-sm ${className}`, onClick }, label);
}

export function buildLibraryItem(item, handlers, createUrl = makeUrl) {
  const title = h('span', {
    class: 'lib-title',
    role: 'button',
    tabindex: 0,
    title: 'Cliquer pour renommer',
    onClick: () => startRename(title, item, handlers.onRename),
  }, item.title || 'Sans titre');
  return h('article', {
    class: 'lib-item',
    role: 'listitem',
    draggable: true,
    dataset: { id: item.id },
    onDragstart: (event) => {
      event.dataTransfer.setData(DRAG_MIME, item.id);
      event.dataTransfer.effectAllowed = 'copy';
    },
  },
  h('div', { class: 'lib-head' }, h('span', { 'aria-hidden': 'true' }, kindIcon(item)), title,
    h('span', { class: 'lib-dur' }, durationLabel(item))),
  h('audio', { controls: true, preload: 'none', src: createUrl(item.audio) }),
  h('div', { class: 'lib-actions' },
    actionButton('＋ Timeline', 'secondary', () => handlers.onAdd(item)),
    actionButton('Supprimer', 'danger-ghost', () => handlers.onDelete(item))));
}
