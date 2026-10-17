import { it, expect, vi } from 'vitest';
import { mountPaletteEditor } from '../src/ui/palette-editor.js';
import { PALETTES } from '../src/core/palette.js';

it('renders preset selector, color swatches and responds to changes', () => {
  const container = document.createElement('div');
  const onChange = vi.fn();
  mountPaletteEditor(container, { settings: {}, onChange });

  const swatches = container.querySelectorAll('.palette-swatch-input');
  expect(swatches).toHaveLength(8);

  const select = container.querySelector('.palette-preset-select');
  expect(select).not.toBeNull();

  select.value = 'pastel';
  select.dispatchEvent(new Event('change'));

  expect(onChange).toHaveBeenCalledTimes(1);
  const updated = onChange.mock.calls[0][0];
  expect(updated.palette).toEqual([...PALETTES.pastel]);
});

it('resets palette to default on reset button click', () => {
  const container = document.createElement('div');
  const onChange = vi.fn();
  mountPaletteEditor(container, {
    settings: { palette: ['#111111', '#222222', '#333333', '#444444', '#555555', '#666666', '#777777', '#888888'] },
    onChange,
  });

  const btnReset = container.querySelector('button');
  expect(btnReset.textContent).toContain('Réinitialiser');
  btnReset.click();

  expect(onChange).toHaveBeenCalled();
  const resetPalette = onChange.mock.calls[0][0].palette;
  expect(resetPalette).toEqual([...PALETTES.vive]);
});
