/**
 * Rôle : éditeur visuel de palette de couleurs (presets, mode cycle ou fixe, sélecteurs natifs).
 * Exemple : mountPaletteEditor(container, { settings, onChange });
 */
import { h } from './dom.js';
import {
  PALETTES,
  DEFAULT_PALETTE,
  DEFAULT_PALETTE_ID,
  normalizePalette,
  normalizeColorMode,
} from '../core/palette.js';

function renderPresetSelector(currentPalette, onSelect) {
  const select = h('select', { class: 'form-control palette-preset-select' });
  const presets = [
    { id: 'vive', label: 'Vive (Défaut)' },
    { id: 'pastel', label: 'Pastel' },
    { id: 'contraste', label: 'Contraste élevé' },
    { id: 'daltonien', label: 'Daltonien (Okabe-Ito)' },
  ];
  presets.forEach(({ id, label }) => {
    select.append(h('option', { value: id }, label));
  });
  select.value = DEFAULT_PALETTE_ID;
  select.addEventListener('change', () => onSelect([...PALETTES[select.value]]));
  return h('div', { class: 'form-group' }, h('label', {}, 'Préréglage de palette'), select);
}

function renderModeSelector(currentMode, onSelect) {
  const select = h('select', { class: 'form-control palette-mode-select' },
    h('option', { value: 'cycle' }, 'Cycle (selon le numéro du bloc)'),
    h('option', { value: 'fixed' }, 'Fixe (première teinte par défaut)'));
  select.value = normalizeColorMode(currentMode);
  select.addEventListener('change', () => onSelect(select.value));
  return h('div', { class: 'form-group' }, h('label', {}, 'Attribution des couleurs'), select);
}

function renderColorSwatches(palette, onUpdateColor) {
  const grid = h('div', { class: 'palette-swatches-grid' });
  palette.forEach((color, index) => {
    const input = h('input', {
      type: 'color',
      class: 'palette-swatch-input',
      value: color,
      'aria-label': `Teinte ${index + 1}`,
      title: `Teinte ${index + 1} (${color})`,
    });
    input.addEventListener('change', (e) => onUpdateColor(index, e.target.value));
    const label = h('label', { class: 'palette-swatch-badge', style: `background:${color}` }, input);
    grid.append(label);
  });
  return grid;
}

export function mountPaletteEditor(container, { settings = {}, onChange }) {
  container.innerHTML = '';
  let palette = normalizePalette(settings.palette);
  let colorMode = normalizeColorMode(settings.colorMode);

  const notify = () => onChange?.({ palette: [...palette], colorMode });

  const swatchesContainer = h('div', { class: 'palette-swatches-container' });
  const refreshSwatches = () => {
    swatchesContainer.innerHTML = '';
    swatchesContainer.append(renderColorSwatches(palette, (index, newColor) => {
      palette[index] = newColor;
      notify();
    }));
  };

  const presetRow = renderPresetSelector(palette, (newPalette) => {
    palette = newPalette;
    refreshSwatches();
    notify();
  });

  const modeRow = renderModeSelector(colorMode, (newMode) => {
    colorMode = newMode;
    notify();
  });

  const btnReset = h('button', { type: 'button', class: 'btn secondary btn-sm' }, 'Réinitialiser la palette');
  btnReset.addEventListener('click', () => {
    palette = [...DEFAULT_PALETTE];
    refreshSwatches();
    notify();
  });

  refreshSwatches();
  container.append(h('div', { class: 'palette-editor' }, presetRow, modeRow, swatchesContainer, btnReset));
}
