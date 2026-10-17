/**
 * Rôle : affichage de la forme d'onde / équalizer sur toute la largeur de la carte de bloc.
 * Exemple : const eq = renderBlockEqualizer(block, { isPlaying, onSeek });
 */
import { h } from './dom.js';
import { getBlockTotalDuration, isBlockEmpty } from '../core/block-model.js';

function generateBarHeights(seed, count) {
  const bars = [];
  let s = Math.abs(seed) || 42;
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280;
    const rnd = s / 233280;
    const envelope = Math.sin((i / count) * Math.PI);
    const height = Math.max(12, Math.round((0.25 + rnd * 0.75) * envelope * 100));
    bars.push(height);
  }
  return bars;
}

function getBlockSeed(block) {
  if (!block?.clips?.length) return 12345;
  return block.clips.reduce((acc, c, idx) => acc + (c.duration || 1) * 100 * (idx + 1), 0);
}

export function renderBlockEqualizer(block, callbacks = {}) {
  const lane = h('div', { class: `block-equalizer-lane${callbacks.isPlaying ? ' is-playing' : ''}` });
  if (isBlockEmpty(block)) {
    lane.append(h('span', { class: 'block-empty-hint' }, '🎙️ Bloc vide — cliquez sur Micro ou Bibliothèque pour ajouter du son'));
    return lane;
  }

  const barsCount = 54;
  const seed = getBlockSeed(block);
  const heights = generateBarHeights(seed, barsCount);

  const cues = h('div', { class: 'block-eq-cues' },
    h('div', { class: 'block-eq-cue cue-cyan', style: 'left: 28%;', title: 'Repère intro' }),
    h('div', { class: 'block-eq-cue cue-magenta', style: 'left: 72%;', title: 'Repère outro' }),
  );

  const barsContainer = h('div', { class: 'block-equalizer-bars' });
  heights.forEach((hVal, idx) => {
    const isMagenta = idx >= Math.floor(barsCount * 0.48);
    const bar = h('div', {
      class: `block-eq-bar ${isMagenta ? 'is-magenta' : 'is-cyan'}`,
      style: `height: ${hVal}%; --bar-delay: ${(idx % 8) * 0.08}s;`,
    });
    barsContainer.append(bar);
  });

  const scrubber = h('div', { class: 'block-eq-scrubber' });
  lane.append(cues, barsContainer, scrubber);

  lane.addEventListener('click', (e) => {
    e.stopPropagation();
    const rect = lane.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    scrubber.style.left = `${pct * 100}%`;
    const dur = getBlockTotalDuration(block);
    callbacks.onSeek?.(pct * dur);
  });

  return lane;
}
