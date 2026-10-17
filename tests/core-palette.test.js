import { it, expect } from 'vitest';
import {
  PALETTES,
  DEFAULT_PALETTE,
  PALETTE_SIZE,
  isValidHex,
  normalizePalette,
  normalizeColorMode,
  normalizeBlockColor,
  colorForBlock,
  textColorFor,
} from '../src/core/palette.js';

it('fournit des palettes de 8 teintes valides', () => {
  expect(PALETTE_SIZE).toBe(8);
  for (const colors of Object.values(PALETTES)) {
    expect(colors).toHaveLength(8);
    expect(colors.every(isValidHex)).toBe(true);
  }
  expect(DEFAULT_PALETTE).toBe(PALETTES.vive);
});

it('valide les couleurs hexadécimales', () => {
  expect(isValidHex('#A1b2C3')).toBe(true);
  expect(isValidHex('#abc')).toBe(false);
  expect(isValidHex('rouge')).toBe(false);
  expect(isValidHex(null)).toBe(false);
});

it('normalise une palette et retombe sur le défaut si vide', () => {
  expect(normalizePalette(['#FF0000', 'x', '#00ff00'])).toEqual(['#ff0000', '#00ff00']);
  expect(normalizePalette([])).toEqual([...DEFAULT_PALETTE]);
  expect(normalizePalette(undefined)).toEqual([...DEFAULT_PALETTE]);
});

it('normalise le mode et la couleur stockée d\'un bloc', () => {
  expect(normalizeColorMode('fixed')).toBe('fixed');
  expect(normalizeColorMode('autre')).toBe('cycle');
  expect(normalizeBlockColor('#ABCDEF')).toBe('#abcdef');
  expect(normalizeBlockColor(3)).toBe(3);
  expect(normalizeBlockColor(-1)).toBeNull();
  expect(normalizeBlockColor(1.5)).toBeNull();
  expect(normalizeBlockColor('nope')).toBeNull();
});

it('colore un bloc selon son rang en mode cycle', () => {
  const block = { color: null };
  expect(colorForBlock(block, 1)).toBe(DEFAULT_PALETTE[0]);
  expect(colorForBlock(block, 8)).toBe(DEFAULT_PALETTE[7]);
  expect(colorForBlock(block, 9)).toBe(DEFAULT_PALETTE[0]);
  expect(colorForBlock(block, 0)).toBe(DEFAULT_PALETTE[0]);
});

it('respecte une couleur explicite et le mode fixé', () => {
  const palette = ['#111111', '#222222', '#333333'];
  expect(colorForBlock({ color: '#abcdef' }, 5, palette)).toBe('#abcdef');
  expect(colorForBlock({ color: 2 }, 1, palette)).toBe('#333333');
  expect(colorForBlock({ color: 4 }, 1, palette)).toBe('#222222');
  expect(colorForBlock({ color: null }, 7, palette, 'fixed')).toBe('#111111');
  expect(colorForBlock({ color: null }, 5, palette, 'cycle')).toBe('#222222');
});

it('choisit un texte lisible selon le fond', () => {
  expect(textColorFor('#ffffff')).toBe('#000000');
  expect(textColorFor('#000000')).toBe('#ffffff');
  expect(textColorFor('#ffb300')).toBe('#000000');
  expect(textColorFor('#1d4ed8')).toBe('#ffffff');
  expect(textColorFor('invalide')).toBe('#ffffff');
});
