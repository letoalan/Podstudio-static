/**
 * Rôle : rôles narratifs du podcast (Intro, Interview, Chronique, Virgule, Outro) et calcul du conducteur temporel.
 * Exemple : const roles = STORY_ROLES; const timeline = calculateStoryTimeline(blocks);
 */
import { getBlockTotalDuration } from './block-model.js';

export const STORY_ROLES = [
  { id: 'intro', label: 'Intro', icon: '🎙️', color: '#8b5cf6', desc: 'Accroche & Présentation' },
  { id: 'interview', label: 'Interview', icon: '💬', color: '#06b6d4', desc: 'Dialogue & Témoignage' },
  { id: 'chronique', label: 'Chronique', icon: '📖', color: '#f59e0b', desc: 'Sujet & Développement' },
  { id: 'virgule', label: 'Virgule', icon: '🎵', color: '#ec4899', desc: 'Respiration & Musique' },
  { id: 'outro', label: 'Outro', icon: '👋', color: '#10b981', desc: 'Conclusion & Générique' },
];

export function getStoryRole(roleId) {
  return STORY_ROLES.find((r) => r.id === roleId) || STORY_ROLES[2];
}

export function inferDefaultRole(index, total) {
  if (index === 0) return 'intro';
  if (total > 1 && index === total - 1) return 'outro';
  return 'chronique';
}

export function calculateStoryTimeline(blocks = []) {
  let currentTime = 0;
  return blocks.map((b) => {
    const dur = getBlockTotalDuration(b);
    const start = currentTime;
    const end = start + dur;
    if (dur > 0) currentTime = end;
    return {
      id: b.id,
      start,
      end,
      duration: dur,
      isTransition: b.type === 'transition',
    };
  });
}
