import { it, expect, vi } from 'vitest';
import { Mixer } from '../src/audio/mixer.js';

function fakeContext() {
  const nodes = [];
  const ctx = {
    currentTime: 0,
    state: 'running',
    destination: {},
    resume: vi.fn(),
    decodeAudioData: vi.fn(async () => ({ duration: 5 })),
    createGain: () => ({ gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() }),
    createBufferSource: () => {
      const source = { connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn() };
      nodes.push(source);
      return source;
    },
  };
  return { ctx, nodes };
}

const buffer = (duration) => ({ duration });

it('décode et ajoute une piste avec ses valeurs par défaut', async () => {
  const { ctx } = fakeContext();
  const mixer = new Mixer(() => ctx);
  const track = await mixer.addTrack('a', new ArrayBuffer(8), { title: 'Voix' });
  expect(track).toMatchObject({ id: 'a', offset: 0, volume: 1, lane: 0, title: 'Voix' });
  expect(mixer.getTracks()).toHaveLength(1);
});

it('calcule la durée totale avec les décalages', () => {
  const mixer = new Mixer(() => fakeContext().ctx);
  mixer.addBuffer('a', buffer(5));
  mixer.addBuffer('b', buffer(4), { offset: 3 });
  expect(mixer.duration()).toBe(7);
});

it('borne les paramètres modifiables', () => {
  const mixer = new Mixer(() => fakeContext().ctx);
  mixer.addBuffer('a', buffer(5));
  const t = mixer.updateTrack('a', { volume: 9, offset: -4, lane: 7, fadeIn: -1, ignored: 1 });
  expect(t).toMatchObject({ volume: 1, offset: 0, lane: 1, fadeIn: 0 });
  expect(t.ignored).toBeUndefined();
  expect(mixer.updateTrack('absent', {})).toBeNull();
});

it('démarre toutes les sources à leur décalage et refuse de jouer à vide', () => {
  const { ctx, nodes } = fakeContext();
  const mixer = new Mixer(() => ctx);
  expect(mixer.play()).toBe(false);
  mixer.addBuffer('a', buffer(5));
  mixer.addBuffer('b', buffer(5), { offset: 2 });
  expect(mixer.play()).toBe(true);
  expect(nodes[0].start).toHaveBeenCalledWith(0, 0);
  expect(nodes[1].start).toHaveBeenCalledWith(2, 0);
});

it('suit la position, met en pause et reprend', () => {
  const { ctx } = fakeContext();
  const mixer = new Mixer(() => ctx);
  mixer.addBuffer('a', buffer(10));
  mixer.play();
  ctx.currentTime = 4;
  expect(mixer.position()).toBe(4);
  mixer.pause();
  expect(mixer.playing).toBe(false);
  expect(mixer.position()).toBe(4);
  mixer.play();
  expect(mixer.startPos).toBe(4);
});

it('stoppe et revient à zéro ; seek repositionne', () => {
  const { ctx } = fakeContext();
  const mixer = new Mixer(() => ctx);
  mixer.addBuffer('a', buffer(10));
  mixer.play();
  ctx.currentTime = 3;
  mixer.stop();
  expect(mixer.position()).toBe(0);
  mixer.seek(6);
  expect(mixer.position()).toBe(6);
});

it('détecte la fin de lecture', () => {
  const { ctx } = fakeContext();
  const mixer = new Mixer(() => ctx);
  mixer.addBuffer('a', buffer(2));
  mixer.play();
  expect(mixer.isFinished()).toBe(false);
  ctx.currentTime = 2.5;
  expect(mixer.isFinished()).toBe(true);
});

it('supprime une piste et arrête sa source', () => {
  const { ctx, nodes } = fakeContext();
  const mixer = new Mixer(() => ctx);
  mixer.addBuffer('a', buffer(5));
  mixer.play();
  expect(mixer.removeTrack('a')).toBe(true);
  expect(nodes[0].stop).toHaveBeenCalled();
  expect(mixer.removeTrack('a')).toBe(false);
});
