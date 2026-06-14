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

export interface ProvenFits {
  ship: string;
  killmailsSampled: number;
  commonModulesBySlot: Record<
    string,
    { module: string; pctOfFits: number; seenInFits: number }[]
  >;
  note: string;
}

const FITTED_SLOTS = new Set(["high slot", "mid slot", "low slot", "rig", "drone bay"]);
const MODULES_PER_SLOT = 6;

/** Count how many distinct fits each module appears in (any quantity counts once). */
function tallyModulePresence(killmails: Killmail[]): Map<string, Map<number, number>> {
  const bySlot = new Map<string, Map<number, number>>();
  for (const killmail of killmails) {
    const seenThisFit = new Set<string>(); // slot:typeId, so 8 identical guns count once
    for (const item of killmail.victim.items ?? []) {
      const slot = slotForFlag(item.flag);
      if (!FITTED_SLOTS.has(slot)) continue;
      const key = `${slot}:${item.item_type_id}`;
      if (seenThisFit.has(key)) continue;
      seenThisFit.add(key);
      const counts = bySlot.get(slot) ?? new Map<number, number>();
      counts.set(item.item_type_id, (counts.get(item.item_type_id) ?? 0) + 1);
      bySlot.set(slot, counts);
    }
  }
  return bySlot;
}

/**
 * Common fits for a ship, derived from recent killmails. EVE only exposes the
 * fit of a killmail's victim, so this samples recent losses of the hull and
 * surfaces the modules that show up most often per slot — what pilots actually
 * fly, not a theorycrafted ideal.
 */
export async function getProvenFits(shipName: string, sample: number): Promise<ProvenFits> {
  const ids = await resolveNames([shipName]);
  const ship = ids.inventory_types?.[0];
  if (!ship) {
    throw new Error(`No ship or item named "${shipName}" found. Names must be exact.`);
  }

  const entries = await zkillFetch(`/losses/shipTypeID/${ship.id}/`);
  const recent = entries.slice(0, sample);
  if (recent.length === 0) {
    return {
      ship: ship.name,
      killmailsSampled: 0,
      commonModulesBySlot: {},
      note: `No recent ${ship.name} killmails on zKillboard to learn from.`,
    };
  }

  const killmails = await Promise.all(
    recent.map((entry) => getKillmail(entry.killmail_id, entry.zkb.hash)),
  );
  const bySlot = tallyModulePresence(killmails);

  const typeIds = [...bySlot.values()].flatMap((counts) => [...counts.keys()]);
  const names = await namesForIds(typeIds);

  const commonModulesBySlot: ProvenFits["commonModulesBySlot"] = {};
  for (const [slot, counts] of bySlot) {
    commonModulesBySlot[slot] = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MODULES_PER_SLOT)
      .map(([typeId, seenInFits]) => ({
        module: names.get(typeId) ?? `type-${typeId}`,
        pctOfFits: Math.round((seenInFits / killmails.length) * 100),
        seenInFits,
      }));
  }

  return {
    ship: ship.name,
    killmailsSampled: killmails.length,
    commonModulesBySlot,
    note:
      "Derived from recent killmails (the only fit data EVE exposes is the victim's). " +
      "High frequency means a module is commonly flown on this hull — pair it with analyze_fit and " +
      "can_i_fly before committing. Charges loaded in launchers appear under high slot.",
  };
}

export interface NotableKill {
  killmailId: number;
  time: string;
  system: string;
  victimShip: string;
  iskLost: number;
  attackerCount: number;
}

/** The highest-value kills from zKill's recent global feed. */
export async function getNotableRecentKills(limit: number): Promise<NotableKill[]> {
  const entries = await zkillFetch(`/kills/`);
  const top = [...entries].sort((a, b) => b.zkb.totalValue - a.zkb.totalValue).slice(0, limit);
  return Promise.all(
    top.map(async (entry) => {
      const killmail = await getKillmail(entry.killmail_id, entry.zkb.hash);
      const [system, names] = await Promise.all([
        getSystem(killmail.solar_system_id),
        namesForIds([killmail.victim.ship_type_id]),
      ]);
      return {
        killmailId: killmail.killmail_id,
        time: killmail.killmail_time,
        system: system.name,
        victimShip: names.get(killmail.victim.ship_type_id) ?? "unknown",
        iskLost: Math.round(entry.zkb.totalValue),
        attackerCount: killmail.attackers.length,
      };
    }),
  );
}

/** A corp's recent PvP activity on zKillboard — an activity/liveness signal. */
export async function getCorpActivity(
  corpId: number,
): Promise<{ recentKillmailsSampled: number; mostRecentActivity: string | null }> {
  const entries = await zkillFetch(`/corporationID/${corpId}/`);
  if (entries.length === 0) {
    return { recentKillmailsSampled: 0, mostRecentActivity: null };
  }
  const killmail = await getKillmail(entries[0].killmail_id, entries[0].zkb.hash);
  return { recentKillmailsSampled: entries.length, mostRecentActivity: killmail.killmail_time };
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
