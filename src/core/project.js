/**
 * Rôle : schéma, validation et formatage des fichiers de projet JSON de PodStudio.
 * Exemple : const project = createProjectData(settings, tracks); validateProject(project);
 */
export const PROJECT_FORMAT = 'podstudio-project';
export const PROJECT_VERSION = 1;

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

export function createProjectData(settings = {}, tracks = []) {
  return {
    format: PROJECT_FORMAT,
    version: PROJECT_VERSION,
    created: new Date().toISOString(),
    settings: { ...settings },
    tracks: tracks.map((t) => ({
      id: t.id,
      title: t.title || 'Clip',
      offset: Number(t.offset) || 0,
      lane: Number(t.lane) || 0,
      volume: Number(t.volume ?? 1),
      fadeIn: Number(t.fadeIn || 0),
      fadeOut: Number(t.fadeOut || 0),
      trimStart: Number(t.trimStart || 0),
      duration: t.duration != null ? Number(t.duration) : null,
      kind: t.kind || 'record',
      audioData: t.audioData || null,
    })),
  };
}

export function validateProject(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('FORMAT_INVALID');
  if (raw.format !== PROJECT_FORMAT && !Array.isArray(raw.tracks)) {
    throw new Error('NOT_A_PODSTUDIO_PROJECT');
  }
  const tracks = Array.isArray(raw.tracks) ? raw.tracks : [];
  return {
    format: PROJECT_FORMAT,
    version: raw.version || PROJECT_VERSION,
    created: raw.created || new Date().toISOString(),
    settings: raw.settings && typeof raw.settings === 'object' ? raw.settings : {},
    tracks,
  };
}
