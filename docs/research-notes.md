# Research notes — new-player pain points & tool ecosystem (June 2026)

Compiled from three research passes: (1) player complaints on Reddit/forums/Steam/press, (2) the third-party tool ecosystem, (3) skill system / weapons / playstyle deep-dive. Reddit data partly via pullpush.io archive (Reddit blocks direct scraping); Steam via the official appreviews API; forums fetched directly.

## Pain points — evidence

1. **Tutorial doesn't teach the game.** "The air career missions as a tutorial dont teach the player how to play... walking face first into another unexplained system with not so much as a text box" (forums.eveonline.com/t/new-player-experience/452755). Career agents "only do a halfway decent job of teaching you two playstyles: High Sec Mining and High Sec Missioning" (reddit.com/r/Eve/comments/ofkm9q). Retention: of 10,000 new accounts, <500 still log in at 30 days (tagn.wordpress.com/2019/06/23).
2. **No direction post-tutorial.** "I finished all the tutorials and now I'm lost and overwhelmed" (r/evenewbies/comments/17r76m). "I don't know what to do" threads are a genre on New Citizens Q&A (forums.eveonline.com/t/i-dont-know-what-to-do/62168, /t/3-new-players-dont-know-what-to-do/166715).
3. **UI overwhelm.** "An overloaded interface from the beginning would make your head blow even on simple operations" (Steam review, app 8500).
4. **Skill system.** "It seems like the interdependence of skills is paralyzing me :( every upgrade leads me to 2 more I want/need" (r/evenewbies/comments/1x966t). Real-time training reads as a paywall-shaped wall (forums.eveonline.com/t/...-340165).
5. **Out-of-game tools are mandatory.** "EVE is one of those rare games where the first thing you need to understand is that you're going to need to learn a lot about the game outside of the game client" (thegamer.com, Fanfest 2025). "In Eve, you don't have a learning curve, you have a cliff." (ibid.)
6. **Fitting + ammo.** "There is an overwhelming amount of ship attachments and guns and rigs and doohickies, I have no idea where to start" (r/evenewbies/comments/5hu0oq). Tutorial never explains ammo types (mmorpg.com NPE review).
7. **Market opacity.** "Why do Buy Orders work? Not how, but why?" (r/Eve/comments/1enpiyc).
8. **Jargon.** "You must know what everything means to learn anything" (r/evenewbies/comments/3dec4h).
9. **Corp finding + scam paranoia.** New player deleted a real GM's messages thinking it was a scam (forums 452755). "Human interaction is the best predictor for player retention" (r/Eve/comments/ofq4ea).
10. **ISK confusion.** "Is there anyway to generate isk... without grinding months of hi sec mining" (r/evenewbies/comments/6ekl2z).

CCP validation: **Exordium** (announced April 2026) — a 53-system PvP-free starter region (eveonline.com/news/view/introducing-exordium); **AIR career program** (2022); **Aura Guidance** AI (Feb 2026).

## Tool ecosystem — state

**Healthy (veteran-focused):** PyFA (fitting, active), eveship.fit (active), EVE Workbench (fits + API), zKillboard (open API + RedisQ), Dotlan (maps), Janice (appraisal), Fuzzwork (market API + SDE conversions), Adam4EVE, EVE Guru (industry planner — not an AI despite the name), SeAT/Alliance Auth (corp mgmt), Tripwire/Pathfinder forks (wormholes), EVE-Scout (Thera).

**Dead or dying:** EVEMon (last push 2024-06; marked Legacy), eve-skillplan.net (shut down 2025), ISK Per Hour (abandoned Nov 2025), Evepraisal (replaced by Janice). EveLens (evelens.dev) is an active 2026 EVEMon successor but early-stage and aimed at multi-alt veterans.

**Best open data:** EVE Ref (data.everef.net — hosted SDE, reference data API, killmail archives, market history; docs.everef.net/datasets.html) and Fuzzwork SQLite SDE conversions. EVE University Wiki is MediaWiki-API accessible and CC-licensed.

**AI landscape:** CCP's Aura Guidance (in-client, Feb 2026) is retrieval over ~706K curated Rookie Help Q&As — deliberately **excludes** fitting advice, ISK strategy, fleet tactics, and goal planning after hallucination problems in testing (eveonline.com/news/view/eve-evolved-aura-guidance). No third-party AI mentor exists. That excluded scope is this project's white space.

## Skill system facts (for v0.2)

- Prerequisites are dogma attributes on every type: required skills = attribute IDs **182, 183, 184, 1285, 1289, 1290**; required levels = **277, 278, 279, 1286, 1287, 1288** (forums.eveonline.com/t/218253).
- ESI `GET /universe/types/{id}/` exposes these **top-level only** — full trees must be resolved recursively; every skill planner precomputes from the SDE instead.
- Training time = skill rank × SP/hour derived from character attributes; "when can I fly X" needs the whole tree + character attributes.
- **Magic 14**: 14 universal support skills (CPU/Power/Cap Management, Mechanics, Hull Upgrades, Shield Management/Operation, Long Range Targeting, Signature Analysis, Navigation, Evasive Maneuvering, Warp Drive Operation, Capacitor Systems Operation, Spaceship Command). Canonized by CCP at eveonline.com/eve-academy/magic-14. Canonical advice: it's *filler*, not a mandatory first plan — "no point training support skills without first training the skills you need to actually USE the ships" (wiki.eveuniversity.org/The_Magic_14). Widespread misinformation says train it first.
- CCP's certified in-game skill plans (2022) solve week 1 but are generic; they don't connect training to a player's goal. Not exposed via ESI.

## Weapons/ammo taxonomy (for v0.3)

- Four damage types: EM, Thermal, Kinetic, Explosive. EM hits shields hardest, Explosive hits armor hardest.
- Lasers (Amarr): EM/Therm fixed, instant crystal swap, no ammo depletion at T1. Hybrids (Gallente blasters / Caldari rails): Kin/Therm. Projectiles (Minmatar): selectable mix, no cap use. Missiles: single selectable damage type, application depends on explosion radius/velocity vs target signature/speed. Drones: damage type fixed per faction.
- NPC faction resist holes (wiki.eveuniversity.org/NPC_damage_types): Guristas→kinetic, Blood Raiders/Sansha→EM/therm, Angels→explosive, Serpentis→thermal/kinetic.
- Classic newbie errors: wrong ammo vs target, mixed shield+armor tank, unbonused weapon systems, no understanding of range bands, premature T2 ammo.

## Playstyles (for v0.4)

~15 recognized paths (wiki.eveuniversity.org/Careers, EVE Academy): mission running, ratting, exploration, mining, abyssals, incursions, faction warfare, PvP roaming, wormhole living, hauling, trading, manufacturing, planetary industry, salvaging, ganking/crime. CCP collapses these into 4 archetypes (Explorer, Industrialist, Enforcer, Soldier of Fortune). **No interactive playstyle recommender exists** (multiple searches; moderate confidence). Current discovery path is career agents → teaching corps (EVE University, Brave Newbies, Pandemic Horde) → human mentors.

## Explicit tool requests seen in the wild

- Tool directory for newbies (r/evenewbies/1yagwu) · two-location price compare (r/evenewbies/12jrbno) · BPC contract appraisal (r/evenewbies/6fc1fb) · market order undercut tracking (r/Eve/ni1b2v) · build-cost profit tracking (r/Eve/7lodmd) · region-sweep exploration routes (r/Eve/qnk6vj) · NPC damage type lookup before a mission (r/Eve/9lv9hz)
