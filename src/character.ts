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
