# Launch posts — ready to paste

All henry-ified. Targets: X article on @areito_ai, X thread, r/Eve, EVE Online forums
(Technology & Research → Third Party Developers category).

---

## X Article (long-form, @areito_ai)

**Title: I have 0 kills in 15 years of EVE Online, so I built an AI mentor for it**

I created my EVE Online character in August 2011. My lifetime combat record is 0 kills and
8 losses. I resubscribed about once a year, played for a month, hit a wall that nobody
explained, and quit. I did this for fifteen years.

The walls were always the same kind of wall. In 2015 I lost two cruisers in one day, the
second one in Uedama, which I later learned is the most famous gank chokepoint in the game.
Every veteran knows about Uedama, and no tutorial mentions it. In 2018 I lost a destroyer
that I had fitted with railguns, artillery, and blasters at the same time — three weapon
systems from three different races on one hull. The game let me do it and nobody told me
why it couldn't work. One year I came back, couldn't dock where all my stuff was, never got
an answer I understood, and cancelled again.

EVE players have a saying: you don't have a learning curve, you have a cliff. The numbers
back them up. Of every 10,000 new pilots, fewer than 500 are still logging in a month later.

The knowledge to survive all of this exists. It just lives in wikis, veteran Discord
servers, and a dozen third-party tools that all assume you already understand the game. The
skill-planning tools most veterans recommend are literally dead projects now. Even CCP's
own in-game AI assistant deliberately refuses to give fitting advice, ISK strategy, or
"what should I do next" guidance. That refusal list is precisely what new players ask for.

So I built the mentor I needed: an open-source MCP server that connects Claude to live EVE
data. You just ask it things. Why do I keep dying? It pulls your actual losses from
zKillboard, fit by fit, and explains what went wrong. What do I need to fly a Vexor? It
computes the full skill chain against your real character and gives you the hours. What
should I even be doing in this game? It interviews you and sorts you into one of 15 career
paths. Where did my stuff go? It sweeps your assets and flags the ones stranded in
stations you got locked out of years ago.

The first real session was the part I didn't expect. It found my lost property from that
docking mystery sitting in two asset-safety wraps that had waited for me for years. It
told me the exploration frigate I always wanted was about ten hours of training away. And
it showed me that across all those failed attempts, past-me had quietly stacked up 17
million skillpoints and 702 million ISK. I was never a failed newbie. I was a mid-tier
veteran who couldn't find the door.

The whole thing is free and MIT-licensed: https://github.com/henryjrobinson/eve-mentor-mcp
The story and roadmap live at https://henryrobinson.net/eve-mcp

I suspect New Eden is full of players like me. This one is for all of us.

---

## X Thread (@areito_ai)

1/ I have 0 kills in 15 years of EVE Online. I resubscribed once a year, hit a wall nobody
explained, and quit. So I built an AI mentor for the game and open-sourced it. 🧵
#tweetfleet #EVEOnline

2/ My greatest hits: died at the Uedama gank chokepoint nobody warns you about, and lost a
destroyer fitted with railguns, artillery, AND blasters at once. The game let me do it.
Nobody told me why it couldn't work.

3/ It's an MCP server that connects Claude to live EVE data (ESI + zKillboard). You ask
"why do I keep dying?" and it pulls your real lossmails and explains each one. You ask
"what do I need to fly a Vexor?" and it computes the skill chain against your character.

4/ On its first real session it found my lost assets from 2018 in asset-safety wraps,
told me my dream exploration frigate was 10 training hours away, and revealed past-me had
banked 17M skillpoints and 702M ISK across all those failed attempts.

5/ 16 tools so far: loss analysis, skill planning, a career sorting hat, fit checking,
ammo/damage matching, a jargon glossary, live PLEX math for the cheapest way to play, and
an asset finder for stuff you lost years ago.

6/ Free, MIT, built on the official ESI API. Repo:
https://github.com/henryjrobinson/eve-mentor-mcp
Story: https://henryrobinson.net/eve-mcp
Feedback wanted, especially from people who bounced off EVE like I did. @EveOnline

---

## r/Eve post

**Title: I have 0 kills in 15 years, so I built an open-source AI mentor for EVE
(loss analysis, skill plans, career sorting hat)**

My character was born in August 2011 and my lifetime record is 0 kills, 8 losses. I'm the
guy who resubscribes once a year, plays a month, hits a wall, and quits. My personal
highlights include dying in Uedama with no idea what Uedama was, and losing a Catalyst
fitted with rails, artillery, and blasters simultaneously (2018, it's on zKill, I cannot
hide from it).

I finally built the thing I needed: an MCP server that lets Claude pull live EVE data and
actually mentor you. It explains your real losses fit-by-fit from zKillboard, computes
recursive skill prerequisites against your character ("you're 16k SP from an Astero"),
interviews you into a career path, checks fits for classic mistakes, knows which damage
type to shoot at which faction, and sweeps your assets for stuff stranded in stations you
got locked out of. On first login it found my lost property from years ago in asset-safety
wraps I didn't know existed.

It's free and MIT-licensed, built on ESI + zKillboard with proper error-limit handling and
a User-Agent, read-only scopes, PKCE (no client secret stored). I know this crowd has
strong opinions about both AI and new-player tools, and I'd genuinely like the feedback —
especially on what a tool like this should never advise a newbie to do.

Repo: https://github.com/henryjrobinson/eve-mentor-mcp
Story/roadmap: https://henryrobinson.net/eve-mcp

---

## EVE Online forums post (Third Party Developers)

**Title: eve-mentor-mcp — open-source MCP server that turns Claude into a new-player mentor**

I've released eve-mentor-mcp, an MIT-licensed MCP server aimed at the new-player and
returning-player learning problem rather than at veterans.

Current tools (16): loss analysis with full fit detail (zKillboard + ESI killmails),
recursive skill-prerequisite planning diffed against the character, a 15-path career
matcher, mechanical fit checking (mixed weapons / mixed tank / missing prop detection),
NPC damage-type matching, a slang glossary, live PLEX/Omega economics, system danger
intel, Jita pricing, and an asset sweep that flags asset-safety wraps and inaccessible
structures.

Technical notes: TypeScript, ESI with error-budget guarding and Expires-based caching,
identifying User-Agent, EVE SSO via PKCE (no secret stored, read-only scopes only), tokens
in a 0600 file. The repo includes a research-backed roadmap; remote hosting for the
public-data tools is planned.

Feedback from this community would be very welcome, particularly on ESI etiquette and on
what guidance is appropriate to give brand-new players.

Repo: https://github.com/henryjrobinson/eve-mentor-mcp
