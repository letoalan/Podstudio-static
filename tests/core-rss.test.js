import { it, expect } from 'vitest';
import { escapeXml, durationTag, buildItem, generateRss } from '../src/core/rss.js';
import { DEFAULT_SETTINGS } from '../src/core/settings.js';

const settings = { ...DEFAULT_SETTINGS, title: 'Café & Co', siteUrl: 'https://exemple.fr/pod/' };
const episode = {
  id: 'e1',
  title: 'Épisode <1>',
  created: '2026-01-02T03:04:05Z',
  duration: 75,
  audio: { size: 1234 },
};

it('échappe les caractères XML réservés', () => {
  expect(escapeXml(`<a href="x">&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&apos;&lt;/a&gt;');
  expect(escapeXml(null)).toBe('');
});

it('formate la durée numérique et conserve les chaînes héritées', () => {
  expect(durationTag(75)).toBe('00:01:15');
  expect(durationTag('02:10')).toBe('02:10');
  expect(durationTag(undefined)).toBe('00:00:00');
});

it('construit un item avec enclosure absolue', () => {
  const xml = buildItem(episode, settings);
  expect(xml).toContain('<title>Épisode &lt;1&gt;</title>');
  expect(xml).toContain('url="https://exemple.fr/pod/episodes/episode-e1.mp3"');
  expect(xml).toContain('length="1234"');
  expect(xml).toContain('type="audio/mpeg"');
  expect(xml).toContain('<itunes:duration>00:01:15</itunes:duration>');
});

it('génère un canal RSS 2.0 iTunes complet', () => {
  const xml = generateRss([episode], settings, new Date('2026-03-01T00:00:00Z'));
  expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  expect(xml).toContain('xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"');
  expect(xml).toContain('<title>Café &amp; Co</title>');
  expect(xml).toContain('<itunes:owner>');
  expect(xml.match(/<item>/g)).toHaveLength(1);
});

it('produit un XML bien formé même sans épisode', () => {
  const xml = generateRss([], DEFAULT_SETTINGS);
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  expect(doc.querySelector('parsererror')).toBeNull();
  expect(doc.querySelectorAll('item')).toHaveLength(0);
});
