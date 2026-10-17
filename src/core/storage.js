/**
 * Rôle : façade métier du stockage (enregistrements et épisodes) + estimation du quota.
 * Exemple : const rec = await saveRecording({ title: 'Intro', duration: 12 }, blob);
 */
import * as db from './db.js';

export const QUOTA_WARNING_RATIO = 0.8;

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

async function save(store, metadata, audio) {
  const item = { id: newId(), created: new Date().toISOString(), ...metadata, audio };
  await db.put(store, item);
  return item;
}

async function list(store) {
  const items = await db.getAll(store);
  return items.sort((a, b) => b.created.localeCompare(a.created));
}

async function rename(store, id, title) {
  const item = await db.get(store, id);
  if (!item) return null;
  const updated = { ...item, title };
  await db.put(store, updated);
  return updated;
}

export const saveRecording = (metadata, audio) => save(db.STORES.recordings, metadata, audio);
export const saveEpisode = (metadata, audio) => save(db.STORES.episodes, metadata, audio);
export const listRecordings = () => list(db.STORES.recordings);
export const listEpisodes = () => list(db.STORES.episodes);
export const getRecording = (id) => db.get(db.STORES.recordings, id);
export const renameRecording = (id, title) => rename(db.STORES.recordings, id, title);
export const renameEpisode = (id, title) => rename(db.STORES.episodes, id, title);
export const deleteRecording = (id) => db.remove(db.STORES.recordings, id);
export const deleteEpisode = (id) => db.remove(db.STORES.episodes, id);

export async function updateRecordingAnalysis(id, patch = {}) {
  const item = await db.get(db.STORES.recordings, id);
  if (!item) return null;
  const updated = { ...item, ...patch };
  await db.put(db.STORES.recordings, updated);
  return updated;
}

export async function clearAll() {
  await db.clear(db.STORES.recordings);
  await db.clear(db.STORES.episodes);
}

export async function estimateQuota() {
  const estimate = globalThis.navigator?.storage?.estimate;
  if (!estimate) return { usage: 0, quota: 0, ratio: 0 };
  const { usage = 0, quota = 0 } = await globalThis.navigator.storage.estimate();
  return { usage, quota, ratio: quota > 0 ? usage / quota : 0 };
}

export const isQuotaCritical = (ratio) => ratio >= QUOTA_WARNING_RATIO;
