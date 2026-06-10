/**
 * EVE slang glossary — the jargon wall is a researched top-10 new-player
 * pain point and no other tool addresses it. Definitions follow EVE
 * University wiki usage.
 */

export const GLOSSARY: Record<string, string> = {
  ratting: "Killing NPC pirates ('rats') in belts or anomalies for bounty ISK.",
  krab: "Someone farming PvE income (ratting/mining) instead of fighting; 'krabbing' is doing that. Mildly derogatory, mostly affectionate.",
  dscan: "Directional scanner (Alt+D): shows ships/structures within 14.3 AU. Spamming it is how you see hunters coming.",
  gank: "Killing a much weaker or unprepared target, often suicide-attacking in high-sec where CONCORD will kill you back.",
  gatecamp: "Players parked at a stargate killing whatever jumps through. Check zKillboard before flying low-sec pipes.",
  pod: "Your escape capsule after your ship dies. Getting 'podded' means losing that too — you wake up in a clone.",
  "pod express": "Getting podded on purpose (or accepting it) as free instant travel back to your home station.",
  plex: "Two meanings: PLEX the item (30 days of game time, buyable/sellable for ISK) and 'plexing' (capturing faction-warfare complexes).",
  doctrine: "A fleet's standardized ship fitting. 'Doctrine ships' are what your alliance tells you to fly so logi can keep you alive.",
  fc: "Fleet Commander — calls targets and movement. 'FC, what do?' is the eternal question.",
  srp: "Ship Replacement Program — your alliance reimburses ships lost on sanctioned fleets. Makes fleet PvP nearly free.",
  hisec: "High security space (0.5–1.0): CONCORD punishes attackers. Not safe, just policed.",
  lowsec: "Low security (0.1–0.4): no CONCORD response, gate guns only. Faction warfare and pirate country.",
  nullsec: "0.0 space: no law at all, player alliances own it. Big fleets, big riches, bubbles.",
  jspace: "Wormhole space (J-numbered systems): no local chat, no stargates, mapped only by scanning.",
  local: "The chat channel listing everyone in your system — null-sec's primary intel tool. Watch it like a smoke detector.",
  blob: "An overwhelmingly larger fleet. 'Getting blobbed' = losing to numbers, not skill.",
  kite: "Fighting at range while staying faster than the enemy can close. Opposite of brawling.",
  brawl: "Close-range, high-damage slugging match. Webs and scrams decide it.",
  tackle: "Holding an enemy ship in place with warp disruption so it can't escape. The newbie fleet job that gets you on every killmail.",
  point: "Warp Disruptor (1 warp-strength block, longer range). 'Point!' in fleet chat means 'I have them tackled.'",
  scram: "Warp Scrambler (2 strength, short range, also shuts off microwarpdrives).",
  web: "Stasis Webifier — slows the target so your guns track and your scram range holds.",
  neut: "Energy Neutralizer — drains the target's capacitor so their guns/reps/prop die.",
  dps: "Damage per second. Also shorthand for the damage-dealing ships in a fleet (vs tackle/logi).",
  tank: "Your defenses. Buffer tank = raw HP, active tank = repairing yourself. Pick shield OR armor, never both.",
  logi: "Logistics ships — fleet healers that remote-repair friendlies. Always blamed, never thanked.",
  alpha: "Two meanings: an Alpha clone (free-to-play account) or alpha strike (one massive volley before the target can react).",
  omega: "A subscribed account: all skills available, double training speed.",
  cyno: "Cynosural field — a beacon capital ships jump to. Lighting one in the wrong place is how supercarriers die.",
  capital: "The big ships: carriers, dreadnoughts, supercarriers, titans. Null-sec endgame, terrible newbie purchases.",
  bait: "A deliberately vulnerable-looking ship with friends one jump away. If it looks too easy, it is.",
  awox: "Attacking your own corpmates from inside the corp. Why corps are paranoid about recruits.",
  tidi: "Time dilation — the server slowing time (down to 10%) so thousand-player battles can compute.",
  jita: "The main trade hub (Jita 4-4 station). Everything is for sale; undocking there is the most dangerous trip in high-sec.",
  "asset safety": "When you lose access to a player structure, your stuff moves to a recoverable holding system (delivered to an NPC station for a fee). Your items are never deleted.",
  concord: "The high-sec police. They don't prevent crime — they punish it after your ship is already dead.",
  "sec status": "Your personal security rating. Goes down for attacking players in hisec/lowsec; below -5 you're freely attackable everywhere.",
  standings: "NPC factions' opinion of you. Gates which mission agents will talk to you.",
  lp: "Loyalty Points — mission/FW currency spent in corp stores for faction gear. Often worth more than the ISK reward.",
  abyssals: "Abyssal Deadspace — timed instanced PvE dungeons entered with filaments. Die inside or run out of time and you lose everything.",
  filament: "Consumable that teleports you into abyssal space or across the universe (Pochven/null filaments).",
  "jump clone": "A second body you can jump into across the map (with cooldown) — lets you keep an expensive-implant clone safe at home.",
  align: "Pointing your ship at a warp target so warp engages instantly. 'Align out' = be ready to flee.",
  bubble: "Warp disruption field in null-sec that stops everyone in it from warping — no targeting needed. Why null travel kills newbies.",
  bm: "Bookmark — a saved location in space. Safe spots, undock points, and tactical perches are all bookmarks.",
};

export function defineJargon(term?: string): unknown {
  if (!term) {
    return { knownTerms: Object.keys(GLOSSARY).sort() };
  }
  const normalized = term.toLowerCase().trim();
  const exact = GLOSSARY[normalized];
  if (exact) return { term: normalized, definition: exact };

  const partial = Object.entries(GLOSSARY).filter(
    ([key]) => key.includes(normalized) || normalized.includes(key),
  );
  if (partial.length > 0) {
    return Object.fromEntries(partial);
  }
  return {
    error: `"${term}" isn't in the glossary yet.`,
    knownTerms: Object.keys(GLOSSARY).sort(),
  };
}
