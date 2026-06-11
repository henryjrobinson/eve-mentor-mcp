/**
 * zKillboard client + loss-report builder.
 * zKillboard indexes every killmail in EVE; we fetch the index here and the
 * full killmail detail from ESI (zKill only stores the id + hash).
 * API docs: https://github.com/zKillboard/zKillboard/wiki/API-(Killmails)
 */

import {
  getKillmail,
  getSystem,
  namesForIds,
  resolveNames,
  slotForFlag,
  type Killmail,
} from "./esi.js";
import { characterPortraitUrl, typeRenderUrl } from "./images.js";

const ZKILL_BASE = "https://zkillboard.com/api";
const USER_AGENT = "eve-mentor-mcp/0.1.0 (https://github.com/henryjrobinson/eve-mentor-mcp)";

interface ZkillEntry {
  killmail_id: number;
  zkb: {
    hash: string;
    totalValue: number;
    solo: boolean;
    npc: boolean;
  };
}

async function zkillFetch(path: string): Promise<ZkillEntry[]> {
  const response = await fetch(`${ZKILL_BASE}${path}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`zKillboard ${response.status} on ${path}`);
  }
  return (await response.json()) as ZkillEntry[];
}

export interface LossReport {
  killmailId: number;
  time: string;
  system: string;
  systemSecurity: number;
  ship: string;
  iskLost: number;
  soloKill: boolean;
  killedByNpc: boolean;
  damageTaken: number;
  attackerCount: number;
  shipRenderUrl: string;
  finalBlow: { pilot: string; ship: string; weapon: string; pilotPortraitUrl?: string };
  fit: Record<string, string[]>;
}

/** Fetch a character's recent losses with full fit detail, newest first. */
export async function getRecentLosses(
  characterName: string,
  limit: number,
): Promise<LossReport[]> {
  const ids = await resolveNames([characterName]);
  const character = ids.characters?.[0];
  if (!character) {
    throw new Error(
      `No character named "${characterName}" found. Names must be exact (check spelling/capitalization).`,
    );
  }

  const entries = await zkillFetch(`/losses/characterID/${character.id}/`);
  const recent = entries.slice(0, limit);

  return Promise.all(
    recent.map(async (entry) => {
      const killmail = await getKillmail(entry.killmail_id, entry.zkb.hash);
      return buildLossReport(entry, killmail);
    }),
  );
}

async function buildLossReport(entry: ZkillEntry, killmail: Killmail): Promise<LossReport> {
  const system = await getSystem(killmail.solar_system_id);

  const idsToName: number[] = [killmail.victim.ship_type_id];
  for (const item of killmail.victim.items ?? []) idsToName.push(item.item_type_id);
  const finalBlowAttacker = killmail.attackers.find((a) => a.final_blow);
  if (finalBlowAttacker?.character_id) idsToName.push(finalBlowAttacker.character_id);
  if (finalBlowAttacker?.ship_type_id) idsToName.push(finalBlowAttacker.ship_type_id);
  if (finalBlowAttacker?.weapon_type_id) idsToName.push(finalBlowAttacker.weapon_type_id);

  const names = await namesForIds(idsToName);
  const nameOf = (id?: number) => (id ? (names.get(id) ?? "unknown") : "unknown");

  const fit: Record<string, string[]> = {};
  for (const item of killmail.victim.items ?? []) {
    const slot = slotForFlag(item.flag);
    if (slot === "cargo" || slot === "other") continue;
    (fit[slot] ??= []).push(nameOf(item.item_type_id));
  }

  return {
    killmailId: killmail.killmail_id,
    time: killmail.killmail_time,
    system: system.name,
    systemSecurity: Number(system.security_status.toFixed(1)),
    ship: nameOf(killmail.victim.ship_type_id),
    iskLost: Math.round(entry.zkb.totalValue),
    soloKill: entry.zkb.solo,
    killedByNpc: entry.zkb.npc,
    damageTaken: killmail.victim.damage_taken,
    attackerCount: killmail.attackers.length,
    shipRenderUrl: typeRenderUrl(killmail.victim.ship_type_id),
    finalBlow: {
      pilot: nameOf(finalBlowAttacker?.character_id),
      ship: nameOf(finalBlowAttacker?.ship_type_id),
      weapon: nameOf(finalBlowAttacker?.weapon_type_id),
      ...(finalBlowAttacker?.character_id
        ? { pilotPortraitUrl: characterPortraitUrl(finalBlowAttacker.character_id, 128) }
        : {}),
    },
    fit,
  };
}
