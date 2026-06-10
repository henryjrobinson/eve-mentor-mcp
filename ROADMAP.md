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

### v0.3 — Fitting & combat coach

Attacks pain point #6 and the "weapons and ammo" confusion.

- `explain_fit` — paste a fit (or reference a loss): tank type, weapon system, range band, what it's for, what's wrong (mixed tanks, unbonused weapons, no prop mod)
- `ammo_advisor <target>` — damage-type matching: EM/Therm/Kin/Exp vs shields/armor, NPC faction resist holes (Guristas→kinetic, Blood Raiders→EM/therm, Angels→explosive...), short vs long range ammo tradeoffs
- `proven_fits <ship>` — what fits are actually surviving/killing on zKillboard right now, filtered for newbie-flyable

### v0.4 — Direction & ISK (the "now what?" mentor)

Attacks pain points #2 and #10. No playstyle recommender exists anywhere — confirmed white space.

- `playstyle_finder` — interview-style matching across ~15 recognized career paths (exploration, faction warfare, abyssals, mission running, mining, industry, trading, wormholes, hauling...), each with first ship + first steps
- `what_to_do_tonight` — content suggestions matched to actual skills, ship, location, wallet, and risk appetite
- `isk_guidance` — viable income for the player's actual SP level (exploration ≫ mining for new players)

### v0.5 — Safety & logistics

- `route_danger` — per-jump kill activity, gatecamp heuristics from zKill
- `where_to_buy <item>` — cheapest sensible hub given player location, price vs haul tradeoff
- `jargon` — EVE slang glossary (EVE Uni wiki–backed)

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
