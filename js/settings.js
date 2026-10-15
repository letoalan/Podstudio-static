/**
 * Settings Module
 * Handles form interactions for Podcast metadata
 */

import * as Storage from './storage.js';

export function init() {
    loadSettingsIntoForm();
    setupEventListeners();
}

function loadSettingsIntoForm() {
    const settings = Storage.getSettings();

    setVal('set-title', settings.title);
    setVal('set-desc', settings.description);
    setVal('set-author', settings.author);
    setVal('set-email', settings.email);
    setVal('set-lang', settings.language);
}

function setupEventListeners() {
    const form = document.getElementById('settings-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            saveFormSettings();
        });
    }
}

function saveFormSettings() {
    const current = Storage.getSettings();
    const settings = {
        ...current,
        title: getVal('set-title', current.title),
        description: getVal('set-desc', current.description),
        author: getVal('set-author', current.author),
        email: getVal('set-email', current.email),
        language: getVal('set-lang', current.language)
    };

    Storage.saveSettings(settings); // Sync save to localStorage

    // Feedback UI sur le bouton
    const btnSave = document.getElementById('btn-save-settings');
    if (btnSave) {
        const originalText = btnSave.textContent;
        btnSave.textContent = '✓ Sauvegardé !';
        btnSave.disabled = true;
        setTimeout(() => {
            btnSave.textContent = originalText;
            btnSave.disabled = false;
        }, 1500);
    }

    const status = document.getElementById('save-status');
    if (status) {
        status.textContent = 'Sauvegardé !';
        status.style.opacity = '1';
        setTimeout(() => {
            status.style.opacity = '0';
        }, 2000);
    }
}

// Helpers
function getVal(id, fallback = '') {
    const el = document.getElementById(id);
    return el ? el.value : fallback;
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
}
