# TODO — eve-mentor / ruby-eve.com

Updated 2026-06-10. Split by who does it. Build items continue in [BACKLOG.md](BACKLOG.md).

## Henry — 5-minute admin items

- [ ] **Dev portal: switch the callback URL** to `https://ruby-eve.com/callback`
      (developers.eveonline.com → your application → edit → save). Nothing breaks meanwhile;
      it only affects future logins.
- [ ] **Dev portal: regenerate the client secret** (it was pasted in chat once; we never use
      it, but hygiene is hygiene). Same edit screen.
- [ ] **Dev portal: update the app description** — paste-ready text below.

## Henry — launch posts (all written + henry-ified, paste-ready)

All four live in [drafts/launch-posts.md](drafts/launch-posts.md). Suggested order:

- [ ] 1. **EVE Online forums** — Technology & Research → Third Party Developers →
      https://forums.eveonline.com/c/technology-research/third-party-developers/76
      (friendliest audience, best technical feedback, and CCP staff read it)
- [ ] 2. **r/Eve** — https://reddit.com/r/Eve (brace for opinions; the post is written to
      lead with self-deprecation, which is the only armor r/Eve respects)
- [ ] 3. **X article** on @areito_ai (long-form draft in the same file)
- [ ] 4. **X thread** (6 tweets, #tweetfleet hashtag, @EveOnline tagged)
- [ ] After posting: drop the links back in chat so feedback can be tracked.

## Henry — in game (the fun list)

- [ ] **Queue Amarr Frigate III** (~10 hours) — your skill queue is EMPTY and the Astero
      is on the other side of it
- [ ] Fit the Imicus with the relic analyzer you already own (it's in Cistuvaert) and run
      one relic site
- [ ] Buy the Astero when Amarr Frigate III lands
- [ ] Claim the two asset-safety wraps (Gehi IX, Villasen V) and report what 2018-you left us

## Claude — next build items (from BACKLOG)

- [x] `fit_readiness` — paste any EFT fit → missing skills + training time (backlog #2) ✅
- [x] `proven_fits <ship>` — most common modules per slot from real killmails (backlog #3) ✅
- [x] `what_should_i_do_tonight` (backlog #4) + `isk_guidance` (backlog #5) ✅ — v0.4 shipped
- [x] `route_danger`, `where_to_buy`, `whats_happening`, `evaluate_corp` (backlog #7-10) ✅ — v0.5 shipped
- [x] Pilot memory: `remember_goal` / `recall_pilot_notes` (backlog #6) ✅
- [x] npm publish — `eve-mentor-mcp@0.1.2` live (backlog #11) ✅
- [x] Official MCP registry — `io.github.henryjrobinson/eve-mentor-mcp` active (backlog #12) ✅
- [x] Smithery — `smithery.yaml` in repo; Smithery + Glama auto-index from GitHub + registry ⏳ (claim listings ~1-2 wks out)
- [x] CCP community tools list — PR to esi/esi-docs #290 (awaiting merge) ✅
- [x] Redirect henryrobinson.net/eve-mcp → ruby-eve.com (301, Netlify; callback preserved) ✅
- [ ] EVE Partnership Program application once user traction exists (backlog #15)

## Dev portal app description (paste-ready)

> EVE Mentor (ruby-eve.com) is a free, open-source AI mentor for new and returning pilots.
> It connects an AI assistant (Claude or any MCP client) to live EVE data so you can ask
> things like "why do I keep dying?", "what do I need to fly a Vexor?", and "where did my
> stuff go?" It uses read-only ESI scopes to look at your skills, skill queue, location,
> ship, wallet, and assets — it never modifies anything on your account, and your login
> stays on your own machine (OAuth2 PKCE; no client secret involved). Source code:
> https://github.com/henryjrobinson/eve-mentor-mcp
