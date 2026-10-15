/**
 * Rôle : sauvegarde (export) et restauration (import) des projets PodStudio au format JSON.
 * Exemple : exportProject(timeline); importProject(timeline, file);
 */
import { emit } from '../core/bus.js';
import { createProjectData, validateProject, sanitizeFileName } from '../core/project.js';
import { getSettings, saveSettings } from '../core/settings.js';
import { audioBufferToWav, blobToDataUrl, dataUrlToBlob } from '../audio/wav.js';
import { downloadBlob, h } from './dom.js';
import { showToast } from './toast.js';

export async function exportProject(timeline, options = {}) {
  const settings = options.settings ?? getSettings();
  const tracks = timeline.mixer.getTracks();
  const serialized = [];
  for (const t of tracks) {
    const wavBlob = audioBufferToWav(t.buffer);
    const audioData = await blobToDataUrl(wavBlob);
    serialized.push({ ...t, audioData });
  }
  const data = createProjectData(settings, serialized);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, sanitizeFileName(settings.title || 'projet'));
  showToast('Projet sauvegardé au format JSON', { type: 'success' });
  return data;
}

function readFileText(file) {
  if (typeof file.text === 'function') return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('FILE_READ_ERROR'));
    reader.readAsText(file);
  });
}

export async function importProject(timeline, file, options = {}) {
  try {
    const text = await readFileText(file);
    const project = validateProject(JSON.parse(text));
    if (project.settings) {
      (options.saveSettingsFn ?? saveSettings)(project.settings);
      emit('settings:saved');
    }
    timeline.mixer.halt();
    timeline.mixer.tracks.clear();
    for (const t of project.tracks) {
      if (t.audioData) {
        const audioBlob = dataUrlToBlob(t.audioData);
        await timeline.mixer.addTrack(t.id, audioBlob, t);
      }
    }
    timeline.render();
    timeline.select(null);
    emit('timeline:changed');
    showToast(`Projet « ${project.settings.title || file.name} » restauré avec succès`, { type: 'success' });
    return project;
  } catch (err) {
    showToast(`Échec de la restauration : ${err.message || 'fichier invalide'}`, { type: 'error' });
    return null;
  }
}

export function createProjectControls(timeline) {
  const fileInput = h('input', {
    type: 'file', accept: '.json,application/json', style: { display: 'none' },
    onChange: (e) => {
      const file = e.target.files?.[0];
      if (file) importProject(timeline, file);
      e.target.value = '';
    },
  });
  const btnSave = h('button', {
    type: 'button', class: 'btn secondary btn-sm', title: 'Sauvegarder le projet en JSON',
    onClick: () => exportProject(timeline),
  }, '💾 Sauvegarder JSON');
  const btnOpen = h('button', {
    type: 'button', class: 'btn secondary btn-sm', title: 'Ouvrir un projet JSON',
    onClick: () => fileInput.click(),
  }, '📂 Ouvrir JSON');

  return h('div', { class: 'project-controls' }, fileInput, btnSave, btnOpen);
}
