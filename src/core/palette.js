/**
 * Rôle : palettes de couleurs des blocs (8 teintes par défaut), couleur d'un bloc selon son rang et contraste du texte.
 * Exemple : const color = colorForBlock(block, 3, palette, 'cycle'); const ink = textColorFor(color);
 */

export const PALETTE_SIZE = 8;

export const PALETTES = Object.freeze({
  vive: Object.freeze(['#8940fa', '#ff0055', '#22d3a5', '#ffb300', '#3b82f6', '#f97316', '#ec4899', '#84cc16']),
  pastel: Object.freeze(['#c4b5fd', '#fda4af', '#99f6e4', '#fde68a', '#bfdbfe', '#fed7aa', '#fbcfe8', '#d9f99d']),
  contraste: Object.freeze(['#1d4ed8', '#b91c1c', '#047857', '#b45309', '#6d28d9', '#0f766e', '#be185d', '#374151']),
  daltonien: Object.freeze(['#e69f00', '#56b4e9', '#009e73', '#f0e442', '#0072b2', '#d55e00', '#cc79a7', '#000000']),
});

export const DEFAULT_PALETTE_ID = 'vive';
export const DEFAULT_PALETTE = PALETTES[DEFAULT_PALETTE_ID];
export const COLOR_MODES = Object.freeze(['cycle', 'fixed']);

export const isValidHex = (value) => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);

/** Palette valide (couleurs hex en minuscules) ; retombe sur la palette par défaut si vide. */
export function normalizePalette(list) {
  const colors = Array.isArray(list) ? list.filter(isValidHex).map((c) => c.toLowerCase()) : [];
  return colors.length > 0 ? colors : [...DEFAULT_PALETTE];
}

export const normalizeColorMode = (mode) => (COLOR_MODES.includes(mode) ? mode : 'cycle');

/** Couleur stockée d'un bloc : hex, index de palette (entier >= 0) ou null (couleur automatique). */
export function normalizeBlockColor(color) {
  if (isValidHex(color)) return color.toLowerCase();
  if (Number.isInteger(color) && color >= 0) return color;
  return null;
}

/**
 * Couleur affichée d'un bloc de rang `rank` (1 = premier).
 * Une couleur explicite l'emporte ; sinon mode « cycle » = teinte selon le rang, « fixed » = première teinte.
 */
export function colorForBlock(block, rank, palette = DEFAULT_PALETTE, mode = 'cycle') {
  const colors = normalizePalette(palette);
  const own = normalizeBlockColor(block?.color);
  if (typeof own === 'string') return own;
  if (typeof own === 'number') return colors[own % colors.length];
  if (normalizeColorMode(mode) === 'fixed') return colors[0];
  const index = (Math.max(1, Math.floor(rank) || 1) - 1) % colors.length;
  return colors[index];
}

/** Noir ou blanc selon la luminance relative (WCAG) de la couleur de fond. */
export function textColorFor(hex) {
  if (!isValidHex(hex)) return '#ffffff';
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.179 ? '#000000' : '#ffffff';
}
