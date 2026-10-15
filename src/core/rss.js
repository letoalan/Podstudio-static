/**
 * Rôle : génération du flux RSS 2.0 / iTunes à partir des épisodes et des réglages.
 * Exemple : const xml = generateRss(episodes, getSettings());
 */
import { formatHms } from './timeline-math.js';

const ESCAPES = { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' };

export const escapeXml = (value) => String(value ?? '').replace(/[<>&'"]/g, (c) => ESCAPES[c]);

export function durationTag(duration) {
  return typeof duration === 'number' ? formatHms(duration) : String(duration || '00:00:00');
}

function baseUrl(settings) {
  return (settings.siteUrl || 'https://example.org').replace(/\/+$/, '');
}

export function buildItem(episode, settings) {
  const file = `episode-${episode.id}.mp3`;
  const url = `${baseUrl(settings)}/episodes/${file}`;
  const size = episode.audio?.size ?? 0;
  return `  <item>
    <title>${escapeXml(episode.title || 'Épisode sans titre')}</title>
    <description>${escapeXml(episode.title || '')}</description>
    <pubDate>${new Date(episode.created).toUTCString()}</pubDate>
    <guid isPermaLink="false">${escapeXml(episode.id)}</guid>
    <enclosure url="${escapeXml(url)}" length="${size}" type="audio/mpeg" />
    <itunes:duration>${durationTag(episode.duration)}</itunes:duration>
  </item>`;
}

function channelHeader(settings, now) {
  const { title, description, author, email, language } = settings;
  return `  <title>${escapeXml(title)}</title>
  <description>${escapeXml(description)}</description>
  <link>${escapeXml(baseUrl(settings))}</link>
  <language>${escapeXml(language)}</language>
  <copyright>${escapeXml(author)}</copyright>
  <lastBuildDate>${now.toUTCString()}</lastBuildDate>
  <generator>PodStudio</generator>
  <itunes:author>${escapeXml(author)}</itunes:author>
  <itunes:summary>${escapeXml(description)}</itunes:summary>
  <itunes:owner>
    <itunes:name>${escapeXml(author)}</itunes:name>
    <itunes:email>${escapeXml(email)}</itunes:email>
  </itunes:owner>`;
}

export function generateRss(episodes, settings, now = new Date()) {
  const items = episodes.map((episode) => buildItem(episode, settings)).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
<channel>
${channelHeader(settings, now)}
${items}
</channel>
</rss>
`;
}

export const rssBlob = (episodes, settings) =>
  new Blob([generateRss(episodes, settings)], { type: 'application/rss+xml' });
