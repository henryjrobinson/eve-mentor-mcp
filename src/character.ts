/**
 * Authenticated character endpoints (require EVE SSO login).
 */

import { getSession } from "./auth.js";
import { esiFetch, getSystem, getType, namesForIds } from "./esi.js";

interface SkillsResponse {
  total_sp: number;
  skills: { skill_id: number; trained_skill_level: number; skillpoints_in_skill: number }[];
}

interface QueueEntry {
  skill_id: number;
  finished_level: number;
  finish_date?: string;
  queue_position: number;
}

export async function getCharacterSheet(): Promise<{
  character: string;
  totalSkillpoints: number;
  skillCount: number;
  walletIsk: number;
  location: string;
  locationSecurity: number;
  currentShip: string;
}> {
  const { accessToken, characterId } = await getSession();
  const authed = { token: accessToken };

  const [skills, wallet, location, ship, names] = await Promise.all([
    esiFetch<SkillsResponse>(`/characters/${characterId}/skills/`, authed),
    esiFetch<number>(`/characters/${characterId}/wallet/`, authed),
    esiFetch<{ solar_system_id: number }>(`/characters/${characterId}/location/`, authed),
    esiFetch<{ ship_type_id: number }>(`/characters/${characterId}/ship/`, authed),
    namesForIds([characterId]),
  ]);

  const [system, shipType] = await Promise.all([
    getSystem(location.data.solar_system_id),
    getType(ship.data.ship_type_id),
  ]);

  return {
    character: names.get(characterId) ?? `character-${characterId}`,
    totalSkillpoints: skills.data.total_sp,
    skillCount: skills.data.skills.length,
    walletIsk: Math.round(wallet.data),
    location: system.name,
    locationSecurity: Number(system.security_status.toFixed(1)),
    currentShip: shipType.name,
  };
}

export async function getSkillQueue(): Promise<
  { position: number; skill: string; toLevel: number; finishes: string }[]
> {
  const { accessToken, characterId } = await getSession();
  const { data: queue } = await esiFetch<QueueEntry[]>(
    `/characters/${characterId}/skillqueue/`,
    { token: accessToken },
  );

  const names = await namesForIds(queue.map((entry) => entry.skill_id));
  return queue.map((entry) => ({
    position: entry.queue_position,
    skill: names.get(entry.skill_id) ?? `skill-${entry.skill_id}`,
    toLevel: entry.finished_level,
    finishes: entry.finish_date ?? "paused (queue not training)",
  }));
}

interface AssetEntry {
  item_id: number;
  type_id: number;
  location_id: number;
  location_flag: string;
  location_type: string;
  quantity: number;
}

const STRUCTURE_ID_FLOOR = 1_000_000_000_000;

async function locationLabel(
  locationId: number,
  accessToken: string,
  stationNames: Map<number, string>,
): Promise<string> {
  if (locationId < STRUCTURE_ID_FLOOR) {
    return stationNames.get(locationId) ?? `location-${locationId}`;
  }
  // Player-owned structure: name lookup requires docking access — a 403 here
  // means the character is locked out (assets likely stranded or in asset safety).
  try {
    const { data } = await esiFetch<{ name: string }>(
      `/universe/structures/${locationId}/`,
      { token: accessToken },
    );
    return data.name;
  } catch {
    return `INACCESSIBLE structure ${locationId} (no docking access — assets may be stranded; check asset safety)`;
  }
}

/** All assets grouped by location, with inaccessible structures and asset safety flagged. */
export async function getAssetsSummary(): Promise<
  {
    location: string;
    inAssetSafety: boolean;
    itemCount: number;
    items: { name: string; quantity: number }[];
  }[]
> {
  const { accessToken, characterId } = await getSession();

  const all: AssetEntry[] = [];
  let page = 1;
  let pages = 1;
  do {
    const result = await esiFetch<AssetEntry[]>(
      `/characters/${characterId}/assets/?page=${page}`,
      { token: accessToken },
    );
    all.push(...result.data);
    pages = result.pages;
    page += 1;
  } while (page <= pages);

  // Top-level assets only: things whose container is a station/structure,
  // not another asset (e.g. modules fitted to a stored ship).
  const ownItemIds = new Set(all.map((asset) => asset.item_id));
  const topLevel = all.filter((asset) => !ownItemIds.has(asset.location_id));

  const byLocation = new Map<number, AssetEntry[]>();
  for (const asset of topLevel) {
    const group = byLocation.get(asset.location_id);
    if (group) {
      group.push(asset);
    } else {
      byLocation.set(asset.location_id, [asset]);
    }
  }

  const stationIds = [...byLocation.keys()].filter((id) => id < STRUCTURE_ID_FLOOR);
  const typeIds = topLevel.map((asset) => asset.type_id);
  const names = await namesForIds([...stationIds, ...typeIds]);

  return Promise.all(
    [...byLocation.entries()].map(async ([locationId, assets]) => ({
      location: await locationLabel(locationId, accessToken, names),
      inAssetSafety: assets.some((asset) => asset.location_flag === "AssetSafety"),
      itemCount: assets.length,
      items: assets
        .map((asset) => ({
          name: names.get(asset.type_id) ?? `type-${asset.type_id}`,
          quantity: asset.quantity,
        }))
        .slice(0, 25),
    })),
  );
}

export async function getTopSkills(limit: number): Promise<
  { skill: string; level: number; skillpoints: number }[]
> {
  const { accessToken, characterId } = await getSession();
  const { data } = await esiFetch<SkillsResponse>(`/characters/${characterId}/skills/`, {
    token: accessToken,
  });

  const top = [...data.skills]
    .sort((a, b) => b.skillpoints_in_skill - a.skillpoints_in_skill)
    .slice(0, limit);
  const names = await namesForIds(top.map((skill) => skill.skill_id));

  return top.map((skill) => ({
    skill: names.get(skill.skill_id) ?? `skill-${skill.skill_id}`,
    level: skill.trained_skill_level,
    skillpoints: skill.skillpoints_in_skill,
  }));
}
