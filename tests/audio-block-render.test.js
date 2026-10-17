import { it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderBlock, renderProject } from '../src/audio/block-render.js';
import { createBlock, createClip } from '../src/core/block-model.js';
import { createProject, addBlock } from '../src/core/project.js';

let fake;

function setupFakeOffline() {
  const instances = [];
  class FakeOfflineContext {
    constructor(channels, length, rate) {
      this.channels = channels;
      this.length = length;
      this.rate = rate;
      this.destination = {};
      this.sources = [];
      instances.push(this);
    }
    createGain() {
      return { gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() }, connect: vi.fn() };
    }
    createBufferSource() {
      const src = { connect: vi.fn(), start: vi.fn() };
      this.sources.push(src);
      return src;
    }
    async startRendering() {
      const chData = new Float32Array(this.length);
      return {
        numberOfChannels: this.channels,
        length: this.length,
        sampleRate: this.rate,
        getChannelData: () => chData,
      };
    }
  }
  return { FakeOfflineContext, instances };
}

beforeEach(() => {
  fake = setupFakeOffline();
  window.OfflineAudioContext = fake.FakeOfflineContext;
});

afterEach(() => {
  delete window.OfflineAudioContext;
});

it('renders a block scheduling its clips at proper offset with padding', async () => {
  const block = createBlock({
    padBefore: 1,
    tracks: [{ id: 't1', volume: 1 }],
    clips: [createClip({ trackId: 't1', sourceId: 's1', start: 2, duration: 3 })],
  });
  const buffers = new Map([['s1', { duration: 5 }]]);

  const rendered = await renderBlock(block, buffers);
  expect(rendered).toBeDefined();
  expect(fake.instances).toHaveLength(1);
  expect(fake.instances[0].sources[0].start).toHaveBeenCalledWith(3, 0, 3);
});

it('renders all blocks in a project and concatenates them', async () => {
  let p = createProject();
  p = addBlock(p, createBlock({
    tracks: [{ id: 't1', volume: 1 }],
    clips: [createClip({ trackId: 't1', sourceId: 's1', start: 0, duration: 2 })],
  }));
  p = addBlock(p, createBlock({
    tracks: [{ id: 't1', volume: 1 }],
    clips: [createClip({ trackId: 't1', sourceId: 's2', start: 0, duration: 3 })],
  }));
  const buffers = new Map([['s1', { duration: 2 }], ['s2', { duration: 3 }]]);

  const fullBuffer = await renderProject(p, buffers);
  expect(fullBuffer).toBeDefined();
  expect(fake.instances).toHaveLength(2);
});
