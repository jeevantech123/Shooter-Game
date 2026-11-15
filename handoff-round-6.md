# Handoff: Shooter-Game, after Round 6

These are notes for a fresh session that will do the next round. The standing rules for every session are in `CLAUDE.md`. This file covers the state of the project after Round 6 (2026-11-15).

Read in this order: `CLAUDE.md`, `problem.md`, `spec.md`, this file, then `docs/decisions/`. Start with `decisions.md` (D1–D13), then read `0001-…` to `0011-…`.

> `handoff-round-5.md`, `handoff-round-4.md`, `handoff-round-3.md`, `handoff-round-2.md`, and `handoff.md` (Round 1) are older handoffs. Where they disagree with this file, trust this file.

## Current state

- **Round 6 is complete.** `problem.md` has one Round 6 requirement. **R1: "Players can press shift to fire a special shotgun attack, with a cooldown of 10 seconds. The cooldown timer is shown under the high score block."** This R1 *adds* a feature. Ship movement (Rounds 1–2), R2–R9, the High Score (Round 3), the purple triangle (Round 4), and pausing with Esc (Round 5) still hold.
- `spec.md` was updated for Round 6 and committed in one commit. All of its edits applied (checked with `git diff` before the commit).
- `node --test` passes **125 tests**: 39 in `01-initial-build`, 19 in `02-round2-move-up-down`, 15 in `03-round3-high-score`, 17 in `04-round4-triangle-enemy`, 17 in `05-round5-pause`, and 18 in `06-round6-shotgun`. Counted file by file with `node --test <file>`. Checked with Node v26.13.0. The suite was run three times in a row, because one Round 1 page test uses real randomness.
- The server smoke check passed. `py -m http.server 8000` served `/`, `/style.css`, and `/game.js` with status 200. The served `game.js` has `fireShotgun`, and the served page has `id="shotgun-cooldown"` and "Shotgun: Shift".
- **The Round 6 browser play-check has not been confirmed.** Following D13, the user got the checklist at the bottom of this file. Ask whether they ran it. The Round 2–5 checks were not confirmed either.
- **Not committed:** the user's Round 6 edit to `problem.md`, this file, and Claude's Round 6 edits to `CLAUDE.md` (see "Unresolved", item 1).

### Round 6 commits (oldest first)

| Commit | What |
|---|---|
| `48c4261` | `spec.md`: the five-pellet fan, pellets following the shot rules until they leave the canvas, the 10 s cooldown with a fresh press needed, ready at each game start, Space and Shift kept separate, pause and Game Over behaviour, the hint line, the Shotgun panel, and pellets as shots with a sideways speed |
| `3a67a95` | `tests/06-round6-shotgun.test.js` (18 tests) and `tests/helpers.js` (a fake `shotgun-cooldown` element and `page.shotgunText()`). All 18 failed before the code, on purpose. |
| `24d25e8` | `game.js`: `SHOTGUN_*` constants, `shotgunTimer`, `fireShotgun`, `createPellet`, `updateShotgunCooldown`, `shotgunCooldownText`, `isOnCanvas`, `SHOTGUN_KEYS`, and `showShotgunCooldown`. `index.html`: the `.side-panels` column with the Shotgun panel, and "Shotgun: Shift" in the hint line. `style.css`: `.side-panels`, and the panel styles shared with High Score. |
| `c7a1ae3` | `README.md`: the Shift key, the 10 s recharge, the Shotgun panel, and the Round 6 test file |
| `6bc7b81` | Decision records `0010` and `0011` |

## How to run

**Game.** From the project folder:

```
py -m http.server 8000
```

Then open http://localhost:8000. Use the arrow keys or W/A/S/D to move, Space to fire, Shift for the shotgun, Esc to pause and un-pause, and Enter to restart after Game Over. The High Score panel is to the right of the canvas, and the Shotgun panel is under it.

**Tests.** These need Node 18 or newer, and nothing to install:

```
node --test
```

This runs every `tests/*.test.js` file. For a short summary, run `node --test 2>&1 | grep -E "^(✖|ℹ (tests|pass|fail))"`. To count the tests in one file, run `node --test tests/06-round6-shotgun.test.js`.

**Server smoke check.** Start `py -m http.server 8000` as a *background* task. Then `curl` `/`, `/style.css`, and `/game.js` and expect status 200, retrying a few times while the server starts. Then stop that task with TaskStop (load it with ToolSearch `select:TaskStop` if it is deferred). Do **not** kill every `py.exe`.

**Play-check tips:** triangles are random, about one enemy in four. To clear the high score, run `localStorage.removeItem("shooter-game-high-score")` in the DevTools console and reload. To see the fan clearly, fire the shotgun from the bottom middle before many enemies are on screen.

## Files

| File | What it is |
|---|---|
| `index.html` | `.game-row` holds the 480×640 `<canvas id="game">` and, **new in Round 6**, a `<div class="side-panels">` column with two `<aside>`s: the High Score panel (`#high-score`, starts at `0`) and the Shotgun panel (`#shotgun-cooldown`, starts at `Ready`). Then the control-hint line: "Move: ← → ↑ ↓ or W A S D · Fire: Space · Shotgun: Shift · Pause: Esc · Restart: Enter". |
| `style.css` | **Round 6:** `.side-panels` stacks the panels (`flex-direction: column`, 16px gap). `.shotgun` shares the `.high-score` box style, and `.panel-label`/`.panel-value` share the `.high-score-label`/`.high-score-value` styles. |
| `game.js` | All the game code: constants, state, update, high score, keyboard, drawing, and browser start-up |
| `tests/helpers.js` | `step()`, the fake canvas context, `createFakeStorage()`, and `loadGameInFakePage({ storage, random })`. **Round 6:** the fake page has a `shotgun-cooldown` element, and `page.shotgunText()` reads it. |
| `tests/01-…` to `06-round6-shotgun.test.js` | One file per round |
| `docs/decisions/decisions.md` | Round 1 records D1–D13 |
| `docs/decisions/0001-…` to `0011-…` | Records from Rounds 2–6, as Y-statements. The next number is **0012**. |
| `README.md` | For players: how to play, run, and test |

## How `game.js` is organised (Round 6 changes)

- **Constants:** `SHOTGUN_COOLDOWN = 10` (s), `SHOTGUN_PELLETS = 5`, and `SHOTGUN_SPREAD_SPEED = 100` (px/s of extra sideways speed between neighbouring pellets). All three are exported.
- **`createGame()`** has a new field, **`shotgunTimer: 0`**. 0 means ready. Because it is created there, restarting with Enter makes the shotgun ready again.
- **`updateGame()`** calls **`updateShotgunCooldown(state, dt)`** right after `updateFiring`, so the countdown sits behind the over/paused early return and freezes during a pause.
- **Firing happens in the key handler, not in `updateGame`** (`0011`):
  - `SHOTGUN_KEYS = ["ShiftLeft", "ShiftRight"]`.
  - `handleKeyDown` calls **`fireShotgun(state)`** on a non-repeat Shift press and always returns `true`.
  - `fireShotgun` does nothing when `isOver`, `isPaused`, or `shotgunTimer > 0`. Otherwise it pushes five pellets and sets `shotgunTimer = SHOTGUN_COOLDOWN`.
  - Shift is **not** in `input`, and `handleKeyUp` ignores it (returns `false`).
- **Pellets are shots** (`0010`):
  - `createPellet(ship, dx)` returns `{ ...createShot(ship), dx }`, with `dx` set to -200, -100, 0, 100, and 200 px/s.
  - Pellets go into `state.shots`, so `handleShotHits` and the drawing treat them exactly like shots (10 points each, drawn in `COLORS.shot`).
  - `moveShots` moves every shot up at `SHOT_SPEED` and adds `dx * dt` when `dx` is set. It keeps a shot only while **`isOnCanvas(shot)`** (it overlaps the canvas rectangle), so pellets that leave by a side are removed too.
- **`shotgunCooldownText(state)`** returns `"Ready"`, or `String(Math.ceil(shotgunTimer))` (10 down to 1). It is exported.
- **Browser start-up:** `startGame()` looks up `#shotgun-cooldown`. **`showShotgunCooldown(element, state)`** writes the text once at start-up and then each frame, but only when it has changed.
- **Not changed:** movement, normal firing, spawning, triangles, collisions, the high score, pause, and drawing. `fireShotgun`, `createPellet`, `isOnCanvas`, and `showShotgunCooldown` are **not exported**. Tests reach them through `handleKeyDown`, `updateGame`, and the fake page.

## Decisions made in Round 6

### Chosen by the user (asked before any code was written)

1. **A blast is a fan of 5 pellets**: one straight up, two to the left, two to the right. A fan of 3, and a row of 5 parallel shots, were the alternatives.
2. **Pellets fly until they leave the screen.** A short range (around 200 px) was the alternative.
3. **The timer shows whole seconds and "Ready"**: label "Shotgun", counting 10, 9, … 1, then "Ready". One decimal (10.0 … 0.1), and a bare number with 0 when ready, were the alternatives. Claude proposed the box under the High Score panel in the same style, and the user accepted it with this answer.
4. **One blast per press.** Holding Shift does not fire again when the cooldown ends. Auto-firing when ready (like Space) was the alternative.

### Judgment calls by Claude (all reported to the user at the end of Round 6)

- **Pellets are normal shots with a sideways speed `dx`** in `state.shots` (`0010`). The upward speed is the same as a normal shot, and the fan is ±100 and ±200 px/s sideways, so the outer pellets angle out about 22°. A separate pellet list and true angles were rejected.
- **All five pellets start at the same point (the ship's nose)** and spread as they fly. They are the same size and colour as normal shots.
- **The blast fires inside `handleKeyDown`**, and the cooldown counts down inside `updateGame` (`0011`). A "fire requested" flag used up on the next frame was rejected, because a press just before Esc would fire after the pause.
- **Both Shift keys fire.**
- **The shotgun is ready at the start of every game,** including after a restart.
- **Space and Shift are independent.** Neither one's delay holds back the other.
- **Shift does nothing while paused or on Game Over,** and is not saved up. The spec now says this.
- **On Game Over the panel keeps its last value.** Restarting shows "Ready".
- **The two panels sit in a new `.side-panels` column.** The Shotgun panel copies the High Score style.
- **The hint line lists "Shotgun: Shift"**, and the README was updated.
- **Shift always returns `true`** (prevents the browser default), even when nothing fires, matching Esc and Enter.
- **Two decision records** were written (at least one was asked for).

## Unresolved

1. **Claude edited `CLAUDE.md` (not committed) with Round 6 standing rules.** Ask the user whether they accept them:
   - (a) The fresh-press rule now covers a key that triggers a one-time action (Shift), not only a toggle (Esc).
   - (b) Every shot, pellets included, lives in `state.shots`, and a shot with no `dx` goes straight up (older tests build plain shots).
   - (c) A new element that `startGame()` looks up with `getElementById` needs a matching fake element in `tests/helpers.js`.
2. **The Round 6, 5, 4, 3, and 2 browser play-checks are unconfirmed.** The shotgun has only been checked by tests, not by eye: how wide the fan looks, whether 10 s feels right, and how the stacked panels look.
3. **The judgment calls above have not been confirmed by the user.** The most visible ones are the width of the fan, pellets looking the same as normal shots, and the panel keeping its last number on Game Over.
4. **Windows Sticky Keys:** pressing Shift five times quickly can open the Windows "Sticky Keys" dialog. A player who taps Shift during the cooldown could trigger it. A web page cannot turn this off. Not raised with the user yet. Changing the key would change the requirement, so ask first.
5. **The `problem.md` Round 6 edit is uncommitted.** Do not commit it unless asked.
6. **D11 (the control-hint line)** was never formally approved. The user added "Pause: Esc" in Round 5. "Shotgun: Shift" was a Claude judgment call in Round 6. Do not edit `decisions.md`.
7. **Carried from Round 5:** the game does not pause when the tab is hidden (the user's choice). `MAX_FRAME_TIME` (0.1 s) still caps the jump when the tab comes back.
8. **Carried from Round 4:** the triangle's hit box is its full 30×30 rectangle, so its empty top corners count as hits. Ask before changing it.
9. **Carried from Round 2:** shots vanish when the ship is at the very top edge, because `createShot` puts the shot fully above the canvas and `moveShots` removes it at once. **This now applies to shotgun pellets too:** a blast fired from the top edge is wasted and still starts the 10 s cooldown. Ask before changing this.
10. **Carried from Round 2:** a ship parked at the top edge gets hit by every enemy that spawns above it. Under the spec, this is not a bug.
11. **`handoff.md` (Round 1) is out of date.** Git tracks it as `HANDOFF.md`. Do not edit it unless asked.

## Warnings for the next session

- **Every new game-state field must be in `createGame()`.** The R8 tests `assert.deepEqual(state, game.createGame())` after a restart, and the Round 5 freeze test `structuredClone`s the whole state. `shotgunTimer` is plain data and passes both. Do not put functions in the state.
- **The shotgun fires during `handleKeyDown`.** A test sees five new shots in `state.shots` straight after the key press, before any `updateGame`. The cooldown only starts counting down on the next update.
- **`shotgunCooldownText` uses `Math.ceil`.** After exactly N whole seconds of 1/60 s steps, the float can land just above or just below a whole number. Round 6 tests read the text at half-second points (such as 5.5 s) or collect the sequence of values. Do not assert the text at an exact whole second.
- **Long page tests must not lose all lives.** With `random: () => 0.5`, red squares spawn right above the ship and the game is over by about 10 s. The Round 6 page test uses `random: () => 0` (slow triangles at x = 0), which loses no lives for about 12 s.
- **The Round 6 unit tests clear `state.enemies` after every step** (`playFor` in `06-…`), so enemies never get in the way of cooldown tests. Follow this pattern for long timing tests.
- **Page tests count pellets as `rectsWithColor(COLORS.shot)`.** If pellets ever get their own colour, update the "Shift fires five pellets on the canvas" test.
- **HTML structure tests:**
  - The Round 3 test matches `<div class="game-row">…</div>` followed by `<p class="controls">` (lazy, so the nested `.side-panels` div is fine).
  - The Round 6 test matches `<div class="side-panels">…</div>` up to the **first** `</div>`. Do not put another `<div>` inside `.side-panels`. Use `<aside>`/`<span>` instead, or update that test.
- **The fake page only knows the ids `game`, `high-score`, and `shotgun-cooldown`.** A new `getElementById` in `startGame()` throws in every page test until `tests/helpers.js` has it (now a `CLAUDE.md` rule). The fake `document` also has no `addEventListener`.
- **The test "the game does not pause by itself"** (Round 5) checks that the page registers only `keydown` and `keyup` listeners. A new `window.addEventListener` will fail it.
- **Firing normal shots reads the key held during an update.** Pressing and releasing Space before `step()` fires nothing. The shotgun is the opposite: it fires on the press itself.
- **`random` in tests controls the enemy kind:**
  - `() => 0.5` (the default for `step()`) gives only red squares at x = 225.
  - `() => 0` gives only triangles, at x = 0, heading left.
  - Use a sequence for anything else (see `sequence()` in `04-…`).
- **The R9/rules test bans some words** in `index.html`, `style.css`, and `game.js`, even in comments: `http://`/`https://`, `fetch`, `XMLHttpRequest`, `WebSocket`, `<input`, `password`, `login`.
- **The input object is not reset on restart or on pause.** Held move and fire keys carry over, on purpose (`0009`). Shift is not in `input` at all.
- **`spec.md` and `CLAUDE.md` use LF line endings,** escaped Markdown (`\-`, `\#`), one blank line between list items, and three blank lines before a `\##` heading. Check with `grep -n "" spec.md | cat -A` before an Edit.
- **Do not pipe a Python script into `python`/`py` through a bash heredoc.** It hangs. Use the Edit tool.
- **Git prints "LF will be replaced by CRLF" warnings** on commit. They are harmless.
- **Never commit a handoff file or `CLAUDE.md` changes yourself.**
- **Next numbers:** test file **07**, decision record **0012**.

## Manual play-check list (Round 6)

1. Run `py -m http.server 8000` and open http://localhost:8000. A "Shotgun" box showing "Ready" sits directly under the High Score box, in the same style. The hint line includes "Shotgun: Shift".
2. Press Shift. Five pellets leave the ship's nose and fan out: one straight up, two to the left, two to the right. The box shows 10, counts down 9, 8, … 1, then shows "Ready".
3. Press Shift during the countdown: nothing fires. Hold Shift through the whole countdown: no second blast until you let go and press again.
4. One blast can destroy several enemies, each worth 10 points. Pellets disappear off the top and off the sides.
5. Hold Space and press Shift: normal shots keep firing during the cooldown.
6. Pause with Esc during the countdown: the number stops. Shift does nothing while paused, and nothing fires on resume.
7. On Game Over, Shift does nothing. Press Enter: the box shows "Ready".
8. Pausing, the High Score, the purple triangles, and moving in all four directions still work as in Round 5.
