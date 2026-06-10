/**
 * Thin client for EVE's public ESI API.
 * Docs: https://esi.evetech.net/ui/
 */

const ESI_BASE = "https://esi.evetech.net/latest";
const USER_AGENT = "eve-mentor-mcp/0.1.0 (https://github.com/henryjrobinson/eve-mentor-mcp)";

export const JITA_REGION_ID = 10000002; // The Forge
export const JITA_44_STATION_ID = 60003760; // Jita IV - Moon 4 - Caldari Navy Assembly Plant

export class EsiError extends Error {
  constructor(
    public status: number,
    public path: string,
    message: string,
  ) {
    super(`ESI ${status} on ${path}: ${message}`);
    this.name = "EsiError";
  }
}

export async function esiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string; raw?: boolean } = {},
): Promise<{ data: T; pages: number }> {
  const response = await fetch(`${ESI_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "User-Agent": USER_AGENT,
      "Accept": "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new EsiError(response.status, path, text.slice(0, 300));
  }

  const pages = Number(response.headers.get("x-pages") ?? "1");
  return { data: (await response.json()) as T, pages };
}

// ---------- Name/ID resolution ----------

interface IdsResult {
  inventory_types?: { id: number; name: string }[];
  systems?: { id: number; name: string }[];
  characters?: { id: number; name: string }[];
  regions?: { id: number; name: string }[];
}

/** Resolve exact names (items, systems, characters...) to IDs. */
export async function resolveNames(names: string[]): Promise<IdsResult> {
  const { data } = await esiFetch<IdsResult>("/universe/ids/", {
    method: "POST",
    body: names,
  });
  return data;
}

const idNameCache = new Map<number, string>();

/** Resolve IDs of mixed categories back to names (cached). */
export async function namesForIds(ids: number[]): Promise<Map<number, string>> {
  const unique = [...new Set(ids)].filter((id) => id > 0);
  const missing = unique.filter((id) => !idNameCache.has(id));

  // ESI accepts max 1000 ids per call
  for (let i = 0; i < missing.length; i += 1000) {
    const batch = missing.slice(i, i + 1000);
    try {
      const { data } = await esiFetch<{ id: number; name: string }[]>(
        "/universe/names/",
        { method: "POST", body: batch },
      );
      for (const entry of data) idNameCache.set(entry.id, entry.name);
    } catch {
      // Some IDs (e.g. deleted characters) are unresolvable; leave them unnamed.
    }
  }

  const result = new Map<number, string>();
  for (const id of unique) {
    result.set(id, idNameCache.get(id) ?? `unknown-${id}`);
  }
  return result;
}

// ---------- Universe ----------

export interface TypeInfo {
  type_id: number;
  name: string;
  description: string;
  group_id: number;
  dogma_attributes?: { attribute_id: number; value: number }[];
}

const typeCache = new Map<number, TypeInfo>();

export async function getType(typeId: number): Promise<TypeInfo> {
  const cached = typeCache.get(typeId);
  if (cached) return cached;
  const { data } = await esiFetch<TypeInfo>(`/universe/types/${typeId}/`);
  typeCache.set(typeId, data);
  return data;
}

export interface SystemInfo {
  system_id: number;
  name: string;
  security_status: number;
  constellation_id: number;
  stargates?: number[];
}

export async function getSystem(systemId: number): Promise<SystemInfo> {
  const { data } = await esiFetch<SystemInfo>(`/universe/systems/${systemId}/`);
  return data;
}

interface SystemKills {
  system_id: number;
  ship_kills: number;
  pod_kills: number;
  npc_kills: number;
}

/** Kills and jumps across all systems in the last hour. */
export async function getSystemActivity(systemId: number): Promise<{
  shipKillsLastHour: number;
  podKillsLastHour: number;
  npcKillsLastHour: number;
  jumpsLastHour: number;
}> {
  const [kills, jumps] = await Promise.all([
    esiFetch<SystemKills[]>("/universe/system_kills/"),
    esiFetch<{ system_id: number; ship_jumps: number }[]>("/universe/system_jumps/"),
  ]);
  const killEntry = kills.data.find((k) => k.system_id === systemId);
  const jumpEntry = jumps.data.find((j) => j.system_id === systemId);
  return {
    shipKillsLastHour: killEntry?.ship_kills ?? 0,
    podKillsLastHour: killEntry?.pod_kills ?? 0,
    npcKillsLastHour: killEntry?.npc_kills ?? 0,
    jumpsLastHour: jumpEntry?.ship_jumps ?? 0,
  };
}

// ---------- Market ----------

interface MarketOrder {
  is_buy_order: boolean;
  location_id: number;
  price: number;
  volume_remain: number;
}

/** Best buy/sell prices for a type in The Forge, split out for Jita 4-4. */
export async function getJitaPrices(typeId: number): Promise<{
  bestSell: number | null;
  bestBuy: number | null;
  sellVolume: number;
  buyVolume: number;
}> {
  const first = await esiFetch<MarketOrder[]>(
    `/markets/${JITA_REGION_ID}/orders/?type_id=${typeId}&order_type=all&page=1`,
  );
  let orders = first.data;

  if (first.pages > 1) {
    const restPages = Array.from({ length: first.pages - 1 }, (_, i) => i + 2);
    const rest = await Promise.all(
      restPages.map((page) =>
        esiFetch<MarketOrder[]>(
          `/markets/${JITA_REGION_ID}/orders/?type_id=${typeId}&order_type=all&page=${page}`,
        ),
      ),
    );
    orders = orders.concat(...rest.map((r) => r.data));
  }

  const atJita = orders.filter((o) => o.location_id === JITA_44_STATION_ID);
  const sells = atJita.filter((o) => !o.is_buy_order);
  const buys = atJita.filter((o) => o.is_buy_order);

  return {
    bestSell: sells.length ? Math.min(...sells.map((o) => o.price)) : null,
    bestBuy: buys.length ? Math.max(...buys.map((o) => o.price)) : null,
    sellVolume: sells.reduce((sum, o) => sum + o.volume_remain, 0),
    buyVolume: buys.reduce((sum, o) => sum + o.volume_remain, 0),
  };
}

// ---------- Killmails ----------

export interface KillmailItem {
  item_type_id: number;
  flag: number;
  quantity_destroyed?: number;
  quantity_dropped?: number;
}

export interface Killmail {
  killmail_id: number;
  killmail_time: string;
  solar_system_id: number;
  victim: {
    character_id?: number;
    corporation_id?: number;
    ship_type_id: number;
    damage_taken: number;
    items?: KillmailItem[];
  };
  attackers: {
    character_id?: number;
    corporation_id?: number;
    ship_type_id?: number;
    weapon_type_id?: number;
    final_blow: boolean;
    damage_done: number;
  }[];
}

export async function getKillmail(killmailId: number, hash: string): Promise<Killmail> {
  const { data } = await esiFetch<Killmail>(`/killmails/${killmailId}/${hash}/`);
  return data;
}

/** Map a killmail item flag to a human-readable fitting slot. */
export function slotForFlag(flag: number): string {
  if (flag >= 11 && flag <= 18) return "low slot";
  if (flag >= 19 && flag <= 26) return "mid slot";
  if (flag >= 27 && flag <= 34) return "high slot";
  if (flag >= 92 && flag <= 94) return "rig";
  if (flag >= 125 && flag <= 128) return "subsystem";
  if (flag === 87) return "drone bay";
  if (flag === 5) return "cargo";
  return "other";
}
