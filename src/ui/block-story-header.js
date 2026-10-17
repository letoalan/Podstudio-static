/**
 * Rôle : en-tête narratif du bloc (rôle de podcast, titre/sujet du chapitre, timecodes et notes de conducteur).
 * Exemple : const header = renderStoryHeader(block, { timeRange: { start: 0, end: 45 }, onUpdate });
 */
import { h } from './dom.js';
import { formatHms } from '../core/timeline-math.js';
import { STORY_ROLES, getStoryRole } from '../core/story-role.js';
import { classifyBlockContent } from '../core/audio-classifier.js';

export const CORE_NATURES = [
  { type: 'monologue', label: 'Monologue', icon: '🗣️', badge: 'Voix solo / Récit', suggestedRole: 'chronique' },
  { type: 'conversation', label: 'Conversation', icon: '👥', badge: 'Dialogue multi-voix', suggestedRole: 'interview' },
  { type: 'musique', label: 'Musique', icon: '🎵', badge: 'Piste / Fond sonore', suggestedRole: 'virgule' },
  { type: 'ambiance', label: 'Bruitage / SFX', icon: '✨', badge: 'Effet sonore ponctuel', suggestedRole: 'virgule' },
];

export function renderNatureBadge(block, onUpdate) {
  const nature = classifyBlockContent(block);
  const detailStr = nature.details?.reasons?.length ? ` (${nature.details.reasons.join(' • ')})` : '';
  const isSpecial = nature.type === 'pending' || nature.type === 'unknown';
  const badge = h('button', {
    type: 'button',
    class: `block-nature-badge${isSpecial ? ` is-${nature.type}` : ''}`,
    title: `Intelligence audio : ${nature.badge}${detailStr}. Cliquez pour modifier`,
    'aria-label': `Nature : ${nature.label}`,
  }, `${nature.icon} ${nature.label}`);

  badge.addEventListener('click', (e) => {
    e.stopPropagation();
    const currIdx = CORE_NATURES.findIndex((n) => n.type === nature.type);
    const next = CORE_NATURES[currIdx >= 0 ? (currIdx + 1) % CORE_NATURES.length : 0];
    onUpdate?.({ customNature: next, role: next.suggestedRole });
  });
  return badge;
}

export function renderStoryRoleBadge(block, onUpdate) {
  const current = getStoryRole(block.role);
  const badge = h('button', {
    type: 'button',
    class: 'story-role-badge',
    style: `color: ${current.color}; background: ${current.color}1f; border-color: ${current.color}55;`,
    title: 'Changer le rôle narratif',
    'aria-label': `Rôle : ${current.label}`,
  }, `${current.icon} ${current.label}`);

  badge.addEventListener('click', (e) => {
    e.stopPropagation();
    const currIdx = STORY_ROLES.findIndex((r) => r.id === current.id);
    const next = STORY_ROLES[(currIdx + 1) % STORY_ROLES.length];
    onUpdate?.({ role: next.id });
  });
  return badge;
}

export function renderStoryTopicInput(block, onUpdate) {
  const input = h('input', {
    type: 'text',
    class: 'story-topic-input',
    placeholder: 'Sujet ou titre du chapitre…',
    value: block.topic || '',
    'aria-label': 'Sujet du chapitre',
  });
  input.addEventListener('click', (e) => e.stopPropagation());
  input.addEventListener('change', (e) => onUpdate?.({ topic: e.target.value.trim() }));
  return input;
}

export function renderStoryTimecode(timeRange) {
  if (!timeRange) return null;
  const str = `${formatHms(timeRange.start)} → ${formatHms(timeRange.end)}`;
  return h('span', { class: 'story-timecode-badge', title: 'Position dans l\'épisode' }, `⏱ ${str}`);
}

export function renderStoryNotes(block, onUpdate) {
  const hasNotes = Boolean(block.notes?.trim());
  const drawer = h('div', { class: 'story-notes-container' });
  const input = h('textarea', {
    class: `story-notes-input${hasNotes ? '' : ' hidden'}`,
    placeholder: 'Notes de conducteur : repères, questions, mots-clés…',
    rows: '2',
  }, block.notes || '');

  input.addEventListener('click', (e) => e.stopPropagation());
  input.addEventListener('change', (e) => onUpdate?.({ notes: e.target.value }));

  const toggle = h('button', {
    type: 'button',
    class: 'story-notes-toggle',
    title: 'Afficher/masquer les notes de conducteur',
  }, hasNotes ? '📝 Notes de conducteur' : '➕ Ajouter des notes de conducteur');

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    input.classList.toggle('hidden');
    if (!input.classList.contains('hidden')) input.focus();
  });

  drawer.append(toggle, input);
  return drawer;
}
