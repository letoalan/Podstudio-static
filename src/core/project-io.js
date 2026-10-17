/**
 * Rôle : sérialisation, validation et migration des fichiers de projet PodStudio (v3 : blocs numérotés, palette).
 * Exemple : const json = serializeProject(project); const loaded = deserializeProject(json);
 */
import { createBlock, validateBlock, generateId } from './block-model.js';
import { normalizePalette, normalizeColorMode } from './palette.js';

export const PROJECT_FORMAT = 'podstudio-project';
export const PROJECT_VERSION = 3;

export function sanitizeFileName(name = 'projet') {
  const clean = String(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const date = new Date().toISOString().slice(0, 10);
  return `podstudio-${clean || 'projet'}-${date}.json`;
}

const legacyTracks = () => [1, 2].map((n) => ({ id: `track-${n}`, name: `Piste ${n}`, volume: 1, muted: false, solo: false }));

/** Ancien format v1 (liste de pistes à plat) : un seul bloc contenant tous les clips. */
function migrateLegacyTracksToBlocks(tracks = []) {
  if (!tracks.length) return [];
  const clips = tracks.map((t, idx) => ({
    id: t.id || generateId('clip'),
    trackId: `track-${(Number(t.lane) || 0) % 2 + 1}`,
    sourceId: t.id || `src-${idx}`,
    start: Number(t.offset) || 0,
    offset: Number(t.trimStart) || 0,
    duration: Number(t.duration) || 0,
    gain: Number(t.volume ?? 1),
    fadeIn: Number(t.fadeIn || 0),
    fadeOut: Number(t.fadeOut || 0),
    name: t.title || `Clip ${idx + 1}`,
  }));
  return [createBlock({ tracks: legacyTracks(), clips, edited: true })];
}

/** Réglages de projet : palette (8 teintes par défaut) et mode de couleur toujours valides. */
function normalizeSettings(settings) {
  const base = settings && typeof settings === 'object' ? settings : {};
  return { ...base, palette: normalizePalette(base.palette), colorMode: normalizeColorMode(base.colorMode) };
}

export function validateProjectData(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('FORMAT_INVALID');
  if (raw.format !== PROJECT_FORMAT && !Array.isArray(raw.blocks) && !Array.isArray(raw.tracks)) {
    throw new Error('NOT_A_PODSTUDIO_PROJECT');
  }
  // v2 : les titres / types de blocs sont ignorés par validateBlock ; la numérotation vient de la position.
  const blocks = Array.isArray(raw.blocks)
    ? raw.blocks.map(validateBlock)
    : migrateLegacyTracksToBlocks(raw.tracks);
  return {
    format: PROJECT_FORMAT,
    version: PROJECT_VERSION,
    id: raw.id || generateId('proj'),
    title: String(raw.title || raw.settings?.title || 'Projet sans titre'),
    created: raw.created || new Date().toISOString(),
    updated: raw.updated || new Date().toISOString(),
    settings: normalizeSettings(raw.settings),
    blocks,
  };
}

export function serializeProject(project) {
  return JSON.stringify({
    format: PROJECT_FORMAT,
    version: PROJECT_VERSION,
    id: project.id,
    title: project.title,
    created: project.created || new Date().toISOString(),
    updated: new Date().toISOString(),
    settings: normalizeSettings(project.settings),
    blocks: project.blocks || [],
  }, null, 2);
}

export function deserializeProject(rawJsonOrObj) {
  const data = typeof rawJsonOrObj === 'string' ? JSON.parse(rawJsonOrObj) : rawJsonOrObj;
  return validateProjectData(data);
}

// Compatibilité descendante
export function createProjectData(settings = {}, items = []) {
  const isBlocks = items.length > 0 && ('tracks' in items[0] || 'clips' in items[0]);
  const blocks = isBlocks ? items : migrateLegacyTracksToBlocks(items);
  return {
    format: PROJECT_FORMAT,
    version: PROJECT_VERSION,
    created: new Date().toISOString(),
    settings: normalizeSettings(settings),
    blocks,
    tracks: items,
  };
}

export function validateProject(raw) {
  const validated = validateProjectData(raw);
  return { ...validated, tracks: raw?.tracks || [] };
}
