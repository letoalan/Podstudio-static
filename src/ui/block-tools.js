/**
 * Rôle : barre d'outils du bloc (capture micro avec timer/pause/stop, import audio, éditeur, duplication, suppression).
 * Exemple : mountBlockTools(container, { block, onUpdateBlock, onOpenEditor, onDuplicate, onDelete });
 */
import { h } from './dom.js';
import { showToast } from './toast.js';
import { createClip, getBlockContentDuration, isBlockEmpty } from '../core/block-model.js';
import { formatHms } from '../core/timeline-math.js';
import * as defaultStorage from '../core/storage.js';
import { Recorder } from '../audio/recorder.js';
import { probeDuration } from '../audio/probe.js';

let activeRecorder = null;
let activeRecordingBlockId = null;
let timerInterval = null;

function appendClipToBlock(block, onUpdateBlock, clipData, replace = false) {
  const clips = replace ? [] : [...block.clips];
  const start = replace ? 0 : getBlockContentDuration({ ...block, clips });
  const trackId = clipData.trackId || block.tracks[0]?.id;
  const newClip = createClip({ ...clipData, trackId, start });
  onUpdateBlock({ clips: [...clips, newClip], edited: true });
}

async function confirmAddOrReplace(block) {
  if (isBlockEmpty(block)) return 'add';
  const replace = globalThis.confirm(
    'Ce bloc contient déjà de l\'audio.\n\nCliquez sur OK pour REMPLACER le contenu existant, ou Annuler pour AJOUTER à la suite.',
  );
  return replace ? 'replace' : 'add';
}

async function stopActiveRecord(block, onUpdateBlock, storage, recState) {
  clearInterval(timerInterval);
  timerInterval = null;
  const result = await activeRecorder.stop();
  activeRecorder = null;
  activeRecordingBlockId = null;
  recState.container.classList.remove('is-recording');
  recState.liveBox.hidden = true;
  recState.btnRecord.textContent = '🎙️ Micro';
  recState.btnRecord.classList.remove('recording');
  if (!result) return;
  const mode = await confirmAddOrReplace(block);
  const item = await storage.saveRecording({ title: 'Enregistrement', source: 'record', duration: result.duration }, result.blob);
  appendClipToBlock(block, onUpdateBlock, { sourceId: item.id, duration: result.duration, name: item.title }, mode === 'replace');
  showToast('Enregistrement ajouté au bloc', { type: 'success' });
}

async function startRecord(block, onUpdateBlock, storage, recState) {
  activeRecorder = new Recorder();
  try {
    await activeRecorder.start();
    activeRecordingBlockId = block.id;
    recState.btnRecord.classList.add('recording');
    recState.btnRecord.textContent = '⏹️ Terminer';
    recState.container.classList.add('is-recording');
    recState.liveBox.hidden = false;
    timerInterval = setInterval(() => {
      recState.timerEl.textContent = formatHms(activeRecorder?.elapsed() || 0);
    }, 250);
    showToast('Enregistrement en cours…', { type: 'info' });
  } catch (err) {
    activeRecorder = null;
    showToast(`Impossible d'enregistrer : ${err.message}`, { type: 'error' });
  }
}

function renderLiveRecBox(block, onUpdateBlock, storage, recState) {
  const timerEl = h('span', { class: 'rec-live-timer' }, '00:00:00');
  const badge = h('span', { class: 'rec-live-badge' }, '🔴 En cours');
  const btnPause = h('button', { type: 'button', class: 'btn-sm btn-tool', title: 'Pause / Reprendre' }, '⏸');
  btnPause.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!activeRecorder) return;
    if (activeRecorder.state === 'paused') {
      activeRecorder.resume();
      btnPause.textContent = '⏸';
      badge.textContent = '🔴 En cours';
    } else {
      activeRecorder.pause();
      btnPause.textContent = '▶';
      badge.textContent = '⏸ En pause';
    }
  });

  const btnStop = h('button', { type: 'button', class: 'btn-sm btn-tool', title: 'Valider et ajouter' }, '⏹ Valider');
  btnStop.addEventListener('click', (e) => {
    e.stopPropagation();
    stopActiveRecord(block, onUpdateBlock, storage, recState);
  });

  const box = h('div', { class: 'card-live-rec-panel', hidden: true }, badge, timerEl, btnPause, btnStop);
  recState.timerEl = timerEl;
  recState.liveBox = box;
  return box;
}

async function handleImport(file, block, onUpdateBlock, storage, probe) {
  if (!file) return;
  try {
    const duration = await probe(file);
    const mode = await confirmAddOrReplace(block);
    const item = await storage.saveRecording({ title: file.name.replace(/\.[^/.]+$/, ''), source: 'import', duration, mimeType: file.type }, file);
    appendClipToBlock(block, onUpdateBlock, { sourceId: item.id, duration, name: item.title }, mode === 'replace');
    showToast(`« ${file.name} » importé dans le bloc`, { type: 'success' });
  } catch (err) {
    showToast(`Erreur d'import : ${err.message}`, { type: 'error' });
  }
}

function renderActionButtons(block, callbacks) {
  const btnEditor = h('button', { type: 'button', class: 'btn-tool', title: 'Ouvrir l\'éditeur de pistes' }, '✂️ Éditeur');
  btnEditor.addEventListener('click', (e) => { e.stopPropagation(); callbacks.onOpenEditor?.(block); });

  const btnDup = h('button', { type: 'button', class: 'btn-tool', title: 'Dupliquer ce bloc' }, '⎘ Dupliquer');
  btnDup.addEventListener('click', (e) => { e.stopPropagation(); callbacks.onDuplicate?.(block.id); });

  const btnDelete = h('button', { type: 'button', class: 'btn-tool btn-tool-danger', title: 'Supprimer ce bloc' }, '🗑️ Supprimer');
  btnDelete.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!isBlockEmpty(block) && !globalThis.confirm('Supprimer ce bloc et son contenu ?')) return;
    callbacks.onDelete?.(block.id);
  });
  return [btnEditor, btnDup, btnDelete];
}

export function mountBlockTools(container, deps) {
  const { block, onUpdateBlock, storage = defaultStorage, probe = probeDuration } = deps;
  const fileInput = h('input', { type: 'file', accept: 'audio/*', style: 'display:none;' });
  const btnRecord = h('button', { type: 'button', class: 'btn-tool' }, '🎙️ Micro');
  const btnImport = h('button', { type: 'button', class: 'btn-tool' }, '📁 Importer');
  const btnLibrary = h('button', { type: 'button', class: 'btn-tool' }, '🎶 Bibliothèque');
  const recState = { container, btnRecord, liveBox: null, timerEl: null };

  btnRecord.addEventListener('click', (e) => {
    e.stopPropagation();
    if (activeRecorder && activeRecordingBlockId === block.id) {
      stopActiveRecord(block, onUpdateBlock, storage, recState);
    } else {
      startRecord(block, onUpdateBlock, storage, recState);
    }
  });

  btnImport.addEventListener('click', (e) => { e.stopPropagation(); fileInput.click(); });
  fileInput.addEventListener('change', (e) => handleImport(e.target.files?.[0], block, onUpdateBlock, storage, probe));
  btnLibrary.addEventListener('click', (e) => {
    e.stopPropagation();
    deps.onOpenLibrary ? deps.onOpenLibrary(block) : document.getElementById('mob-library-toggle')?.click();
  });

  const liveBox = renderLiveRecBox(block, onUpdateBlock, storage, recState);
  const row = h('div', { class: 'block-tools-row' }, btnRecord, btnImport, btnLibrary, ...renderActionButtons(block, deps), fileInput);
  container.append(liveBox, row);
}
