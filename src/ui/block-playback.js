/**
 * Rôle : contrôleur de lecture audio pour la vue Blocs (lecture d'un bloc individuel ou lecture séquentielle du projet).
 * Exemple : togglePlayBlock(block, { state, storage, player, render });
 */
import { getBlockTotalDuration } from '../core/block-model.js';
import { getPlayableBlocks } from '../core/project.js';
import { loadProjectBuffers } from '../audio/block-render.js';
import { showToast } from './toast.js';

let endTimeout = null;

function unlockPlayerContext(player) {
  const ctx = player.ensureContext ? player.ensureContext() : null;
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

export function stopPlayback(state, player, render) {
  clearTimeout(endTimeout);
  endTimeout = null;
  player.stop();
  state.playingBlockId = null;
  state.isGlobalPlaying = false;
  render();
}

export async function togglePlayBlock(block, { state, storage, player, render }) {
  if (state.playingBlockId === block.id) {
    stopPlayback(state, player, render);
    return;
  }
  if (!block?.clips?.length) {
    showToast('Ce bloc est vide : ajoutez un son ou enregistrez votre voix.', { type: 'info' });
    return;
  }
  stopPlayback(state, player, render);
  const ctx = unlockPlayerContext(player);
  state.playingBlockId = block.id;
  render();

  try {
    const buffers = await loadProjectBuffers({ blocks: [block] }, storage, ctx);
    player.setBuffers(buffers);
    player.play(block, 0);
    const durationMs = Math.max(0.2, getBlockTotalDuration(block)) * 1000 + 200;
    endTimeout = setTimeout(() => {
      if (state.playingBlockId === block.id) {
        state.playingBlockId = null;
        render();
      }
    }, durationMs);
  } catch (err) {
    stopPlayback(state, player, render);
    showToast(`Erreur de lecture : ${err.message}`, { type: 'error' });
  }
}

export async function togglePlayAll(project, { state, storage, player, render }) {
  if (state.isGlobalPlaying) {
    stopPlayback(state, player, render);
    showToast('Lecture arrêtée', { type: 'info' });
    return;
  }
  const playable = getPlayableBlocks(project);
  if (!playable.length) {
    showToast('Le podcast est vide : ajoutez du son dans au moins un bloc.', { type: 'info' });
    return;
  }
  stopPlayback(state, player, render);
  const ctx = unlockPlayerContext(player);
  state.isGlobalPlaying = true;
  render();

  try {
    const buffers = await loadProjectBuffers(project, storage, ctx);
    player.setBuffers(buffers);
    let index = 0;
    const playNext = () => {
      if (!state.isGlobalPlaying || index >= playable.length) {
        stopPlayback(state, player, render);
        return;
      }
      const current = playable[index++];
      state.playingBlockId = current.id;
      render();
      player.play(current, 0);
      endTimeout = setTimeout(playNext, Math.max(0.2, getBlockTotalDuration(current)) * 1000 + 200);
    };
    playNext();
  } catch (err) {
    stopPlayback(state, player, render);
    showToast(`Erreur de lecture : ${err.message}`, { type: 'error' });
  }
}
