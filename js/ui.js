/**
 * UI Module
 * Handles DOM manipulation, View switching, and Event binding for non-recorder actions
 */

import * as Storage from './storage.js';
import * as RSS from './rss.js';
import * as Mixer from './mixer.js';
import * as TimelineUI from './timeline-ui.js';

export function init() {
    setupNavigation();
    setupSettingsEvents();
    setupLibraryEvents();
    refreshEpisodesList();
    setInterval(updateStorageInfo, 5000); // Check storage periodically
    updateStorageInfo();
}

function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.id.replace('nav-', 'view-');

            // Visual toggle
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // View toggle
            views.forEach(v => {
                if (v.id === targetId) {
                    v.classList.add('active');
                    v.classList.remove('hidden');
                } else {
                    v.classList.remove('active');
                    v.classList.add('hidden');
                }
            });

            // Special actions when entering views
            if (targetId === 'view-episodes') {
                refreshEpisodesList();
            }
            if (targetId === 'view-library') {
                refreshLibraryList();
            }
            if (targetId === 'view-settings') {
                updateStorageInfo();
            }
        });
    });
}

function setupSettingsEvents() {
    const btnDeleteAll = document.getElementById('btn-delete-all');
    const btnExportAll = document.getElementById('btn-export-all');

    if (btnDeleteAll) {
        btnDeleteAll.addEventListener('click', async () => {
            if (confirm('ATTENTION: Voulez-vous vraiment supprimer TOUS les épisodes ? Cette action est irréversible.')) {
                await Storage.clearAllData();
                refreshEpisodesList();
                updateStorageInfo();
                alert('Toutes les données ont été supprimées.');
            }
        });
    }

    if (btnExportAll) {
        btnExportAll.addEventListener('click', async () => {
            const episodes = await Storage.getAllEpisodes();
            if (episodes.length === 0) {
                alert('Aucun épisode publié à exporter.');
                return;
            }
            const rssBlob = RSS.generateRSS(episodes);
            const url = URL.createObjectURL(rssBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'podcast.xml';
            a.click();
            URL.revokeObjectURL(url);
        });
    }
}

export async function refreshLibraryList() {
    const listContainer = document.getElementById('library-list');
    if (!listContainer) return;

    listContainer.innerHTML = '<p>Chargement...</p>';

    try {
        const recordings = await Storage.getAllRecordings();
        listContainer.innerHTML = '';

        if (recordings.length === 0) {
            listContainer.innerHTML = '<p class="empty-state">Aucun enregistrement brut.</p>';
            return;
        }

        recordings.forEach(rec => {
            const card = createRecordingCard(rec);
            listContainer.appendChild(card);
        });
    } catch (e) {
        console.error('Error fetching library:', e);
        listContainer.innerHTML = '<p class="error">Erreur lors du chargement de la bibliothèque.</p>';
    }
}

function setupLibraryEvents() {
    const btnImport = document.getElementById('btn-import-file');
    const inpFile = document.getElementById('inp-import-file');

    if (btnImport) btnImport.addEventListener('click', () => inpFile.click());
    if (inpFile) inpFile.addEventListener('change', handleLibraryImport);
}

async function handleLibraryImport(e) {
    const files = e.target.files;
    if (!files.length) return;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log("Importing to Library:", file.name);

        try {
            // Get duration
            const duration = await getAudioDuration(file);

            const metadata = {
                title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
                duration: formatDuration(duration),
                mimeType: file.type || 'audio/mpeg',
                type: 'import'
            };

            await Storage.saveRecording(metadata, file);
            console.log("Saved recording:", file.name);
        } catch (err) {
            console.error("Failed to import file", err);
            alert(`Erreur lors de l'import de ${file.name}`);
        }
    }

    refreshLibraryList();
    e.target.value = ''; // Reset
}

function getAudioDuration(file) {
    return new Promise((resolve) => {
        const audio = new Audio();
        audio.src = URL.createObjectURL(file);
        audio.onloadedmetadata = () => {
            URL.revokeObjectURL(audio.src);
            resolve(audio.duration);
        };
        audio.onerror = () => {
            resolve(0); // Fallback
        };
    });
}

function formatDuration(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

export async function refreshEpisodesList() {
    const listContainer = document.getElementById('episodes-list');
    if (!listContainer) return;

    listContainer.innerHTML = '<p>Chargement...</p>';

    try {
        const episodes = await Storage.getAllEpisodes();
        listContainer.innerHTML = '';

        if (episodes.length === 0) {
            listContainer.innerHTML = '<p class="empty-state">Aucun épisode publié.</p>';
            return;
        }

        episodes.forEach(ep => {
            const card = createEpisodeCard(ep);
            listContainer.appendChild(card);
        });
    } catch (e) {
        console.error('Error fetching episodes:', e);
        listContainer.innerHTML = '<p class="error">Erreur lors du chargement des épisodes.</p>';
    }
}

function createRecordingCard(recording) {
    const card = document.createElement('div');
    const type = recording.type || 'recording'; // Fallback
    card.className = `episode-card card--${type}`;
    card.setAttribute('draggable', 'true');

    card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
            id: recording.id,
            title: recording.title || 'Enregistrement',
            type: recording.type || 'recording'
        }));
    });

    const date = new Date(recording.created).toLocaleDateString() + ' ' + new Date(recording.created).toLocaleTimeString();
    const audioUrl = URL.createObjectURL(recording.audio);

    card.innerHTML = `
        <div class="episode-info">
            <h3 contenteditable="true" spellcheck="false">${recording.title || 'Enregistrement'}</h3>
            <div class="meta">
                <span>🎤 ${date}</span>
                <span>⏱️ ${recording.duration}</span>
                <span>💾 ${(recording.audio.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <audio controls src="${audioUrl}"></audio>
        </div>
        <div class="episode-actions">
            <button class="btn danger btn-sm delete-btn" data-id="${recording.id}">Supprimer</button>
            <button class="btn primary btn-sm add-timeline-btn">Ajouter à la Timeline</button>
        </div>
    `;

    const titleEl = card.querySelector('h3');
    titleEl.addEventListener('blur', async () => {
        const newTitle = titleEl.textContent.trim();
        if (newTitle && newTitle !== recording.title) {
            await Storage.updateRecordingTitle(recording.id, newTitle);
            // Optional: visual feedback
        }
    });

    titleEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            titleEl.blur();
        }
    });

    card.querySelector('.delete-btn').addEventListener('click', async () => {
        if (confirm('Supprimer cet enregistrement brut ?')) {
            await Storage.deleteRecording(recording.id);
            refreshLibraryList();
            updateStorageInfo();
        }
    });

    card.querySelector('.add-timeline-btn').addEventListener('click', async () => {
        try {
            const trackId = 'rec-' + recording.id + '-' + Date.now();
            await Mixer.addTrack(trackId, recording.audio);
            TimelineUI.addTrackToUI(trackId, recording.title || `Record ${recording.id}`, recording.type || 'recording');
            document.getElementById('nav-editor').click();
        } catch (err) {
            console.error(err);
            alert('Erreur: impossible d\'ajouter à la timeline.');
        }
    });

    return card;
}

function createEpisodeCard(episode) {
    const card = document.createElement('div');
    card.className = 'episode-card';

    // Format date properly
    const date = new Date(episode.created).toLocaleDateString() + ' ' + new Date(episode.created).toLocaleTimeString();

    // Audio blob URL
    const audioUrl = URL.createObjectURL(episode.audio);

    card.innerHTML = `
        <div class="episode-info">
            <h3>${episode.title || 'Sans titre'}</h3>
            <div class="meta">
                <span>📻 ${date}</span>
                <span>⏱️ ${episode.duration}</span>
                <span>💾 ${(episode.audio.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <audio controls src="${audioUrl}"></audio>
        </div>
        <div class="episode-actions">
            <button class="btn danger btn-sm delete-btn" data-id="${episode.id}">Supprimer</button>
            <button class="btn secondary btn-sm download-btn">Télécharger</button>
        </div>
    `;

    // Events
    card.querySelector('.delete-btn').addEventListener('click', async () => {
        if (confirm('Supprimer cet épisode publié ?')) {
            await Storage.deleteEpisode(episode.id);
            refreshEpisodesList();
            updateStorageInfo();
        }
    });

    card.querySelector('.download-btn').addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = audioUrl;
        a.download = `episode-${episode.id}.mp3`;
        a.click();
    });

    return card;
}

async function updateStorageInfo() {
    const quotaBar = document.getElementById('storage-quota');
    const quotaText = document.getElementById('storage-text');

    if (!quotaBar || !quotaText) return;

    try {
        const estimate = await Storage.getStorageEstimate();
        // estimate.usage is bytes, estimate.quota is bytes
        if (estimate.quota) {
            const percent = (estimate.usage / estimate.quota) * 100;
            const usageMB = (estimate.usage / 1024 / 1024).toFixed(1);
            const quotaMB = (estimate.quota / 1024 / 1024).toFixed(0);

            quotaBar.value = percent;
            quotaText.textContent = `${usageMB} MB utilisés sur ${quotaMB} MB disponibles`;
        } else {
            quotaText.textContent = "Quota indisponible";
        }
    } catch (e) {
        console.warn('Storage estimate failed', e);
    }
}
