/**
 * Pilot memory — goals the player asks the mentor to remember, persisted to
 * ~/.config/eve-mentor/memory.json so they survive server restarts. Keyed per
 * character (by character ID) when logged in, so multiple pilots don't mix.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import { authStatus } from "./auth.js";

const MEMORY_DIR = join(homedir(), ".config", "eve-mentor");
const MEMORY_FILE = join(MEMORY_DIR, "memory.json");

export interface MemoryEntry {
  timestamp: string;
  goal: string;
}

type MemoryStore = Record<string, MemoryEntry[]>;

async function loadStore(): Promise<MemoryStore> {
  try {
    return JSON.parse(await readFile(MEMORY_FILE, "utf8")) as MemoryStore;
  } catch {
    return {};
  }
}

async function saveStore(store: MemoryStore): Promise<void> {
  await mkdir(MEMORY_DIR, { recursive: true });
  await writeFile(MEMORY_FILE, JSON.stringify(store, null, 2), { mode: 0o600 });
}

/** Which pilot's memory to read/write — falls back to a shared bucket when not logged in. */
async function pilotKey(): Promise<{ key: string; pilot: string }> {
  const auth = await authStatus();
  if (auth.loggedIn && auth.characterId) {
    return { key: String(auth.characterId), pilot: auth.characterName ?? "your pilot" };
  }
  return { key: "anonymous", pilot: "anonymous (not logged in)" };
}

export async function rememberGoal(
  goal: string,
): Promise<{ saved: MemoryEntry; pilot: string; totalGoals: number }> {
  const trimmed = goal.trim();
  if (!trimmed) {
    throw new Error("Nothing to remember — pass the goal the pilot stated.");
  }
  const { key, pilot } = await pilotKey();
  const store = await loadStore();
  const entries = store[key] ?? [];
  const saved: MemoryEntry = { timestamp: new Date().toISOString(), goal: trimmed };
  entries.push(saved);
  store[key] = entries;
  await saveStore(store);
  return { saved, pilot, totalGoals: entries.length };
}

export async function recallPilotNotes(): Promise<{
  pilot: string;
  goals: MemoryEntry[];
  note: string;
}> {
  const { key, pilot } = await pilotKey();
  const store = await loadStore();
  const goals = store[key] ?? []; // append order is chronological

  return {
    pilot,
    goals,
    note: goals.length
      ? "Goals the pilot asked you to remember, oldest first. Use them to steer coaching and what_should_i_do_tonight."
      : "No saved goals yet. Call remember_goal when the pilot states an ambition (e.g. 'I want to fly a Gila for abyssals').",
  };
}
