/**
 * route_danger — per-jump safety report for a journey. Composes the ESI route
 * with each system's security and last-hour kill activity, and names the
 * notorious high-sec gank chokepoints a new player won't know to fear.
 */

import { getRoute, getSystem, getSystemActivity, resolveNames } from "./esi.js";

// High-sec chokepoints where suicide-gankers camp loaded haulers, plus a few
// infamous low-sec pipe systems. Community knowledge no API exposes.
const GANK_CHOKEPOINTS: Record<string, string> = {
  Uedama: "The most camped high-sec gank system in EVE — gankers hit freighters and loaded haulers here daily.",
  Sivala: "A high-sec gank chokepoint on the Jita–Amarr pipe.",
  Niarja: "Historically the deadliest high-sec chokepoint; still a known gank funnel.",
  Rancer: "Notorious low-sec gate camp on the route to Black Rise.",
  Tama: "Famous low-sec PvP hotspot and gate camp on the Caldari–Gallente warzone edge.",
  Ignoitton: "High-sec gank chokepoint near Amarr trade routes.",
};

export interface RouteJump {
  system: string;
  security: number;
  securityClass: "high-sec" | "low-sec" | "null-sec";
  shipKillsLastHour: number;
  podKillsLastHour: number;
  warnings: string[];
}

export interface RouteDanger {
  origin: string;
  destination: string;
  preference: "shortest" | "safest (high-sec where possible)";
  jumps: number;
  lowSecOrWorseJumps: number;
  hottestSystems: { system: string; shipKillsLastHour: number }[];
  route: RouteJump[];
  note: string;
}

function securityClass(security: number): RouteJump["securityClass"] {
  return security >= 0.5 ? "high-sec" : security > 0 ? "low-sec" : "null-sec";
}

export async function getRouteDanger(
  origin: string,
  destination: string,
  preferSafer: boolean,
): Promise<RouteDanger> {
  const ids = await resolveNames([origin, destination]);
  const originSystem = ids.systems?.find((s) => s.name.toLowerCase() === origin.toLowerCase());
  const destSystem = ids.systems?.find((s) => s.name.toLowerCase() === destination.toLowerCase());
  if (!originSystem) throw new Error(`No system named "${origin}" found. Names must be exact.`);
  if (!destSystem) throw new Error(`No system named "${destination}" found. Names must be exact.`);

  const systemIds = await getRoute(originSystem.id, destSystem.id, preferSafer ? "secure" : "shortest");
  if (systemIds.length === 0) {
    throw new Error(`No route found between ${origin} and ${destination}.`);
  }

  const route: RouteJump[] = await Promise.all(
    systemIds.map(async (systemId) => {
      const [system, activity] = await Promise.all([
        getSystem(systemId),
        getSystemActivity(systemId),
      ]);
      const security = Number(system.security_status.toFixed(1));
      const warnings: string[] = [];
      const gank = GANK_CHOKEPOINTS[system.name];
      if (gank) warnings.push(gank);
      if (activity.shipKillsLastHour >= 10) {
        warnings.push(`Hot right now: ${activity.shipKillsLastHour} ship kills in the last hour.`);
      }
      return {
        system: system.name,
        security,
        securityClass: securityClass(security),
        shipKillsLastHour: activity.shipKillsLastHour,
        podKillsLastHour: activity.podKillsLastHour,
        warnings,
      };
    }),
  );

  const lowSecOrWorseJumps = route.filter((jump) => jump.securityClass !== "high-sec").length;
  const hottestSystems = [...route]
    .sort((a, b) => b.shipKillsLastHour - a.shipKillsLastHour)
    .slice(0, 3)
    .filter((jump) => jump.shipKillsLastHour > 0)
    .map((jump) => ({ system: jump.system, shipKillsLastHour: jump.shipKillsLastHour }));

  return {
    origin: originSystem.name,
    destination: destSystem.name,
    preference: preferSafer ? "safest (high-sec where possible)" : "shortest",
    jumps: route.length - 1,
    lowSecOrWorseJumps,
    hottestSystems,
    route,
    note:
      "Kill counts are the whole last hour for the system, not aimed at you — a hot high-sec system usually " +
      "means ganking, a hot low/null system means PvP. Named chokepoints are camped routinely regardless of the " +
      "current count: in those, don't autopilot, don't fly a loaded hauler, and consider a detour.",
  };
}
