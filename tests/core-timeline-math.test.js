import { it, expect } from 'vitest';
import {
  secondsToPx,
  pxToSeconds,
  clampPps,
  snap,
  formatClock,
  formatHms,
  graduationStep,
  buildTicks,
  timelineDuration,
  laneEnd,
  clipDuration,
  clampTrim,
  MIN_PPS,
  MAX_PPS,
} from '../src/core/timeline-math.js';

it('convertit px <-> secondes dans les deux sens', () => {
  expect(secondsToPx(2.5, 10)).toBe(25);
  expect(pxToSeconds(25, 10)).toBe(2.5);
});

it('borne le zoom', () => {
  expect(clampPps(0)).toBe(MIN_PPS);
  expect(clampPps(9999)).toBe(MAX_PPS);
  expect(clampPps(20)).toBe(20);
});

it('aimante au pas et refuse les valeurs négatives', () => {
  expect(snap(1.26, 0.1)).toBeCloseTo(1.3);
  expect(snap(-3)).toBe(0);
});

it('formate les compteurs', () => {
  expect(formatClock(75)).toBe('1:15');
  expect(formatClock(3725)).toBe('1:02:05');
  expect(formatHms(75)).toBe('00:01:15');
  expect(formatHms(undefined)).toBe('00:00:00');
});

it('choisit un pas de graduation adapté au zoom', () => {
  expect(graduationStep(100)).toBe(1);
  expect(graduationStep(10)).toBe(10);
  expect(graduationStep(2)).toBe(60);
});

it('construit les graduations jusqu\'à la durée', () => {
  const ticks = buildTicks(30, 10);
  expect(ticks.map((t) => t.time)).toEqual([0, 10, 20, 30]);
  expect(ticks[1].label).toBe('0:10');
});

it('calcule la durée totale et la fin de ligne', () => {
  const spans = [
    { offset: 0, duration: 5, lane: 0 },
    { offset: 4, duration: 10, lane: 1 },
  ];
  expect(timelineDuration(spans)).toBe(14);
  expect(laneEnd(spans, 0)).toBe(5);
  expect(laneEnd(spans, 2)).toBe(0);
  expect(timelineDuration([])).toBe(0);
});

it('calcule la durée rognée d\'un clip avec clipDuration', () => {
  expect(clipDuration(null)).toBe(0);
  expect(clipDuration({ buffer: { duration: 10 } })).toBe(10);
  expect(clipDuration({ buffer: { duration: 10 }, trimStart: 3 })).toBe(7);
  expect(clipDuration({ buffer: { duration: 10 }, trimStart: 2, duration: 4 })).toBe(4);
});

it('borne le rognage avec clampTrim', () => {
  const res = clampTrim(10, 2, 5);
  expect(res.trimStart).toBe(2);
  expect(res.duration).toBe(5);
  const overflow = clampTrim(10, 8, 5);
  expect(overflow.trimStart).toBe(8);
  expect(overflow.duration).toBe(2);
});
