/**
 * Rôle : vue Paramètres — formulaire de métadonnées, jauge de stockage (alerte à 80 %), réinitialisation.
 * Exemple : mountSettings(document.getElementById('view-settings'));
 */
import * as defaultStorage from '../../core/storage.js';
import { getSettings, saveSettings } from '../../core/settings.js';
import { emit, on } from '../../core/bus.js';
import { formatBytes } from '../../core/format.js';
import { h } from '../dom.js';
import { showToast } from '../toast.js';
import { mountPaletteEditor } from '../palette-editor.js';

export const FIELDS = [
  { name: 'title', label: 'Titre du podcast', type: 'text' },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'author', label: 'Auteur', type: 'text' },
  { name: 'email', label: 'Email de contact (RSS)', type: 'email' },
  { name: 'language', label: 'Langue (code, ex. fr)', type: 'text' },
  { name: 'siteUrl', label: 'URL publique du podcast (RSS)', type: 'url' },
];

function buildField(field, value) {
  const attrs = { id: `set-${field.name}`, name: field.name };
  const control = field.type === 'textarea'
    ? h('textarea', { ...attrs, rows: 3 }, value)
    : h('input', { ...attrs, type: field.type, value });
  return h('div', { class: 'form-group' }, h('label', { for: attrs.id }, field.label), control);
}

export function readForm(form) {
  const values = {};
  for (const field of FIELDS) values[field.name] = form.elements[field.name].value.trim();
  return values;
}

export async function renderQuota(refs, storage) {
  const { usage, quota, ratio } = await storage.estimateQuota();
  refs.bar.value = Math.round(ratio * 100);
  refs.text.textContent = quota > 0
    ? `${formatBytes(usage)} utilisés sur ${formatBytes(quota)} (${Math.round(ratio * 100)} %)`
    : 'Estimation du stockage indisponible sur ce navigateur.';
  refs.card.classList.toggle('warn', storage.isQuotaCritical(ratio));
  refs.warning.hidden = !storage.isQuotaCritical(ratio);
}

export function mountSettings(container, deps = {}) {
  const storage = deps.storage ?? defaultStorage;
  const current = getSettings();
  const save = h('button', { type: 'submit', class: 'btn primary full-width', id: 'btn-save-settings' }, 'Sauvegarder');
  const form = h('form', { id: 'settings-form', class: 'card' }, FIELDS.map((f) => buildField(f, current[f.name] ?? '')), save);

  const paletteCard = h('div', { class: 'card' }, h('h3', {}, 'Couleurs des blocs'));
  mountPaletteEditor(paletteCard, {
    settings: current,
    onChange: (vals) => saveSettings({ ...getSettings(), ...vals }),
  });

  const refs = {
    bar: h('progress', { max: 100, value: 0, 'aria-label': 'Espace de stockage utilisé' }),
    text: h('span', { role: 'status' }, 'Calcul…'),
    warning: h('p', { class: 'quota-warning', hidden: true }, 'Espace presque saturé : exportez vos épisodes puis supprimez d\'anciens fichiers.'),
  };
  const reset = h('button', { type: 'button', class: 'btn danger full-width', id: 'btn-delete-all' }, 'Tout réinitialiser');
  refs.card = h('div', { class: 'card danger-zone' }, h('h3', {}, 'Stockage local'), refs.bar, refs.text, refs.warning, reset);
  container.append(h('div', { class: 'section-header' }, h('h2', {}, 'Paramètres')), form, paletteCard, refs.card);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    saveSettings(readForm(form));
    emit('settings:saved');
    showToast('Paramètres sauvegardés', { type: 'success' });
    save.textContent = '✓ Sauvegardé !';
    setTimeout(() => { save.textContent = 'Sauvegarder'; }, 1500);
  });
  reset.addEventListener('click', async () => {
    if (!globalThis.confirm('Supprimer tous les enregistrements et épisodes ?')) return;
    await storage.clearAll();
    emit('library:changed');
    emit('episodes:changed');
    renderQuota(refs, storage);
  });
  const update = () => renderQuota(refs, storage);
  on('view:change', (view) => view === 'settings' && update());
  on('library:changed', update);
  on('episodes:changed', update);
  update();
  return { refresh: update };
}
