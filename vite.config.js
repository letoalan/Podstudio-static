import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// BASE_PATH permet d'adapter le chemin selon l'hébergeur
// (GitHub Pages : '/Podstudio-static/', GitLab Pages : '/').
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  base,
  worker: { format: 'es' },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'PodStudio',
        short_name: 'PodStudio',
        description: 'Studio de podcast dans le navigateur',
        theme_color: '#080810',
        background_color: '#080810',
        display: 'standalone',
        start_url: base,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,png,woff2}'] },
    }),
  ],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.js'],
  },
});
