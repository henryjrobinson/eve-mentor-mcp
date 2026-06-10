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

### 2. `fit_readiness` — paste a fit, get a verdict `[live-api]`
Parse EFT-format fit text (the format every fitting site exports). For each module + hull,
run the prerequisite diff against the logged-in character. Output: can-fly-now yes/no,
missing skills in training order, total days.
- Accept: feeding a published Heron exploration fit returns correct per-module gaps.
- Verify: EFT fixture in `test/fixtures/`, plus live check against Ruby Q.

### 3. `proven_fits <ship>` `[live-api]`
Pull recent killmails where the given ship was the *attacker* (zKill kills endpoint),
extract what those winning pilots flew alongside it; surface 3-5 recurring fit patterns.
- Accept: `proven_fits Heron` returns real, recent, recurring module patterns.

## v0.4 — direction & ISK

### 4. `what_should_i_do_tonight` `[live-api]`
Compose: character skills + wallet + location + ship + career-test result (if stored) →
3 concrete session suggestions with expected ISK and risk. Uses careers data + can_i_fly.
- Accept: returns suggestions that reference the character's actual situation, not generic advice.

### 5. `isk_guidance` — income matched to skillpoints
Knowledge tool: viable income activities by SP tier (0-1M, 1-5M, 5-20M, 20M+) with ISK/hr
ranges and first steps. Static data, research-sourced (EVE Uni + r/Eve consensus).
- Accept: every tier has ≥3 activities with honest ISK/hr ranges and requirements.

### 6. Pilot memory tools
`remember_goal`, `recall_pilot_notes` — persistent JSON at ~/.config/eve-mentor/memory.json.
A mentor that remembers your goals between sessions. (Pattern from vael.)
- Accept: notes survive server restart; recall returns chronological entries.

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
