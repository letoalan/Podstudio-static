import { it, expect } from 'vitest';
import {
  computeSilenceRatio,
  computeRmsStats,
  computeAcousticFeatures,
} from '../src/core/audio-dsp.js';

it('computes silence ratio correctly for silent and active buffers', () => {
  const silent = new Float32Array(1000).fill(0.001);
  expect(computeSilenceRatio(silent)).toBe(1);

  const loud = new Float32Array(1000).fill(0.8);
  expect(computeSilenceRatio(loud)).toBe(0);

  expect(computeSilenceRatio(null)).toBe(0);
});

it('computes RMS stats (mean and std) across windows', () => {
  const constant = new Float32Array(320).fill(0.5);
  const stats = computeRmsStats(constant, 16);
  expect(stats.mean).toBeCloseTo(0.5, 2);
  expect(stats.std).toBeCloseTo(0, 4);
});

it('detects musique acoustic profile when silence is low and RMS is steady', () => {
  // Continuous wave: low silence, steady RMS
  const musicSamples = new Float32Array(4000);
  for (let i = 0; i < musicSamples.length; i++) {
    musicSamples[i] = 0.4 * Math.sin(i * 0.1);
  }
  const features = computeAcousticFeatures(musicSamples, 30);
  expect(features.silenceRatio).toBeLessThan(0.12);
  expect(features.signalClass).toBe('musique');
  expect(features.dominantClass).toBe('music');
  expect(features.estimatedSpeakers).toBe(1);
});

it('detects jingle acoustic profile for short continuous music', () => {
  const jingleSamples = new Float32Array(4000);
  for (let i = 0; i < jingleSamples.length; i++) {
    jingleSamples[i] = 0.35 * Math.sin(i * 0.15);
  }
  const features = computeAcousticFeatures(jingleSamples, 10);
  expect(features.dominantClass).toBe('music');
  expect(features.signalClass).toBe('jingle');
});


it('detects ambiance/sfx profile when duration is very short', () => {
  const shortSamples = new Float32Array(1000).fill(0.2);
  const features = computeAcousticFeatures(shortSamples, 3);
  expect(features.signalClass).toBe('ambiance');
});

it('detects monologue profile for single speaker with uniform bursts', () => {
  // Speech with pauses: bursts of active voice separated by silence
  const samples = new Float32Array(8000);
  for (let b = 0; b < 4; b++) {
    const start = b * 2000;
    for (let i = 0; i < 1200; i++) {
      // Uniform voice pitch
      samples[start + i] = 0.3 * Math.sin(i * 0.05);
    }
  }
  const features = computeAcousticFeatures(samples, 15);
  expect(features.burstCount).toBeGreaterThanOrEqual(2);
  expect(features.estimatedSpeakers).toBe(1);
  expect(features.signalClass).toBe('monologue');
});

it('detects conversation profile for alternating speakers with distinct timbres', () => {
  const samples = new Float32Array(8000);
  // Speaker 1: low pitch (0.02)
  for (let i = 0; i < 1500; i++) samples[i] = 0.3 * Math.sin(i * 0.02);
  // Pause
  // Speaker 2: high pitch (0.35)
  for (let i = 2500; i < 4000; i++) samples[i] = 0.4 * Math.sin(i * 0.35);
  // Pause
  // Speaker 1: low pitch again
  for (let i = 5000; i < 6500; i++) samples[i] = 0.3 * Math.sin(i * 0.02);

  const features = computeAcousticFeatures(samples, 20);
  expect(features.burstCount).toBeGreaterThanOrEqual(3);
  expect(features.estimatedSpeakers).toBe(2);
  expect(features.signalClass).toBe('conversation');
});
