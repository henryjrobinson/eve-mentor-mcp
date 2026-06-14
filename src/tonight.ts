/**
 * "What should I do tonight?" — composes the logged-in character's real
 * situation (skills, wallet, location, ship) with the income guidance for their
 * skillpoint tier, so the AI client can turn it into a few concrete,
 * situation-aware session suggestions instead of generic advice.
 */

import { authStatus } from "./auth.js";
import { getCharacterSheet, getSkillQueue } from "./character.js";
import { tierForSkillpoints, type IncomeTier } from "./income.js";

function locationContext(security: number): string {
  if (security >= 0.5) {
    return (
      "High-sec: missions, high-sec exploration, mining, salvaging and incursions are all comparatively safe here. " +
      "For higher-paying exploration or ratting you'd travel to low/null/wormhole space and accept PvP risk."
    );
  }
  if (security > 0) {
    return (
      "Low-sec: faction warfare, richer exploration and ratting pay more here, but PvP is unrestricted. " +
      "Watch directional scan and local; don't undock anything you can't afford to lose."
    );
  }
  return (
    "Null-sec or unknown (wormhole) space: the best exploration, ratting and combat-site income lives here — " +
    "and so does the most danger. No CONCORD is coming. Travel light and check intel before undocking."
  );
}

function walletContext(walletIsk: number): string {
  if (walletIsk < 10_000_000) {
    return "Thin wallet — lean toward low-cost activities (exploration, FW frigates, career-agent follow-ups) over anything you'd cry to lose.";
  }
  if (walletIsk < 100_000_000) {
    return "Enough ISK for a properly-fit cruiser or several frigates — you can take a calculated loss without it hurting.";
  }
  return "Healthy wallet — affording the ship isn't the constraint; matching the activity to your skills and risk appetite is.";
}

export interface TonightOptions {
  loggedIn: boolean;
  situation?: {
    character: string;
    totalSkillpoints: number;
    walletIsk: number;
    location: string;
    locationSecurity: number;
    currentShip: string;
  };
  whatsTraining?: { skill: string; toLevel: number; finishes: string }[];
  skillpointTier?: IncomeTier;
  locationContext?: string;
  walletContext?: string;
  note: string;
}

export async function getTonightOptions(): Promise<TonightOptions> {
  const auth = await authStatus();
  if (!auth.loggedIn) {
    return {
      loggedIn: false,
      note: "Not logged in — this tool reads the player's real skills, wallet, location and ship. Use eve_login first.",
    };
  }

  const [sheet, queue] = await Promise.all([
    getCharacterSheet(),
    getSkillQueue().catch(() => [] as Awaited<ReturnType<typeof getSkillQueue>>),
  ]);

  const tier = tierForSkillpoints(sheet.totalSkillpoints);

  return {
    loggedIn: true,
    situation: {
      character: sheet.character,
      totalSkillpoints: sheet.totalSkillpoints,
      walletIsk: sheet.walletIsk,
      location: sheet.location,
      locationSecurity: sheet.locationSecurity,
      currentShip: sheet.currentShip,
    },
    whatsTraining: queue.slice(0, 3).map((entry) => ({
      skill: entry.skill,
      toLevel: entry.toLevel,
      finishes: entry.finishes,
    })),
    skillpointTier: tier,
    locationContext: locationContext(sheet.locationSecurity),
    walletContext: walletContext(sheet.walletIsk),
    note:
      "Turn this into 2-3 concrete suggestions for tonight. Use the player's ACTUAL ship, wallet, " +
      "location security and skillpoint tier — name specific activities from skillpointTier, with their " +
      "ISK range and risk, and a realistic first step from where they're sitting. If the player has taken " +
      "career_test in this conversation, weight toward those paths. Flag when a better option needs them to " +
      "travel or train something first. Don't promise the ISK numbers — they're rough ranges.",
  };
}
