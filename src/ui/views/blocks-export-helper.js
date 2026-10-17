/**
 * Rôle : assistants d'export WAV du podcast et téléchargement/import de fichier projet JSON.
 * Exemple : await exportPodcastAction(project, storage);
 */
import { h } from '../dom.js';
import { formatDateTime } from '../../core/format.js';
import { serializeProject, deserializeProject, sanitizeFileName } from '../../core/project-io.js';
import { renderProject, loadProjectBuffers } from '../../audio/block-render.js';
import { audioBufferToWav } from '../../audio/wav.js';
import { showToast } from '../toast.js';
import { emit } from '../../core/bus.js';
import { getPlayableBlocks } from '../../core/project.js';

export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function exportPodcastAction(project, storage) {
  if (getPlayableBlocks(project).length === 0) {
    showToast('Le podcast est vide : ajoutez du son dans au moins un bloc.', { type: 'error' });
    return;
  }
  showToast('Rendu du podcast en cours…', { type: 'info' });
  try {
    const buffers = await loadProjectBuffers(project, storage);
    const audioBuf = await renderProject(project, buffers);
    const wavBlob = audioBufferToWav(audioBuf);
    const title = `${project.title || 'Podcast'} — ${formatDateTime(new Date())}`;
    await storage.saveEpisode({ title, duration: audioBuf.duration, mimeType: 'audio/wav' }, wavBlob);
    triggerDownload(wavBlob, `${sanitizeFileName(project.title || 'podcast')}.wav`);
    emit('episodes:changed');
    showToast('Podcast exporté et sauvegardé dans Épisodes !', { type: 'success' });
  } catch (err) {
    showToast(`Échec de l'export : ${err.message}`, { type: 'error' });
  }
}

export function handleOpenProject(file, onLoaded) {
  if (!file) return;
  file.text().then((text) => {
    onLoaded(deserializeProject(text));
    showToast('Projet importé avec succès', { type: 'success' });
  }).catch((e) => showToast(`Fichier invalide : ${e.message}`, { type: 'error' }));
}

export function saveProjectFile(project) {
  const json = serializeProject(project);
  triggerDownload(new Blob([json], { type: 'application/json' }), sanitizeFileName(project.title));
}
