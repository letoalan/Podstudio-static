import { it, expect, vi } from 'vitest';
import {
  renderStoryRoleBadge,
  renderStoryTopicInput,
  renderStoryTimecode,
  renderStoryNotes,
  renderNatureBadge,
} from '../src/ui/block-story-header.js';

it('renders role badge and cycles to next role on click', () => {
  const onUpdate = vi.fn();
  const badge = renderStoryRoleBadge({ role: 'intro' }, onUpdate);
  expect(badge.textContent).toContain('Intro');
  badge.click();
  expect(onUpdate).toHaveBeenCalledWith({ role: 'interview' });
});

it('renders topic input and triggers onUpdate on change', () => {
  const onUpdate = vi.fn();
  const input = renderStoryTopicInput({ topic: 'Mon sujet' }, onUpdate);
  expect(input.value).toBe('Mon sujet');
  input.value = 'Nouveau sujet';
  input.dispatchEvent(new Event('change'));
  expect(onUpdate).toHaveBeenCalledWith({ topic: 'Nouveau sujet' });
});

it('renders timecode badge formatted with start and end', () => {
  const badge = renderStoryTimecode({ start: 0, end: 75 });
  expect(badge.textContent).toBe('⏱ 00:00:00 → 00:01:15');
  expect(renderStoryTimecode(null)).toBeNull();
});

it('renders host notes toggle and textarea', () => {
  const onUpdate = vi.fn();
  const container = renderStoryNotes({ notes: '' }, onUpdate);
  const toggle = container.querySelector('.story-notes-toggle');
  const textarea = container.querySelector('.story-notes-input');
  expect(textarea.classList.contains('hidden')).toBe(true);
  toggle.click();
  expect(textarea.classList.contains('hidden')).toBe(false);
  textarea.value = 'Points clés';
  textarea.dispatchEvent(new Event('change'));
  expect(onUpdate).toHaveBeenCalledWith({ notes: 'Points clés' });
});

it('renders audio nature badge in pending state when unanalysed', () => {
  const badge = renderNatureBadge({ clips: [{ duration: 15, name: 'Vocal' }] }, vi.fn());
  expect(badge.textContent).toContain('Analyse sonore…');
  expect(badge.classList.contains('is-pending')).toBe(true);
});

it('renders audio nature badge and cycles nature on click', () => {
  const onUpdate = vi.fn();
  const badge = renderNatureBadge({
    clips: [{ duration: 15, name: 'Vocal' }],
    acousticFeatures: { signalClass: 'monologue', estimatedSpeakers: 1 },
  }, onUpdate);
  expect(badge.textContent).toContain('Monologue');
  badge.click();
  expect(onUpdate).toHaveBeenCalled();
  expect(onUpdate.mock.calls[0][0].customNature.type).toBe('conversation');
});

