# Roadmap

Built from research into new-player pain points (r/Eve, r/evenewbies, official forums, Steam reviews, press) and the third-party tool ecosystem, June 2026. Sources and detail in `docs/research-notes.md`.

## The thesis

EVE's tool ecosystem is built **by veterans, for veterans**. PyFA shows 200 stats but never explains *why* you'd armor-tank a ship. zKillboard has every kill but nothing interprets them for novices. EVEMon (skill planning) is dead; eve-skillplan.net is dead. CCP's own in-game AI assistant (Aura Guidance, Feb 2026) deliberately refuses to give fitting, ISK, or "what should I do" advice after it hallucinated in testing.

The missing layer is **synthesis**: connecting a player's goal ("I want to fly a Vexor and run missions") to skills, fits, content, and locations. That currently requires 4+ tools, a wiki, and asking strangers in chat. An LLM with the right tools is exactly that layer. That's what this project is.

## Top new-player pain points (ranked by evidence)

1. Tutorial doesn't teach the actual game (career missions ≠ playing)
2. No direction after the tutorial — "I finished the tutorials and now I'm lost"
3. UI/information overwhelm
4. Skill system confusion — what to train, prerequisite chains, real-time training anxiety
5. The game can't be learned in-game — out-of-game tools are mandatory tribal knowledge
6. Ship fitting complexity (and ammo/damage types get no explanation at all)
7. Market opacity — buy vs sell orders, where to buy anything
8. Jargon wall (dscan, ratting, doctrine, krab...)
9. Finding the right corp + scam paranoia
10. ISK-making confusion at low skillpoints

## Releases

### v0.1 — Loss mentor ✅ (shipped)

- `recent_losses` — why did I die, with full fit detail
- `system_intel`, `lookup_item` + Jita prices
- EVE SSO (PKCE), `character_sheet`, `skill_queue`, `top_skills`

### v0.2 — "Can I fly it?" + career sorting hat — ✅ (shipped)

Attacks pain points #4 and #2.

- `can_i_fly <ship|module>` ✅ — recursive prerequisite tree (dogma attrs 182/183/184/1285/1289/1290 + level attrs 277/278/279/1286/1287/1288), ordered training plan with SP totals and time estimates, diffed against the character's actual skills when logged in. Implemented via recursive ESI type fetches with caching (trees are shallow; an SDE bundle is a later optimization, not a requirement).
- `career_test` ✅ — pulled forward from v0.4: 15-path career taxonomy with traits; Claude runs the sorting-hat interview and matches.
- Still open for v0.2.x: `skill_gap_for_fit` (whole fitting at once), `whats_training_worth` (queue sanity-check, Magic 14 awareness)

### v0.3 — Fitting & combat coach — ✅ core shipped

Attacks pain point #6 and the "weapons and ammo" confusion.

- `analyze_fit` ✅ — classifies modules via ESI groups and mechanically detects classic mistakes: mixed weapon systems, mixed shield+armor tank, no propulsion, damage mods without matching weapons
- `ammo_advisor <target>` ✅ — damage-type matching: NPC faction resist holes (Guristas→kinetic, Blood Raiders→EM/therm, Angels→explosive...) with concrete ammo names per weapon system
- `jargon` ✅ — ~45-term slang glossary (pain #8; competitor research confirmed nobody has one)
- `sitrep` ✅ — one-call session-start orientation (borrowed from vael's SITREP pattern)
- Server-level anti-hallucination instructions ✅ (borrowed from jita-mcp): "only tool values are authoritative"
- `fit_readiness` ✅ — paste an EFT fit → parses the format every fitting site exports, merges the prerequisite trees of hull + every module, diffs against the logged-in character, returns a can-fly verdict with missing skills in training order and total time
- `proven_fits <ship>` ✅ — samples recent killmails of a hull and surfaces the most common modules per slot with frequency. (EVE only exposes the victim's fit, so this learns from losses — verified against the live zKill + ESI pipeline.)

### Competitor research takeaways (June 2026, full dossier in docs/)

- **Loss analysis and career matching are confirmed unoccupied** — zKill appears in 3 competing MCPs, only for danger ratings; no one explains deaths; vael covers exactly one career.
- Worth borrowing later: goal-language tool params (jita-mcp), pilot memory tools (vael), corp evaluator for newbies (OSINT-MCP primitives), fees-modeled market math (d3ej), `should_i_undock`-style decision-shaped tools.
- ESI citizenship bar (vael/d3ej/jita-mcp converged): watch X-ESI-Error-Limit headers, honor Expires/ETag caching, bounded concurrency. Adopt before public release.
- Remote hosting path (jita-mcp): stateless streamable-HTTP works great for public-data tools; keep character/SSO tools local (or add a server-side encrypted token store later). A split deployment is the realistic v1.0 shape.

### v0.4 — Direction & ISK (the "now what?" mentor) — ✅ shipped

Attacks pain points #2 and #10. No playstyle recommender exists anywhere — confirmed white space.

- `playstyle_finder` — covered by `career_test` (shipped in v0.2): interview-style matching across ~15 recognized career paths, each with first ship + first steps
- `what_should_i_do_tonight` ✅ — composes the logged-in character's real situation (skillpoints, wallet, location security, current ship, what's training) with the income options for their SP tier; the client turns it into 2-3 concrete, situation-aware suggestions. Verified live against a real character.
- `isk_guidance` ✅ — viable income by SP tier (0-1M / 1-5M / 5-20M / 20M+), each activity with an honest ISK/hr range, requirements, and a first step. Static, community-sourced, explicitly framed as relative guidance not promises (exploration ≫ mining for new players).
- Pilot memory ✅ — `remember_goal` / `recall_pilot_notes` (backlog #6): goals persist per character across sessions in `~/.config/eve-mentor/memory.json`, so coaching and `what_should_i_do_tonight` can pick up where you left off

### v0.5 — Safety, logistics & news

- `route_danger` — per-jump kill activity, gatecamp heuristics from zKill
- `where_to_buy <item>` — cheapest sensible hub given player location, price vs haul tradeoff
- `jargon` — EVE slang glossary (EVE Uni wiki–backed)
- `whats_happening` — a news layer for returning players: big battles (zKill), sov changes, patch notes, what changed since you last logged in. Origin story: Henry once returned to find he couldn't dock where all his stuff was, got no satisfying answer, and quit again. A chatbot that could explain "what happened while you were gone" would have saved that subscription.

### v0.2.x additions (shipped early)

- `my_assets` ✅ — all assets grouped by location, flagging asset-safety wraps and structures the character is locked out of. Directly targets the "I came back and couldn't reach my stuff" quit-moment.

### Distribution (after v0.2)

- Publish GitHub repo, submit to MCP registries (Smithery, Glama, official registry) and CCP's third-party tools directory
- Post to r/Eve and the official forums' third-party-dev section
- Remote MCP deployment so non-technical players need no local install

## Data sources

| Source | Used for | Access |
|---|---|---|
| ESI | live character data, market, killmails, universe | open, SSO for character |
| SDE via Fuzzwork/EVE Ref | skill trees, prerequisites, dogma attributes | open downloads + JSON APIs |
| zKillboard | losses, proven fits, danger data | open API |
| EVE University Wiki | mechanics explanations, NPC damage types, careers | MediaWiki API, CC-licensed |

## Non-goals

- Anything that automates gameplay (EULA violation)
- Veteran optimization tools (PyFA, EVE Guru, SeAT already do this well)
- Replacing human corps/mentors — the goal is getting players confident enough to join one
