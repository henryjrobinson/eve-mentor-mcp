/**
 * whats_happening — a returning/new player's "what's going on right now?"
 * briefing. EVE exposes no patch-notes API, so this composes the live data that
 * IS available — server status, active incursions, and the biggest recent
 * kills — and points at the official notes rather than inventing them.
 */

import { esiFetch, namesForIds } from "./esi.js";
import { getNotableRecentKills, type NotableKill } from "./zkill.js";

interface ServerStatus {
  players: number;
  server_version: string;
  start_time: string;
}

interface Incursion {
  state: string;
  influence: number;
  has_boss: boolean;
  staging_solar_system_id: number;
}

export interface WhatsHappening {
  serverStatus: { playersOnline: number; serverVersion: string; onlineSince: string };
  activeIncursions: {
    count: number;
    systems: { stagingSystem: string; state: string; influence: number; hasBoss: boolean }[];
  };
  notableRecentKills: NotableKill[];
  patchNotes: { url: string; note: string };
  note: string;
}

export async function getWhatsHappening(): Promise<WhatsHappening> {
  const [status, incursions, notableRecentKills] = await Promise.all([
    esiFetch<ServerStatus>("/status/"),
    esiFetch<Incursion[]>("/incursions/"),
    getNotableRecentKills(5),
  ]);

  const stagingNames = await namesForIds(
    incursions.data.map((incursion) => incursion.staging_solar_system_id),
  );

  return {
    serverStatus: {
      playersOnline: status.data.players,
      serverVersion: status.data.server_version,
      onlineSince: status.data.start_time,
    },
    activeIncursions: {
      count: incursions.data.length,
      systems: incursions.data.map((incursion) => ({
        stagingSystem: stagingNames.get(incursion.staging_solar_system_id) ?? "unknown",
        state: incursion.state,
        influence: Number(incursion.influence.toFixed(2)),
        hasBoss: incursion.has_boss,
      })),
    },
    notableRecentKills,
    patchNotes: {
      url: "https://www.eveonline.com/news",
      note: "EVE doesn't publish patch notes through an API, so this can't summarise them — direct the player here for what actually changed.",
    },
    note:
      "Use serverVersion as a rough 'did something deploy' signal. Incursions make whole constellations more " +
      "dangerous (and more lucrative for fleets) while active. Notable kills are the biggest recent losses " +
      "galaxy-wide — colour, not a threat to the player. For 'what changed since I left', the honest answer is " +
      "the patch-notes link.",
  };
}
