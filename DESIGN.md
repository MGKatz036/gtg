# GTG — "Game Theory Game"
## Title: **PRISONER.DILEMMA.BAS**
### Design Document v1.1 — July 8, 2026

(Title chosen by Michael. Note: real DOS used 8.3 filenames, so the boot screen may type `C:\>RUN DILEMMA.BAS` before the stylized title card — final flourish TBD.)

A 1–2 player web-based game built around the **Iterated Prisoner's Dilemma** and Robert Axelrod's famous 1980 computer tournaments. Inspired by Veritasium's video ["This game theory problem will change the way you see the world"](https://www.youtube.com/watch?v=mScpHTIi-kM).

**Status:** Design phase. No code yet — this document is the agreed vision before any implementation begins.

---

## 1. The Core Game

Two players repeatedly choose **Cooperate** or **Defect**, simultaneously, over many rounds.

**Payoff matrix (classic Axelrod values):**

| | They Cooperate | They Defect |
|---|---|---|
| **You Cooperate** | You: 3, Them: 3 | You: 0, Them: 5 |
| **You Defect** | You: 5, Them: 0 | You: 1, Them: 1 |

Key insight the game teaches: this is **non-zero-sum** — both players can do well, and the "obvious" selfish move loses in the long run.

---

## 2. Two Game Modes

### Mode 1 — "Play the Game"
The human makes each Cooperate/Defect choice, round by round.
- **1-player:** vs. a CPU strategy (identity hidden — see §5).
- **2-player:** two humans, same device (see §9).

### Mode 2 — "Coach the Strategy"
The player selects or **designs a strategy**, then watches it compete automatically, Axelrod-style.
- Strategy vs. strategy single matches, or full round-robin tournaments.
- Player skill shifts from tactical (each round) to architectural (designing the ruleset).

---

## 3. Match Settings (player-facing options)

### Turn count — the central experiment
1. **Fixed & known** — e.g., "10 rounds, both players know." End-game betrayal becomes a legit tactic (backward induction).
2. **Random length** — players know it's random but not when it ends. Preserves the "shadow of the future" (how Axelrod ran Tournament 2).
3. **Hidden** — one or both players don't know the count. Psychological layer.

**Defaults (decided):**
- **Quick Match (human plays):** random length averaging ~20 rounds (roughly 15–25), and the anticipated round count is **NOT shown** by default. Fixed-and-known available in settings.
- **Simulated pairings (Mode 2):** a **"Classic" option = exactly 200 rounds** (Axelrod's Tournament 1), plus **random duration (150–300 rounds)** options both with and without the strategies "knowing" the count.
- **Human-played Tournament Mode:** ~20 rounds per pairing across the 15-opponent ladder (~30–45 min); progress saved between matches so it needn't be one sitting.

### Win condition — selectable
1. **Maximize points** (purist, non-zero-sum): beat a benchmark; both players can win.
2. **Defeat opponent** (versus): whoever scores more wins.

Players will discover different strategies win under different goals — that's the lesson.

### Noise
**None.** All strategies play deterministically (except intentionally random ones). Decided — keeps matches replayable and explanations clean.

---

## 4. The Strategy Roster

- **Source:** the open-source **Axelrod-Python Library** ([axelrod.readthedocs.io](https://axelrod.readthedocs.io)) — 230+ documented strategies with historically correct names. We re-implement the logic in JavaScript.
- **Must include:** all 15 first-tournament entries with proper names — Tit For Tat (Rapoport), Grudger (Friedman), Joss, Davis, Graaskamp, Downing, Feld, Grofman, Nydegger, Shubik, Stein & Rapoport, Tideman & Chieruzzi, Tullock, Name Withheld, Random.
- Plus second-tournament notables (Tester, Tranquilizer, Champion...) and post-Axelrod celebrities (Pavlov / Win-Stay-Lose-Shift, Generous Tit for Tat, Tit for Two Tats, Gradual, Prober, zero-determinant/extortionate strategies).
- **Goal: A LOT of strategies.** Famous ones are the gateway; 200 deep cuts are the collection.
- **v1 launch roster (decided): ~25** — the complete Tournament 1 field (all 15) + ~10 celebrities (Pavlov, Generous Tit for Tat, Tit for Two Tats, Gradual, Prober, Tester, Tranquilizer, one extortionate zero-determinant strategy, Always Cooperate, Always Defect). Architecture must make adding the rest pure data entry.
- Each strategy gets a **"museum plaque"**: who submitted it, what year, how it placed, how it works in plain English.
- Roster organized by era (Tournament 1 / Tournament 2 / Modern) and/or personality (Nice / Nasty / Weird).

---

## 5. Mystery Opponent & The Reveal

- In both modes, the player does **not** know which strategy they're facing.
- Deducing the opponent is part of the fun (detective element).
- **At match end: the reveal** — the opponent's floppy disk ejects and flips over to show its label, followed by the museum plaque and an **animated replay** of the match with annotations (e.g., showing exactly when Joss sneaked in random defections).

---

## 6. The Strategy Builder

Players design custom strategies via checkboxes/dropdowns — no programming. Parameters:

- **First move:** Cooperate / Defect
- **Response to defection:** retaliate immediately / after N defections / never / forever (grudge)
- **Forgiveness:** return to cooperation after N rounds, or % chance per round
- **Memory:** last move / last N moves / full history
- **Sneakiness:** occasional random defection probe (like Joss)
- **End-game behavior:** defect in final K rounds if length is known

~6 controls can reconstruct most classics plus hundreds of novel combinations. Saved strategies are written to a **floppy disk** with a player-typed label (see §8).

---

## 7. Progression & Cheat Codes

### Unlocking (the honest path)
- Start with a small roster: **Tit for Tat, Always Defect, Always Cooperate, Random** (the four "primary colors").
- Beating or correctly identifying a mystery opponent adds their disk to your shelf.
- Filling the disk shelf is the meta-game (Pokédex-style collection).
- Special feats unlock rare strategies (e.g., beat Grudger without defecting first; win a tournament to unlock its historical champion).

### Cheat codes (the fun path)
- Entered by **typing at the C:\> prompt** — the DOS prompt IS the cheat interface. No extra UI.
- **Starter code list (decided):**

| Code | Effect | Type |
|---|---|---|
| `UNLOCK ALL` | every disk on the shelf | progression |
| `UNLOCK 1980` | Tournament 1 field | progression |
| `UNLOCK NASTY` | all the mean strategies | progression |
| `XRAY` | reveal opponent identity pre-match | gameplay (blocks unlocks) |
| `ORACLE` | see opponent's next move | gameplay (blocks unlocks) |
| `PAYOFF T,R,P,S` | rewrite the payoff matrix | sandbox (blocks unlocks) |
| `TURBO` | simulations run at max speed | quality-of-life (harmless) |
| `AMBER` / `GREEN` / `WHITE` | CRT phosphor color | cosmetic (harmless) |
| `LOUD` | absurdly loud floppy drive | cosmetic (harmless) |
| `RAPOPORT` | secret: opponent pool becomes all Tit for Tat variants | easter egg |
- **Rule:** gameplay-altering cheats disable unlock progress for that session; cosmetic/sandbox cheats are harmless.
- Codes are discoverable in-game: hidden in museum plaques, a fake manual, printouts — like magazine cheat codes circa 1987.

---

## 8. Aesthetic: "Modern 8-bit" 1980s PC

Highly stylized retro UI simulating a 1980s personal computer. Historically resonant: Axelrod's contestants literally mailed in their strategies as code.

- **Boot sequence:** BIOS screen, memory check, blinking cursor, `INSERT STRATEGY DISK...`
- **The disk shelf:** saved/unlocked strategies live as labeled 5.25" floppies; drag one into the drive → whirr/grind sounds → strategy loads.
- **Strategy builder = disk formatter**; type the label on a new disk.
- **CRT look:** chunky pixel art, phosphor green/amber, scanlines, subtle screen curvature.
- **Tournaments as mainframe batch jobs:** results print line by line.
- Tech: pixel fonts, CSS effects, Web Audio for disk sounds. No game engine needed.
- **Sound (decided): cute chiptune soundscape** — effects AND music. Floppy drive seek/grind, PC-speaker menu beeps, soft key clacks, a triumphant beep-melody on the reveal. Master mute toggle; default ON for desktop, OFF on phones.
- **Platform (decided): desktop web-first**, with a friendly mobile/touch layout as a genuine secondary target (big touch targets, portrait reflow).

---

## 9. Session Shapes

### 1-player (both included)
- **Quick Match:** one mystery match (~2 minutes).
- **Tournament Mode:** your disk enters a round-robin ladder against the historical field, standings printout at the end — recreating the 1980 tournament with you as an entrant.

### 2-player
- **Same device** (decided). Hidden simultaneous input (decided):
  - **Desktop — secret keys:** Player 1 uses `A`/`S`, Player 2 uses `K`/`L` (cooperate/defect). Screen shows only `AWAITING INPUT...`; no feedback until both have pressed.
  - **iPhone/iPad — touch zones:** each player gets a screen corner, cups a hand over it, taps.
  - No pass-the-device mode.
- **Future feature (not v1):** online play between two devices over the internet.

---

## 10. Technology & Hosting

- **Plain HTML / CSS / JavaScript.** No server, no game engine, no build tools required.
- Runs entirely in the browser; saves (unlocks, custom disks) in browser local storage.
- Works on Mac and iOS Safari (touch support to be considered in UI design).
- **Hosting: GitHub Pages — free.** Push files to a GitHub repository, enable Pages, get a public URL. Setup is ~15 minutes and will be documented when we get there.
- All work lives in `/Users/michaelkatz/Dropbox/Claude Code/GTG` — never in the EP Coding folder.

---

## 11. Future Features (explicitly deferred)

- Online 2-player over the internet
- (Possibly) optional noise / "trembling hand" mode — currently decided against
- Evolutionary/ecological simulation mode (populations of strategies breeding over generations)?

---

## 12. Open Questions — ALL RESOLVED (July 8, 2026)

1. **Title:** PRISONER.DILEMMA.BAS (see top of document; 8.3-filename flourish TBD).
2. **Match lengths:** see defaults in §3.
3. **2-player hidden input:** secret keys (desktop) + touch zones (mobile); see §9.
4. **v1 roster:** ~25 strategies; see §4.
5. **Cheat codes:** starter list written; see §7.
6. **Sound:** chiptune effects + music, mute toggle; see §8.
7. **Mobile:** desktop web-first, friendly mobile secondary; see §8.

**Next step agreed:** build a small visual prototype — boot screen + one playable Quick Match vs. a mystery opponent — before building out the full roster.

---

## 13. Build Log

**v0.1 (July 8, 2026)** — single-file prototype: boot sequence, title card, Quick Match vs. 8 mystery strategies, reveal screen with plaque and verdict, chiptune sounds. Approved by Michael (pacing + green CRT).

**v0.2 (July 8, 2026)** — split into `index.html` / `style.css` / `strategies.js` / `game.js`. Added:
- Main menu (A–F keys or click)
- **16 strategies** (all with plaques): TFT, Grudger, Joss, Davis, Feld, Tullock, Shubik, Tit for Two Tats, Tester, Pavlov, Generous TFT, Gradual, Prober, Always Defect, Always Cooperate, Random
- **Disk shelf** with unlock progression (start with 4 starters; earn a disk by outscoring it or hitting ≥85% of par), saved in browser localStorage
- **Strategy Lab** — dropdown-based custom strategy builder, saved as custom disks (erasable)
- **Batch Job** (Mode 2 lite) — your disk vs. a mystery disk, secret length 150–300 or Classic 200 (known), animated playback
- **Head to Head** (2P same device) — secret keys A/S vs K/L plus touch buttons
- **C:\ prompt** with full cheat code list from §7 (UNLOCK ALL/1980/NASTY, XRAY, ORACLE, PAYOFF, TURBO, GREEN/AMBER/WHITE, LOUD, RAPOPORT); gameplay cheats disable collecting for the session
- CRT phosphor themes (green/amber/white), persisted

**Still to build (after v0.3):** boot-screen `RUN DILEMMA.BAS` title flourish decision, music (currently effects only), GitHub Pages deployment, remaining Tournament-2/modern deep-cut strategies.

**v0.3 (July 8, 2026)** — Tournament Mode + complete historical Tournament 1 field. Added:
- **7 new strategies** (roster now 23): Grofman, Nydegger (faithful 19-pattern implementation), Stein & Rapoport, Tideman & Chieruzzi, Graaskamp, Downing, Name Withheld — several marked "(simplified here)" on their plaques where the original spec was condensed
- **Tournament Mode (menu G)** — the full 1980 recreation: you face all 15 real Tournament-1 entrants in shuffled order as mystery opponents, 20 rounds each, length KNOWN (backward-induction drama intended; Stein & Rapoport really does betray the last 2 rounds). The 105 CPU-vs-CPU pairings simulate instantly at the end; final standings print line-by-line on the "GTG SYSTEMS LINE PRINTER" with all 16 entrants ranked and YOU marked. Rank-dependent closing message.
- Tournament progress persists between sessions (resume from the menu: "MATCH n OF 15"); disks earned in tournament matches count toward the collection.

**Deployed (July 8, 2026):** live at **https://mgkatz036.github.io/gtg/** — public GitHub repo `MGKatz036/gtg`, GitHub Pages serving the `main` branch root. To publish updates: commit changes and `git push` (Pages redeploys automatically in ~1 minute). GitHub CLI installed at `~/.local/bin/gh`, authenticated as MGKatz036.
