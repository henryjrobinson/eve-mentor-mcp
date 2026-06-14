# eve-mentor-mcp

An MCP server that turns Claude into an **EVE Online mentor for players trying to learn the game**.

EVE has the steepest learning cliff in gaming. Existing tools assume you already know what to ask. This one is built around the questions new players actually have:

- **"Why do I keep getting blown up?"** — pulls your real losses from zKillboard with the full fit you were flying, who killed you, and with what, so Claude can explain exactly what went wrong.
- **"Is this system dangerous?"** — live kill and traffic data for any system.
- **"What is this thing and what does it cost?"** — any ship or module, with live Jita prices.
- **"What should I do next?"** — log in with EVE SSO and Claude sees your skills, skill queue, wallet, location, and current ship, and can coach from your actual situation.

Works with Claude Desktop, Claude Code, and any MCP client.

## Tools

| Tool | Auth | What it does |
|------|------|--------------|
| `recent_losses` | none | A character's recent losses with full fit detail (zKillboard + ESI) |
| `can_i_fly` | optional | Full recursive skill prerequisite tree + ordered training plan for any ship/module; diffed against your real skills when logged in |
| `fit_readiness` | optional | Paste an EFT fit → can-fly verdict: missing skills to online every module, in training order, with total time |
| `proven_fits` | none | What pilots actually fly on a ship — the most common modules per slot, learned from recent killmails |
| `analyze_fit` | none | Mechanical fit check: classifies modules and flags classic mistakes (mixed weapons/tank, no propulsion, dead damage mods) |
| `ammo_advisor` | none | Which damage type to shoot and tank against a faction or enemy tank, with concrete ammo names |
| `career_test` | none | The EVE career "sorting hat" — Claude interviews you, then matches you to playstyles |
| `isk_guidance` | none | Viable income activities by skillpoint tier, with honest ISK/hr ranges and first steps |
| `what_should_i_do_tonight` | SSO | Composes your real skills/wallet/location/ship into concrete session suggestions |
| `system_intel` | none | Security status + kills/jumps in the last hour for any system |
| `lookup_item` | none | Item/ship/module description + live Jita buy/sell prices |
| `cheapest_way_to_play` | none | Alpha vs Omega vs PLEX economics with today's live Jita PLEX price |
| `jargon` | none | EVE slang glossary — define a term or list everything known |
| `sitrep` | optional | One-call session-start orientation: login state, character overview, what's training, last loss |
| `eve_login` | — | Browser-based EVE SSO login (OAuth2 PKCE, no secret stored) |
| `eve_auth_status` | — | Who's logged in |
| `character_sheet` | SSO | Skillpoints, wallet, location, current ship |
| `skill_queue` | SSO | What's training and when it finishes |
| `top_skills` | SSO | Highest-trained skills |
| `my_assets` | SSO | Everything you own grouped by location, flagging stranded/asset-safety items |

## Install (no coding required)

You need two things: the **Claude Desktop app** (or Claude Code) and **Node.js**, a free
runtime that this server runs on — installing it is like installing any other app.

### Step 1 — Install Node.js (skip if you have it)

Go to [nodejs.org](https://nodejs.org), download the **LTS** version, run the installer,
click through with the defaults. Done.

### Step 2 — Tell Claude about it (no download needed)

**Claude Desktop:** open the config file in any text editor —

- Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

(If it doesn't exist, create it.) Make it look like this:

```json
{
  "mcpServers": {
    "eve-mentor": {
      "command": "npx",
      "args": ["-y", "eve-mentor-mcp"]
    }
  }
}
```

Save, then fully quit and reopen Claude Desktop. That's it — `npx` downloads and runs the
server automatically; updates come free.

**Claude Code** (one line instead):

```bash
claude mcp add eve-mentor -- npx -y eve-mentor-mcp
```

<details>
<summary>Developing or self-building instead? (clone &amp; build)</summary>

```bash
git clone https://github.com/henryjrobinson/eve-mentor-mcp
cd eve-mentor-mcp
npm install && npm run build
```

Then point your MCP client at `node /FULL/PATH/TO/eve-mentor-mcp/dist/index.js`.
</details>

### Step 3 — Test it

Ask Claude: *"Pull the last 3 losses for character `<any EVE character name>` and explain
what went wrong."* If it answers with real killmail data, you're live. No EVE login is
needed for this — losses, system intel, prices, the career test, and the jargon glossary
all work immediately.

### Other AI apps

Any MCP-capable client works the same way (Cursor, LM Studio, VS Code, etc. — point them
at `node /path/dist/index.js`). **ChatGPT** supports MCP but only *remote* servers, not
local ones — a hosted version of the public tools is on the roadmap.

### Character tools (EVE SSO)

1. Go to [developers.eveonline.com](https://developers.eveonline.com) → log in with your EVE account → **Create New Application**
2. Name it anything (e.g. `eve-mentor`), pick **Authentication & API Access**
3. Select these scopes:
   - `esi-skills.read_skills.v1`
   - `esi-skills.read_skillqueue.v1`
   - `esi-location.read_location.v1`
   - `esi-location.read_ship_type.v1`
   - `esi-wallet.read_character_wallet.v1`
   - `esi-assets.read_assets.v1`
4. Set the callback URL to exactly `https://ruby-eve.com/callback` — CCP's portal only accepts
   https callbacks; this static page (source in `site/callback/`) relays the login code to the
   local server on port 8484. (Self-hosting? Serve your own copy and set `EVE_REDIRECT_URI`.)
5. Copy the **Client ID** and add it to the server's environment:

```bash
claude mcp add eve-mentor -e EVE_CLIENT_ID=your_client_id -- npx -y eve-mentor-mcp
```

(or add `"env": {"EVE_CLIENT_ID": "your_client_id"}` to the Claude Desktop config.)

Then ask Claude to log you in to EVE — a browser opens, you authorize, done. Tokens are stored in `~/.config/eve-mentor/tokens.json` (mode 600) and refresh automatically.

## Try it

> *"Pull my last 3 losses for character `Your Pilot Name` and explain what I did wrong in each one."*

> *"I'm about to fly through Tama. How dangerous is it right now?"*

> *"What should I be training next given my skills and the fact that I want to try small-gang PvP?"*

## Verify it works

```bash
npm run smoke                      # tests ESI name resolution, market, system intel
npm run smoke -- "Pilot Name"      # also tests the zKillboard loss pipeline
```

## Notes

- Data comes from [ESI](https://esi.evetech.net) (CCP's official API) and [zKillboard](https://zkillboard.com). Be a good citizen: this server sends a proper User-Agent and caches name lookups.
- Built under the [CCP Developer License](https://developers.eveonline.com/license-agreement) — non-commercial, as required.
- EVE Online and all related trademarks are the property of [CCP hf](https://www.ccpgames.com).

## Roadmap

Shipped through v0.4 (loss analysis, "can I fly it?", career sorting hat, fitting & combat coaching, direction & ISK guidance). Next:

- **v0.5 — Safety, logistics & news:** route danger scoring, where to buy sensibly, a "what happened while you were gone" briefing
- Pilot memory so goals persist across sessions
- Remote MCP deployment so no local install is needed (and ChatGPT support)

Full detail in [ROADMAP.md](ROADMAP.md). PRs welcome. MIT licensed.
