/**
 * Rôle : panneau Bibliothèque (liste, import .mp3/.wav, renommage, suppression, ajout à la timeline).
 * Exemple : const lib = mountLibrary(document.getElementById('library-panel'));
 */
import * as defaultStorage from '../core/storage.js';
import { probeDuration, probeAudioFeatures } from '../audio/probe.js';
import { emit, on } from '../core/bus.js';
import { h, clear, makeUrl } from './dom.js';
import { buildLibraryItem } from './library-item.js';
import { showToast } from './toast.js';

const stripExtension = (name) => name.replace(/\.[^.]+$/, '');

export async function importFiles(files, { storage, probe = probeDuration, probeFeatures = probeAudioFeatures }) {
  let count = 0;
  for (const file of files) {
    const duration = await probe(file);
    const acousticFeatures = await probeFeatures(file);
    const meta = { title: stripExtension(file.name), source: 'import', duration, mimeType: file.type, acousticFeatures };
    await storage.saveRecording(meta, file);
    count++;
  }
  if (count > 0) emit('library:changed');
  return count;
}

function buildHeader(onFiles) {
  const input = h('input', {
    type: 'file', accept: 'audio/*,.mp3,.wav', multiple: true, hidden: true,
    onChange: (event) => {
      onFiles([...event.target.files]);
      event.target.value = '';
    },
  });
  const button = h('button', { type: 'button', class: 'btn secondary btn-sm', onClick: () => input.click() }, '+ Importer');
  return h('div', { class: 'panel-header' }, h('h2', {}, 'Bibliothèque'), button, input);
}

export function mountLibrary(container, deps = {}) {
  const storage = deps.storage ?? defaultStorage;
  const probe = deps.probe ?? probeDuration;
  const probeFeatures = deps.probeFeatures ?? probeAudioFeatures;
  const createUrl = deps.createUrl ?? makeUrl;
  const list = h('div', { class: 'lib-list', role: 'list' });
  const emptyState = h('p', { class: 'empty-state' }, 'Aucun enregistrement. Enregistrez votre voix ou importez un fichier audio.');

  const handlers = {
    onAdd: (item) => emit('block:import', item),
    onRename: async (item, title) => {
      await storage.renameRecording(item.id, title);
      emit('library:changed');
    },
    onDelete: async (item) => {
      if (!globalThis.confirm(`Supprimer « ${item.title} » ?`)) return;
      await storage.deleteRecording(item.id);
      emit('library:changed');
    },
  };

  async function refresh() {
    const items = await storage.listRecordings();
    clear(list);
    if (items.length === 0) list.append(emptyState);
    else list.append(...items.map((item) => buildLibraryItem(item, handlers, createUrl)));
  }

  async function onFiles(files) {
    const count = await importFiles(files, { storage, probe, probeFeatures });
    if (count > 0) showToast(`${count} fichier(s) importé(s)`, { type: 'success' });
  }

  container.append(buildHeader(onFiles), list);
  on('library:changed', refresh);
  refresh();
  return { refresh };
}
