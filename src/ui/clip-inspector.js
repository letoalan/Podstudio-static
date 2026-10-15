/**
 * Rôle : panneau de réglages du clip sélectionné (nom, volume, fondus, début, rognage, copier, couper).
 * Exemple : const inspector = mountInspector(el, { mixer, onRemove, onCopy, onCut }); inspector.show(track);
 */
import { emit } from '../core/bus.js';
import { clipDuration } from '../core/timeline-math.js';
import { h } from './dom.js';

function field(label, input) {
  return h('label', { class: 'inspector-field' }, h('span', {}, label), input);
}

function numberInput(name, step = 0.1) {
  return h('input', { type: 'number', name, min: 0, step, inputmode: 'decimal' });
}

function createInspectorInputs() {
  return {
    title: h('input', { type: 'text', name: 'title', maxlength: 80 }),
    volume: h('input', { type: 'range', name: 'volume', min: 0, max: 100, step: 1 }),
    fadeIn: numberInput('fadeIn'),
    fadeOut: numberInput('fadeOut'),
    offset: numberInput('offset'),
    trimStart: numberInput('trimStart'),
    duration: numberInput('duration'),
  };
}

function populateInputs(inputs, track) {
  inputs.title.value = track.title;
  inputs.volume.value = Math.round(track.volume * 100);
  inputs.fadeIn.value = track.fadeIn;
  inputs.fadeOut.value = track.fadeOut;
  inputs.offset.value = track.offset.toFixed(1);
  inputs.trimStart.value = (track.trimStart || 0).toFixed(1);
  inputs.duration.value = clipDuration(track).toFixed(1);
}

function readFormValues(inputs) {
  return {
    title: inputs.title.value,
    volume: Number(inputs.volume.value) / 100,
    fadeIn: Number(inputs.fadeIn.value),
    fadeOut: Number(inputs.fadeOut.value),
    offset: Number(inputs.offset.value),
    trimStart: Number(inputs.trimStart.value),
    duration: Number(inputs.duration.value),
  };
}

function createInspectorActions(actions) {
  return h('div', { class: 'inspector-actions' },
    h('button', { type: 'button', class: 'btn secondary btn-sm', onClick: actions.copy }, '📋 Copier'),
    h('button', { type: 'button', class: 'btn secondary btn-sm', onClick: actions.cut }, '✂️ Couper'),
    h('button', { type: 'button', class: 'btn secondary btn-sm', onClick: actions.resetTrim }, '↺ Réinitialiser rognage'),
    h('button', { type: 'button', class: 'btn danger-ghost btn-sm', onClick: actions.remove }, 'Supprimer'));
}

export function mountInspector(container, { mixer, onRemove, onCopy, onCut }) {
  const inputs = createInspectorInputs();
  let currentTrack = null;

  const actions = {
    copy: () => currentTrack && onCopy?.(currentTrack),
    cut: () => currentTrack && onCut?.(currentTrack),
    remove: () => currentTrack && onRemove(currentTrack.id),
    resetTrim: () => {
      if (!currentTrack) return;
      mixer.updateTrack(currentTrack.id, { trimStart: 0, duration: currentTrack.buffer.duration });
      emit('timeline:changed');
    },
  };

  const form = h('form', { class: 'inspector-form', onSubmit: (e) => e.preventDefault() },
    field('Nom', inputs.title), field('Volume', inputs.volume), field('Début (s)', inputs.offset),
    field('Rognage début (s)', inputs.trimStart), field('Durée (s)', inputs.duration),
    field('Fondu entrée (s)', inputs.fadeIn), field('Fondu sortie (s)', inputs.fadeOut),
    createInspectorActions(actions));

  const hint = h('p', { class: 'empty-state' }, 'Sélectionnez un clip pour régler son volume, ses fondus et son rognage.');
  container.append(hint, form);
  form.hidden = true;

  form.addEventListener('change', () => {
    if (!currentTrack) return;
    mixer.updateTrack(currentTrack.id, readFormValues(inputs));
    emit('timeline:changed');
  });
  inputs.volume.addEventListener('input', () => currentTrack && mixer.updateTrack(currentTrack.id, { volume: inputs.volume.value / 100 }));

  return {
    show(track) {
      currentTrack = track ?? null;
      form.hidden = !track;
      hint.hidden = Boolean(track);
      if (track) populateInputs(inputs, track);
    },
  };
}
