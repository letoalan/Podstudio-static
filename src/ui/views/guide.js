/**
 * Rôle : vue Guide (onboarding en 4 étapes) avec raccourci vers le Studio.
 * Exemple : mountGuide(document.getElementById('view-guide'));
 */
import { emit } from '../../core/bus.js';
import { h } from '../dom.js';

export const STEPS = [
  { title: 'Enregistrez vos voix', text: 'Ouvrez le Studio et appuyez sur le gros bouton rouge. Vous pouvez mettre en pause ou arrêter à tout moment.' },
  { title: 'Gérez votre bibliothèque', text: 'Importez des fichiers .mp3 ou .wav. Enregistrements et imports se trouvent dans la Bibliothèque : renommez-les ou supprimez-les.' },
  { title: 'Montez votre épisode', text: 'Dans l\'Éditeur, glissez vos clips sur la timeline, placez voix et musique sur leurs lignes, réglez volume et fondus.' },
  { title: 'Exportez et partagez', text: 'Renseignez les Paramètres, puis cliquez sur Exporter. Le MP3 est dans Épisodes, avec le flux RSS prêt à publier.' },
];

function stepCard(step, index) {
  return h('article', { class: 'guide-card' },
    h('div', { class: 'guide-number', 'aria-hidden': 'true' }, index + 1),
    h('div', { class: 'guide-content' }, h('h3', {}, step.title), h('p', {}, step.text)));
}

export function mountGuide(container) {
  const cta = h('button', {
    type: 'button', class: 'btn primary', id: 'guide-cta-record', onClick: () => emit('view:go', 'studio'),
  }, 'Aller au Studio →');
  container.append(
    h('div', { class: 'section-header' }, h('h2', {}, 'Comment débuter ?'), cta),
    h('div', { class: 'guide-grid' }, STEPS.map(stepCard)),
    h('p', { class: 'guide-footer' }, 'Tout est stocké localement dans votre navigateur : pensez à exporter vos mixages finaux.'));
}
