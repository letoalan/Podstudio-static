/**
 * Timeline UI Controller
 * Bridges the UI and the Mixer logic.
 */

import * as Mixer from './mixer.js';
import * as Storage from './storage.js';
import * as UI from './ui.js';

let isDragging = false;
let dragTarget = null;
let dragStartPos = 0;
let dragStartOffset = 0;

const PIXELS_PER_SECOND = 10; // 10px = 1s for the "bricks" look (can be adjusted)
const BRICK_HEIGHT = 64;

export function init() {
    setupEventListeners();
    renderTracks();
    generateRuler();
    setupScrollSync();
}

function setupScrollSync() {
    const tracksContainer = document.getElementById('timeline-tracks');
    const headerSticky = document.querySelector('.timeline-header-sticky');
    if (tracksContainer && headerSticky) {
        tracksContainer.addEventListener('scroll', () => {
            headerSticky.scrollLeft = tracksContainer.scrollLeft;
        });
    }
}

function setupEventListeners() {
    // Transport
    document.getElementById('btn-editor-play').addEventListener('click', () => {
        Mixer.play();
        startPlaybackTimer();
    });
    document.getElementById('btn-editor-stop').addEventListener('click', () => {
        Mixer.stop();
        stopPlaybackTimer();
        document.getElementById('editor-time').textContent = "00:00";
        document.getElementById('editor-time').textContent = "00:00";
    });

    // Export
    document.getElementById('btn-export-mix').addEventListener('click', async () => {
        const btn = document.getElementById('btn-export-mix');
        const originalText = btn.textContent;
        btn.textContent = "Rendu en cours...";
        btn.disabled = true;

        try {
            const blob = await Mixer.exportMix();
            if (!blob) {
                alert("La timeline est vide !");
            } else {
                // Save to Episodes (Final Mix)
                const dateStr = new Date().toISOString();
                const metadata = {
                    title: `Mix ${new Date().toLocaleString()}`,
                    duration: document.getElementById('editor-time').textContent, // Approximation
                    mimeType: 'audio/mp3'
                };

                await Storage.saveEpisode(metadata, blob);

                if (confirm("Mix exporté avec succès dans 'Épisodes' ! Voulez-vous le télécharger aussi ?")) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `mix-${dateStr.slice(0, 19).replace(/:/g, '-')}.mp3`;
                    a.click();
                }

                // Switch to episodes view to see the result
                document.getElementById('nav-episodes').click();
                UI.refreshEpisodesList();
            }
        } catch (e) {
            console.error(e);
            alert("Erreur lors de l'export.");
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });

    // Drag & Drop Listeners
    const timelineContainer = document.getElementById('timeline-tracks');
    if (timelineContainer) {
        timelineContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            timelineContainer.classList.add('drag-over');
        });

        timelineContainer.addEventListener('dragleave', () => {
            timelineContainer.classList.remove('drag-over');
        });

        timelineContainer.addEventListener('drop', async (e) => {
            e.preventDefault();
            timelineContainer.classList.remove('drag-over');

            try {
                const data = JSON.parse(e.dataTransfer.getData('application/json'));
                if (data && data.id) {
                    // Fetch recording blob from storage
                    const recordings = await Storage.getAllRecordings();
                    const recording = recordings.find(r => r.id === data.id);

                    if (recording) {
                        const trackId = 'rec-' + recording.id + '-' + Date.now();
                        await Mixer.addTrack(trackId, recording.audio);
                        addTrackToUI(trackId, recording.title || 'Enregistrement', data.type || 'recording');
                    }
                }
            } catch (err) {
                console.error('Drop failed', err);
            }
        });
    }
}

let timerInterval;

function startPlaybackTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const time = Mixer.getCurrentTime();
        const m = Math.floor(time / 60).toString().padStart(2, '0');
        const s = Math.floor(time % 60).toString().padStart(2, '0');
        document.getElementById('editor-time').textContent = `${m}:${s}`;

        updatePlayhead(time);
    }, 50);
}

function stopPlaybackTimer() {
    clearInterval(timerInterval);
    updatePlayhead(0);
}

function updatePlayhead(time) {
    const playhead = document.getElementById('timeline-playhead');
    if (playhead) {
        const pos = time * PIXELS_PER_SECOND;
        playhead.style.left = pos + 'px';

        // Auto-scroll logic
        const container = document.getElementById('timeline-tracks');
        if (container) {
            const scrollLeft = container.scrollLeft;
            const width = container.clientWidth;
            if (pos > scrollLeft + width - 50 || pos < scrollLeft) {
                container.scrollLeft = pos - 100;
            }
        }
    }
}

function generateRuler() {
    const ruler = document.getElementById('timeline-ruler');
    if (!ruler) return;

    ruler.innerHTML = '';
    const maxSeconds = 3600; // 1 hour
    for (let i = 0; i < maxSeconds; i += 30) {
        const mark = document.createElement('div');
        mark.className = 'ruler-mark-h';
        mark.style.left = (i * PIXELS_PER_SECOND) + 'px';

        const m = Math.floor(i / 60).toString().padStart(2, '0');
        const s = (i % 60).toString().padStart(2, '0');
        mark.textContent = `${m}:${s}`;
        ruler.appendChild(mark);
    }
}



export async function addTrackToUI(id, name, type = 'recording') {
    const container = document.getElementById('timeline-tracks');
    const content = container.querySelector('.timeline-tracks-content');

    // Remove empty hint if exists
    const hint = content.querySelector('.empty-timeline-hint');
    if (hint) hint.remove();

    const track = Mixer.getTracks().find(t => t.id === id);
    const duration = track ? track.buffer.duration : 0;
    const width = Math.max(100, duration * PIXELS_PER_SECOND); // Minimum width 100px

    const clip = document.createElement('div');
    clip.className = `track-clip clip--${type}`;
    clip.id = `clip-${id}`;
    clip.style.left = '0px';
    clip.style.top = (content.querySelectorAll('.track-clip').length * (BRICK_HEIGHT + 10)) + 'px'; // Simple vertical stack
    clip.style.width = width + 'px';

    clip.innerHTML = `
        <span>${name}</span>
        <div class="clip-actions">
            <button class="clip-settings-toggle" title="Volume/Fades">🔊</button>
            <button class="clip-delete" title="Supprimer">✕</button>
        </div>
        <div class="clip-volume-panel">
            <div class="vol-row">
                <label>Vol</label>
                <input type="range" class="clip-vol-slider" min="0" max="1.5" step="0.05" value="1">
            </div>
            <div class="vol-row">
                <label>Fade In (s)</label>
                <input type="number" class="clip-fade-in" min="0" max="10" step="0.5" value="0">
            </div>
            <div class="vol-row">
                <label>Fade Out (s)</label>
                <input type="number" class="clip-fade-out" min="0" max="10" step="0.5" value="0">
            </div>
        </div>
    `;

    content.appendChild(clip);

    // Bind Toggle Panel
    const toggle = clip.querySelector('.clip-settings-toggle');
    const panel = clip.querySelector('.clip-volume-panel');
    toggle.addEventListener('mousedown', (e) => e.stopPropagation());
    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.toggle('active');
    });

    // Close panel on document click
    document.addEventListener('click', (e) => {
        if (!clip.contains(e.target)) panel.classList.remove('active');
    });

    // Stop propagation for inputs
    panel.addEventListener('mousedown', (e) => e.stopPropagation());

    // Bind Volume
    clip.querySelector('.clip-vol-slider').addEventListener('input', (e) => {
        Mixer.setVolume(id, parseFloat(e.target.value));
    });

    // Bind Fades
    clip.querySelector('.clip-fade-in').addEventListener('change', (e) => {
        Mixer.setFadeIn(id, parseFloat(e.target.value));
    });
    clip.querySelector('.clip-fade-out').addEventListener('change', (e) => {
        Mixer.setFadeOut(id, parseFloat(e.target.value));
    });

    // Bind Deletion
    clip.querySelector('.clip-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm("Supprimer ce segment ?")) {
            Mixer.removeTrack(id);
            clip.remove();
            if (content.querySelectorAll('.track-clip').length === 0) {
                renderEmptyHint();
            }
        }
    });

    // Setup Dragging
    setupClipDragging(clip, id);
}

function setupClipDragging(clip, trackId) {
    const container = document.getElementById('timeline-tracks');
    const isVertical = container.classList.contains('vertical-timeline');

    clip.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('clip-delete')) return;

        isDragging = true;
        dragTarget = clip;
        dragStartPos = e.clientX;
        dragStartOffset = parseFloat(clip.style.left) || 0;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        e.preventDefault();
    });

    function onMouseMove(e) {
        if (!isDragging) return;

        const delta = e.clientX - dragStartPos;
        let newValue = dragStartOffset + delta;
        if (newValue < 0) newValue = 0;

        dragTarget.style.left = newValue + 'px';
    }

    function onMouseUp(e) {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        const pixels = parseFloat(dragTarget.style.left) || 0;
        const seconds = pixels / PIXELS_PER_SECOND;

        const track = Mixer.getTracks().find(t => t.id === trackId);
        if (track) {
            track.offset = seconds;
            console.log(`Track ${trackId} moved to ${seconds}s`);
        }
    }
}

function renderEmptyHint() {
    const container = document.getElementById('timeline-tracks');
    const content = container.querySelector('.timeline-tracks-content');
    if (content.querySelector('.empty-timeline-hint')) return;

    const div = document.createElement('div');
    div.className = 'empty-timeline-hint';
    div.innerHTML = '<p>Glissez-déposez vos enregistrements ici pour les monter.</p>';
    content.appendChild(div);
}

function renderTracks() {
    // Re-render from mixer state if needed (persistance)
}
