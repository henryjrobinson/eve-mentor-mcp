/**
 * Combat coaching: ammo/damage-type advice and mechanical fit analysis.
 * Damage tables follow EVE University's canonical NPC damage reference
 * (https://wiki.eveuniversity.org/NPC_damage_types).
 */

import { esiFetch, getType, resolveNames } from "./esi.js";

// ---------- Ammo / damage-type advisor ----------

interface DamageAdvice {
  target: string;
  shootDamageTypes: string[];
  incomingDamageTypes: string[];
  tankAgainst: string;
  ammoExamples: Record<string, string>;
}

const AMMO_BY_DAMAGE: Record<string, Record<string, string>> = {
  EM: {
    projectile: "EMP S/M/L",
    missile: "Mjolnir missiles",
    drones: "Amarr drones (Acolyte/Infiltrator/Praetor)",
    laser: "any crystal (lasers always deal EM+Thermal)",
    hybrid: "not available — hybrids only deal Kinetic+Thermal",
  },
  Thermal: {
    projectile: "Phased Plasma S/M/L",
    missile: "Inferno missiles",
    drones: "Gallente drones (Hobgoblin/Hammerhead/Ogre)",
    laser: "any crystal (lasers always deal EM+Thermal)",
    hybrid: "any charge (hybrids always deal Kinetic+Thermal)",
  },
  Kinetic: {
    projectile: "Titanium Sabot S/M/L",
    missile: "Scourge missiles",
    drones: "Caldari drones (Hornet/Vespa/Wasp)",
    laser: "not available — lasers only deal EM+Thermal",
    hybrid: "any charge (hybrids always deal Kinetic+Thermal)",
  },
  Explosive: {
    projectile: "Fusion S/M/L",
    missile: "Nova missiles",
    drones: "Minmatar drones (Warrior/Valkyrie/Berserker)",
    laser: "not available — lasers only deal EM+Thermal",
    hybrid: "not available — hybrids only deal Kinetic+Thermal",
  },
};

function advice(
  target: string,
  shootDamageTypes: string[],
  incomingDamageTypes: string[],
): DamageAdvice {
  const primary = shootDamageTypes[0];
  return {
    target,
    shootDamageTypes,
    incomingDamageTypes,
    tankAgainst: incomingDamageTypes.join(" + "),
    ammoExamples: AMMO_BY_DAMAGE[primary] ?? {},
  };
}

const DAMAGE_ADVICE: Record<string, DamageAdvice> = {
  guristas: advice("Guristas", ["Kinetic", "Thermal"], ["Kinetic", "Thermal"]),
  serpentis: advice("Serpentis", ["Thermal", "Kinetic"], ["Thermal", "Kinetic"]),
  "angel cartel": advice("Angel Cartel", ["Explosive", "Kinetic"], ["Explosive", "Kinetic"]),
  "blood raiders": advice("Blood Raiders", ["EM", "Thermal"], ["EM", "Thermal"]),
  sansha: advice("Sansha's Nation", ["EM", "Thermal"], ["EM", "Thermal"]),
  "rogue drones": advice("Rogue Drones", ["EM", "Thermal"], ["Explosive", "Kinetic"]),
  triglavian: advice("Triglavian Collective", ["Explosive", "Thermal"], ["Explosive", "Thermal"]),
  "shield-tanked player": advice(
    "Shield-tanked player ship",
    ["EM", "Thermal"],
    ["anything — match your tank to their guns"],
  ),
  "armor-tanked player": advice(
    "Armor-tanked player ship",
    ["Explosive", "Kinetic"],
    ["anything — match your tank to their guns"],
  ),
};



/** Damage-type advice for a target faction or tank type. */
export function adviseAmmo(target: string): DamageAdvice | { error: string; knownTargets: string[] } {
  const normalized = target.toLowerCase();
  const match = Object.keys(DAMAGE_ADVICE).find(
    (key) => normalized.includes(key) || key.includes(normalized),
  );
  if (!match) {
    return {
      error: `No damage data for "${target}".`,
      knownTargets: Object.values(DAMAGE_ADVICE).map((entry) => entry.target),
    };
  }
  return DAMAGE_ADVICE[match];
}

// ---------- Fit analysis ----------

const groupNameCache = new Map<number, string>();

async function getGroupName(groupId: number): Promise<string> {
  const cached = groupNameCache.get(groupId);
  if (cached) return cached;
  const { data } = await esiFetch<{ name: string }>(`/universe/groups/${groupId}/`);
  groupNameCache.set(groupId, data.name);
  return data.name;
}

interface ClassifiedModule {
  name: string;
  group: string;
}

const TURRET_GROUPS = ["Projectile Weapon", "Hybrid Weapon", "Energy Weapon"];
const DAMAGE_MOD_TO_WEAPON: Record<string, string> = {
  Gyrostabilizer: "Projectile Weapon",
  "Magnetic Field Stabilizer": "Hybrid Weapon",
  "Heat Sink": "Energy Weapon",
  "Ballistic Control system": "Missile Launcher",
};

async function classifyModules(moduleNames: string[]): Promise<ClassifiedModule[]> {
  const unique = [...new Set(moduleNames)];
  const resolved = await resolveNames(unique);
  const types = resolved.inventory_types ?? [];

  return Promise.all(
    types.map(async (entry) => {
      const type = await getType(entry.id);
      return { name: entry.name, group: await getGroupName(type.group_id) };
    }),
  );
}

function findRedFlags(modules: ClassifiedModule[]): string[] {
  const flags: string[] = [];
  const groups = modules.map((m) => m.group);

  const turretClasses = TURRET_GROUPS.filter((turret) => groups.includes(turret));
  const hasMissiles = groups.some((g) => g.includes("Missile Launcher"));
  const weaponSystemCount = turretClasses.length + (hasMissiles ? 1 : 0);
  if (weaponSystemCount > 1) {
    flags.push(
      `MIXED WEAPON SYSTEMS (${[...turretClasses, ...(hasMissiles ? ["Missiles"] : [])].join(", ")}): ` +
        "ships bonus exactly one weapon system; the others waste slots, fitting room, and ammo logistics. Pick the hull's bonused system.",
    );
  }

  const hasShieldTank = groups.some((g) => g.includes("Shield"));
  const hasArmorTank = groups.some((g) => g.includes("Armor") || g.includes("Hull"));
  if (hasShieldTank && hasArmorTank) {
    flags.push(
      "MIXED TANK (shield and armor modules together): pick one. Splitting tank halves your effective HP and wastes slots that should hold damage or utility.",
    );
  }

  const hasPropulsion = groups.some((g) => g.includes("Propulsion"));
  if (!hasPropulsion) {
    flags.push(
      "NO PROPULSION MODULE (afterburner/microwarpdrive): speed controls range, and range controls every fight. Almost every fit wants one.",
    );
  }

  for (const [damageMod, weaponGroup] of Object.entries(DAMAGE_MOD_TO_WEAPON)) {
    const hasDamageMod = modules.some((m) => m.group === damageMod);
    const hasMatchingWeapon = groups.some((g) => g.includes(weaponGroup));
    if (hasDamageMod && !hasMatchingWeapon) {
      flags.push(
        `${damageMod.toUpperCase()} FITTED WITHOUT ${weaponGroup.toUpperCase()}S: this damage module boosts a weapon type the fit doesn't carry — it does nothing.`,
      );
    }
  }

  return flags;
}

export interface FitAnalysis {
  modules: ClassifiedModule[];
  redFlags: string[];
  unresolvedNames: string[];
}

/**
 * Mechanical fit check: classify modules by group and detect classic
 * newbie mistakes. Interpretation/coaching is the AI client's job.
 */
export async function analyzeFit(moduleNames: string[]): Promise<FitAnalysis> {
  const classified = await classifyModules(moduleNames);
  const resolvedNames = new Set(classified.map((m) => m.name.toLowerCase()));
  const unresolvedNames = [...new Set(moduleNames)].filter(
    (name) => !resolvedNames.has(name.toLowerCase()),
  );
  return {
    modules: classified,
    redFlags: findRedFlags(classified),
    unresolvedNames,
  };
}
