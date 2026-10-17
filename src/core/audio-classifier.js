/**
 * Rôle : reconnaissance intelligente des types de sons (monologue, conversation, musique/jingle, ambiance, bruitage, analyse).
 * Exemple : const nature = classifyBlockContent(block);
 */
import { isBlockEmpty, getBlockTotalDuration } from './block-model.js';

export const CLASSIFIER_VERSION = '2.3.0';

const JINGLE_REGEX = /jingle|virgule|stinger|bumper|g[eé]n[eé]rique|ident|chime|carillon|indicatif|sonnerie|accroche|signature[\s_-]?sonore|sound[\s_-]?logo|(^|[\s._-])(intro|outro|th[eè]me)([\s._-]|$)/i;
const MUSIC_REGEX = /music|musique|beat|synth|m[eé]lodie|loop|instrumental|sample|soundtrack|song|chanson|piano|guitar|guitare|drum|batterie|bass|basse|riff|orchestr[ea]|accord|nappe|(\bost\b|\bbed\b|\bbgm\b)/i;
const CONV_REGEX = /interview|itw|dialogue|dialog|conversation|d[eé]bat|discussion|host|guest|invit[eé]|cohost|co-animateur|animateur|interlocuteur|intervenant|[eé]change|table[\s_-]?ronde|micro[\s_-]?[12]|mic[\s_-]?[12]|question|r[eé]ponse|q&a|faq|duo|trio|entretien|talk|show|r[eé]union|rdv|rendez[\s_-]?vous|(\bspk\b|\bspeaker\b)/i;
const MONO_REGEX = /monologue|solo|chronique|r[eé]cit|narration|voix[\s_-]?off|voiceover|voix[\s_-]?solo|edito|[eé]dito|journal|billet|pr[eé]sentation|lecture|conf[eé]rence|tribune|debrief|humeur|seul/i;
const SFX_REGEX = /sfx|bruit|effet|applause|applaudissement|ding|foley|whoosh|sweep|clic|laser|explosion|pop|rire|(\bbip\b)/i;
const AMBIANCE_REGEX = /ambiance|atmosphere|room|pluie|rain|café|cafe|nature|city|ville|rue|street|foule|crowd|vent|wind/i;

function countActiveTracks(block) {
  return new Set(block.clips.map((c) => c.trackId).filter(Boolean)).size;
}

function countDistinctSources(block) {
  return new Set(block.clips.map((c) => c.sourceId || c.name).filter(Boolean)).size;
}

function hasClipsOverlap(block) {
  if (block.clips.length < 2) return false;
  const sorted = [...block.clips].sort((a, b) => (a.start || 0) - (b.start || 0));
  for (let i = 0; i < sorted.length - 1; i++) {
    const end = (sorted[i].start || 0) + (sorted[i].duration || 0);
    if ((sorted[i + 1].start || 0) < end - 0.1) return true;
  }
  return false;
}

function detectTurnTaking(block) {
  if (block.clips.length < 2) return false;
  const sorted = [...block.clips].sort((a, b) => (a.start || 0) - (b.start || 0));
  let alternations = 0;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const diffTrack = prev.trackId && curr.trackId && prev.trackId !== curr.trackId;
    const diffSource = prev.sourceId && curr.sourceId && prev.sourceId !== curr.sourceId;
    const diffName = prev.name && curr.name && prev.name !== curr.name;
    if (diffTrack || diffSource || diffName) alternations++;
  }
  return alternations >= 1;
}

function matchesKeywords(block, regex) {
  return block.clips.some((c) => regex.test(c.name || '') || regex.test(block.topic || ''));
}

function isJingleOrMusic(block, dur, acoustic) {
  const isJingleKeyword = matchesKeywords(block, JINGLE_REGEX);
  const isMusicKeyword = matchesKeywords(block, MUSIC_REGEX);
  const isPresetJingle = block.clips.some((c) => c.sourceId === 'preset-jingle');
  const isAcousticMusic = acoustic?.dominantClass === 'music' ||
                          acoustic?.signalClass === 'musique' ||
                          acoustic?.signalClass === 'jingle' ||
                          (acoustic && acoustic.silenceRatio < 0.18 && (acoustic.lfr < 0.30 || acoustic.rmsStd < 0.10));

  if (isJingleKeyword || isPresetJingle || (isAcousticMusic && dur <= 20) || acoustic?.signalClass === 'jingle') {
    return { match: true, label: 'Jingle / Virgule', icon: '🔔', badge: 'Jingle / Virgule sonore' };
  }
  if (isMusicKeyword || isAcousticMusic) {
    return { match: true, label: 'Musique', icon: '🎵', badge: 'Piste / Fond sonore' };
  }
  return { match: false };
}

export function evaluateSpeechDialogue(block, acoustic) {
  if (acoustic?.dominantClass === 'music' || acoustic?.signalClass === 'musique' || acoustic?.signalClass === 'jingle') {
    return { isConversation: false, isMonologue: false, convScore: 0, monoScore: 0, reasons: ['Signal musical'], speakerEstimate: 1 };
  }
  const reasons = [];
  let conv = 0;
  let mono = 0;

  const tracks = countActiveTracks(block);
  if (tracks >= 2) { conv += 50; reasons.push(`${tracks} pistes actives (multi-voix)`); }
  if (hasClipsOverlap(block)) { conv += 40; reasons.push('Chevauchement vocal / cross-talk'); }
  if (detectTurnTaking(block)) { conv += 35; reasons.push('Alternance de répliques'); }
  if (countDistinctSources(block) >= 2) { conv += 30; reasons.push('Prises de son multiples'); }
  if (acoustic?.signalClass === 'conversation' || (acoustic?.estimatedSpeakers || 1) >= 2) {
    conv += 45;
    reasons.push('Diarisation acoustique : multiples locuteurs');
  }

  if (matchesKeywords(block, CONV_REGEX)) { conv += 35; reasons.push('Indice lexical conversation'); }
  if (matchesKeywords(block, MONO_REGEX)) { mono += 35; reasons.push('Indice lexical monologue'); }

  if (acoustic?.signalClass === 'monologue') {
    mono += 35;
    reasons.push('Profil spectral homogène : voix unique');
  }
  if (block.clips.length === 1 && tracks <= 1 && acoustic?.estimatedSpeakers === 1) {
    mono += 25;
  }

  const isConversation = conv >= 35 && conv > mono;
  const isMonologue = mono >= 30 && mono > conv;
  return {
    isConversation, isMonologue, convScore: conv, monoScore: mono,
    reasons, speakerEstimate: isConversation ? Math.max(2, tracks) : 1,
  };
}

export function classifyBlockContent(block) {
  if (isBlockEmpty(block)) {
    return { type: 'empty', label: 'Vide', icon: '⚪', badge: 'En attente de son', suggestedRole: 'intro' };
  }
  if (block.customNature) return block.customNature;

  const dur = getBlockTotalDuration(block);
  const acoustic = block.acousticFeatures || block.clips.find((c) => c.acousticFeatures)?.acousticFeatures;
  const hasPresetJingle = block.clips.some((c) => c.sourceId === 'preset-jingle');

  if (!acoustic && !hasPresetJingle) {
    return { type: 'pending', label: 'Analyse sonore…', icon: '🔍', badge: 'Analyse acoustique en cours…', suggestedRole: block.role || 'intro' };
  }

  const jingleOrMusic = isJingleOrMusic(block, dur, acoustic);
  if (jingleOrMusic.match) {
    return { type: 'musique', label: jingleOrMusic.label, icon: jingleOrMusic.icon, badge: jingleOrMusic.badge, suggestedRole: 'virgule' };
  }
  if (matchesKeywords(block, SFX_REGEX) || (acoustic?.signalClass === 'ambiance' && dur <= 3)) {
    return { type: 'ambiance', label: 'Bruitage / SFX', icon: '✨', badge: 'Effet sonore ponctuel', suggestedRole: 'virgule' };
  }
  if (matchesKeywords(block, AMBIANCE_REGEX)) {
    return { type: 'ambiance', label: 'Ambiance', icon: '🍃', badge: 'Fond sonore continu', suggestedRole: 'virgule' };
  }

  const speech = evaluateSpeechDialogue(block, acoustic);
  if (speech.isConversation) {
    return { type: 'conversation', label: 'Conversation', icon: '👥', badge: 'Dialogue multi-voix', suggestedRole: 'interview', details: speech };
  }
  if (speech.isMonologue) {
    return { type: 'monologue', label: 'Monologue', icon: '🗣️', badge: 'Voix solo / Récit', suggestedRole: 'chronique', details: speech };
  }
  return { type: 'unknown', label: 'Incertain', icon: '❓', badge: 'Nature indéterminée (cliquez pour choisir)', suggestedRole: block.role || 'chronique', details: speech };
}
