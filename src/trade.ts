/**
 * where_to_buy — compares an item's cheapest sell price across EVE's five major
 * trade hubs, and (when logged in) how many jumps each hub is from where the
 * player is sitting, so the AI can weigh price against the haul.
 */

import { authStatus, getSession } from "./auth.js";
import { esiFetch, getRoute, getStationSell, resolveNames } from "./esi.js";

interface Hub {
  name: string;
  station: string;
  regionId: number;
  stationId: number;
  systemId: number;
}

const HUBS: Hub[] = [
  { name: "Jita", station: "Jita IV-4 Caldari Navy Assembly Plant", regionId: 10000002, stationId: 60003760, systemId: 30000142 },
  { name: "Amarr", station: "Amarr VIII (Oris) Emperor Family Academy", regionId: 10000043, stationId: 60008494, systemId: 30002187 },
  { name: "Dodixie", station: "Dodixie IX-20 Federation Navy Assembly Plant", regionId: 10000032, stationId: 60011866, systemId: 30002659 },
  { name: "Rens", station: "Rens VI-8 Brutor Tribe Treasury", regionId: 10000030, stationId: 60004588, systemId: 30002510 },
  { name: "Hek", station: "Hek VIII-12 Boundless Creation Factory", regionId: 10000042, stationId: 60005686, systemId: 30002053 },
];

/** The logged-in character's current solar system id, or null if not available. */
async function currentSystemId(): Promise<number | null> {
  const auth = await authStatus();
  if (!auth.loggedIn) return null;
  try {
    const { accessToken, characterId } = await getSession();
    const { data } = await esiFetch<{ solar_system_id: number }>(
      `/characters/${characterId}/location/`,
      { token: accessToken },
    );
    return data.solar_system_id;
  } catch {
    return null;
  }
}

export interface HubPrice {
  hub: string;
  station: string;
  bestSell: number | null;
  sellVolume: number;
  jumpsFromYou: number | null;
}

export interface WhereToBuy {
  item: string;
  personalized: boolean;
  hubs: HubPrice[];
  cheapest: { hub: string; bestSell: number } | null;
  note: string;
}

export async function getWhereToBuy(itemName: string): Promise<WhereToBuy> {
  const ids = await resolveNames([itemName]);
  const type = ids.inventory_types?.[0];
  if (!type) throw new Error(`No item named "${itemName}" found. Names must be exact.`);

  const fromSystem = await currentSystemId();

  const hubs: HubPrice[] = await Promise.all(
    HUBS.map(async (hub) => {
      const [{ bestSell, sellVolume }, jumpsFromYou] = await Promise.all([
        getStationSell(hub.regionId, hub.stationId, type.id),
        (async () => {
          if (!fromSystem) return null;
          try {
            const route = await getRoute(fromSystem, hub.systemId, "shortest");
            return route.length - 1;
          } catch {
            return null;
          }
        })(),
      ]);
      return { hub: hub.name, station: hub.station, bestSell, sellVolume, jumpsFromYou };
    }),
  );

  const inStock = hubs.filter((h): h is HubPrice & { bestSell: number } => h.bestSell !== null);
  const cheapest = inStock.length
    ? inStock.reduce((min, h) => (h.bestSell < min.bestSell ? h : min))
    : null;

  return {
    item: type.name,
    personalized: fromSystem !== null,
    hubs,
    cheapest: cheapest ? { hub: cheapest.hub, bestSell: cheapest.bestSell } : null,
    note:
      "Prices are the best sell order at each hub right now. Jita is almost always cheapest and deepest; the " +
      "other hubs trade a higher price for being closer to other regions. When logged in, weigh the price gap " +
      "against jumpsFromYou — a few hundred ISK saved is rarely worth ten extra jumps through dangerous space.",
  };
}
