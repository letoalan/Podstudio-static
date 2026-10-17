/**
 * Rôle : point d'entrée — monte les vues, les bibliothèques (bureau + mobile), le routeur et la PWA.
 * Exemple : bootstrap(); // appelé au chargement du DOM
 */
import './styles/variables.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/studio.css';
import './styles/blocks.css';
import './styles/palette.css';
import './styles/rail.css';
import './styles/editor.css';
import './styles/inspector.css';
import './styles/library.css';
import './styles/timeline.css';
import './styles/transitions.css';
import './styles/story.css';
import './styles/responsive.css';
import { openDB } from './core/db.js';
import { mountEpisodes } from './ui/episodes.js';
import { mountLibrary } from './ui/library.js';
import { initLibraryModal } from './ui/library-modal.js';
import { initRouter } from './ui/router.js';
import { showToast } from './ui/toast.js';
import { mountEditor } from './ui/views/editor.js';
import { mountGuide } from './ui/views/guide.js';
import { mountSettings } from './ui/views/settings.js';
import { mountBlocksView } from './ui/views/blocks.js';
import { registerPwa } from './pwa.js';

const byId = (id) => document.getElementById(id);

export function mountViews() {
  mountGuide(byId('view-guide'));
  mountBlocksView(byId('view-studio'));
  mountEditor(byId('view-editor'));
  mountEpisodes(byId('view-episodes'));
  mountSettings(byId('view-settings'));
}

export function mountLibraries() {
  mountLibrary(byId('library-panel'));
  mountLibrary(byId('library-modal-content'));
  initLibraryModal();
}

export async function bootstrap() {
  try {
    await openDB();
  } catch {
    showToast('Stockage local indisponible : navigation privée ou navigateur trop ancien.', { type: 'error', duration: 0 });
  }
  mountViews();
  mountLibraries();
  initRouter();
  registerPwa();
}

if (!import.meta.env?.VITEST) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
  else bootstrap();
}
