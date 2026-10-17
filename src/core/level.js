/**
 * Rôle : définition des 3 niveaux d'interface progressive (Simple, Intermédiaire, Avancé) et filtrage des outils visibles.
 * Exemple : if (isToolEnabled(level, 'advancedEditing')) { ... }
 */

export const LEVELS = {
  SIMPLE: 'simple',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
};

export const LEVEL_LABELS = {
  [LEVELS.SIMPLE]: 'Simple',
  [LEVELS.INTERMEDIATE]: 'Intermédiaire',
  [LEVELS.ADVANCED]: 'Avancé',
};

export const LEVEL_TOOLS = {
  [LEVELS.SIMPLE]: new Set([
    'blockList',
    'quickRecord',
    'quickImport',
    'quickTrim',
    'addJingle',
  ]),
  [LEVELS.INTERMEDIATE]: new Set([
    'blockList',
    'quickRecord',
    'quickImport',
    'quickTrim',
    'addJingle',
    'editorAccess',
    'twoTracks',
    'soundLibrary',
    'volumeControls',
    'fadeControls',
    'blockColor',
  ]),
  [LEVELS.ADVANCED]: new Set([
    'blockList',
    'quickRecord',
    'quickImport',
    'quickTrim',
    'addJingle',
    'editorAccess',
    'twoTracks',
    'soundLibrary',
    'volumeControls',
    'fadeControls',
    'blockColor',
    'paletteEditor',
    'unlimitedTracks',
    'advancedEditing',
    'splitTool',
    'clipboardTools',
    'keyboardShortcuts',
    'zoomControls',
    'multiSelect',
  ]),
};

export function validateLevel(level) {
  if (level && Object.values(LEVELS).includes(level)) return level;
  return LEVELS.SIMPLE;
}

export function isToolEnabled(level, toolName) {
  const safeLevel = validateLevel(level);
  return LEVEL_TOOLS[safeLevel].has(toolName);
}

export function getVisibleTools(level) {
  const safeLevel = validateLevel(level);
  return Array.from(LEVEL_TOOLS[safeLevel]);
}

export function suggestLevelUpgrade(currentLevel, block) {
  if (!block) return null;
  const safeLevel = validateLevel(currentLevel);
  const trackCount = block.tracks?.length || 0;
  const clipCount = block.clips?.length || 0;

  if (safeLevel === LEVELS.SIMPLE && (trackCount > 2 || clipCount > 5)) {
    return trackCount > 2 ? LEVELS.ADVANCED : LEVELS.INTERMEDIATE;
  }
  if (safeLevel === LEVELS.INTERMEDIATE && trackCount > 2) {
    return LEVELS.ADVANCED;
  }
  return null;
}
