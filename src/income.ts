/**
 * ISK guidance: viable income activities by skillpoint tier, for new and
 * returning players. Static, curated knowledge — NOT live data.
 *
 * The ISK/hour figures are deliberately broad community-consensus ranges
 * (EVE University income pages + long-running r/Eve threads). They exist for
 * relative comparison ("exploration beats mining for a newbie"), not as
 * promises. Live prices always come from the market tools, never here.
 */

export interface IncomeActivity {
  activity: string;
  iskPerHour: string;
  whatYouNeed: string;
  firstStep: string;
  /** Cross-reference to a CAREER_PATHS name where one matches. */
  career?: string;
}

export interface IncomeTier {
  tier: string;
  label: string;
  summary: string;
  activities: IncomeActivity[];
}

export const INCOME_TIERS: IncomeTier[] = [
  {
    tier: "0-1M SP",
    label: "Brand new (first few days)",
    summary:
      "You're in starter and career-agent ships. The point right now is learning, not ISK — and the career agents pay better than anything else you can do at this level while teaching the basics. Do those first.",
    activities: [
      {
        activity: "Career agent missions (the EVE Academy tutorial chain)",
        iskPerHour: "one-time: ~10-20M total in rewards PLUS free ships (including a Venture)",
        whatYouNeed: "Just your starter frigate; the agents hand you ships and modules as you go.",
        firstStep:
          "Open the Agency → Career Agents, find all five sets (Military, Business, Industry, Exploration, Advanced Military) and run every one.",
      },
      {
        activity: "High-sec data & relic exploration",
        iskPerHour: "~5-30M, high variance",
        whatYouNeed: "Astrometrics I-III, a probe launcher + data/relic analyzer on a Heron or Imicus.",
        firstStep:
          "Scan down data/relic sites in quiet high-sec systems, hack the cans, sell loot at a trade hub. Cheap to start, nothing to lose.",
        career: "Exploration (relic/data sites)",
      },
      {
        activity: "Level 1 security missions",
        iskPerHour: "~5-15M",
        whatYouNeed: "A combat frigate with ammo matched to the enemy faction (see ammo_advisor).",
        firstStep: "Find a level 1 security agent near your start and work the easy combat missions.",
        career: "Mission running",
      },
      {
        activity: "Venture mining in high-sec",
        iskPerHour: "~5-10M",
        whatYouNeed: "The free Venture from the Industry career agent.",
        firstStep: "Mine the most valuable ore you can reach, sell at the nearest hub, ideally on a group op.",
        career: "Mining",
      },
    ],
  },
  {
    tier: "1-5M SP",
    label: "Finding your feet (around the Alpha skill cap)",
    summary:
      "Now you can fly destroyers and cruisers and your scanning is real. This is where exploration starts paying disproportionately well for your skillpoints — the best ISK-per-SP a new player can get.",
    activities: [
      {
        activity: "Low-sec / null-sec / wormhole exploration",
        iskPerHour: "~20-80M+, high variance",
        whatYouNeed: "Astrometrics III-IV, a cloaky T1 scanning frigate, and nerve.",
        firstStep:
          "Take wormholes or low-sec gates into quieter space; hack relic sites (they out-pay data). Run from anything that shoots — your ship is cheap, your pod is not.",
        career: "Exploration (relic/data sites)",
      },
      {
        activity: "Level 2-3 security missions",
        iskPerHour: "~15-40M",
        whatYouNeed: "A well-tanked destroyer or cruiser with damage matched to the faction.",
        firstStep: "Build standings with one corp's agents and climb from L2 to L3.",
        career: "Mission running",
      },
      {
        activity: "Ratting in a Vexor (drone cruiser)",
        iskPerHour: "~10-25M",
        whatYouNeed: "A Vexor plus drone skills; it's the classic newbie ISK workhorse.",
        firstStep: "Clear combat anomalies in low-true-sec high-sec or quiet low-sec, drones matched to faction.",
        career: "Ratting",
      },
      {
        activity: "Tier 0-1 Abyssal Deadspace",
        iskPerHour: "~20-40M",
        whatYouNeed: "A tanky T1 cruiser you can afford to lose; the 20-minute timer is the real threat.",
        firstStep: "Buy a few T0/T1 filaments, practice in the lowest tier until clears are comfortable.",
        career: "Abyssal Deadspace",
      },
    ],
  },
  {
    tier: "5-20M SP",
    label: "Competent (battlecruiser / specialised cruiser pilot)",
    summary:
      "You can field a serious PvE ship and tank real damage. Income roughly doubles, and group content (incursions) opens up.",
    activities: [
      {
        activity: "Level 4 security missions",
        iskPerHour: "~20-60M",
        whatYouNeed: "A battlecruiser or battleship, a strong tank, and ideally T2 weapons.",
        firstStep: "Unlock L4 agents through standings, blitz the high-ISK missions, salvage as you go.",
        career: "Mission running",
      },
      {
        activity: "Tier 2-3 Abyssals in a Gila",
        iskPerHour: "~40-80M",
        whatYouNeed: "A Gila with solid shield + drone skills — the meta Abyssal runner.",
        firstStep: "Step up one tier at a time; never enter a tier you can't reliably clear inside the timer.",
        career: "Abyssal Deadspace",
      },
      {
        activity: "Null-sec / wormhole exploration & combat sites",
        iskPerHour: "~40-100M+, high variance",
        whatYouNeed: "Strong scanning plus a combat-capable ship, usually via a corp that holds space.",
        firstStep: "Join a null or wormhole corp; their space and intel multiply what exploration pays.",
        career: "Wormhole living",
      },
      {
        activity: "Faction Warfare plexing (loyalty points)",
        iskPerHour: "~20-60M in LP value",
        whatYouNeed: "Cheap T1/faction frigates and a militia membership.",
        firstStep: "Run novice/small complexes, convert LP through a good store, expect PvP interruptions.",
        career: "Faction Warfare",
      },
    ],
  },
  {
    tier: "20M+ SP",
    label: "Established (specialise and scale)",
    summary:
      "Skillpoints stop being the bottleneck; ship choice, fit, and how much risk you'll take now decide your income. Trading and industry scale with capital, not SP, and can out-earn everything here.",
    activities: [
      {
        activity: "Level 4 blitzing / burner missions",
        iskPerHour: "~40-80M",
        whatYouNeed: "Specialised mission ships (marauders later) and route optimisation.",
        firstStep: "Learn which L4s to blitz and which to skip; burners need dedicated frigate/AF fits.",
        career: "Mission running",
      },
      {
        activity: "Tier 4-5 Abyssals",
        iskPerHour: "~80-150M, high risk",
        whatYouNeed: "An expensive, perfectly-skilled fit — a single mistake loses the whole ship.",
        firstStep: "Only push past T3 once T3 is trivial and you've memorised the dangerous spawns.",
        career: "Abyssal Deadspace",
      },
      {
        activity: "Incursions (organised fleets)",
        iskPerHour: "~80-150M",
        whatYouNeed: "A community-mandated battleship/logi fit and a fleet to run with.",
        firstStep: "Apply to a public incursion community, fit exactly to their doctrine, learn the sites.",
        career: "Incursions",
      },
      {
        activity: "Null-sec ratting in alliance space",
        iskPerHour: "~40-100M, scales to capitals later",
        whatYouNeed: "A ratting cruiser/battleship and sovereign null space (i.e. a bloc).",
        firstStep: "Use your alliance's ratting systems and intel channels; upgrade toward a carrier over time.",
        career: "Null-sec sovereignty warfare",
      },
      {
        activity: "Trading & industry",
        iskPerHour: "scales with capital, not skillpoints — can exceed everything above",
        whatYouNeed: "Seed ISK, market knowledge, and patience rather than combat skills.",
        firstStep: "Start station trading high-volume items in Jita; compound margins instead of grinding.",
        career: "Trading / market PvP",
      },
    ],
  },
];

export interface IskGuidance {
  disclaimer: string;
  tiers: IncomeTier[];
}

const DISCLAIMER =
  "ISK/hour figures are rough community-consensus ranges (EVE University + r/Eve), not live data. " +
  "Real income swings hard with your skills, ship, region, market prices, and luck — exploration " +
  "especially is feast-or-famine. Use these for relative comparison, not as promises. These numbers " +
  "are static and can drift between patches; live prices come from the market tools.";

/** Pick the income tier for a given total skillpoints. */
export function tierForSkillpoints(totalSkillpoints: number): IncomeTier {
  if (totalSkillpoints < 1_000_000) return INCOME_TIERS[0];
  if (totalSkillpoints < 5_000_000) return INCOME_TIERS[1];
  if (totalSkillpoints < 20_000_000) return INCOME_TIERS[2];
  return INCOME_TIERS[3];
}

/** The full ISK guide, all tiers. */
export function getIskGuidance(): IskGuidance {
  return { disclaimer: DISCLAIMER, tiers: INCOME_TIERS };
}
