# Handoff: Shooter-Game, after Round 4

These are notes for a fresh session that will do the next round. The standing rules for every session are in `CLAUDE.md`. This file covers the state of the project after Round 4 (2026-11-14).

Read in this order: `CLAUDE.md`, `problem.md`, `spec.md`, this file, then `docs/decisions/`. Start with `decisions.md` (D1–D13), then read `0001-…` to `0007-…`.

> `handoff-round-3.md`, `handoff-round-2.md`, and `handoff.md` (Round 1) are older handoffs. Where they disagree with this file, trust this file.

## Current state

- **Round 4 is complete.** `problem.md` has one Round 4 requirement. **R1: a new type of enemy, a purple triangle that faces downward. It moves "half as slow as the red squares" and moves left and right sideways.** This R1 *adds* a feature. Ship movement (Rounds 1–2), R2–R9, and the High Score (Round 3) still hold.
- `spec.md` was updated for Round 4 and committed, in two commits (see "Warnings").
- `node --test` passes **90 tests**: 35 in `01-initial-build`, 15 in `02-round2-move-up-down`, 15 in `03-round3-high-score`, and 17 in `04-round4-triangle-enemy`. Some tests are generated in loops, which is why the file counts add up to fewer than 90. Checked with Node v26.13.0, and the suite was run three times in a row because one Round 1 page test uses real randomness.
- The server smoke check passed. `py -m http.server 8000` served `/`, `/style.css`, and `/game.js` with status 200, and the served `game.js` has the triangle code.
- **The Round 4 browser play-check has not been confirmed.** Following D13, the user got the checklist at the bottom of this file. Ask whether they ran it. The Round 2 and Round 3 checks were not confirmed either.
- **Not committed:** the user's Round 4 edit to `problem.md`, this file, and Claude's Round 4 edits to `CLAUDE.md` (see "Unresolved", item 1).

### Round 4 commits (oldest first)

| Commit | What |
|---|---|
| `822fd6c` | `spec.md`: **only** the "How it works" lines (rectangle hit box for the triangle, and enemies record their kind). The Behavior bullets failed to apply. |
| `1634239` | `spec.md`: the missing Behavior bullets (two enemy kinds, one in four is a triangle, half fall speed, bounces between edges, same rules) |
| `c8e626c` | `tests/04-round4-triangle-enemy.test.js`. 13 of 17 tests failed before the code, on purpose. |
| `8970ca4` | `game.js`: triangle constants, `createEnemy` kinds, `moveTriangle`, `drawTriangleEnemy`, and the new exports |
| `1d7ec23` | Fixed one test that released Space before any update, so no shot was fired. The game code was right. |
| `edd527c` | `README.md`: the two enemy kinds, and the Round 4 test file |
| `5aa4636` | Decision records `0006` and `0007` |

## How to run

**Game.** From the project folder:

```
py -m http.server 8000
```

Then open http://localhost:8000. Use the arrow keys or W/A/S/D to move, Space to fire, and Enter to restart after Game Over. The High Score panel is to the right of the canvas.

**Tests.** These need Node 18 or newer, and nothing to install:

```
node --test
```

This runs every `tests/*.test.js` file. For a short summary, run `node --test 2>&1 | grep -E "^(✖|ℹ (tests|pass|fail))"`.

**Server smoke check.** Start `py -m http.server 8000` as a *background* task. Then `curl` `/`, `/style.css`, and `/game.js` and expect status 200, retrying a few times while the server starts. Then stop that task with TaskStop (load it with ToolSearch `select:TaskStop` if it is deferred). Do **not** kill every `py.exe`.

**Seeing triangles quickly in a play-check:** they are random, about one enemy in four. To clear the high score, run `localStorage.removeItem("shooter-game-high-score")` in the DevTools console and reload.

## Files

| File | What it is |
|---|---|
| `index.html` | The 480×640 `<canvas id="game">` and the High Score `<aside>` in a `.game-row`, then the control-hint line. **Not changed in Round 4.** |
| `style.css` | Page layout. **Not changed in Round 4.** |
| `game.js` | All the game code: constants, state, update, high score, keyboard, drawing, and browser start-up |
| `tests/helpers.js` | `step()`, the fake canvas context, `createFakeStorage()`, and `loadGameInFakePage({ storage, random })`. **Not changed in Round 4.** |
| `tests/01-…` to `04-round4-triangle-enemy.test.js` | One file per round |
| `docs/decisions/decisions.md` | Round 1 records D1–D13 |
| `docs/decisions/0001-…` to `0007-…` | Records from Rounds 2–4, as Y-statements. The next number is **0008**. |
| `README.md` | For players: how to play, run, and test |

## How `game.js` is organised (Round 4 changes)

- **New constants** below `ENEMY_SPAWN_DELAY`:
  - `TRIANGLE_CHANCE = 0.25`
  - `TRIANGLE_FALL_SPEED = ENEMY_SPEED / 2` (50 px/s)
  - `TRIANGLE_SIDE_SPEED = 80` (px/s)
  - `COLORS.triangle = "#b44fff"`
- **`createEnemy(random)`** returns `{ type: "square", x, y, width, height }`. If the second `random()` is below `TRIANGLE_CHANCE`, it sets `type: "triangle"` and `direction` (-1 for left, 1 for right) from a third `random()` (below 0.5 means left). Only triangles have `direction`.
- **`isTriangle(enemy)`** returns `enemy.type === "triangle"`. Any other `type`, or none, counts as a red square.
- **`moveEnemies`** moves squares straight down at `ENEMY_SPEED`. Triangles go through **`moveTriangle`**, which falls at `TRIANGLE_FALL_SPEED`, moves `direction * TRIANGLE_SIDE_SPEED`, and at an edge clamps x into `[0, CANVAS_WIDTH - width]` and flips `direction`.
- **`drawEnemy`** chooses `drawRect` (red) or **`drawTriangleEnemy`**, a purple path from (x, y) to (x+w, y) to (x+w/2, y+h): a flat top and a point at the bottom middle.
- **Not changed:** `updateGame` order, `handleShotHits`, `handleEnemyLosses`, the high score, the keyboard, and `createGame()`. The game state has no new fields. A triangle's `direction` lives on the enemy object, inside `state.enemies`.
- **New exports:** `TRIANGLE_CHANCE`, `TRIANGLE_FALL_SPEED`, `TRIANGLE_SIDE_SPEED`, `COLORS`, `createEnemy`.

## Decisions made in Round 4

### Chosen by the user (asked before any code was written)

1. **"Half as slow" means half the speed.** The triangle falls at 50 px/s, while the squares fall at 100 px/s. The alternatives offered were 1.5× and 2×.
2. **Sideways movement bounces from wall to wall** at a steady speed, starting left or right at random. A sine-wave weave and random direction changes were the alternatives. See `0007-triangles-bounce-between-edges.md`.
3. **Triangles replace some spawns.** The game still makes one enemy about every second, and each one has a chance of being a triangle. A separate triangle timer and strict alternation were the alternatives. See `0006-triangles-replace-some-spawns.md`.
4. **The same rules as red squares:** a 30 px size, +10 points, -1 life for touching the ship or the bottom, and a rectangle hit box. Worth 20 points was the alternative.

### Judgment calls by Claude (all reported to the user at the end of Round 4)

- **One in four** (`TRIANGLE_CHANCE = 0.25`), so the red square stays the main enemy.
- **Sideways speed of 80 px/s.** That is enough to cross the canvas in about 6 s, while a triangle takes about 13 s to fall. At 50 px/s it would barely move, and above 100 px/s it would be hard to hit.
- **The purple is `#b44fff`.** The triangle points down, fills the same 30×30 box as a square, and is hit-tested with that box.
- **At an edge,** the triangle is placed exactly on the edge and turns around.
- **The order of `random()` calls:** x first (as before), then the kind, then the direction. This kept every earlier test working unchanged.
- **Enemies without a `type` act as squares,** so tests that build `{ x, y, width, height }` by hand still work.
- **New exports** for the tests, **two decision records** (one was asked for), and a README update.
- **No change** to `index.html`, the control-hint line, or the HUD. Nothing about triangles appears on the page outside the canvas.

## Unresolved

1. **Claude edited `CLAUDE.md` (not committed) with Round 4 standing rules.** Ask the user whether they accept them:
   - (a) Every enemy has a `type`, and an enemy with no `type` acts as a red square.
   - (b) Keep the `random()` order in `createEnemy` (x first).
   - (c) Requirement IDs can replace or add; ask if it is unclear.
   - (d) The order of work in a round (spec, then tests, then code, then records), ending with the list of unrequested decisions.
   - (e) Leave the user's `problem.md` round-start edits uncommitted.
   - (f) Edit with the Edit and Write tools, not heredoc-piped `python`, and check the whitespace before editing `spec.md` or `CLAUDE.md`.
2. **The Round 4, 3, and 2 browser play-checks are unconfirmed.** The triangle's speeds and colour (80 px/s, 1 in 4, `#b44fff`) have only been checked by tests, not by eye.
3. **The `problem.md` Round 4 edit is uncommitted.** Do not commit it unless asked.
4. **The triangle's hit box is its full 30×30 rectangle,** so a shot or the ship touching the empty corners beside the point still counts as a hit. The user chose "same as squares", and the spec says so. It may feel unfair in play. Ask before changing it.
5. **Carried from Round 2:** shots vanish when the ship is at the very top edge. `createShot` puts the shot above the canvas, and `moveShots` removes it at once. Ask before changing this.
6. **Carried from Round 2:** a ship parked at the top edge gets hit by every enemy that spawns above it. Triangles now sweep sideways too, so this happens more often. Under the spec, this is not a bug.
7. **D11 (the control-hint line)** is still not explicitly approved.
8. **`handoff.md` (Round 1) is out of date.** Git tracks it as `HANDOFF.md`. Do not edit it unless asked.

## Warnings for the next session

- **The Round 4 spec change is split across two commits** (`822fd6c` and `1634239`), because one Edit did not match the whitespace in `spec.md` and the commit went ahead without it. Before committing, check `git diff` and confirm that every edit applied.
- **Do not pipe a Python script into `python`/`py` through a bash heredoc.** In Round 4 it hung until it was stopped, and it changed nothing. Use the Edit tool.
- **`random` in tests controls the enemy kind now:**
  - `() => 0.5` (the default for `step()`, and `CENTER` in `03-…`) gives only red squares at x = 225.
  - `() => 0` gives only triangles, at x = 0, heading left. They turn right at once.
  - To get a specific kind, use a sequence (see `sequence()` in `04-…`).
- **Firing reads the key that is held during an update.** Pressing and releasing Space before `step()` fires nothing. Hold it while the game runs (this caused the `1d7ec23` fix).
- **Page tests can score points after Space is released,** because shots in flight still hit. Read scores at a stable point.
- **A triangle moves sideways while a shot travels.** In tests, put it close above the ship, or it drifts out of the shot's path.
- **The Round 1 page test "full round"** uses real `Math.random` and expects Game Over within 20 s. Triangles fall more slowly, but with three squares in four the chance of a failure is tiny. It passed in three runs in a row. If it ever fails, this is why.
- **The R8 test does `assert.deepEqual(state, game.createGame())` after a restart.** Every game-state field must come from `createGame()`. Anything that must survive a restart must stay out of it (like the high score).
- **The R9/rules test bans some words** in `index.html`, `style.css`, and `game.js`, even in comments: `http://`/`https://`, `fetch`, `XMLHttpRequest`, `WebSocket`, `<input`, `password`, `login`.
- **The input object is not reset on restart.** No spec item covers this.
- **Git prints "LF will be replaced by CRLF" warnings** on commit. They are harmless.
- **Never commit a handoff file or `CLAUDE.md` changes yourself.**
- **Next numbers:** test file **05**, decision record **0008**.

## Manual play-check list (Round 4)

1. Run `py -m http.server 8000` and open http://localhost:8000. Within a few seconds, purple triangles pointing down appear among the red squares, roughly one enemy in four.
2. Triangles fall clearly more slowly than squares and zigzag sideways, turning at the left and right edges without leaving the screen.
3. Shooting a triangle removes it and adds 10 points, and the High Score rises with it if beaten.
4. A triangle that touches the ship or reaches the bottom costs one life.
5. Game Over, restarting with Enter (no triangles left over), the High Score, and moving in all four directions still work as in Round 3.
