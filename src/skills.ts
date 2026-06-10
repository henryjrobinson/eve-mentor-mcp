/**
 * Skill prerequisite resolution — "what exactly do I need to fly/use X?"
 *
 * Requirements live as dogma attributes on every type. ESI only exposes the
 * top level, so we resolve the chain recursively (skills require skills).
 * Attribute pairs per https://forums.eveonline.com/t/218253:
 * required skill IDs 182/183/184/1285/1289/1290, levels 277/278/279/1286/1287/1288.
 */

import { esiFetch, getType, type TypeInfo } from "./esi.js";
import { getSession } from "./auth.js";

const REQUIRED_SKILL_ATTR_PAIRS: [number, number][] = [
  [182, 277],
  [183, 278],
  [184, 279],
  [1285, 1286],
  [1289, 1287],
  [1290, 1288],
];
const SKILL_RANK_ATTR = 275;

/** SP needed to have a skill AT this level: 250 × rank × √32^(level−1). */
function skillpointsAtLevel(rank: number, level: number): number {
  return Math.round(250 * rank * Math.pow(Math.sqrt(32), level - 1));
}

// Assumes evenly-spread attributes, no implants (~30 SP/minute).
const ESTIMATED_SP_PER_HOUR = 1800;

interface DirectRequirement {
  skillId: number;
  level: number;
}

function directRequirements(type: TypeInfo): DirectRequirement[] {
  const attributes = new Map(
    (type.dogma_attributes ?? []).map((attr) => [attr.attribute_id, attr.value]),
  );
  const requirements: DirectRequirement[] = [];
  for (const [skillAttr, levelAttr] of REQUIRED_SKILL_ATTR_PAIRS) {
    const skillId = attributes.get(skillAttr);
    const level = attributes.get(levelAttr);
    if (skillId && level) requirements.push({ skillId, level });
  }
  return requirements;
}

export interface SkillNode {
  skill: string;
  skillId: number;
  level: number;
  rank: number;
  requires: SkillNode[];
}

// skillId -> its own (level-independent) subtree info
const subtreeCache = new Map<
  number,
  { name: string; rank: number; requires: DirectRequirement[] }
>();

async function skillSubtreeInfo(skillId: number) {
  const cached = subtreeCache.get(skillId);
  if (cached) return cached;
  const type = await getType(skillId);
  const rank =
    type.dogma_attributes?.find((a) => a.attribute_id === SKILL_RANK_ATTR)?.value ?? 1;
  const info = { name: type.name, rank, requires: directRequirements(type) };
  subtreeCache.set(skillId, info);
  return info;
}

async function buildNode(requirement: DirectRequirement): Promise<SkillNode> {
  const info = await skillSubtreeInfo(requirement.skillId);
  const children = await Promise.all(info.requires.map(buildNode));
  return {
    skill: info.name,
    skillId: requirement.skillId,
    level: requirement.level,
    rank: info.rank,
    requires: children,
  };
}

/** Full recursive prerequisite tree for any type (ship, module, ammo). */
export async function prerequisiteTree(typeId: number): Promise<SkillNode[]> {
  const type = await getType(typeId);
  return Promise.all(directRequirements(type).map(buildNode));
}

interface PlanEntry {
  skill: string;
  skillId: number;
  toLevel: number;
  rank: number;
}

/** Flatten a tree into a prerequisites-first training order, max level per skill. */
function flattenTree(nodes: SkillNode[]): PlanEntry[] {
  const needed = new Map<number, PlanEntry>();
  const visit = (node: SkillNode) => {
    node.requires.forEach(visit);
    const existing = needed.get(node.skillId);
    if (!existing) {
      needed.set(node.skillId, {
        skill: node.skill,
        skillId: node.skillId,
        toLevel: node.level,
        rank: node.rank,
      });
    } else if (node.level > existing.toLevel) {
      existing.toLevel = node.level;
    }
  };
  nodes.forEach(visit);
  return [...needed.values()];
}

/** Trained skill levels for the logged-in character, or null if not logged in. */
async function trainedSkillLevels(): Promise<Map<number, number> | null> {
  try {
    const { accessToken, characterId } = await getSession();
    const { data } = await esiFetch<{
      skills: { skill_id: number; trained_skill_level: number }[];
    }>(`/characters/${characterId}/skills/`, { token: accessToken });
    return new Map(data.skills.map((s) => [s.skill_id, s.trained_skill_level]));
  } catch {
    return null;
  }
}

export interface FlightPlan {
  item: string;
  personalized: boolean;
  alreadyMet: boolean;
  trainingPlan: {
    skill: string;
    fromLevel: number;
    toLevel: number;
    skillpointsNeeded: number;
  }[];
  totalSkillpointsNeeded: number;
  estimatedTrainingDays: number;
  prerequisiteTree: SkillNode[];
  note: string;
}

/** The complete answer to "what do I need to use this, and how long?" */
export async function flightPlan(typeId: number, itemName: string): Promise<FlightPlan> {
  const tree = await prerequisiteTree(typeId);
  const flat = flattenTree(tree);
  const trained = await trainedSkillLevels();

  const trainingPlan = flat
    .map((entry) => {
      const fromLevel = trained?.get(entry.skillId) ?? 0;
      if (fromLevel >= entry.toLevel) return null;
      const skillpointsNeeded =
        skillpointsAtLevel(entry.rank, entry.toLevel) -
        (fromLevel > 0 ? skillpointsAtLevel(entry.rank, fromLevel) : 0);
      return { skill: entry.skill, fromLevel, toLevel: entry.toLevel, skillpointsNeeded };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const totalSkillpointsNeeded = trainingPlan.reduce(
    (sum, entry) => sum + entry.skillpointsNeeded,
    0,
  );

  return {
    item: itemName,
    personalized: trained !== null,
    alreadyMet: trained !== null && trainingPlan.length === 0,
    trainingPlan,
    totalSkillpointsNeeded,
    estimatedTrainingDays:
      Math.round((totalSkillpointsNeeded / (ESTIMATED_SP_PER_HOUR * 24)) * 10) / 10,
    prerequisiteTree: tree,
    note:
      trained === null
        ? "Not logged in — plan assumes zero trained skills. Log in with eve_login to personalize."
        : "Personalized against the logged-in character's trained skills. Time estimate assumes average attributes, no implants.",
  };
}
