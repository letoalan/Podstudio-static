/**
 * <audio-player> Component
 * Custom audio controls and waveform visualization.
 */
export class AudioPlayer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.audio = new Audio();
        this.isPlaying = false;
        this.duration = 0;
    }

    static get observedAttributes() {
        return ['src', 'title'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'src') {
            this.audio.src = newValue;
            this.setupAudio();
        }
        if (name === 'title' && this.dom) {
            this.dom.title.textContent = newValue;
        }
    }

    connectedCallback() {
        this.render();
        this.cacheDom();
        this.setupEvents();

        if (this.hasAttribute('title')) {
            this.dom.title.textContent = this.getAttribute('title');
        }
        if (this.hasAttribute('src')) {
            this.audio.src = this.getAttribute('src');
            this.setupAudio();
        }
    }

    disconnectedCallback() {
        this.audio.pause();
        this.audio.src = '';
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                @import url('css/variables.css');
                
                :host {
                    display: block;
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius-md);
                    padding: 1rem;
                    margin-top: 1rem;
                }

                .player-container {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .controls-row {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                h4 {
                    margin: 0;
                    font-size: 0.9rem;
                    color: var(--text-main);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .btn-play {
                    background: var(--primary);
                    color: white;
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    transition: background 0.2s;
                    flex-shrink: 0;
                }

                .btn-play:hover {
                    background: var(--primary-hover);
                }

                .progress-container {
                    flex-grow: 1;
                    position: relative;
                    height: 6px;
                    background: var(--bg-secondary);
                    border-radius: 3px;
                    cursor: pointer;
                }

                .progress-bar {
                    height: 100%;
                    background: var(--accent);
                    border-radius: 3px;
                    width: 0%;
                    transition: width 0.1s linear;
                }

                .time {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    font-family: monospace;
                    min-width: 40px;
                }
            </style>
            
            <div class="player-container">
                <div class="controls-row">
                    <button id="play-btn" class="btn-play">▶</button>
                    <div style="flex-grow: 1; overflow: hidden;">
                        <h4 id="track-title">Loading...</h4>
                    </div>
                    <span id="current-time" class="time">00:00</span>
                </div>
                
                <div class="controls-row">
                    <div id="progress" class="progress-container">
                        <div id="progress-bar" class="progress-bar"></div>
                    </div>
                    <span id="duration" class="time">--:--</span>
                </div>
            </div>
        `;
    }

    cacheDom() {
        this.dom = {
            playBtn: this.shadowRoot.getElementById('play-btn'),
            title: this.shadowRoot.getElementById('track-title'),
            progress: this.shadowRoot.getElementById('progress'),
            progressBar: this.shadowRoot.getElementById('progress-bar'),
            currentTime: this.shadowRoot.getElementById('current-time'),
            duration: this.shadowRoot.getElementById('duration')
        };
    }

    setupEvents() {
        this.dom.playBtn.addEventListener('click', () => this.togglePlay());

        this.dom.progress.addEventListener('click', (e) => {
            const rect = this.dom.progress.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            if (Number.isFinite(this.audio.duration)) {
                this.audio.currentTime = pos * this.audio.duration;
            }
        });
    }

    setupAudio() {
        this.audio.addEventListener('loadedmetadata', () => {
            this.duration = this.audio.duration;
            this.dom.duration.textContent = this.formatTime(this.duration);
        });

        this.audio.addEventListener('timeupdate', () => {
            const percent = (this.audio.currentTime / this.audio.duration) * 100;
            this.dom.progressBar.style.width = `${percent}%`;
            this.dom.currentTime.textContent = this.formatTime(this.audio.currentTime);
        });

        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
            this.updatePlayBtn();
            this.dom.progressBar.style.width = '0%';
        });

        // Handle external pause (e.g. if another player starts)
        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayBtn();
        });

        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.updatePlayBtn();

            // Stop other players
            const allPlayers = document.querySelectorAll('audio-player');
            allPlayers.forEach(p => {
                if (p !== this) p.pause();
            });
        });
    }

    togglePlay() {
        if (this.isPlaying) {
            this.audio.pause();
        } else {
            this.audio.play();
        }
    }

    pause() {
        this.audio.pause();
    }

    updatePlayBtn() {
        this.dom.playBtn.textContent = this.isPlaying ? '⏸' : '▶';
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '00:00';
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }
}

customElements.define('audio-player', AudioPlayer);
