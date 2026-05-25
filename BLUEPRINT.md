# Money School — Build Blueprint

**Learner:** Oihana (17yo)
**Goal:** Real money + investing skills from zero to stocks/index funds/diversification/risk
**Format:** Responsive web app, Duolingo-style, 5-15 min/day
**Constraint:** Simulation only (minor, no real brokerage)

---

## 1. Learner profile + end-state competencies

### Profile
- Oihana, 17, smart, motivated, zero formal money/investing background
- Phone-first user. Will use the app like Duolingo: short, daily, intermittent
- Motivation starts external (parent ask) — the app must convert it to internal
- Architected so younger-kid tracks (8-10yo, 11-13yo, 14-16yo) can be added later **without a rebuild**

### End-state competencies (what she can DO, not just name)

- [ ] Build a monthly budget that fits her income/spending
- [ ] Mentally estimate compound growth on round numbers (10% over 7y ≈ 2x)
- [ ] Explain the difference between a bank and a brokerage account
- [ ] Explain in her own words what owning a share of stock actually gives you
- [ ] Explain why an index fund usually beats picking individual stocks
- [ ] Pick a sensible asset allocation given a time horizon and risk tolerance
- [ ] Use dollar-cost averaging correctly in a simulated portfolio
- [ ] Identify diversification gaps in a sample portfolio
- [ ] Distinguish "market dropped 20%" from "I lost 20%" (paper vs realized loss)
- [ ] Open a paper Roth IRA in the simulator and pick three funds
- [ ] Recognize four behavioral pitfalls in a real scenario: panic-selling, FOMO, loss aversion, recency bias
- [ ] Set a long-horizon savings goal and reverse-engineer the monthly contribution

### Anti-goals (we deliberately do NOT teach)
- Stock-picking as a strategy
- Day-trading, options, crypto-as-investment
- Real brokerage flows (she's a minor; sim only)
- Anything we can't defend with academic evidence

---

## 2. Pedagogical foundation

Each mechanism is mapped to a concrete feature.

| Mechanism | Evidence base | Feature it powers |
|---|---|---|
| Spaced repetition | Ebbinghaus forgetting curve; SuperMemo SM-2 | Review queue with expanding intervals |
| Retrieval practice | Roediger & Karpicke 2006 — testing > re-reading | Every card asks before it tells |
| Interleaving | Rohrer & Taylor 2007 — mixing topics improves transfer | Sessions blend concepts, never block one topic |
| Elaborative interrogation | "Why?" prompts deepen encoding | Every concept ends with a "why does this matter?" tap |
| Dual coding | Paivio — text + image beats either alone | Concepts paired with charts/icons |
| Desirable difficulty | Bjork 1994 — slight struggle improves retention | Question difficulty adapts; never trivial |
| Generation effect | Slamecka & Graf 1978 — predicted answers stick | "Guess first" before reveal in sims |
| Worked examples + fading | Sweller — show, guided, then independent | Sims walk her through one, then she does it |
| Application over recall | Far transfer requires use, not naming | Concept only "mastered" after applied in a sim |
| Immediate, specific feedback | Hattie effect size 0.7+ | Every answer gets 1-2 sentence explanation, not just ✓/✗ |

---

## 3. Curriculum map and skill tree

**Track 1: Foundations** (gate for all later tracks)

| ID | Concept | Depends on | Mastery test |
|---|---|---|---|
| 1.1 | What is money for? | — | Identify the four functions of money |
| 1.2 | Income vs spending | 1.1 | Build a 1-month budget from a list |
| 1.3 | Saving vs spending tradeoff | 1.2 | Defend a saving decision in a sim |
| 1.4 | Simple interest | 1.3 | Compute simple interest on round numbers |
| 1.5 | Compound interest | 1.4 | Predict 10y / 20y / 30y outcomes |

**Track 2: Banks and accounts**

| 2.1 | Checking vs savings | 1.2 | Pick the right account for a purpose |
| 2.2 | What a bank actually does | 2.1 | Explain how a bank makes money |
| 2.3 | Fees and APY | 2.1 | Compare two accounts on real terms |
| 2.4 | Emergency fund | 1.3, 2.1 | Pick fund size for a given situation |

**Track 3: Investing 101**

| 3.1 | What is a stock? | 1.5 | Explain ownership in own words |
| 3.2 | Brokerage account | 2.1, 3.1 | Pick the right account for a goal |
| 3.3 | Why the market tends to go up | 3.1 | Explain the mechanism; identify the catch |
| 3.4 | Index funds | 3.1, 3.3 | Explain why they usually beat stock-picking |
| 3.5 | ETF vs mutual fund | 3.4 | Pick the right one for a given goal |

**Track 4: Risk and diversification** (stubbed in MVP; full content in Phase 2)

| 4.1 | Risk vs return | 3.3 |
| 4.2 | Diversification | 4.1, 3.4 |
| 4.3 | Time horizon | 4.1 |
| 4.4 | Volatility ≠ permanent loss | 4.1, 3.3 |

**Track 5: Portfolio building** (stubbed)

| 5.1 | Asset allocation | 4.1, 4.3 |
| 5.2 | Dollar-cost averaging | 4.4, 5.1 |
| 5.3 | Rebalancing | 5.1 |
| 5.4 | Roth IRA basics | 5.1 |

**Track 6: Behavioral pitfalls** (interleaved throughout, not a separate gated track)

| 6.x | FOMO, panic-selling, recency bias, loss aversion | (varies) |

Mastery is a strict-prerequisite graph. UI is a skill tree where each node unlocks when its prereqs hit "mastered."

---

## 4. Lesson anatomy (5-15 min session)

### Default 8-minute session
```
0:00-0:10   Streak check + 1-line "what we're learning today"
0:10-2:30   3 review cards (interleaved across all unlocked concepts)
2:30-5:30   1 new-concept teach card + 1 retrieval check
5:30-7:30   1 application exercise (sim or decision)
7:30-8:00   "What stuck?" reflection (1 tap), summary, streak
```

### Variants
- **5 min** — drop the new concept, do reviews + 1 application
- **15 min** — full session + 2 extra applications + 1 long sim step

### Adaptation rules
- Session adapts to: how many reviews are due, the slot she has, prior fatigue (>3 wrong in a row → shorten next)

---

## 5. Spaced repetition engine

### Algorithm: simplified SM-2

Per card:
```
ease (default 2.5)
interval_days (default 0 for new)
due_date (default today for new)
lapse_count (default 0)
```

After review, she picks **Again / Hard / Good / Easy**.

| Response | Action |
|---|---|
| Again | interval = 0 (immediate re-review), ease -= 0.2 (floor 1.3), lapse++ |
| Hard | interval = max(1, interval × 1.2), ease -= 0.15 (floor 1.3) |
| Good | interval = interval × ease, ease unchanged |
| Easy | interval = interval × ease × 1.3, ease += 0.15 |

New cards: first interval = 1 day on first Good, then enter normal SM-2.

### Mastery
A card is "mastered" after 3 consecutive Good/Easy reviews AND interval ≥ 30 days. Concept mastery requires ≥80% of cards mastered AND the application exercise passed.

### Interleaving
Review queue is built by pulling due cards, then shuffling so no two consecutive cards are from the same concept (when avoidable).

---

## 6. Engagement system

### What we gamify carefully
- Daily streak with **grace days** (1 free skip per week, no streak loss)
- Skill tree visualization — unlocking nodes feels like real progress
- End-of-session summary names 1-2 specific wins (not generic)

### What we deliberately do NOT gamify
- **No XP/levels** — masks actual learning state with abstract numbers
- **No leaderboards** — single user; comparison breeds anxiety in personal finance
- **No speed bonuses** — encourages guessing over thinking
- **No hearts/lives** — punishes the very mistake-making that drives learning
- **No premium tier** — this is a parent's gift; no dark patterns
- **No guilt notifications** — one optional gentle reminder, user-controlled

**The Duolingo trap to avoid:** addictive metrics for their own sake. North star is "she made a sensible Roth IRA decision at 22," not "she has a 365-day streak."

---

## 7. Application layer (simulation only, minor learner)

### Three simulation types

1. **Decision simulator** — real-life scenario, picks an action, sees outcome over 1y / 5y / 10y
2. **Portfolio simulator** — paper portfolio with virtual $1,000; she picks % allocations; we replay historical S&P 500 + bond returns (1995-2024, baked in)
3. **Time-travel calculator** — adjustable monthly contribution + horizon → compound growth chart

**Rules**: no real money, no brokerage, no bank linkage, EVER. Works offline.

---

## 8. Progress and mastery tracking

Three states per concept:
- **Seen** — encountered, not yet retrievable
- **Familiar** — can retrieve with reminders / multiple choice
- **Mastered** — can retrieve cold AND applied successfully in a sim

Mastery is **NOT** memorization. A concept is only mastered when:
1. Cards on the concept hit SM-2 mastery (interval ≥ 30 days)
2. **At least one** simulation requiring the concept was completed successfully

Prevents the failure mode "she can define dollar-cost averaging but wouldn't use it." **Application gates mastery.**

### Dashboard shows
- Skill tree with node colors: locked (gray), seen (blue), familiar (yellow), mastered (green)
- Today's preview: "3 reviews due, 1 new concept, ~7 min"
- Honest progress: "12% through Track 3" — never a vague level number

---

## 9. Tech stack

| Layer | Choice | Plain-English why |
|---|---|---|
| Build tool | Vite | One command to start (`npm run dev`), one URL. Fast. |
| Language | TypeScript | Catches typos and bugs before Oihana sees them. |
| UI framework | React | Well-documented, easy to extend, fits a "screens + state" app. |
| Styling | Tailwind CSS | Responsive on phone with no separate CSS files. |
| State | Zustand + persist middleware | Tiny library; auto-syncs state to localStorage. |
| Storage | localStorage (browser) | No DB server. Data lives on her device. |
| Charts | Recharts | React chart library used for the portfolio sim. |
| Hosting | Run locally; later: Netlify/Vercel (free) | No backend = no infra to maintain. |

### Why no backend?
Single user, no real money, all data fits in browser storage. A backend adds complexity (auth, hosting cost, downtime) for zero benefit. If you ever want progress on multiple devices, add a sync layer later — not now.

### Why no PWA in v1?
PWAs add ~50 lines of setup. We can add it in Phase 2 once the core loop is proven. The app is fully usable in any phone browser without it.

---

## 10. Data model

Stored as a single JSON blob in localStorage (~5-20 KB total).

| Object | Fields |
|---|---|
| `user` | `name`, `created_at`, `current_streak`, `longest_streak`, `last_session_date`, `track_progress` (% per track), `settings` (session_length_pref, daily_reminder_time) |
| `concept` (static, in bundle) | `id`, `track_id`, `audience_age_range`, `title`, `summary`, `depends_on`, `cards` (array of card ids), `application_id` |
| `card_state` (per-user) | `card_id`, `ease`, `interval_days`, `due_date`, `lapse_count`, `last_reviewed_at`, `consecutive_good` |
| `card` (static, in bundle) | `id`, `concept_id`, `type` (recall/explain/decision/scenario), `prompt`, `answer`, `explanation` |
| `simulation` (static + state) | static: `id`, `name`, `type`, `concept_ids_tested`. state: `passed`, `last_attempt_at`, `attempts` |
| `session_log` | `id`, `date`, `duration_seconds`, `reviews_completed`, `correct_count`, `incorrect_count`, `new_concepts_introduced` |

**Static content** (`/src/content/curriculum.json`) ships with the app bundle. Editing curriculum = editing JSON + rebuild. No CMS. No backend.

---

## 11. Screen-by-screen UX

Mobile-first. One-thumb operation. Large tap targets.

1. **Welcome** (first run) — name input, 60-second intro, "Let's go" → first session
2. **Home (returning)** — streak, "Start today's session" big button, skill-tree mini-preview, 1-line motivation
3. **Session length picker** — 5 / 8 / 15 min (defaults to her previous choice)
4. **Card screen** — question/prompt at top, tap to reveal answer, self-grade Again/Hard/Good/Easy, explanation after grade
5. **Application screen** — scenario, choice buttons, outcome viz (chart for portfolio sims, narrative for decisions)
6. **End-of-session summary** — streak update, 1-2 specific wins, what's next
7. **Skill tree** — full curriculum map, tap node for details
8. **Settings** — name, daily reminder, "reset all progress" (with confirm), export/import data

All screens are single-column, large tap targets, max ~1 second of content visible at a time. No infinite scroll.

---

## 12. MVP scope vs later phases

### MVP (this build)
- Tracks 1-3 **fully covered** (Foundations, Banks, Investing 101)
- Tracks 4-6 **stubbed** (concept stubs, content TBD)
- ~30 concept cards, ~10 application exercises, 1 portfolio simulation
- Single user (Oihana)
- localStorage only (no sync)
- Web-only, responsive (works in phone browser)
- Streak + skill tree + session loop

### Phase 2 (next month)
- Tracks 4-6 fully covered
- ~80 total cards
- 3 portfolio simulations with historical-replay engine
- PWA support (install to home screen)
- Export progress as parent-readable report

### Phase 3 (later — younger-kid tracks)
- Age-scaled content: 8-10yo, 11-13yo, 14-16yo
- Track selection on first run / in settings
- **Same engine, different content JSON**

### Architectural decisions enabling Phase 3 without rebuild
- Curriculum lives in `/src/content/curriculum.json` (swappable per track)
- Concept/card schemas carry `track_id` and `audience_age_range` fields
- Track selection is a top-level setting, not hardcoded
- Adding a new track = adding a JSON file + a setting

---

## 13. Content authoring plan

### MVP content target
- 30 concept cards (covering Tracks 1-3)
- 10 application exercises (3-4 per track)
- 1 portfolio simulation (covers stocks, index funds, diversification, risk, time horizon)

### Authoring format
- JSON; each card is 5-15 lines; each exercise 20-40 lines
- MVP total: ~600 lines of JSON

### Authoring source
- MVP curriculum written inline by this build, drawing from Khan Academy Personal Finance, NextGen Personal Finance, and the Bogleheads wiki

### Quality bar
- Every answer fits on a phone screen without scrolling
- Every explanation has a "why does this matter for you?" sentence
- Every application exercise has at least one path that produces a teachable failure

### Editability
- Parent can edit `src/content/curriculum.json` directly. Future phases may add an in-app editor; not needed for MVP.

---

## Reviewer Concerns (open for parent review)

- **Voice & tone**: assumes a U.S. financial context (Roth IRA, S&P 500). If Oihana lives elsewhere, swap to local equivalents.
- **Personalization depth**: MVP examples are generic-teen ("babysitting income," "college expenses"). Phase 2 can adapt examples to her actual interests once usage data shows what hooks her.
- **Historical replay data**: uses real S&P 500 + bond returns 1995-2024 baked in. Updates require a code change (intentional — keeps the app offline + deterministic).

---

## Status: APPROVED FOR BUILD
