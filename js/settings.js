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
    const settings = {
        title: getVal('set-title'),
        description: getVal('set-desc'),
        author: getVal('set-author'),
        email: getVal('set-email'),
        language: getVal('set-lang')
    };

    Storage.saveSettings(settings); // Sync save to localStorage

    // Feedback UI
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
function getVal(id) {
    return document.getElementById(id).value;
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
}
