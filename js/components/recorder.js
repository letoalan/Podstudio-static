/**
 * <podcast-recorder> Component
 * Handles microphone access, visualization, and recording control.
 */
import { saveEpisode } from '../db.js';

export class PodcastRecorder extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // State
        this.isRecording = false;
        this.startTime = 0;
        this.timerInterval = null;
        this.mediaRecorder = null;
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.animationId = null;
        this.stream = null;
        this.worker = null;

        // Bindings
        this.toggleRecording = this.toggleRecording.bind(this);
    }

    connectedCallback() {
        this.render();
        this.cacheDom();
        this.setupEvents();
        this.resizeVisualizer();
        window.addEventListener('resize', () => this.resizeVisualizer());
    }

    disconnectedCallback() {
        this.cleanup();
        window.removeEventListener('resize', () => this.resizeVisualizer());
    }

    cacheDom() {
        this.dom = {
            btnRecord: this.shadowRoot.getElementById('btn-record'),
            btnStop: this.shadowRoot.getElementById('btn-stop'),
            timer: this.shadowRoot.getElementById('timer'),
            status: this.shadowRoot.getElementById('status'),
            canvas: this.shadowRoot.getElementById('visualizer'),
            container: this.shadowRoot.querySelector('.recorder-container')
        };
        this.canvasCtx = this.dom.canvas.getContext('2d');
    }

    setupEvents() {
        this.dom.btnRecord.addEventListener('click', this.toggleRecording);
        this.dom.btnStop.addEventListener('click', this.toggleRecording);
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                @import url('css/variables.css');
                
                :host {
                    display: block;
                    width: 100%;
                    max-width: 800px;
                    margin: 0 auto;
                }

                .recorder-container {
                    background: var(--bg-card);
                    border-radius: var(--border-radius-lg);
                    padding: 2rem;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                    box-shadow: var(--shadow-md);
                    border: 1px solid var(--border-color);
                    transition: all 0.3s ease;
                }

                .recorder-container.recording {
                    border-color: var(--accent);
                    box-shadow: 0 0 20px rgba(255, 0, 85, 0.2);
                }

                canvas {
                    width: 100%;
                    height: 120px;
                    background: var(--bg-secondary);
                    border-radius: var(--border-radius-md);
                    margin-bottom: 2rem;
                }

                .controls {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 1.5rem;
                    flex-direction: column;
                }

                .timer {
                    font-family: monospace;
                    font-size: 3rem;
                    font-weight: 700;
                    color: var(--text-main);
                    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                }

                .recording .timer {
                    color: var(--accent);
                }

                .btn {
                    border: none;
                    outline: none;
                    cursor: pointer;
                    font-weight: 600;
                    padding: 1rem 3rem;
                    border-radius: var(--border-radius-full);
                    font-size: 1.1rem;
                    transition: transform 0.1s, background-color 0.2s;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }

                .btn:active {
                    transform: scale(0.95);
                }

                .btn-record {
                    background-color: var(--primary);
                    color: white;
                }

                .btn-record:hover {
                    background-color: var(--primary-hover);
                }

                .btn-stop {
                    background-color: var(--secondary);
                    color: var(--accent);
                    border: 2px solid var(--accent);
                    display: none;
                }

                .btn-stop:hover {
                    background-color: var(--bg-card-hover);
                }

                .status {
                    margin-top: 1rem;
                    color: var(--text-muted);
                    font-size: 0.9rem;
                    height: 20px;
                }

                /* State Classes */
                .hidden { display: none !important; }
                .visible { display: inline-flex !important; }

            </style>

            <div class="recorder-container">
                <canvas id="visualizer"></canvas>

                <div class="controls">
                    <div class="timer" id="timer">00:00:00</div>
                    
                    <button id="btn-record" class="btn btn-record">
                        <span>🎙️</span> Commencer
                    </button>
                    
                    <button id="btn-stop" class="btn btn-stop hidden">
                        <span>⏹️</span> Arrêter
                    </button>

                    <div id="status" class="status">Prêt à enregistrer</div>
                </div>
            </div>
        `;
    }

    async toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            await this.startRecording();
        }
    }

    async startRecording() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;

            const source = this.audioContext.createMediaStreamSource(this.stream);
            source.connect(this.analyser);

            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

            this.mediaRecorder = new MediaRecorder(this.stream);
            let chunks = [];

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            this.mediaRecorder.onstop = async () => {
                this.dom.status.textContent = 'Traitement audio...';
                const blob = new Blob(chunks, { type: 'audio/webm' });
                await this.processAudio(blob);
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            this.startTime = Date.now();
            this.startTimer();
            this.startVisualizer();
            this.updateUIState(true);

        } catch (err) {
            console.error('Microphone access failed:', err);
            this.dom.status.textContent = "Erreur: Accès micro refusé";
            alert('Accès micro refusé. Vérifiez vos paramètres.');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.stream.getTracks().forEach(track => track.stop());
            this.isRecording = false;
            this.stopTimer();
            this.stopVisualizer();
            this.updateUIState(false);
        }
    }

    async processAudio(webmBlob) {
        try {
            const arrayBuffer = await webmBlob.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            const pcmData = audioBuffer.getChannelData(0); // Mono

            this.worker = new Worker('js/audio-worker.js');
            this.worker.postMessage({
                command: 'encode',
                audioData: pcmData,
                sampleRate: audioBuffer.sampleRate
            });

            this.worker.onmessage = async (e) => {
                if (e.data.command === 'complete') {
                    const mp3Blob = e.data.blob;
                    const metadata = {
                        title: `Enregistrement ${new Date().toLocaleString()}`,
                        duration: this.dom.timer.textContent,
                        mimeType: 'audio/mp3',
                        size: mp3Blob.size
                    };

                    await saveEpisode(metadata, mp3Blob);

                    this.dom.status.textContent = 'Sauvegardé avec succès !';
                    this.worker.terminate();

                    // Dispatch event for other components
                    this.dispatchEvent(new CustomEvent('episode-saved', {
                        bubbles: true,
                        composed: true,
                        detail: { metadata }
                    }));

                    setTimeout(() => {
                        this.dom.status.textContent = 'Prêt à enregistrer';
                        this.dom.timer.textContent = '00:00:00';
                    }, 2000);
                } else if (e.data.error) {
                    this.dom.status.textContent = 'Erreur encodage';
                    console.error('Worker error:', e.data.error);
                }
            };
        } catch (err) {
            console.error('Processing error:', err);
            this.dom.status.textContent = 'Erreur de traitement';
        }
    }

    // --- UI Helpers ---

    updateUIState(recording) {
        if (recording) {
            this.dom.container.classList.add('recording');
            this.dom.btnRecord.classList.add('hidden');
            this.dom.btnStop.classList.remove('hidden');
            this.dom.btnStop.classList.add('visible');
            this.dom.status.textContent = 'Enregistrement...';
        } else {
            this.dom.container.classList.remove('recording');
            this.dom.btnRecord.classList.remove('hidden');
            this.dom.btnStop.classList.add('hidden');
            this.dom.btnStop.classList.remove('visible');
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const d = new Date(elapsed);
            const m = d.getUTCMinutes().toString().padStart(2, '0');
            const s = d.getUTCSeconds().toString().padStart(2, '0');
            const ms = Math.floor(d.getUTCMilliseconds() / 10).toString().padStart(2, '0');
            this.dom.timer.textContent = `${m}:${s}:${ms}`;
        }, 50);
    }

    stopTimer() {
        clearInterval(this.timerInterval);
    }

    // --- Visualization ---

    resizeVisualizer() {
        if (this.dom.canvas) {
            this.dom.canvas.width = this.dom.canvas.offsetWidth;
            this.dom.canvas.height = this.dom.canvas.offsetHeight;
        }
    }

    startVisualizer() {
        const draw = () => {
            if (!this.isRecording) return;
            this.animationId = requestAnimationFrame(draw);

            this.analyser.getByteFrequencyData(this.dataArray);

            const ctx = this.canvasCtx;
            const w = this.dom.canvas.width;
            const h = this.dom.canvas.height;
            const bufferLength = this.dataArray.length;
            const barWidth = (w / bufferLength) * 2.5;
            let x = 0;

            ctx.clearRect(0, 0, w, h);

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = this.dataArray[i] / 2;

                // Dynamic styling inside canvas to match theme
                // Gradient from primary to accent
                const r = barHeight + 25 * (i / bufferLength);
                const g = 250 * (i / bufferLength);
                const b = 50;

                // Simply using the accent color for now for "Podcast" vibe
                ctx.fillStyle = `rgb(255, ${255 - barHeight}, 85)`;
                ctx.fillRect(x, h - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };
        draw();
    }

    stopVisualizer() {
        cancelAnimationFrame(this.animationId);
        // Clear canvas
        if (this.canvasCtx) {
            this.canvasCtx.clearRect(0, 0, this.dom.canvas.width, this.dom.canvas.height);
        }
    }

    cleanup() {
        this.stopRecording();
        if (this.worker) this.worker.terminate();
        if (this.audioContext) this.audioContext.close();
    }
}

customElements.define('podcast-recorder', PodcastRecorder);
