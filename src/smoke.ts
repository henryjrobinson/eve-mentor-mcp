/**
 * Live smoke test of the public-data layer (no SSO needed): npm run smoke
 * Exercises name resolution, type info, market, system intel, and zKillboard.
 */

import { getJitaPrices, getSystemActivity, getType, resolveNames, getSystem } from "./esi.js";
import { getRecentLosses } from "./zkill.js";

const testCharacter = process.argv[2];

const ids = await resolveNames(["Rifter", "Tama"]);
const rifter = ids.inventory_types?.[0];
const tama = ids.systems?.[0];
if (!rifter || !tama) throw new Error("name resolution failed");
console.log("resolve ok:", rifter, tama);

const type = await getType(rifter.id);
console.log("type ok:", type.name, "| description length:", type.description.length);

const prices = await getJitaPrices(rifter.id);
console.log("market ok:", prices);

const system = await getSystem(tama.id);
const activity = await getSystemActivity(tama.id);
console.log("system ok:", system.name, system.security_status.toFixed(1), activity);

if (testCharacter) {
  const losses = await getRecentLosses(testCharacter, 1);
  console.log("zkill ok:", JSON.stringify(losses, null, 2));
} else {
  console.log("zkill skipped (pass a character name as argv to test)");
}

console.log("ALL SMOKE TESTS PASSED");
