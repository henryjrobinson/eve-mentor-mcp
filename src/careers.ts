/**
 * Career path taxonomy for the playstyle "sorting hat".
 * The MCP client (Claude) runs the interview; this is the matching data.
 * Sources: EVE University careers wiki, CCP's EVE Academy archetypes.
 */

export interface CareerPath {
  name: string;
  archetype: "Explorer" | "Industrialist" | "Enforcer" | "Soldier";
  description: string;
  appealsTo: string;
  social: "solo" | "either" | "group";
  risk: "low" | "medium" | "high";
  income: "low" | "medium" | "high" | "none early";
  activity: "active" | "semi-active" | "passive";
  firstShip: string;
  firstSteps: string;
  newbieFriendly: boolean;
}

export const CAREER_PATHS: CareerPath[] = [
  {
    name: "Exploration (relic/data sites)",
    archetype: "Explorer",
    description:
      "Probe-scan hidden sites across dangerous space, hack containers for loot, run from anything that shoots.",
    appealsTo:
      "Players who like treasure hunting, tension without forced combat, and playing smart instead of strong.",
    social: "solo",
    risk: "medium",
    income: "high",
    activity: "active",
    firstShip: "Heron / Imicus (T1 scanning frigate)",
    firstSteps:
      "Train Astrometrics, fit a relic/data analyzer + probe launcher, take wormholes or null-sec entrances and hack everything you find.",
    newbieFriendly: true,
  },
  {
    name: "Faction Warfare",
    archetype: "Soldier",
    description:
      "Enlist with an empire militia; capture complexes and fight small-ship PvP for loyalty point payouts.",
    appealsTo:
      "Players who want real PvP fast, in cheap ships, with a built-in team and a reason to fight.",
    social: "either",
    risk: "high",
    income: "medium",
    activity: "active",
    firstShip: "T1 frigate (Tristan, Merlin, Punisher, Rifter)",
    firstSteps:
      "Join a militia (or an FW newbie corp like Minmatar Fleet Academy), buy 10 cheap fitted frigates, expect to lose them all, learn from each one.",
    newbieFriendly: true,
  },
  {
    name: "Mission running",
    archetype: "Enforcer",
    description:
      "Run combat missions for NPC agents, climbing from level 1 to level 4 for ISK and loyalty points.",
    appealsTo:
      "Players who want structured PvE with clear goals, steady progression, and low surprise.",
    social: "solo",
    risk: "low",
    income: "medium",
    activity: "active",
    firstShip: "T1 frigate → destroyer → cruiser",
    firstSteps:
      "Find a level 1 security agent, match your ammo damage type to the enemy faction, work up the ladder.",
    newbieFriendly: true,
  },
  {
    name: "Abyssal Deadspace",
    archetype: "Enforcer",
    description:
      "Timed instanced dungeons with escalating tiers — EVE's closest thing to a roguelike arena.",
    appealsTo: "Players who like skill-expression PvE, measurable difficulty tiers, and adrenaline.",
    social: "solo",
    risk: "medium",
    income: "high",
    activity: "active",
    firstShip: "Well-fitted cruiser (Gila is the meta; a T1 cruiser can run low tiers)",
    firstSteps:
      "Start at tier 0/1 filaments in a cheap cruiser; the timer is the real enemy — die inside and you lose everything.",
    newbieFriendly: true,
  },
  {
    name: "Mining",
    archetype: "Industrialist",
    description: "Extract ore, ice, and gas to sell or feed into manufacturing.",
    appealsTo:
      "Players who want low-stress, semi-passive play — podcast in one ear, lasers on rocks.",
    social: "either",
    risk: "low",
    income: "low",
    activity: "semi-active",
    firstShip: "Venture (free from career agents)",
    firstSteps:
      "Run the industry career agent for a free Venture, mine high-sec belts, sell at the nearest hub; join group mining ops for company.",
    newbieFriendly: true,
  },
  {
    name: "Ratting",
    archetype: "Enforcer",
    description: "Hunt NPC pirates in asteroid belts and anomalies for bounty payouts.",
    appealsTo: "Players who want simple combat income without mission structure.",
    social: "solo",
    risk: "low",
    income: "low",
    activity: "active",
    firstShip: "Any combat frigate; Vexor later",
    firstSteps: "Match damage types to the local pirate faction and clear belts/anomalies.",
    newbieFriendly: true,
  },
  {
    name: "Hauling / logistics",
    archetype: "Industrialist",
    description: "Move goods between markets via courier contracts or your own trading.",
    appealsTo: "Players who enjoy logistics puzzles and quiet profit over combat.",
    social: "solo",
    risk: "medium",
    income: "medium",
    activity: "semi-active",
    firstShip: "T1 industrial (Iteron Mark V, Badger)",
    firstSteps:
      "Take small courier contracts; never autopilot through Uedama or Niarja-class chokepoints with valuable cargo.",
    newbieFriendly: true,
  },
  {
    name: "Trading / market PvP",
    archetype: "Industrialist",
    description:
      "Station trading and regional arbitrage — playing the market instead of the spaceship.",
    appealsTo: "Spreadsheet enjoyers, economics nerds, patient compounding-gains people.",
    social: "solo",
    risk: "low",
    income: "high",
    activity: "passive",
    firstShip: "None — a docked alt and seed capital",
    firstSteps:
      "Start with 0.01-ISK-style margin trading on high-volume items in Jita; learn buy vs sell orders with small stakes.",
    newbieFriendly: true,
  },
  {
    name: "Manufacturing & research",
    archetype: "Industrialist",
    description: "Buy blueprints, build modules/ships, research efficiency, sell output.",
    appealsTo: "Builders and optimizers who want to make the things everyone else explodes.",
    social: "either",
    risk: "low",
    income: "medium",
    activity: "passive",
    firstShip: "None initially",
    firstSteps:
      "Build T1 ammo from a cheap blueprint near a trade hub; profit is thin but the loop teaches the whole economy.",
    newbieFriendly: true,
  },
  {
    name: "Planetary Industry",
    archetype: "Industrialist",
    description: "Semi-passive resource colonies on planets, harvested on a timer.",
    appealsTo: "Players who like idle-game mechanics layered onto their main activity.",
    social: "solo",
    risk: "low",
    income: "low",
    activity: "passive",
    firstShip: "Any",
    firstSteps: "Train Command Center Upgrades, drop colonies on high-sec planets, restart extractors every few days.",
    newbieFriendly: true,
  },
  {
    name: "Wormhole living",
    archetype: "Explorer",
    description:
      "Move into uncharted J-space with a corp: scanning, krabbing, and ambush PvP with no local chat.",
    appealsTo: "Players who want the frontier — self-reliance, paranoia, tight-knit crews.",
    social: "group",
    risk: "high",
    income: "high",
    activity: "active",
    firstShip: "Scanning frigate; corp provides doctrine ships",
    firstSteps: "Not a first-month path solo — join a wormhole corp that teaches.",
    newbieFriendly: false,
  },
  {
    name: "Null-sec sovereignty warfare",
    archetype: "Soldier",
    description:
      "Join a null bloc (Pandemic Horde, Brave, etc.): big fleet fights, doctrine ships, alliance life.",
    appealsTo:
      "Players who want to be part of something huge — thousand-pilot battles and politics.",
    social: "group",
    risk: "medium",
    income: "medium",
    activity: "active",
    firstShip: "Whatever the alliance doctrine hands you",
    firstSteps:
      "Join a newbie-friendly bloc, follow the fleet, shoot what the FC calls. Free ships are common.",
    newbieFriendly: true,
  },
  {
    name: "Incursions",
    archetype: "Enforcer",
    description: "High-end organized fleet PvE against Sansha invasions — elite income, strict fits.",
    appealsTo: "PvE players who want raid-style group content.",
    social: "group",
    risk: "low",
    income: "high",
    activity: "active",
    firstShip: "Battleship with a community-mandated fit",
    firstSteps: "A months-long training target, not a starting point.",
    newbieFriendly: false,
  },
  {
    name: "Salvaging",
    archetype: "Industrialist",
    description: "Sweep battlefields and mission wrecks for salvage materials.",
    appealsTo: "Scavenger-brain players; pairs well with mission running.",
    social: "either",
    risk: "low",
    income: "low",
    activity: "active",
    firstShip: "Destroyer with salvagers → Noctis",
    firstSteps: "Follow your own mission wrecks first; public wreck fields later.",
    newbieFriendly: true,
  },
  {
    name: "Piracy / ganking",
    archetype: "Soldier",
    description:
      "Legal-but-hostile sandbox crime: suicide ganking, can-flipping, ransoms, scams.",
    appealsTo: "Villain-arc players. EVE genuinely permits it; the community will remember you.",
    social: "either",
    risk: "high",
    income: "medium",
    activity: "active",
    firstShip: "Cheap Catalyst",
    firstSteps: "Understand CONCORD and sec status mechanics first or you'll lock yourself out of empire space.",
    newbieFriendly: false,
  },
];
