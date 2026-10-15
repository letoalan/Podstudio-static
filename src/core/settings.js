/**
 * Rôle : métadonnées du podcast (titre, auteur, langue…) persistées dans localStorage.
 * Exemple : saveSettings({ title: 'Mon émission' }); getSettings().title;
 */
export const SETTINGS_KEY = 'podcast_settings';

export const DEFAULT_SETTINGS = Object.freeze({
  title: 'Mon Podcast',
  description: 'Créé avec PodStudio',
  author: '',
  email: '',
  language: 'fr',
  siteUrl: '',
});

const defaultStorage = () => globalThis.localStorage;

export function getSettings(storage = defaultStorage()) {
  try {
    const raw = storage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(patch, storage = defaultStorage()) {
  const merged = { ...getSettings(storage), ...patch };
  storage.setItem(SETTINGS_KEY, JSON.stringify(merged));
  return merged;
}

export function resetSettings(storage = defaultStorage()) {
  storage.removeItem(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS };
}
