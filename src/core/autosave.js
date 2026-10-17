/**
 * Rôle : sauvegarde différée (autosave) avec temporisation (30 s par défaut) et vidage forcé (flush/beforeunload).
 * Exemple : const auto = createAutosave((data) => saveProject(data), 30000); auto.trigger(project);
 */

function clearTimer(state) {
  if (state.timerId) {
    clearTimeout(state.timerId);
    state.timerId = null;
  }
}

async function flushState(state, saveHandler) {
  clearTimer(state);
  if (state.pendingData !== null && !state.isDisposed) {
    const dataToSave = state.pendingData;
    state.pendingData = null;
    return saveHandler(dataToSave);
  }
  return null;
}

export function createAutosave(saveHandler, delayMs = 30000) {
  const state = { timerId: null, pendingData: null, isDisposed: false };
  const flush = () => flushState(state, saveHandler);

  return {
    trigger: (data) => {
      if (state.isDisposed) return;
      state.pendingData = data;
      clearTimer(state);
      state.timerId = setTimeout(flush, delayMs);
    },
    flush,
    cancel: () => {
      clearTimer(state);
      state.pendingData = null;
    },
    isPending: () => state.pendingData !== null,
    dispose: () => {
      clearTimer(state);
      state.pendingData = null;
      state.isDisposed = true;
    },
  };
}
