import { describe, it, expect, vi } from 'vitest';
import { h, clear, downloadBlob, makeUrl } from '../src/ui/dom.js';

describe('ui/dom.js', () => {
  it('creates elements with attributes and classes', () => {
    const el = h('button', { class: 'btn primary', 'aria-label': 'Play' }, 'Jouer');
    expect(el.tagName).toBe('BUTTON');
    expect(el.className).toBe('btn primary');
    expect(el.getAttribute('aria-label')).toBe('Play');
    expect(el.textContent).toBe('Jouer');
  });

  it('attaches event listeners via on* attributes', () => {
    const spy = vi.fn();
    const el = h('button', { onClick: spy });
    el.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('handles dataset, styles, and nested children', () => {
    const el = h('div', {
      dataset: { role: 'clip' },
      style: { color: 'red' },
    }, h('span', {}, 'Child'));
    expect(el.dataset.role).toBe('clip');
    expect(el.style.color).toBe('red');
    expect(el.querySelector('span')?.textContent).toBe('Child');
  });

  it('clears all children with clear()', () => {
    const el = h('div', {}, h('p', {}, '1'), h('p', {}, '2'));
    expect(el.children.length).toBe(2);
    clear(el);
    expect(el.children.length).toBe(0);
  });

  it('creates object url with makeUrl and handles downloadBlob', () => {
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    globalThis.URL.revokeObjectURL = vi.fn();
    const blob = new Blob(['test'], { type: 'text/plain' });
    expect(makeUrl(blob)).toBe('blob:mock-url');
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    downloadBlob(blob, 'test.txt');
    expect(globalThis.URL.createObjectURL).toHaveBeenCalledWith(blob);
    clickSpy.mockRestore();
  });
});
