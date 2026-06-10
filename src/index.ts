#!/usr/bin/env node
/**
 * eve-mentor-mcp — MCP server that turns Claude into an EVE Online mentor.
 * Public tools work immediately; character tools need EVE SSO login.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { authStatus, login } from "./auth.js";
import { getCharacterSheet, getSkillQueue, getTopSkills } from "./character.js";
import {
  getJitaPrices,
  getSystem,
  getSystemActivity,
  getType,
  resolveNames,
} from "./esi.js";
import { getRecentLosses } from "./zkill.js";
import { flightPlan } from "./skills.js";
import { CAREER_PATHS } from "./careers.js";

const server = new McpServer({ name: "eve-mentor", version: "0.1.0" });

type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

function asResult(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function asError(error: unknown): ToolResult {
  const message = error instanceof Error ? error.message : String(error);
  return { content: [{ type: "text", text: message }], isError: true };
}

// ---------- Public tools ----------

server.tool(
  "lookup_item",
  "Look up any EVE item, ship, or module by exact name. Returns its description and Jita market prices.",
  { name: z.string().describe('Exact in-game name, e.g. "Rifter" or "Damage Control II"') },
  async ({ name }) => {
    try {
      const ids = await resolveNames([name]);
      const type = ids.inventory_types?.[0];
      if (!type) {
        return asError(`No item named "${name}" found. Names must be exact.`);
      }
      const [info, prices] = await Promise.all([getType(type.id), getJitaPrices(type.id)]);
      return asResult({
        name: info.name,
        typeId: info.type_id,
        description: info.description.replace(/<[^>]+>/g, ""),
        jitaMarket: prices,
      });
    } catch (error) {
      return asError(error);
    }
  },
);

server.tool(
  "system_intel",
  "Danger report for a solar system: security status, ship/pod kills and traffic in the last hour.",
  { system_name: z.string().describe('Exact system name, e.g. "Jita" or "Tama"') },
  async ({ system_name }) => {
    try {
      const ids = await resolveNames([system_name]);
      const match = ids.systems?.[0];
      if (!match) {
        return asError(`No system named "${system_name}" found. Names must be exact.`);
      }
      const [system, activity] = await Promise.all([
        getSystem(match.id),
        getSystemActivity(match.id),
      ]);
      const security = Number(system.security_status.toFixed(1));
      return asResult({
        system: system.name,
        securityStatus: security,
        securityClass: security >= 0.5 ? "high-sec" : security > 0 ? "low-sec" : "null-sec",
        lastHour: activity,
      });
    } catch (error) {
      return asError(error);
    }
  },
);

server.tool(
  "recent_losses",
  "A character's recent ship losses from zKillboard with full fit detail — the raw material for explaining why they died. Works for any character name, no login needed.",
  {
    character_name: z.string().describe("Exact character name"),
    limit: z.number().int().min(1).max(10).default(3).describe("How many losses (1-10)"),
  },
  async ({ character_name, limit }) => {
    try {
      const losses = await getRecentLosses(character_name, limit);
      if (losses.length === 0) {
        return asResult({ message: `${character_name} has no recorded losses on zKillboard.` });
      }
      return asResult(losses);
    } catch (error) {
      return asError(error);
    }
  },
);

server.tool(
  "can_i_fly",
  "What does it take to fly/use a ship or module? Returns the full recursive skill prerequisite tree, an ordered training plan, total skillpoints, and estimated training time. If a character is logged in, the plan is diffed against their actual trained skills.",
  { item_name: z.string().describe('Exact ship or module name, e.g. "Vexor" or "Damage Control II"') },
  async ({ item_name }) => {
    try {
      const ids = await resolveNames([item_name]);
      const type = ids.inventory_types?.[0];
      if (!type) {
        return asError(`No item named "${item_name}" found. Names must be exact.`);
      }
      return asResult(await flightPlan(type.id, type.name));
    } catch (error) {
      return asError(error);
    }
  },
);

server.tool(
  "career_test",
  "Data for the EVE career 'sorting hat'. Returns all recognized career paths with traits (social/risk/income/activity, who it appeals to, first ship, first steps). To use: interview the player about what they enjoy (solo vs group, risk appetite, building vs fighting vs exploring, active vs idle, how much structure they want), THEN call this and match their answers to 2-3 paths. Recommend concrete first steps, not just labels.",
  {},
  async () => {
    try {
      return asResult(CAREER_PATHS);
    } catch (error) {
      return asError(error);
    }
  },
);

// ---------- Auth + character tools ----------

server.tool(
  "eve_login",
  "Start the EVE Online login flow. Opens a browser for SSO; the user must complete it within 3 minutes.",
  {},
  async () => {
    try {
      const result = await login();
      return asResult({ loggedIn: true, ...result });
    } catch (error) {
      return asError(error);
    }
  },
);

server.tool(
  "eve_auth_status",
  "Check whether an EVE character is currently logged in.",
  {},
  async () => {
    try {
      return asResult(await authStatus());
    } catch (error) {
      return asError(error);
    }
  },
);

server.tool(
  "character_sheet",
  "The logged-in character's overview: total skillpoints, wallet, current location, and ship.",
  {},
  async () => {
    try {
      return asResult(await getCharacterSheet());
    } catch (error) {
      return asError(error);
    }
  },
);

server.tool(
  "skill_queue",
  "The logged-in character's current skill training queue.",
  {},
  async () => {
    try {
      return asResult(await getSkillQueue());
    } catch (error) {
      return asError(error);
    }
  },
);

server.tool(
  "top_skills",
  "The logged-in character's highest-trained skills — useful for judging what they can fly well.",
  { limit: z.number().int().min(1).max(50).default(15).describe("How many skills (1-50)") },
  async ({ limit }) => {
    try {
      return asResult(await getTopSkills(limit));
    } catch (error) {
      return asError(error);
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
