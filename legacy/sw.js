const CACHE_NAME = 'podstudio-v1';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/ui.js',
    './js/recorder.js',
    './js/storage.js',
    './js/rss.js',
    './js/audio-worker.js',
    './js/mixer.js',
    './js/timeline-ui.js',
    './vendor/lame.min.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});
