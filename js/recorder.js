/**
 * Recorder Module
 * Handles Audio Capture, Visualization, and Timer
 */

import * as Storage from './storage.js';
import * as UI from './ui.js';

let mediaRecorder = null;
let audioChunks = [];
let audioContext = null;
let analyser = null;
let dataArray = null;
let source = null;
let animationId = null;
let startTime = 0;
let elapsedTime = 0;
let timerInterval = null;
let stream = null;
let isPaused = false;

const visualizerCanvas = document.getElementById('audio-visualizer');
const canvasCtx = visualizerCanvas ? visualizerCanvas.getContext('2d') : null;

export function init() {
    setupEventListeners();
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
}

function resizeCanvas() {
    if (visualizerCanvas) {
        visualizerCanvas.width = visualizerCanvas.offsetWidth;
        visualizerCanvas.height = visualizerCanvas.offsetHeight;
    }
}

function setupEventListeners() {
    const btnRecord = document.getElementById('btn-record');
    const btnStop = document.getElementById('btn-stop');
    const btnPause = document.getElementById('btn-pause');

    if (btnRecord) btnRecord.addEventListener('click', startRecording);
    if (btnStop) btnStop.addEventListener('click', stopRecording);
    if (btnPause) btnPause.addEventListener('click', togglePause);
}

async function togglePause() {
    if (!mediaRecorder) return;

    if (mediaRecorder.state === 'recording') {
        mediaRecorder.pause();
        isPaused = true;
        clearInterval(timerInterval);
        elapsedTime += Date.now() - startTime;
        updateUIState(true);
    } else if (mediaRecorder.state === 'paused') {
        mediaRecorder.resume();
        isPaused = false;
        startTime = Date.now();
        startTimer();
        updateUIState(true);
    }
}

async function startRecording() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            // Stop the tracks to release mic
            stream.getTracks().forEach(track => track.stop());
            cancelAnimationFrame(animationId);
            clearInterval(timerInterval);

            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            // processRecording will handle the worker and UI updates for encoding
            processRecording(audioBlob);
        };

        mediaRecorder.start();
        isPaused = false;
        elapsedTime = 0;
        startTime = Date.now();
        startTimer();
        drawVisualizer();

        updateUIState(true);

    } catch (err) {
        console.error('Error accessing microphone:', err);
        alert('Impossible d\'accéder au microphone. Veuillez vérifier vos permissions.');
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        // Stream tracks must be stopped manually
        stream.getTracks().forEach(track => track.stop());
    }
}

function cleanup() {
    cancelAnimationFrame(animationId);
    clearInterval(timerInterval);
    if (audioContext) audioContext.close();
    elapsedTime = 0;
    updateUIState(false);
}

function updateUIState(isRecording) {
    const btnRecord = document.getElementById('btn-record');
    const btnStop = document.getElementById('btn-stop');
    const btnPause = document.getElementById('btn-pause');
    const statusText = document.getElementById('recording-status');
    const recorderContainer = document.getElementById('view-record');

    if (isRecording) {
        recorderContainer.classList.add('is-recording');
        btnRecord.classList.add('hidden');
        btnStop.classList.remove('hidden');
        btnPause.classList.remove('hidden');

        if (isPaused) {
            recorderContainer.classList.add('is-paused');
            statusText.textContent = "En Pause";
            btnPause.textContent = "▶️"; // Resume icon
        } else {
            recorderContainer.classList.remove('is-paused');
            statusText.textContent = "Enregistrement en cours...";
            btnPause.textContent = "⏸️"; // Pause icon
        }
    } else {
        recorderContainer.classList.remove('is-recording');
        recorderContainer.classList.remove('is-paused');
        btnRecord.classList.remove('hidden');
        btnStop.classList.add('hidden');
        btnPause.classList.add('hidden');
        statusText.textContent = "Prêt à enregistrer";
        document.querySelector('.timer-display').textContent = "00:00:00";
    }
}

function startTimer() {
    const timerDisplay = document.querySelector('.timer-display');
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const currentElapsed = elapsedTime + (Date.now() - startTime);
        const date = new Date(currentElapsed);
        const m = date.getUTCMinutes().toString().padStart(2, '0');
        const s = date.getUTCSeconds().toString().padStart(2, '0');
        const ms = Math.floor(date.getUTCMilliseconds() / 10).toString().padStart(2, '0');
        timerDisplay.textContent = `${m}:${s}:${ms}`;
    }, 50);
}

function drawVisualizer() {
    if (!analyser || !dataArray || !canvasCtx) return;

    animationId = requestAnimationFrame(drawVisualizer);
    analyser.getByteFrequencyData(dataArray);

    canvasCtx.fillStyle = '#000';
    canvasCtx.fillRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

    const barWidth = (visualizerCanvas.width / dataArray.length) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
        barHeight = dataArray[i] / 2;

        // Gradient color based on height
        const r = barHeight + 25 * (i / dataArray.length);
        const g = 250 * (i / dataArray.length);
        const b = 50;

        canvasCtx.fillStyle = `rgb(${r},${g},${b})`;
        canvasCtx.fillRect(x, visualizerCanvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
    }
}

async function processRecording(blob) {
    updateUIState(false); // Ensure UI is reset
    const statusText = document.getElementById('recording-status');
    statusText.textContent = "Conversion en MP3...";

    // Decode audio to get PCM data
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const pcmData = audioBuffer.getChannelData(0); // Use first channel (Mono)

    // Initialize Worker
    const worker = new Worker('js/audio-worker.js');

    worker.postMessage({
        command: 'encode',
        audioData: pcmData,
        sampleRate: audioBuffer.sampleRate
    });

    worker.onmessage = async (e) => {
        if (e.data.error) {
            console.error(e.data.error);
            alert('Erreur: Bibliothèque MP3 manquante. Voir console.');
            statusText.textContent = "Erreur encodage";
            return;
        }

        if (e.data.command === 'complete') {
            const mp3Blob = e.data.blob;

            // Save to IndexedDB
            const dateStr = new Date().toLocaleString();
            const metadata = {
                title: `Enregistrement ${dateStr}`,
                duration: document.querySelector('.timer-display').textContent,
                mimeType: 'audio/mp3',
                type: 'recording'
            };

            try {
                await Storage.saveRecording(metadata, mp3Blob);
                if (UI.refreshLibraryList) UI.refreshLibraryList(); // Check existence as UI might not be updated yet
                statusText.textContent = "Sauvegardé (Bibliothèque) !";
                setTimeout(() => {
                    statusText.textContent = "Prêt à enregistrer";
                }, 2000);
            } catch (err) {
                console.error('Save failed', err);
                statusText.textContent = "Erreur sauvegarde";
            }
            worker.terminate();
        }
    };
}
