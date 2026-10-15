/**
 * Rôle : mathématiques pures de la timeline (px <-> secondes, graduations, durées, pistes).
 * Exemple : secondsToPx(2.5, 10) // 25
 */
export const DEFAULT_PPS = 10;
export const MIN_PPS = 2;
export const MAX_PPS = 200;
export const LANES = Object.freeze(['Voix', 'Musique']);

const STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1800];
const MIN_LABEL_SPACING_PX = 64;

export const secondsToPx = (seconds, pps) => seconds * pps;
export const pxToSeconds = (px, pps) => px / pps;
export const clampPps = (pps) => Math.min(MAX_PPS, Math.max(MIN_PPS, pps));

export function snap(seconds, step = 0.1) {
  return Math.max(0, Math.round(seconds / step) * step);
}

const pad = (n) => String(Math.floor(n)).padStart(2, '0');

/** Format compteur court : "m:ss" ou "h:mm:ss". */
export function formatClock(seconds) {
  const total = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Format HH:MM:SS (chronomètre, balise itunes:duration). */
export function formatHms(seconds) {
  const total = Math.max(0, Math.floor(seconds || 0));
  return `${pad(total / 3600)}:${pad((total % 3600) / 60)}:${pad(total % 60)}`;
}

export function graduationStep(pps) {
  return STEPS.find((step) => step * pps >= MIN_LABEL_SPACING_PX) ?? STEPS.at(-1);
}

export function buildTicks(duration, pps) {
  const step = graduationStep(pps);
  const ticks = [];
  for (let time = 0; time <= duration; time += step) {
    ticks.push({ time, label: formatClock(time), major: true });
  }
  return ticks;
}

/** Durée totale d'une liste de pistes {offset, duration}. */
export function timelineDuration(spans) {
  return spans.reduce((max, s) => Math.max(max, s.offset + s.duration), 0);
}

/** Fin de la dernière piste d'une ligne ; 0 si la ligne est vide. */
export function laneEnd(spans, lane) {
  return timelineDuration(spans.filter((s) => s.lane === lane));
}

/** Durée effective d'un clip en tenant compte du rognage (trimStart et duration). */
export function clipDuration(track) {
  if (!track) return 0;
  const rawDur = track.buffer?.duration ?? 0;
  const start = Math.max(0, track.trimStart || 0);
  const max = Math.max(0, rawDur - start);
  if (track.duration != null && track.duration > 0) return Math.min(track.duration, max);
  return max;
}

/** Ajuste et borne les valeurs de rognage pour un clip. */
export function clampTrim(rawDur, trimStart = 0, duration = null) {
  const start = Math.max(0, Math.min(rawDur, Number(trimStart) || 0));
  const maxDur = Math.max(0, rawDur - start);
  const dur = duration == null ? maxDur : Math.max(0.1, Math.min(maxDur, Number(duration) || 0));
  return { trimStart: snap(start), duration: snap(dur) };
}
