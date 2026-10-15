import * as Storage from './storage.js';

export function generateRSS(episodes) {
    const settings = Storage.getSettings();
    const now = new Date().toUTCString();

    const channelTitle = settings.title || "Mon Podcast Statique";
    const channelDescription = settings.description || "Généré via Podcast Studio Static";
    const channelLink = "https://podcast-studio.example.com"; // TODO: Add to settings?
    const channelLanguage = settings.language || 'fr';
    const channelAuthor = settings.author || 'Podcast Studio';
    const channelEmail = settings.email || '';

    let xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
  <title>${escapeXml(channelTitle)}</title>
  <description>${escapeXml(channelDescription)}</description>
  <link>${channelLink}</link>
  <language>${channelLanguage}</language>
  <copyright>${escapeXml(channelAuthor)}</copyright>
  <lastBuildDate>${now}</lastBuildDate>
  <pubDate>${now}</pubDate>
  <generator>Podcast Studio Static</generator>
  <itunes:author>${escapeXml(channelAuthor)}</itunes:author>
  <itunes:summary>${escapeXml(channelDescription)}</itunes:summary>
  <itunes:owner>
    <itunes:name>${escapeXml(channelAuthor)}</itunes:name>
    <itunes:email>${escapeXml(channelEmail)}</itunes:email>
  </itunes:owner>
`;

    episodes.forEach(ep => {
        const pubDate = new Date(ep.created).toUTCString();
        // Determine extension based on mimeType
        const ext = ep.mimeType === 'audio/mp3' ? 'mp3' : 'webm';
        const fileName = `episode-${ep.id}.${ext}`;

        xml += `
  <item>
    <title>${escapeXml(ep.title || 'Épisode sans titre')}</title>
    <description>Durée: ${ep.duration}</description>
    <pubDate>${pubDate}</pubDate>
    <guid isPermaLink="false">${ep.id}</guid>
    <enclosure url="http://localhost/${fileName}" length="${ep.audio.size}" type="${ep.audio.type}" />
    <itunes:duration>${ep.duration}</itunes:duration>
  </item>
`;
    });

    xml += `
</channel>
</rss>`;

    return new Blob([xml], { type: 'application/xml' });
}

function escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}
