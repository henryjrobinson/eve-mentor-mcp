/**
 * The pay-vs-play guide: EVE's Alpha/Omega/PLEX economy explained with live
 * numbers. PLEX is an in-game item tradeable for ISK, so subscription time
 * can be bought with play instead of money — the math changes monthly.
 */

import { esiFetch } from "./esi.js";

const PLEX_TYPE_ID = 44992;
const PLEX_PER_OMEGA_MONTH = 500;

const STATIC_GUIDE = {
  alpha: {
    cost: "Free, forever.",
    whatYouGet:
      "All four empires' Tech 1 ships up through battleships, a limited skill set, and normal access to the same single universe as everyone else.",
    limits:
      "Skill training stops at the Alpha set (~5M skillpoints of free training; more via injectors), trains at half speed, no Tech 2 ships, one logged-in character at a time.",
    honestTake:
      "Alpha is a real game, not a demo — exploration, faction warfare, and trading all work. It is the right way to find out if EVE sticks before paying anything.",
  },
  omega: {
    cost: "A subscription — paid with real money OR with PLEX bought from other players with ISK.",
    whatYouGet:
      "Every ship and skill in the game, double training speed, multiple training queues per account.",
  },
  plexExplained:
    "PLEX is game time as a tradeable item: someone with more money than time buys PLEX with cash and sells it on the market for ISK; someone with more time than money earns ISK and buys that PLEX for game time. Both players get what they want, and CCP gets paid either way. It also means every ship in EVE has a real-world price shadow — which is why big battles make gaming news with dollar figures.",
  cheapestPaths: [
    "1. Start Alpha. Pay nothing until the game has actually hooked you.",
    "2. If it hooks you, pay cash for the first Omega month or two — your early hours are worth more spent learning than grinding for PLEX.",
    "3. Once your income is real (see the live math below for the bar), decide each month: grind the PLEX price in ISK, or pay cash and spend those hours having fun.",
    "4. Watch for starter-pack sales — discounted Omega+skillpoint bundles for new/returning accounts are common and usually the best cash value.",
  ],
  trap: "Buying PLEX with cash to sell for ISK to buy ships ('whaling') is legal but is how people spend hundreds of dollars learning to lose ships. Earn the cheap ships first.",
};

/** Live cost of an Omega month in ISK, with honest grind-hours context. */
export async function getPayGuide(): Promise<unknown> {
  let liveMath: Record<string, unknown>;
  try {
    // PLEX trades on a special global market, not regional order books, so use
    // ESI's universe-wide average price.
    const { data } = await esiFetch<{ type_id: number; average_price?: number }[]>(
      "/markets/prices/",
    );
    const plexPrice = data.find((entry) => entry.type_id === PLEX_TYPE_ID)?.average_price;
    if (plexPrice) {
      const omegaMonthIsk = Math.round(plexPrice * PLEX_PER_OMEGA_MONTH);
      liveMath = {
        plexAveragePrice: Math.round(plexPrice),
        omegaMonthInIsk: omegaMonthIsk,
        omegaMonthReadable: `${(omegaMonthIsk / 1e9).toFixed(2)} billion ISK for ${PLEX_PER_OMEGA_MONTH} PLEX`,
        grindContext:
          `At rough new-player income estimates (10-40M ISK/hour from exploration or L3 missions), ` +
          `that's ~${Math.round(omegaMonthIsk / 40e6)}-${Math.round(omegaMonthIsk / 10e6)} hours of grinding per month. ` +
          "If that number is bigger than your monthly play time, pay cash and spend your hours on fun.",
      };
    } else {
      liveMath = { error: "PLEX price missing from ESI market prices." };
    }
  } catch (error) {
    liveMath = {
      error: `Live PLEX price unavailable: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  return { ...STATIC_GUIDE, liveMath };
}
