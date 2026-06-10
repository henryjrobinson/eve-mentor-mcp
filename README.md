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
| `can_i_fly` | optional | Full recursive skill prerequisite tree + ordered training plan for any ship/module; diffed against your real skills when logged in |
| `career_test` | none | The EVE career "sorting hat" — Claude interviews you, then matches you to playstyles |
| `recent_losses` | none | A character's recent losses with full fit detail (zKillboard + ESI) |
| `system_intel` | none | Security status + kills/jumps in the last hour for any system |
| `lookup_item` | none | Item/ship/module description + live Jita buy/sell prices |
| `eve_login` | — | Browser-based EVE SSO login (OAuth2 PKCE, no secret stored) |
| `eve_auth_status` | — | Who's logged in |
| `character_sheet` | SSO | Skillpoints, wallet, location, current ship |
| `skill_queue` | SSO | What's training and when it finishes |
| `top_skills` | SSO | Highest-trained skills |

## Setup

Requires Node 18+.

```bash
git clone https://github.com/henryjrobinson/eve-mentor-mcp
cd eve-mentor-mcp
npm install && npm run build
```

### Public tools only (no EVE login)

**Claude Code:**

```bash
claude mcp add eve-mentor -- node /path/to/eve-mentor-mcp/dist/index.js
```

**Claude Desktop** (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "eve-mentor": {
      "command": "node",
      "args": ["/path/to/eve-mentor-mcp/dist/index.js"]
    }
  }
}
```

### Character tools (EVE SSO)

1. Go to [developers.eveonline.com](https://developers.eveonline.com) → log in with your EVE account → **Create New Application**
2. Name it anything (e.g. `eve-mentor`), pick **Authentication & API Access**
3. Select these scopes:
   - `esi-skills.read_skills.v1`
   - `esi-skills.read_skillqueue.v1`
   - `esi-location.read_location.v1`
   - `esi-location.read_ship_type.v1`
   - `esi-wallet.read_character_wallet.v1`
4. Set the callback URL to exactly `http://localhost:8484/callback`
5. Copy the **Client ID** and add it to the server's environment:

```bash
claude mcp add eve-mentor -e EVE_CLIENT_ID=your_client_id -- node /path/to/eve-mentor-mcp/dist/index.js
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

- Ship fitting analysis (slot layout vs. ship bonuses)
- "What can I fly?" — cross-reference skills against ship prerequisites
- Route danger scoring (per-jump kill activity)
- Wormhole / exploration helpers
- Remote MCP deployment so no local install is needed

PRs welcome. MIT licensed.
