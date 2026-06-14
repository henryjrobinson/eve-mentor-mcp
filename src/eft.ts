/**
 * Parser for EFT-format fits — the plain-text format every fitting site,
 * PyFA, and the in-game fitting window export and import.
 *
 * Shape:
 *   [ShipName, Fit name]
 *   <module>[, <loaded charge>][ xN]
 *   <blank lines separate slot groups>
 *   [Empty High slot]        <- ignored
 */

export interface ParsedFit {
  shipName: string | null;
  /** Unique module/charge names, charges and quantities stripped, empty slots removed. */
  moduleNames: string[];
}

const HEADER = /^\[([^,\]]+)/; // "[Heron, Exploration]" -> "Heron"
const QUANTITY = /\s+x\d+$/i; // "Hobgoblin I x2" -> "Hobgoblin I"

export function parseEft(text: string): ParsedFit {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) return { shipName: null, moduleNames: [] };

  const headerMatch = lines[0].match(HEADER);
  const shipName = headerMatch ? headerMatch[1].trim() : null;

  const seen = new Set<string>();
  const moduleNames: string[] = [];
  for (const line of lines.slice(headerMatch ? 1 : 0)) {
    if (line.startsWith("[")) continue; // empty-slot markers and section headers
    // EFT separates a module from its loaded charge with a comma; no item name
    // contains one, so the part before the first comma is always the module.
    const name = line.split(",")[0].replace(QUANTITY, "").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    moduleNames.push(name);
  }

  return { shipName, moduleNames };
}
