/**
 * <episode-library> Component
 * Displays the list of episodes from IndexedDB.
 */
import { getAllEpisodes, deleteEpisode } from '../db.js';

export class EpisodeLibrary extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.episodes = [];
        this.selectedIds = new Set();
    }

    connectedCallback() {
        this.render();
        this.cacheDom();
        this.loadEpisodes();

        // Listen for new episodes saved
        window.addEventListener('episode-saved', () => this.loadEpisodes());
    }

    disconnectedCallback() {
        window.removeEventListener('episode-saved', () => this.loadEpisodes());
    }

    cacheDom() {
        this.dom = {
            list: this.shadowRoot.getElementById('list'),
            refreshBtn: this.shadowRoot.getElementById('btn-refresh'),
            deleteBtn: this.shadowRoot.getElementById('btn-delete-multi'),
            count: this.shadowRoot.getElementById('count')
        };

        this.dom.refreshBtn.addEventListener('click', () => this.loadEpisodes());
        this.dom.deleteBtn.addEventListener('click', () => this.deleteSelected());
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                @import url('css/variables.css');
                
                :host {
                    display: block;
                    padding: 1rem;
                }

                .toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid var(--border-color);
                }
                
                h2 { margin: 0; color: var(--text-main); font-size: 1.5rem; }

                .actions {
                    display: flex;
                    gap: 1rem;
                }

                .btn-text {
                    background: none;
                    border: none;
                    color: var(--primary);
                    cursor: pointer;
                    font-size: 0.9rem;
                }
                
                .btn-text:hover { text-decoration: underline; }

                .btn-danger {
                    color: var(--accent);
                }
                
                .grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.5rem;
                }
                
                .card {
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius-md);
                    padding: 1.5rem;
                    position: relative;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                
                .card:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-sm);
                    border-color: var(--primary);
                }
                
                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1rem;
                }
                
                .checkbox-wrapper {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                }
                
                h3 {
                    margin: 0 0 0.5rem 0;
                    font-size: 1.1rem;
                    color: var(--text-main);
                    padding-right: 2rem;
                }
                
                .meta {
                    display: flex;
                    gap: 1rem;
                    font-size: 0.85rem;
                    color: var(--text-muted);
                }
                
                .card-footer {
                    margin-top: 1rem;
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                }
                
                .icon-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 1.2rem;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                }
                
                .icon-btn:hover { opacity: 1; }
                .btn-dl:hover { color: var(--primary); }
                .btn-del:hover { color: var(--accent); }

                .empty-state {
                    text-align: center;
                    padding: 4rem;
                    color: var(--text-muted);
                }
            </style>
            
            <div class="toolbar">
                <div>
                    <h2>Bibliothèque <span id="count">(0)</span></h2>
                </div>
                <div class="actions">
                    <button id="btn-delete-multi" class="btn-text btn-danger hidden">Supprimer la sélection</button>
                    <button id="btn-refresh" class="btn-text">Actualiser</button>
                </div>
            </div>
            
            <div id="list" class="grid">
                <!-- Episodes inserted here -->
            </div>
        `;
    }

    async loadEpisodes() {
        this.shadowRoot.getElementById('list').innerHTML = '<p class="empty-state">Chargement...</p>';
        try {
            this.episodes = await getAllEpisodes();
            this.renderList();
        } catch (e) {
            console.error(e);
            this.shadowRoot.getElementById('list').innerHTML = '<p class="empty-state">Erreur de chargement</p>';
        }
    }

    renderList() {
        const list = this.shadowRoot.getElementById('list');
        list.innerHTML = '';
        this.dom.count.textContent = `(${this.episodes.length})`;

        if (this.episodes.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <h3>C'est vide !</h3>
                    <p>Enregistrez votre premier épisode pour le voir apparaître ici.</p>
                </div>
            `;
            return;
        }

        this.episodes.forEach(ep => {
            const card = document.createElement('div');
            card.className = 'card';

            const date = new Date(ep.created).toLocaleDateString();
            const size = (ep.audio.size / 1024 / 1024).toFixed(1) + ' MB';
            const blobUrl = URL.createObjectURL(ep.audio);

            card.innerHTML = `
                <div class="checkbox-wrapper">
                    <input type="checkbox" class="select-box" data-id="${ep.id}">
                </div>
                <div class="card-header">
                    <div>
                        <h3>${ep.title || 'Sans titre'}</h3>
                        <div class="meta">
                            <span>📅 ${date}</span>
                            <span>💾 ${size}</span>
                        </div>
                    </div>
                </div>
                
                <audio-player src="${blobUrl}" title="${ep.title}"></audio-player>
                
                <div class="card-footer">
                    <button class="icon-btn btn-dl" title="Télécharger">⬇️</button>
                    <button class="icon-btn btn-del" title="Supprimer">🗑️</button>
                </div>
            `;

            // Events
            const checkbox = card.querySelector('.select-box');
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) this.selectedIds.add(ep.id);
                else this.selectedIds.delete(ep.id);
                this.updateToolbar();
            });

            card.querySelector('.btn-dl').addEventListener('click', () => {
                const a = document.createElement('a');
                a.href = blobUrl;
                // FIX: Force .mp3 extension
                a.download = `${ep.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`;
                a.click();
            });

            card.querySelector('.btn-del').addEventListener('click', async () => {
                if (confirm('Supprimer cet épisode ?')) {
                    await deleteEpisode(ep.id);
                    this.loadEpisodes();
                }
            });

            list.appendChild(card);
        });
    }

    updateToolbar() {
        const btn = this.shadowRoot.getElementById('btn-delete-multi');
        if (this.selectedIds.size > 0) {
            btn.classList.remove('hidden');
            btn.style.display = 'block';
            btn.textContent = `Supprimer la sélection (${this.selectedIds.size})`;
        } else {
            btn.style.display = 'none';
        }
    }

    async deleteSelected() {
        if (!confirm(`Supprimer ${this.selectedIds.size} épisodes ?`)) return;

        for (const id of this.selectedIds) {
            await deleteEpisode(id);
        }
        this.selectedIds.clear();
        this.updateToolbar();
        this.loadEpisodes();
    }
}

customElements.define('episode-library', EpisodeLibrary);
