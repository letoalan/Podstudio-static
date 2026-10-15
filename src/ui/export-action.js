/**
 * Rôle : action « Exporter » (rendu hors-ligne + MP3 + sauvegarde de l'épisode) avec retour d'état.
 * Exemple : await runExport(button, { mixer, storage });
 */
import * as defaultStorage from '../core/storage.js';
import { emit } from '../core/bus.js';
import { formatDateTime } from '../core/format.js';
import { exportMp3 } from '../audio/render.js';
import { showToast } from './toast.js';

function setBusy(button, busy, label) {
  button.disabled = busy;
  button.setAttribute('aria-busy', String(busy));
  if (label) button.textContent = label;
}

export async function runExport(button, deps) {
  const { mixer, storage = defaultStorage, exporter = exportMp3 } = deps;
  const tracks = mixer.getTracks();
  if (tracks.length === 0) {
    showToast('La timeline est vide : ajoutez au moins un clip.', { type: 'error' });
    return null;
  }
  const original = button.textContent;
  setBusy(button, true, 'Rendu en cours…');
  try {
    const onProgress = (ratio) => setBusy(button, true, `Encodage ${Math.round(ratio * 100)} %`);
    const { blob, duration } = await exporter(tracks, { onProgress });
    const title = `Épisode du ${formatDateTime(new Date())}`;
    const episode = await storage.saveEpisode({ title, duration, mimeType: 'audio/mpeg' }, blob);
    emit('episodes:changed');
    showToast('Épisode exporté dans « Épisodes »', { type: 'success' });
    emit('view:go', 'episodes');
    return episode;
  } catch (error) {
    showToast(`Échec de l'export : ${error.message}`, { type: 'error' });
    return null;
  } finally {
    setBusy(button, false, original);
  }
}
