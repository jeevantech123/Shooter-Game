# Handoff: Shooter-Game, after Round 2

Notes for a fresh session that will do the next round. Standing rules for every session are in `CLAUDE.md`. This file covers the state of the project after Round 2 (2026-11-13).

Read in this order: `CLAUDE.md`, `problem.md`, `spec.md`, this file, then `docs/decisions/` (`decisions.md` for D1–D13, then `0001-…`, `0002-…`).

> `handoff.md` is the **Round 1** handoff. Parts of it are now wrong (see "Warnings"). Where the two disagree, trust this file.

## Current state

- **Round 2 is complete.** `problem.md` has one Round 2 requirement. It changes **R1**: the ship moves left, right, up, and down, using the same logic as before. R2–R9 are unchanged.
- `spec.md` was updated for Round 2 and committed.
- `node --test` passes **58 tests**: 39 in `tests/01-initial-build.test.js` and 19 in `tests/02-round2-move-up-down.test.js` (checked with Node v26.13.0).
- Server smoke check passed: `py -m http.server 8000` serves `/`, `/style.css`, and `/game.js` with status 200.
- **The browser play-check for Round 2 has not been confirmed.** Claude does not drive a browser (D13). The user was given the checklist at the bottom of this file. Ask the user whether they ran it.
- The working tree was clean at `bc9d592`. Only this file and the `CLAUDE.md` edits are uncommitted, and they are left for the user to review.

### Round 2 commits (oldest first)

| Commit | What |
|---|---|
| `9b43ecf` | Committed the user's move of `decision.md` to `docs/decisions/decisions.md` |
| `d9b9436` | `spec.md`: up/down movement, whole-canvas clamp, per-axis speed, restart puts the ship back |
| `372506b` | Added `tests/02-round2-move-up-down.test.js`. 12 of its tests failed before the code change, on purpose. |
| `4c03b19` | `game.js`: up/down movement |
| `7a41a15` | Control hint in `index.html` and `README.md` now list ↑ ↓ and W/S |
| `bc9d592` | Decision records `0001` and `0002` |

## How to run

**Game.** From the project folder:

```
py -m http.server 8000
```

Then open http://localhost:8000. Controls: arrow keys or W/A/S/D to move, Space to fire, Enter to restart after Game Over.

**Tests.** Needs Node 18 or newer, and nothing to install:

```
node --test
```

This runs every `tests/*.test.js` file. Run `node --test 2>&1 | grep -E "^(✖|ℹ (tests|pass|fail))"` for a short summary.

**Server smoke check.** Run `py -m http.server 8000` as a *background* task. Then `curl` the three files and expect status 200 for each; retry a few times while the server starts. Then stop that task with TaskStop. Do **not** kill every `py.exe`: that was blocked in Round 1.

## Files

| File | What it is |
|---|---|
| `index.html` | 480×640 `<canvas id="game">`, one control-hint line (`<p class="controls">`), loads `style.css` and `game.js` |
| `style.css` | Centers the canvas on a dark page |
| `game.js` | All game code: constants, state, update, keyboard, drawing, browser start-up |
| `tests/helpers.js` | `step()` (60 fps steps, `random` fixed at 0.5), a recording fake canvas context, `loadGameInFakePage()` (runs `game.js` as a page script in a Node `vm`) |
| `tests/01-initial-build.test.js` | Round 1 tests, R1–R9 plus page wiring and project rules |
| `tests/02-round2-move-up-down.test.js` | Round 2 tests for the changed R1 and how it works with R2, R6, R7, and R8 |
| `docs/decisions/decisions.md` | Round 1 records D1–D13 (old format, not numbered files) |
| `docs/decisions/0001-*.md`, `0002-*.md` | Round 2 records, as Y-statements |
| `README.md` | Player-facing: how to play, run, and test |
| `HANDOFF.md` | Round 1 handoff (partly out of date) |

## How `game.js` is organised

- `updateGame(state, input, dt, random)` is the single step. Order: move ship → fire → move shots → move enemies → spawn → shot hits → enemy losses → game-over check. It returns at once when `state.isOver` is true.
- **Changed in Round 2:** `moveShip` (around line 86) uses `axisDirection(negative, positive)` to get −1/0/1 for each axis. Then it clamps `x` to `[0, CANVAS_WIDTH - width]` and `y` to `[0, CANVAS_HEIGHT - height]`. Both axes use `SHIP_SPEED`.
- **Changed in Round 2:** `createInput()` now has `up` and `down`. `UP_KEYS = ["ArrowUp", "KeyW"]` and `DOWN_KEYS = ["ArrowDown", "KeyS"]` go through `setKey`, so these keys also call `preventDefault()` and the page does not scroll.
- `handleKeyDown` / `handleKeyUp` take `event.code` and return `true` for game keys. Enter calls `resetGame(state)` only when the game is over.
- `drawGame` draws the background, the ship (a triangle; its hit box is the rectangle), shots, enemies, the HUD `"Score: N   Lives: N"`, and the game-over text. Tests match these exact strings.
- The two guards at the end of the file (`startGame()` only if `document` exists; `module.exports` only if `module` exists) must stay.

## Decisions made in Round 2

### Chosen by the user (asked before any code was written)

1. **Up/down keys are ArrowUp/ArrowDown plus W/S.** This matches the existing arrows + A/D pattern.
2. **The ship may move over the whole canvas.** It uses the same clamp as left/right. The user did not want it limited to the bottom half or third. See `docs/decisions/0002-ship-may-move-over-whole-canvas.md`.
3. **Diagonal movement uses full speed on each axis.** It is not normalized, which matches the old left/right logic exactly. Diagonal movement is about 1.41× faster. See `docs/decisions/0001-diagonal-movement-per-axis-speed.md`.
4. **The uncommitted move of `decision.md` to `docs/decisions/decisions.md` was committed** on its own.

### Judgment calls by Claude (all reported to the user at the end of Round 2)

- `spec.md` now also says the ship starts centered, holding opposite keys cancels out, and restart puts the ship back at its start. The code already reset the ship through `createGame()`; the spec now says so.
- Vertical movement reuses `SHIP_SPEED`. No separate vertical speed constant was added.
- Shots still travel only upward, wherever the ship is.
- An enemy that slips below a raised ship still costs a life when it reaches the bottom. R6 is unchanged, and a test covers it.
- The control hint under the canvas (D11) and the README were updated to show ↑ ↓ and W/S. A test checks the hint.
- The failing tests were committed before the code. Test names start with the requirement ID; tests that cover two requirements use `R1/R2`, `R1/R8`, and so on.
- Two decision records were written (at least one was asked for). They are named `NNNN-short-slug.md`. D1–D13 were left unconverted in `decisions.md`.
- D13 was kept: Claude ran the server smoke check and gave the user a checklist instead of playing in a browser.

## Unresolved

1. **Shots vanish when the ship is at the very top edge.** `createShot` puts the shot at `ship.y - SHOT_HEIGHT`. With the ship at `y = 0` (or below about 8 px), the shot starts above the canvas. `moveShots` then removes it before the hit check runs, so pressing Space does nothing visible. This was confirmed in Node (ship at y=0: 0 shots; ship at y=10: 1 shot). The spec does not cover this case. Ask the user before changing it; it is not a fix to make on your own.
2. **A ship parked at the top edge gets hit by every enemy that spawns above it.** Enemies spawn at `y = -ENEMY_SIZE` and slide in onto the ship. This follows from the whole-canvas choice (0002) and is not a bug under the spec, but the user may want to know.
3. **The browser play-check for Round 2 is unconfirmed** (see "Current state").
4. **`CLAUDE.md` vs D13.** `CLAUDE.md` says "After each change, play the game in the browser…", but D13 (the user's choice) says the user does the browser check. Round 2 followed D13. Ask the user which one holds.
5. **D11 (the control-hint line)** was flagged to the user in Round 1 and is still not explicitly approved. Round 2 extended it.
6. **`HANDOFF.md` (Round 1) is out of date** (details below). The user has not decided whether to update it, delete it, or keep it as history. Do not edit it unless asked.

## Warnings for the next session

- **Requirement IDs get reused.** Round 2's "R1" *replaces* Round 1's R1 instead of adding R10. Tests labelled `R1` in `01-initial-build.test.js` check left/right; those in `02-…` check up/down. Read each new round's list in `problem.md` carefully, and ask if an ID's meaning is unclear.
- **`HANDOFF.md` is wrong in places:** it says `decision.md` is in the project root (it is now `docs/decisions/decisions.md`), it says 39 tests and "the next test number is 02" (the next is **03**), it says the user's `CLAUDE.md`/`spec.md` edits are uncommitted (they were committed before Round 2), and it says the spec has an unfinished sentence (it is fixed).
- **`problem.md`, `spec.md`, and `CLAUDE.md` use escaped Markdown** (`\#`, `\-`) with extra blank lines. This is the user's style. Keep it when editing `spec.md` or `CLAUDE.md`, and do not "clean it up".
- **The R8 test does `assert.deepEqual(state, game.createGame())` after a restart.** Any new field added to the game state must be created by `createGame()`, or that test will fail.
- **The `input` object is not reset on restart.** Keys held through Enter stay held. No test or spec item covers this; it has not been a problem so far.
- **Tests that move the ship vertically should keep enemies away.** `02-…` sets `state.spawnTimer = -100` for this, because a ship moving up can now run into falling enemies and lose lives mid-test.
- **Git prints "LF will be replaced by CRLF" warnings** on commit. They are harmless (autocrlf).
- **Each round's prompt has asked for:** list the requirements and ask about anything unclear *before* coding; update and commit `spec.md`; write tests named by requirement ID; commit in small steps; write at least one Y-statement record in `docs/decisions/` (the next number is **0003**); list unrequested decisions at the end; never undo or amend a commit; do not write the handoff until asked.

## Manual play-check list (Round 2)

1. Run `py -m http.server 8000` and open http://localhost:8000. The game starts right away with "Score: 0   Lives: 3". The hint under the canvas lists ← → ↑ ↓ and W A S D.
2. Up/W moves the ship up and Down/S moves it down. The page does not scroll.
3. The ship stops at all four edges and can reach each corner.
4. Holding Up + Right moves diagonally. Holding Up + Down keeps the ship still on that axis.
5. Left/right, Space, enemies, scoring, and lives work as in Round 1.
6. Shots fire upward from the ship's current position after moving up.
7. An enemy that gets below a raised ship still costs a life when it reaches the bottom.
8. After Game Over, Enter starts a new game with the ship back at the bottom center.
