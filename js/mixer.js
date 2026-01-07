/**
 * Moteur de Mixage Audio
 * Gère la lecture multipiste et le rendu audio.
 */

let audioContext = null;
let tracks = []; // Liste des objets { id, buffer, offset, gainNode, sourceNode }
let isPlaying = false;
let startTime = 0;
let pauseTime = 0;

export function init() {
    // Initialisation lazy du contexte audio (requis par les navigateurs)
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

/**
 * Ajoute une piste au mixeur
 * @param {string} id - Identifiant unique de la piste
 * @param {Blob|ArrayBuffer} audioSource - Blob ou ArrayBuffer source
 * @param {number} offset - Décalage temporel en secondes (défaut 0)
 */
export async function addTrack(id, audioSource, offset = 0) {
    init();
    let arrayBuffer;

    if (audioSource instanceof Blob) {
        arrayBuffer = await audioSource.arrayBuffer();
    } else {
        arrayBuffer = audioSource;
    }

    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const track = {
        id: id,
        buffer: audioBuffer,
        offset: offset,
        volume: 1.0,
        fadeIn: 0,
        fadeOut: 0,
        sourceNode: null,
        gainNode: null
    };

    tracks.push(track);
    return track;
}

export function removeTrack(id) {
    const index = tracks.findIndex(t => t.id === id);
    if (index > -1) {
        if (tracks[index].sourceNode) {
            tracks[index].sourceNode.stop();
        }
        tracks.splice(index, 1);
    }
}

export function play() {
    if (isPlaying) return;
    init();

    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    startTime = audioContext.currentTime - pauseTime;

    tracks.forEach(track => {
        playTrack(track);
    });

    isPlaying = true;
}

function playTrack(track) {
    // Créer la source
    const source = audioContext.createBufferSource();
    source.buffer = track.buffer;

    // Créer le gain (volume)
    const gainNode = audioContext.createGain();
    const now = audioContext.currentTime;
    const trackStart = startTime + track.offset;
    const trackEnd = trackStart + track.buffer.duration;

    // Reset gain to 0 if there is a fade in
    if (track.fadeIn > 0) {
        gainNode.gain.setValueAtTime(0, Math.max(now, trackStart));
        gainNode.gain.linearRampToValueAtTime(track.volume, trackStart + track.fadeIn);
    } else {
        gainNode.gain.setValueAtTime(track.volume, Math.max(now, trackStart));
    }

    // Schedule fade out
    if (track.fadeOut > 0) {
        gainNode.gain.setValueAtTime(track.volume, trackEnd - track.fadeOut);
        gainNode.gain.linearRampToValueAtTime(0, trackEnd);
    }

    // Connecter : Source -> Gain -> Destination
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    track.sourceNode = source;
    track.gainNode = gainNode;

    // Calcul du temps de départ
    // Si on est en pause à 5s, et que la piste commence à 2s, on doit lire à partir de 3s (offset dans le buffer)
    // Si on est en pause à 1s, et la piste commence à 2s, on doit programmer un start différé.

    const contextCurrentTime = audioContext.currentTime;
    const trackStartTime = startTime + track.offset; // Quand la piste doit commencer dans le temps absolu du contexte

    // Position actuelle du curseur de lecture
    const cursor = contextCurrentTime - startTime;

    if (cursor < track.offset) {
        // Le curseur est AVANT le début de la piste -> on programme un start dans le futur
        // Délai = track.offset - cursor
        source.start(contextCurrentTime + (track.offset - cursor));
    } else if (cursor < track.offset + track.buffer.duration) {
        // Le curseur est PENDANT la piste -> on start immédiatement avec un offset dans le buffer
        const bufferOffset = cursor - track.offset;
        source.start(contextCurrentTime, bufferOffset);
    }
    // Si cursor > fin de piste, on ne joue rien
}

export function pause() {
    if (!isPlaying) return;

    tracks.forEach(track => {
        if (track.sourceNode) {
            try {
                track.sourceNode.stop();
            } catch (e) { /* Already stopped */ }
            track.sourceNode = null;
        }
    });

    pauseTime = audioContext.currentTime - startTime;
    isPlaying = false;
}

export function stop() {
    pause();
    pauseTime = 0;
    // Rembobiner visuellement si besoin via callback
}

export function getTracks() {
    return tracks;
}

export function setVolume(trackId, value) {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
        track.volume = value;
        // Note: Real-time update of gainNode during fade might conflict with scheduling.
        // For simplicity, we just set the target value if no automation is currently running
        if (track.gainNode) {
            track.gainNode.gain.setTargetAtTime(value, audioContext.currentTime, 0.05);
        }
    }
}

export function setFadeIn(trackId, value) {
    const track = tracks.find(t => t.id === trackId);
    if (track) track.fadeIn = value;
}

export function setFadeOut(trackId, value) {
    const track = tracks.find(t => t.id === trackId);
    if (track) track.fadeOut = value;
}

export function getCurrentTime() {
    if (!audioContext) return 0;
    if (isPlaying) {
        return audioContext.currentTime - startTime;
    }
    return pauseTime;
}

export async function exportMix() {
    if (tracks.length === 0) return null;

    init();

    // 1. Calculate total duration
    let maxDuration = 0;
    tracks.forEach(track => {
        const end = track.offset + track.buffer.duration;
        if (end > maxDuration) maxDuration = end;
    });

    if (maxDuration === 0) return null;

    // 2. Setup Offline Context
    // Standard sample rate usually 44100 or 48000
    const sampleRate = audioContext.sampleRate;
    const offlineCtx = new OfflineAudioContext(1, sampleRate * maxDuration, sampleRate); // Mono output for now

    // 3. Schedule all tracks in offline context
    tracks.forEach(track => {
        const source = offlineCtx.createBufferSource();
        source.buffer = track.buffer;

        const gainNode = offlineCtx.createGain();
        const start = track.offset;
        const end = start + track.buffer.duration;

        // Fade In
        if (track.fadeIn > 0) {
            gainNode.gain.setValueAtTime(0, start);
            gainNode.gain.linearRampToValueAtTime(track.volume, start + track.fadeIn);
        } else {
            gainNode.gain.setValueAtTime(track.volume, start);
        }

        // Fade Out
        if (track.fadeOut > 0) {
            gainNode.gain.setValueAtTime(track.volume, end - track.fadeOut);
            gainNode.gain.linearRampToValueAtTime(0, end);
        }

        source.connect(gainNode);
        gainNode.connect(offlineCtx.destination);

        source.start(start);
    });

    // 4. Render
    const renderedBuffer = await offlineCtx.startRendering();

    // 5. Convert to PCM for MP3 Worker
    const pcmData = renderedBuffer.getChannelData(0);

    return new Promise((resolve, reject) => {
        const worker = new Worker('js/audio-worker.js');
        worker.postMessage({
            command: 'encode',
            audioData: pcmData,
            sampleRate: sampleRate
        });

        worker.onmessage = (e) => {
            if (e.data.command === 'complete') {
                resolve(e.data.blob);
                worker.terminate();
            } else if (e.data.error) {
                reject(e.data.error);
                worker.terminate();
            }
        };
    });
}
