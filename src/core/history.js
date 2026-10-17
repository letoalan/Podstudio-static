/**
 * Rôle : gestion de l'historique annuler/rétablir (undo/redo) immuable avec limite de pile paramétrable.
 * Exemple : let h = pushState(history, state); const res = undo(h, currentState);
 */

function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function createHistory(limit = 50) {
  return {
    past: [],
    future: [],
    limit: Math.max(1, Number(limit) || 50),
  };
}

export function canUndo(history) {
  return Boolean(history?.past?.length);
}

export function canRedo(history) {
  return Boolean(history?.future?.length);
}

export function pushState(history, currentState) {
  const nextPast = [...history.past, clone(currentState)];
  if (nextPast.length > history.limit) {
    nextPast.splice(0, nextPast.length - history.limit);
  }
  return {
    past: nextPast,
    future: [],
    limit: history.limit,
  };
}

export function undo(history, currentState) {
  if (!canUndo(history)) return null;
  const nextPast = [...history.past];
  const previousState = nextPast.pop();
  const nextFuture = [clone(currentState), ...history.future];
  return {
    history: { past: nextPast, future: nextFuture, limit: history.limit },
    state: previousState,
  };
}

export function redo(history, currentState) {
  if (!canRedo(history)) return null;
  const nextFuture = [...history.future];
  const nextState = nextFuture.shift();
  const nextPast = [...history.past, clone(currentState)];
  return {
    history: { past: nextPast, future: nextFuture, limit: history.limit },
    state: nextState,
  };
}

export function clearHistory(history) {
  return {
    past: [],
    future: [],
    limit: history?.limit || 50,
  };
}
