# Backlog

Discrete work items, ordered. Each has acceptance criteria and a verification step so any
agent (or human) can pick one up and know when it's done. Items marked `[live-api]` need
verification against real ESI/zKillboard responses — prefer interactive sessions for those.

## v0.3.x — hardening & completion

### 1. ESI citizenship hardening `[live-api]` — IN PROGRESS
Watch `X-ESI-Error-Limit-Remain` on every response; when below 20, wait out
`X-ESI-Error-Limit-Reset` before the next call. Cache unauthenticated GET responses that
carry an `Expires` header (system kills/jumps and market orders are the heavy ones).
- Accept: esiFetch never lets the error budget hit zero; repeated `system_intel` calls
  within the cache window make one upstream request.
- Verify: call `getSystemActivity` twice, confirm second is served from cache (log line).

### 2. `fit_readiness` — paste a fit, get a verdict `[live-api]` — ✅ DONE
Parse EFT-format fit text (the format every fitting site exports). For each module + hull,
run the prerequisite diff against the logged-in character. Output: can-fly-now yes/no,
missing skills in training order, total days.
- Shipped: `src/eft.ts` parser + `fitReadiness()` in `src/skills.ts` (reuses the can_i_fly
  tree/flatten/diff machinery, merging hull + all modules into one plan).
- Verified live: a published exploration Heron fit resolves all modules and returns a
  correct 19-skill / ~78k SP plan (not-logged-in path lists every skill the fit needs).

### 3. `proven_fits <ship>` `[live-api]` — ✅ DONE
- Reality check: EVE killmails only expose the *victim's* fit, never an attacker's. So this
  samples recent *losses* of the hull (`/losses/shipTypeID/{id}/`) and surfaces the most
  common modules per slot with frequency — what pilots actually fly, honestly framed.
- Shipped: `getProvenFits()` in `src/zkill.ts`.
- Verified live: `proven_fits Heron` cleanly recovers the canonical exploration fit
  (Core Probe Launcher 80%, Relic/Data Analyzers 65%, Gravity Capacitor rig 75%, etc.).

## v0.4 — direction & ISK

### 4. `what_should_i_do_tonight` `[live-api]` — ✅ DONE
Compose: character skills + wallet + location + ship + career-test result (if stored) →
3 concrete session suggestions with expected ISK and risk. Uses careers data + can_i_fly.
- Shipped: `getTonightOptions()` in `src/tonight.ts` — composes character_sheet + skill
  queue + the income tier + location/wallet context, returns building blocks for the client
  to synthesize 2-3 suggestions. (career_test result is held in conversation, not stored yet —
  that's pilot memory, #6.)
- Verified live against Ruby Q: 17.3M SP → "Competent" tier, Auga 0.4 → low-sec context,
  702M wallet → "healthy" framing. All composition fields correct.

### 5. `isk_guidance` — income matched to skillpoints — ✅ DONE
Knowledge tool: viable income activities by SP tier (0-1M, 1-5M, 5-20M, 20M+) with ISK/hr
ranges and first steps. Static data, research-sourced (EVE Uni + r/Eve consensus).
- Shipped: `src/income.ts` (`getIskGuidance`, `tierForSkillpoints`). Every tier has ≥3
  activities (4/4/4/5) with ISK/hr ranges, requirements, and first steps; a prominent
  disclaimer frames the numbers as relative community consensus, not live data.

### 6. Pilot memory tools — ✅ DONE
`remember_goal`, `recall_pilot_notes` — persistent JSON at ~/.config/eve-mentor/memory.json.
A mentor that remembers your goals between sessions. (Pattern from vael.)
- Shipped: `src/memory.ts`, keyed per character (by ID) so pilots don't mix.
- Verified: goals written in one process read back in a fresh process, oldest-first.

## v0.5 — safety, logistics, news

### 7. `route_danger <origin> <destination>` `[live-api]`
ESI route + per-system kill counts + zKill recent activity on chokepoints. Flag Uedama-class
gank systems by name.
- Accept: a Jita→Amarr query flags Uedama/Niarja-pipe systems.

### 8. `where_to_buy <item>` `[live-api]`
Compare the 5 trade hubs' best sell + jumps from current location; recommend.

### 9. `whats_happening` — returning-player briefing `[live-api]`
Patch notes RSS + biggest battles this week (zKill) + "what changed since <date>".

### 10. `evaluate_corp <name>` `[live-api]`
ESI + zKill + EveWho fusion scored for newbie-friendliness: activity, size trend, timezone,
kill/loss culture. (Primitives proven by kongyo2's OSINT MCP; recommendation layer is novel.)

## v1.0 — distribution

### 11. npm publish (`npx eve-mentor-mcp`) — zero-clone install.
### 12. Registry submissions: official MCP registry, Smithery, Glama, CCP third-party directory.
### 13. Remote hosting split: public-data tools as stateless streamable-HTTP (jita-mcp pattern) so claude.ai web users need no install; SSO tools stay local.
### 14. r/Eve + EVE forums launch post (use the landing-page story).
### 15. EVE Partnership Program application once ~1k monthly users is in sight.
