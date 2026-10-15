import { it, expect } from 'vitest';
import { formatBytes, formatDateTime } from '../src/core/format.js';

it('formate les octets en unités lisibles', () => {
  expect(formatBytes(0)).toBe('0 o');
  expect(formatBytes(512)).toBe('512 o');
  expect(formatBytes(1536)).toBe('1,5 Ko');
  expect(formatBytes(5 * 1024 * 1024)).toBe('5,0 Mo');
});

it('gère les valeurs invalides', () => {
  expect(formatBytes(NaN)).toBe('0 o');
  expect(formatBytes(-4)).toBe('0 o');
});

it('formate une date valide et ignore une date invalide', () => {
  expect(formatDateTime('2026-01-15T10:30:00Z')).toMatch(/2026/);
  expect(formatDateTime('pas une date')).toBe('');
});
