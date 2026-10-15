import { describe, it, expect, beforeEach } from 'vitest';
import { initRouter, parseHash, VIEWS } from '../src/ui/router.js';
import { emit } from '../src/core/bus.js';

describe('ui/router.js parsing', () => {
  it('parses hash correctly', () => {
    expect(parseHash('')).toBe('guide');
    expect(parseHash('#/studio')).toBe('studio');
    expect(parseHash('#editor')).toBe('editor');
  });
});

describe('ui/router.js navigation', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <nav>
        <button data-nav="guide">Guide</button>
        <button data-nav="studio">Studio</button>
        <button data-nav="editor">Éditeur</button>
      </nav>
      <section data-view-name="guide" class="hidden"></section>
      <section data-view-name="studio" class="hidden"></section>
      <section data-view-name="editor" class="hidden"></section>
    `;
    window.location.hash = '';
  });

  it('initializes router and activates initial view', () => {
    const router = initRouter(document, window);
    expect(router.current()).toBe('guide');
    const guide = document.querySelector('[data-view-name="guide"]');
    expect(guide.classList.contains('hidden')).toBe(false);
  });

  it('switches view via go() and bus event view:go', () => {
    const router = initRouter(document, window);
    router.go('studio');
    expect(router.current()).toBe('studio');
    expect(document.querySelector('[data-view-name="studio"]').classList.contains('hidden')).toBe(false);
    emit('view:go', 'editor');
    expect(router.current()).toBe('editor');
    router.go('unknown');
    expect(router.current()).toBe(VIEWS[0]);
  });
});
