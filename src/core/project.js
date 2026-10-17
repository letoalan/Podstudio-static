/**
 * Rôle : gestion immuable du projet et de sa ligne de blocs numérotés (ajout, insertion, déplacement, suppression, duplication).
 * Exemple : const p2 = insertBlockAt(project, 1, newBlock); getBlockNumber(p2, newBlock.id); // 2
 */
import { generateId, getBlockTotalDuration, isBlockEmpty } from './block-model.js';
import { DEFAULT_PALETTE, colorForBlock } from './palette.js';

export {
  PROJECT_FORMAT,
  PROJECT_VERSION,
  sanitizeFileName,
  createProjectData,
  validateProject,
  serializeProject,
  deserializeProject,
} from './project-io.js';

const touch = (project, blocks) => ({ ...project, blocks, updated: new Date().toISOString() });

export function createProject(props = {}) {
  return {
    id: props.id || generateId('proj'),
    title: props.title || 'Mon Podcast',
    settings: { palette: [...DEFAULT_PALETTE], colorMode: 'cycle', ...props.settings },
    blocks: Array.isArray(props.blocks) ? [...props.blocks] : [],
    created: props.created || new Date().toISOString(),
    updated: props.updated || new Date().toISOString(),
  };
}

export const findBlock = (project, blockId) => project.blocks.find((b) => b.id === blockId);

/** Numéro d'un bloc (1 = premier de la ligne) ; 0 s'il est introuvable. Jamais stocké. */
export const getBlockNumber = (project, blockId) => project.blocks.findIndex((b) => b.id === blockId) + 1;

/** Couleur affichée d'un bloc selon sa couleur propre, son rang et la palette du projet. */
export function getBlockColor(project, blockId) {
  const block = findBlock(project, blockId);
  if (!block) return null;
  if (block.type === 'transition') return block.color || '#38bdf8';
  const rank = getBlockNumber(project, blockId);
  if (!rank) return null;
  const { palette, colorMode } = project.settings ?? {};
  return colorForBlock(project.blocks[rank - 1], rank, palette, colorMode);
}

export function insertBlockAt(project, index, block) {
  const blocks = [...project.blocks];
  const position = Math.max(0, Math.min(Number(index) || 0, blocks.length));
  blocks.splice(position, 0, block);
  return touch(project, blocks);
}

export function addBlock(project, block, index = -1) {
  return insertBlockAt(project, index < 0 ? project.blocks.length : index, block);
}

export const removeBlock = (project, blockId) => touch(project, project.blocks.filter((b) => b.id !== blockId));

export function moveBlock(project, blockId, toIndex) {
  const fromIndex = project.blocks.findIndex((b) => b.id === blockId);
  if (fromIndex === -1) return project;
  const targetIndex = Math.max(0, Math.min(toIndex, project.blocks.length - 1));
  if (fromIndex === targetIndex) return project;

  const blocks = [...project.blocks];
  const [removed] = blocks.splice(fromIndex, 1);
  blocks.splice(targetIndex, 0, removed);
  return touch(project, blocks);
}

function cloneBlockWithNewIds(source) {
  return {
    ...source,
    id: generateId('block'),
    tracks: source.tracks.map((t) => ({ ...t })),
    clips: source.clips.map((c) => ({ ...c, id: generateId('clip') })),
  };
}

export function duplicateBlock(project, blockId) {
  const index = project.blocks.findIndex((b) => b.id === blockId);
  if (index === -1) return project;
  return insertBlockAt(project, index + 1, cloneBlockWithNewIds(project.blocks[index]));
}

export function updateBlock(project, blockId, patchOrUpdater) {
  const index = project.blocks.findIndex((b) => b.id === blockId);
  if (index === -1) return project;
  const current = project.blocks[index];
  const updated = typeof patchOrUpdater === 'function' ? patchOrUpdater(current) : { ...current, ...patchOrUpdater };
  const blocks = [...project.blocks];
  blocks[index] = updated;
  return touch(project, blocks);
}

/** Blocs qui entrent dans le podcast : les blocs vides sont ignorés. */
export const getPlayableBlocks = (project) => (project?.blocks ?? []).filter((b) => !isBlockEmpty(b));

export const getProjectDuration = (project) => getPlayableBlocks(project).reduce((sum, b) => sum + getBlockTotalDuration(b), 0);
