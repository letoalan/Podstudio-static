import { it, expect, beforeEach } from 'vitest';
import {
  getSettings,
  saveSettings,
  resetSettings,
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
} from '../src/core/settings.js';

beforeEach(() => localStorage.clear());

it('retourne les valeurs par défaut sans données', () => {
  expect(getSettings()).toEqual(DEFAULT_SETTINGS);
});

it('fusionne une mise à jour partielle avec l\'existant', () => {
  saveSettings({ title: 'Mon émission' });
  saveSettings({ author: 'Alan' });
  const settings = getSettings();
  expect(settings.title).toBe('Mon émission');
  expect(settings.author).toBe('Alan');
  expect(settings.language).toBe('fr');
});

it('ignore un JSON corrompu', () => {
  localStorage.setItem(SETTINGS_KEY, '{pas du json');
  expect(getSettings()).toEqual(DEFAULT_SETTINGS);
});

it('réinitialise les réglages', () => {
  saveSettings({ title: 'x' });
  resetSettings();
  expect(getSettings().title).toBe(DEFAULT_SETTINGS.title);
});

it('reste compatible avec la clé de l\'ancienne version', () => {
  localStorage.setItem('podcast_settings', JSON.stringify({ author: 'Ancien' }));
  expect(getSettings().author).toBe('Ancien');
});
