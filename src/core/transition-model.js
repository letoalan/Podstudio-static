/**
 * Rôle : modèle et validation des transitions entre blocs (types, durées, fabrique de bloc transition).
 * Exemple : const t = createTransitionBlock({ transitionType: 'crossfade', duration: 1.5 });
 */
import { generateId } from './block-model.js';

export const TRANSITION_TYPES = [
  { id: 'crossfade', label: 'Fondu enchaîné', icon: '🔀', defaultDuration: 1.5 },
  { id: 'pause', label: 'Silence / Pause', icon: '⏸️', defaultDuration: 1.0 },
  { id: 'whoosh', label: 'Balayage sonore', icon: '💨', defaultDuration: 1.2 },
  { id: 'jingle', label: 'Virgule sonore', icon: '🔔', defaultDuration: 1.5 },
  { id: 'fade', label: 'Fondu au noir', icon: '🌗', defaultDuration: 1.5 },
];

export const DEFAULT_TRANSITION_TYPE = 'crossfade';

export function getTransitionMeta(type) {
  return TRANSITION_TYPES.find((t) => t.id === type) || TRANSITION_TYPES[0];
}

export function normalizeTransition(raw = {}) {
  const meta = getTransitionMeta(raw.type || raw.transitionType);
  const duration = Math.min(10, Math.max(0.2, Number(raw.duration ?? meta.defaultDuration) || meta.defaultDuration));
  return {
    type: meta.id,
    label: meta.label,
    icon: meta.icon,
    duration: Number(duration.toFixed(1)),
  };
}

export function createTransitionBlock(props = {}) {
  const transition = normalizeTransition(props.transition || props);
  return {
    id: props.id || generateId('trans'),
    type: 'transition',
    transition,
    isGhost: Boolean(props.isGhost),
    color: props.color || '#38bdf8',
    tracks: [],
    clips: [],
    edited: false,
    padBefore: 0,
    padAfter: 0,
  };
}

export const isTransitionBlock = (block) => block?.type === 'transition' && Boolean(block?.transition);
