/**
 * Rôle : outils rapides pour bloc (enregistrement direct, import audio, jingle express sans ouvrir l'éditeur).
 * Exemple : mountBlockQuick(container, { block, onUpdateBlock });
 */
import { h } from './dom.js';
import { showToast } from './toast.js';
import { createClip, getBlockContentDuration } from '../core/block-model.js';
import * as defaultStorage from '../core/storage.js';
import { Recorder } from '../audio/recorder.js';

import { probeDuration, probeAudioFeatures } from '../audio/probe.js';

let activeRecorder = null;
let activeRecordingBlockId = null;

async function handleQuickRecord(btn, block, onUpdateBlock, storage) {
  if (activeRecorder && activeRecordingBlockId === block.id) {
    const result = await activeRecorder.stop();
    activeRecorder = null;
    activeRecordingBlockId = null;
    btn.classList.remove('recording');
    btn.textContent = '🎙️ Enregistrer';
    if (!result) return;
    const feat = await probeAudioFeatures(result.blob);
    const item = await storage.saveRecording({
      title: 'Prise', source: 'record', duration: result.duration, acousticFeatures: feat,
    }, result.blob);
    const start = getBlockContentDuration(block);
    const newClip = createClip({
      trackId: block.tracks[0]?.id, sourceId: item.id, start, duration: result.duration, name: item.title, acousticFeatures: feat,
    });
    onUpdateBlock({ clips: [...block.clips, newClip] });
    showToast('Prise ajoutée au bloc', { type: 'success' });
  } else {
    activeRecorder = new Recorder();
    try {
      await activeRecorder.start();
      activeRecordingBlockId = block.id;
      btn.classList.add('recording');
      btn.textContent = '⏹️ Arrêter';
      showToast('Enregistrement en cours…', { type: 'info' });
    } catch (err) {
      activeRecorder = null;
      showToast(`Impossible d'enregistrer : ${err.message}`, { type: 'error' });
    }
  }
}

async function handleQuickImport(file, block, onUpdateBlock, storage) {
  if (!file) return;
  try {
    const dur = await probeDuration(file);
    const feat = await probeAudioFeatures(file);
    const item = await storage.saveRecording({
      title: file.name.replace(/\.[^/.]+$/, ''), source: 'import', mimeType: file.type, duration: dur, acousticFeatures: feat,
    }, file);
    const start = getBlockContentDuration(block);
    const newClip = createClip({
      trackId: block.tracks[0]?.id, sourceId: item.id, start, duration: dur || 10, name: item.title, acousticFeatures: feat,
    });
    onUpdateBlock({ clips: [...block.clips, newClip] });
    showToast(`Fichier « ${file.name} » importé dans le bloc`, { type: 'success' });
  } catch (err) {
    showToast(`Erreur d'import : ${err.message}`, { type: 'error' });
  }
}

export function mountBlockQuick(container, { block, onUpdateBlock, storage = defaultStorage }) {
  const fileInput = h('input', { type: 'file', accept: 'audio/*', style: 'display:none;' });
  const btnRecord = h('button', { type: 'button', class: 'btn-quick' }, '🎙️ Enregistrer');
  const btnImport = h('button', { type: 'button', class: 'btn-quick' }, '📁 Importer');
  const btnJingle = h('button', { type: 'button', class: 'btn-quick' }, '🔔 Jingle');

  btnRecord.addEventListener('click', (e) => {
    e.stopPropagation();
    handleQuickRecord(btnRecord, block, onUpdateBlock, storage);
  });

  btnImport.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    handleQuickImport(file, block, onUpdateBlock, storage);
  });

  btnJingle.addEventListener('click', (e) => {
    e.stopPropagation();
    const start = getBlockContentDuration(block);
    const jingleClip = createClip({
      trackId: block.tracks[1]?.id || block.tracks[0]?.id,
      sourceId: 'preset-jingle',
      start,
      duration: 3,
      name: 'Jingle',
      acousticFeatures: { signalClass: 'musique', silenceRatio: 0.04, rmsStd: 0.03 },
    });
    onUpdateBlock({ clips: [...block.clips, jingleClip] });
    showToast('Jingle ajouté au bloc', { type: 'success' });
  });

  container.append(btnRecord, btnImport, btnJingle, fileInput);
}
