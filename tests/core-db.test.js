// @vitest-environment node
import 'fake-indexeddb/auto';
import { it, expect, beforeEach } from 'vitest';
import * as db from '../src/core/db.js';

beforeEach(async () => {
  await db.closeDB();
  await new Promise((resolve) => {
    const req = indexedDB.deleteDatabase(db.DB_NAME);
    req.onsuccess = resolve;
    req.onerror = resolve;
  });
});

it('crée les deux magasins à l\'ouverture', async () => {
  const handle = await db.openDB();
  expect([...handle.objectStoreNames].sort()).toEqual(['episodes', 'recordings']);
  expect(handle.version).toBe(db.DB_VERSION);
});

it('écrit puis relit un élément avec son Blob', async () => {
  const audio = new Blob(['abc'], { type: 'audio/webm' });
  await db.put('recordings', { id: 'r1', created: '2026-01-01', audio });
  const item = await db.get('recordings', 'r1');
  expect(item.id).toBe('r1');
  expect(item.audio.size).toBe(3);
});

it('liste, supprime et vide un magasin', async () => {
  await db.put('episodes', { id: 'a', created: '1' });
  await db.put('episodes', { id: 'b', created: '2' });
  expect(await db.getAll('episodes')).toHaveLength(2);
  await db.remove('episodes', 'a');
  expect((await db.getAll('episodes')).map((e) => e.id)).toEqual(['b']);
  await db.clear('episodes');
  expect(await db.getAll('episodes')).toHaveLength(0);
});

it('retourne undefined pour un identifiant inconnu', async () => {
  expect(await db.get('recordings', 'absent')).toBeUndefined();
});

it('garde les deux magasins indépendants', async () => {
  await db.put('recordings', { id: 'x', created: '1' });
  expect(await db.getAll('episodes')).toHaveLength(0);
});
