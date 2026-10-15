/**
 * Main Application Entry Point
 * Orchestrates modules and handles navigation
 */

import * as UI from './ui.js';
import * as Recorder from './recorder.js';
import * as Storage from './storage.js';
import * as Settings from './settings.js';
import * as TimelineUI from './timeline-ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Podcast Studio initializing...');

    // Initialize core modules
    try {
        await Storage.init();
        Settings.init();
        UI.init();
        UI.init();
        Recorder.init();
        TimelineUI.init();

        // Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('SW registered', reg))
                .catch(err => console.error('SW failed', err));
        }

        console.log('Initialization complete.');
    } catch (error) {
        console.error('Initialization failed:', error);
        alert('Erreur: Impossible d\'initialiser l\'application. Vérifiez la compatibilité du navigateur.');
    }
});
