// @vitest-environment node
import 'fake-indexeddb/auto';
import { it, expect, beforeEach, vi } from 'vitest';
import * as db from '../src/core/db.js';
import * as storage from '../src/core/storage.js';

beforeEach(async () => {
  await db.closeDB();
  await new Promise((resolve) => {
    const req = indexedDB.deleteDatabase(db.DB_NAME);
    req.onsuccess = resolve;
    req.onerror = resolve;
  });
});

it('sauvegarde un enregistrement avec id et date', async () => {
  const rec = await storage.saveRecording({ title: 'Intro', duration: 3 }, new Blob(['x']));
  expect(rec.id).toBeTruthy();
  expect(new Date(rec.created).toString()).not.toBe('Invalid Date');
  expect((await storage.listRecordings())[0].title).toBe('Intro');
});

it('liste du plus récent au plus ancien', async () => {
  await storage.saveRecording({ title: 'ancien', created: '2026-01-01T00:00:00.000Z' }, new Blob(['a']));
  await storage.saveRecording({ title: 'récent', created: '2026-02-01T00:00:00.000Z' }, new Blob(['b']));
  const titles = (await storage.listRecordings()).map((r) => r.title);
  expect(titles).toEqual(['récent', 'ancien']);
});

it('renomme et supprime', async () => {
  const rec = await storage.saveRecording({ title: 'a' }, new Blob(['a']));
  const renamed = await storage.renameRecording(rec.id, 'b');
  expect(renamed.title).toBe('b');
  expect(await storage.renameRecording('inconnu', 'z')).toBeNull();
  await storage.deleteRecording(rec.id);
  expect(await storage.listRecordings()).toHaveLength(0);
});

it('range les épisodes dans leur propre magasin', async () => {
  await storage.saveEpisode({ title: 'ep' }, new Blob(['e']));
  expect(await storage.listEpisodes()).toHaveLength(1);
  expect(await storage.listRecordings()).toHaveLength(0);
});

it('vide tout avec clearAll', async () => {
  await storage.saveRecording({ title: 'r' }, new Blob(['r']));
  await storage.saveEpisode({ title: 'e' }, new Blob(['e']));
  await storage.clearAll();
  expect(await storage.listRecordings()).toHaveLength(0);
  expect(await storage.listEpisodes()).toHaveLength(0);
});

it('estime le quota et signale le dépassement de 80 %', async () => {
  vi.stubGlobal('navigator', { storage: { estimate: async () => ({ usage: 90, quota: 100 }) } });
  const quota = await storage.estimateQuota();
  expect(quota.ratio).toBe(0.9);
  expect(storage.isQuotaCritical(quota.ratio)).toBe(true);
  expect(storage.isQuotaCritical(0.5)).toBe(false);
  vi.unstubAllGlobals();
});

it('retourne un quota nul sans API storage', async () => {
  vi.stubGlobal('navigator', {});
  expect(await storage.estimateQuota()).toEqual({ usage: 0, quota: 0, ratio: 0 });
  vi.unstubAllGlobals();
});
