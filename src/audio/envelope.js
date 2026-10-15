/**
 * Rôle : courbe de gain d'une piste (volume + fondus entrée/sortie), partagée par le mixeur et le rendu.
 * Exemple : scheduleEnvelope(gainNode.gain, { volume: 1, fadeIn: 2, fadeOut: 3, duration: 20 }, when);
 */
const EPSILON = 1e-6;

/** Réduit les fondus proportionnellement s'ils dépassent la durée du clip. */
export function clampFades({ fadeIn = 0, fadeOut = 0, duration }) {
  const total = fadeIn + fadeOut;
  if (total <= duration || total <= EPSILON) return { fadeIn, fadeOut };
  const ratio = duration / total;
  return { fadeIn: fadeIn * ratio, fadeOut: fadeOut * ratio };
}

/** Gain (0..volume) à l'instant t (secondes dans le clip). */
export function gainAt(env, t) {
  const { volume = 1, duration } = env;
  const { fadeIn, fadeOut } = clampFades(env);
  const up = fadeIn > 0 ? t / fadeIn : 1;
  const down = fadeOut > 0 ? (duration - t) / fadeOut : 1;
  return volume * Math.max(0, Math.min(1, up, down));
}

/** Points {t, v} (t relatif au début de lecture) à partir de la position `skip` dans le clip. */
export function envelopePoints(env, skip = 0) {
  const { fadeIn, fadeOut } = clampFades(env);
  const marks = [fadeIn, env.duration - fadeOut, env.duration]
    .filter((t) => t > skip + EPSILON && t <= env.duration)
    .sort((a, b) => a - b);
  return [skip, ...marks].map((t) => ({ t: t - skip, v: gainAt(env, t) }));
}

/** Programme la courbe sur un AudioParam ; `when` = instant contexte du début du son. */
export function scheduleEnvelope(param, env, when, skip = 0) {
  const [first, ...rest] = envelopePoints(env, skip);
  param.setValueAtTime(first.v, when);
  for (const point of rest) param.linearRampToValueAtTime(point.v, when + point.t);
}
