import { it, expect, vi } from 'vitest';
import { clampFades, gainAt, envelopePoints, scheduleEnvelope } from '../src/audio/envelope.js';

const env = { volume: 1, fadeIn: 2, fadeOut: 4, duration: 10 };

it('monte linéairement pendant le fondu d\'entrée', () => {
  expect(gainAt(env, 0)).toBe(0);
  expect(gainAt(env, 1)).toBe(0.5);
  expect(gainAt(env, 2)).toBe(1);
});

it('descend pendant le fondu de sortie et respecte le volume', () => {
  expect(gainAt({ ...env, volume: 0.5 }, 5)).toBe(0.5);
  expect(gainAt(env, 8)).toBe(0.5);
  expect(gainAt(env, 10)).toBe(0);
});

it('réduit proportionnellement des fondus trop longs', () => {
  const out = clampFades({ fadeIn: 8, fadeOut: 8, duration: 8 });
  expect(out.fadeIn + out.fadeOut).toBeCloseTo(8);
  expect(out.fadeIn).toBeCloseTo(4);
});

it('produit les points clés depuis le début', () => {
  const points = envelopePoints(env);
  expect(points.map((p) => p.t)).toEqual([0, 2, 6, 10]);
  expect(points.map((p) => p.v)).toEqual([0, 1, 1, 0]);
});

it('reprend au milieu du clip sans rejouer le fondu d\'entrée', () => {
  const points = envelopePoints(env, 5);
  expect(points[0]).toEqual({ t: 0, v: 1 });
  expect(points.map((p) => p.t)).toEqual([0, 1, 5]);
});

it('programme la courbe sur un AudioParam', () => {
  const param = { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() };
  scheduleEnvelope(param, env, 3);
  expect(param.setValueAtTime).toHaveBeenCalledWith(0, 3);
  expect(param.linearRampToValueAtTime).toHaveBeenCalledTimes(3);
  expect(param.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, 13);
});
