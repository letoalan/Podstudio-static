/**
 * Rôle : vue « Épisodes » (lecteur, téléchargement MP3, suppression) et export du flux RSS.
 * Exemple : mountEpisodes(document.getElementById('view-episodes'));
 */
import * as defaultStorage from '../core/storage.js';
import { getSettings } from '../core/settings.js';
import { rssBlob } from '../core/rss.js';
import { emit, on } from '../core/bus.js';
import { formatBytes, formatDateTime } from '../core/format.js';
import { formatClock } from '../core/timeline-math.js';
import { h, clear, downloadBlob, makeUrl } from './dom.js';
import { showToast } from './toast.js';

export function buildEpisodeCard(episode, handlers, createUrl = makeUrl) {
  const meta = [formatDateTime(episode.created), formatClock(episode.duration), formatBytes(episode.audio?.size)];
  return h('article', { class: 'episode-card', dataset: { id: episode.id } },
    h('h3', {}, episode.title || 'Épisode sans titre'),
    h('p', { class: 'episode-meta' }, meta.filter(Boolean).join(' · ')),
    h('audio', { controls: true, preload: 'none', src: createUrl(episode.audio) }),
    h('div', { class: 'lib-actions' },
      h('button', { type: 'button', class: 'btn secondary btn-sm', onClick: () => handlers.onDownload(episode) }, 'Télécharger MP3'),
      h('button', { type: 'button', class: 'btn danger-ghost btn-sm', onClick: () => handlers.onDelete(episode) }, 'Supprimer')));
}

export function mountEpisodes(container, deps = {}) {
  const storage = deps.storage ?? defaultStorage;
  const list = h('div', { class: 'episodes-grid', role: 'list' });
  const rssButton = h('button', { type: 'button', class: 'btn secondary', id: 'btn-export-rss' }, 'Flux RSS');
  container.append(
    h('div', { class: 'section-header' }, h('h2', {}, 'Épisodes publiés'), rssButton), list);

  const handlers = {
    onDownload: (ep) => downloadBlob(ep.audio, `${(ep.title || 'episode').replace(/[^\w-]+/g, '_')}.mp3`),
    onDelete: async (ep) => {
      if (!globalThis.confirm(`Supprimer « ${ep.title} » ?`)) return;
      await storage.deleteEpisode(ep.id);
      emit('episodes:changed');
    },
  };

  async function refresh() {
    const episodes = await storage.listEpisodes();
    clear(list);
    if (episodes.length === 0) {
      list.append(h('p', { class: 'empty-state' }, 'Aucun épisode. Montez puis exportez votre premier mix depuis l\'éditeur.'));
      return;
    }
    list.append(...episodes.map((ep) => buildEpisodeCard(ep, handlers, deps.createUrl)));
  }

  rssButton.addEventListener('click', async () => {
    const episodes = await storage.listEpisodes();
    if (episodes.length === 0) return showToast('Aucun épisode à publier.', { type: 'error' });
    downloadBlob(rssBlob(episodes, getSettings()), 'podcast.xml');
  });
  on('episodes:changed', refresh);
  refresh();
  return { refresh };
}
