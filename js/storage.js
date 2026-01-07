/**
 * Storage Module
 * Handles IndexedDB for large audio files and LocalStorage for metadata.
 */

import * as DB from './db.js';

export async function init() {
    return DB.initDB();
}

/**
 * Save an episode
 * @param {Object} metadata - Episode metadata (title, duration, etc.)
 * @param {Blob} blob - Audio data
 */
export async function saveEpisode(metadata, blob) {
    return DB.saveEpisode(metadata, blob);
}

export async function saveRecording(metadata, blob) {
    return DB.saveRecording(metadata, blob);
}

/**
 * Get all episodes (metadata only ideally, but IDB fetches whole object usually. 
 * For performance with large blobs, we might want to split stores, but keeping it simple for now).
 * Optimization: Use cursor to only fetch lightweight fields if needed, but for < 100 episodes it's fine.
 */
export async function getAllEpisodes() {
    return DB.getAllEpisodes();
}

export async function getAllRecordings() {
    return DB.getAllRecordings();
}

/**
 * Get a single episode by ID
 */
// getEpisode removed as not in DB interface yet, but can be added if needed via generic get
export async function getEpisode(id) {
    // Legacy support or new generic implementation
    // For now we assume getAll is enough or impl generic get
    return null;
}

/**
 * Delete an episode
 */
export async function deleteEpisode(id) {
    return DB.deleteEpisode(id);
}

export async function deleteRecording(id) {
    return DB.deleteRecording(id);
}

/**
 * Clear all data (GDPR)
 */
export async function clearAllData() {
    return DB.clearAllData();
}

export async function updateRecordingTitle(id, title) {
    return DB.updateRecordingTitle(id, title);
}

/**
 * Estimate storage usage
 */
export async function getStorageEstimate() {
    return DB.getStorageEstimate();
}

/**
 * Settings Management (LocalStorage)
 */
const SETTINGS_KEY = 'podcast_settings';

export function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getSettings() {
    const data = localStorage.getItem(SETTINGS_KEY);
    const defaults = {
        title: 'Mon Podcast Statique',
        description: 'Généré avec Podcast Studio',
        author: 'Un Podcasteur',
        email: '',
        language: 'fr',
        category: 'Technology'
    };

    if (!data) return defaults;

    try {
        return { ...defaults, ...JSON.parse(data) };
    } catch (e) {
        console.error('Error parsing settings', e);
        return defaults;
    }
}
