# Handoff: Shooter-Game, after Round 5

These are notes for a fresh session that will do the next round. The standing rules for every session are in `CLAUDE.md`. This file covers the state of the project after Round 5 (2026-11-14).

Read in this order: `CLAUDE.md`, `problem.md`, `spec.md`, this file, then `docs/decisions/`. Start with `decisions.md` (D1–D13), then read `0001-…` to `0009-…`.

> `handoff-round-4.md`, `handoff-round-3.md`, `handoff-round-2.md`, and `handoff.md` (Round 1) are older handoffs. Where they disagree with this file, trust this file.

## Current state

- **Round 5 is complete.** `problem.md` has one Round 5 requirement. **R1: "Players can press ESC on their keyboard to pause and un-pause the game."** This R1 *adds* a feature. Ship movement (Rounds 1–2), R2–R9, the High Score (Round 3), and the purple triangle (Round 4) still hold.
- `spec.md` was updated for Round 5 and committed in one commit. All of its edits applied.
- `node --test` passes **107 tests**: 39 in `01-initial-build`, 19 in `02-round2-move-up-down`, 15 in `03-round3-high-score`, 17 in `04-round4-triangle-enemy`, and 17 in `05-round5-pause`. (`handoff-round-4.md` said 35 and 15 for the first two files. The numbers here were counted file by file with `node --test <file>`.) Checked with Node v26.13.0. The suite was run three times in a row, because one Round 1 page test uses real randomness.
- The server smoke check passed. `py -m http.server 8000` served `/`, `/style.css`, and `/game.js` with status 200. The served `game.js` has `togglePause`, and the served page has "Pause: Esc".
- **The Round 5 browser play-check has not been confirmed.** Following D13, the user got the checklist at the bottom of this file. Ask whether they ran it. The Round 2, 3, and 4 checks were not confirmed either.
- **Not committed:** the user's Round 5 edit to `problem.md`, this file, and Claude's Round 5 edits to `CLAUDE.md` (see "Unresolved", item 1).

### Round 5 commits (oldest first)

| Commit | What |
|---|---|
| `263697e` | `spec.md`: Esc pauses and un-pauses, what stops, the dimmed "Paused" screen, held keys on resume, Esc does nothing on Game Over, the control-hint line lists Esc, and the loop keeps running while paused |
| `e967b22` | `tests/05-round5-pause.test.js` (17 tests) and `tests/helpers.js` (`page.press(code, extra)`). 13 of the 17 failed before the code, on purpose. |
| `2fc5cab` | `game.js`: `isPaused`, `togglePause`, `PAUSE_KEYS`, the `repeat` argument, `drawPaused`, `dimCanvas`, `COLORS.dim`. `index.html`: "Pause: Esc" in the hint line. |
| `c544ffc` | `README.md`: the pause key, and the Round 5 test file |
| `a91c0d7` | Decision records `0008` and `0009` |

## How to run

**Game.** From the project folder:

```
py -m http.server 8000
```

Then open http://localhost:8000. Use the arrow keys or W/A/S/D to move, Space to fire, Esc to pause and un-pause, and Enter to restart after Game Over. The High Score panel is to the right of the canvas.

**Tests.** These need Node 18 or newer, and nothing to install:

```
node --test
```

This runs every `tests/*.test.js` file. For a short summary, run `node --test 2>&1 | grep -E "^(✖|ℹ (tests|pass|fail))"`. To count the tests in one file, run `node --test tests/05-round5-pause.test.js`.

**Server smoke check.** Start `py -m http.server 8000` as a *background* task. Then `curl` `/`, `/style.css`, and `/game.js` and expect status 200, retrying a few times while the server starts. Then stop that task with TaskStop (load it with ToolSearch `select:TaskStop` if it is deferred). Do **not** kill every `py.exe`.

**Play-check tips:** triangles are random, about one enemy in four. To clear the high score, run `localStorage.removeItem("shooter-game-high-score")` in the DevTools console and reload.

## Files

| File | What it is |
|---|---|
| `index.html` | The 480×640 `<canvas id="game">` and the High Score `<aside>` in a `.game-row`, then the control-hint line. **Round 5:** the hint line is now "Move: ← → ↑ ↓ or W A S D · Fire: Space · Pause: Esc · Restart: Enter". |
| `style.css` | Page layout. **Not changed in Round 5.** |
| `game.js` | All the game code: constants, state, update, high score, keyboard, drawing, and browser start-up |
| `tests/helpers.js` | `step()`, the fake canvas context, `createFakeStorage()`, and `loadGameInFakePage({ storage, random })`. **Round 5:** `page.press(code, extra)` can add event fields, for example `{ repeat: true }`. Every fake key event now has `repeat: false` unless told otherwise. |
| `tests/01-…` to `05-round5-pause.test.js` | One file per round |
| `docs/decisions/decisions.md` | Round 1 records D1–D13 |
| `docs/decisions/0001-…` to `0009-…` | Records from Rounds 2–5, as Y-statements. The next number is **0010**. |
| `README.md` | For players: how to play, run, and test |

## How `game.js` is organised (Round 5 changes)

- **`createGame()`** has a new field, **`isPaused: false`**. Because of it, `resetGame()` (Enter after Game Over) always gives an unpaused game.
- **`updateGame()`** starts with `if (state.isOver || state.isPaused) return;`. While paused, nothing moves, spawns, scores, or counts down (`shotTimer` and `spawnTimer` freeze too).
- **The browser loop is unchanged.** `requestAnimationFrame` keeps running while paused, and `lastTime` keeps moving forward, so the first frame after resuming has a normal `dt` (no jump).
- **Keyboard:**
  - `PAUSE_KEYS = ["Escape"]`.
  - `handleKeyDown(state, input, code, repeat = false)` has a new fourth argument. Esc calls **`togglePause(state)`** unless `repeat` is true, and always returns `true` (so `preventDefault`).
  - `togglePause` does nothing when `state.isOver`.
  - Move and fire keys still go through `setKey` while paused. They are recorded but have no effect until play resumes.
  - The browser's keydown listener passes `event.repeat`.
- **Drawing:**
  - `drawGame` order: background, ship, shots, enemies, then **`drawPaused(ctx)` if paused**, then the HUD, then Game Over. The HUD comes after the pause dim layer on purpose, so the score and lives stay readable.
  - **`dimCanvas(ctx)`** fills the canvas with **`COLORS.dim`** (`"rgba(0, 0, 0, 0.6)"`, the same value Game Over used before). Both `drawPaused` and `drawGameOver` use it.
  - `drawPaused` shows "Paused" (40px) and "Press Esc to resume" (16px), centred.
- **Not changed:** movement, firing, spawning, triangles, collisions, the high score, `handleKeyUp`, and the exports. `togglePause` and `drawPaused` are **not exported**. Tests reach them through `handleKeyDown` and `drawGame`.

## Decisions made in Round 5

### Chosen by the user (asked before any code was written)

1. **The paused screen dims the game and shows "Paused" with "Press Esc to resume"** underneath. Text without the dim, and a plain freeze with no text, were the alternatives.
2. **Esc does nothing on the Game Over screen.** Only Enter restarts. Letting Esc toggle there too was the alternative.
3. **Only Esc pauses.** The game does not pause by itself when the tab or window loses focus. Auto-pause on blur was the alternative.
4. **The control-hint line lists "Pause: Esc".** Leaving `index.html` unchanged was the alternative. This also means the user has kept the hint line from D11 (see "Unresolved", item 4).

### Judgment calls by Claude (all reported to the user at the end of Round 5)

- **The pause skips the update while the loop keeps running** (`0008-pause-skips-update-loop-keeps-running.md`). Stopping the loop with `cancelAnimationFrame` was rejected because it needs the paused frame drawn first and `lastTime` reset on resume. Updating with `dt = 0` was rejected because Space would still fire.
- **A held-down Esc does not repeat** (`0009-pause-key-handling.md`). Browsers repeat `keydown` while a key is held, and toggling on each one would make the pause flicker.
- **Move and fire keys stay tracked while paused** (`0009`). A key let go during the pause is not stuck down afterwards, and a key still held at resume works straight away. So Space held through a pause fires on the first frame back.
- **Esc always returns `true`** (prevents the browser default), even on Game Over where it changes nothing. Enter already works this way during play.
- **Enter while paused does nothing**: it does not restart or un-pause.
- **The HUD is drawn on top of the pause dim layer.** On Game Over it is still under the dim layer, as before.
- **The dim colour became the named constant `COLORS.dim`**, shared with Game Over.
- **`spec.md` now mentions the control-hint line.** It never did before. D11 was a judgment call that only lived in `decisions.md`.
- **`tests/helpers.js` was extended** (`page.press(code, extra)`), **two decision records** were written (at least one was asked for), and **the README was updated**.

## Unresolved

1. **Claude edited `CLAUDE.md` (not committed) with Round 5 standing rules.** Ask the user whether they accept them:
   - (a) New per-frame game logic goes inside `updateGame()`, after its early return for over or paused, so a pause freezes it. No timers outside the game state.
   - (b) A key that toggles something acts only on a fresh press, and ignores `event.repeat`.
   - (c) Before each commit, check `git diff` to confirm that every edit is there. This comes from the split Round 4 spec commit.
2. **The Round 5, 4, 3, and 2 browser play-checks are unconfirmed.** The pause has only been checked by tests, not by eye: how readable the dim layer and text are, and how Esc feels.
3. **The `problem.md` Round 5 edit is uncommitted.** Do not commit it unless asked. (The Round 4 edit is already in git.)
4. **D11 (the control-hint line)** was never formally approved. In Round 5 the user chose to add "Pause: Esc" to it, which suggests they accept it. If you want certainty, ask before marking it approved. Do not edit `decisions.md`.
5. **The game does not pause when the tab is hidden** (the user's choice). When the tab comes back, the `MAX_FRAME_TIME` cap (0.1 s) still stops a burst of enemies. In some browsers a hidden tab stops `requestAnimationFrame` anyway.
6. **Carried from Round 4:** the triangle's hit box is its full 30×30 rectangle, so its empty top corners count as hits. Ask before changing it.
7. **Carried from Round 2:** shots vanish when the ship is at the very top edge, because `createShot` puts the shot above the canvas and `moveShots` removes it at once. Ask before changing this.
8. **Carried from Round 2:** a ship parked at the top edge gets hit by every enemy that spawns above it. Under the spec, this is not a bug.
9. **`handoff.md` (Round 1) is out of date.** Git tracks it as `HANDOFF.md`. Do not edit it unless asked.

## Warnings for the next session

- **Every new game-state field must be in `createGame()`**, and the R8 tests `assert.deepEqual(state, game.createGame())` after a restart will catch one that is not. `isPaused` is in there now. A new field also has to work with `structuredClone`, which the Round 5 freeze test uses. Plain data is fine, functions are not.
- **The Round 5 test "while paused nothing in the game moves…"** clones the whole game state, runs 5 seconds, and expects it unchanged. Any new logic that changes the state outside the `updateGame` guard will fail it. This is intended.
- **The test "after un-pausing, play continues exactly where it stopped"** compares a paused game with an unpaused game using `deepEqual`. Both use the same 1/60 s steps, so the floating-point results match exactly. Keep the step sizes the same if you change it.
- **The test "the game does not pause by itself"** checks that the page registers only `keydown` and `keyup` listeners. Any new `window.addEventListener` (for example `blur`) will fail it. Only add one if the user asks for it, then update that test.
- **The fake `document` has no `addEventListener`.** Calling `document.addEventListener` in `startGame()` (for example for `visibilitychange`) throws in the page tests.
- **Firing reads the key that is held during an update.** Pressing and releasing Space before `step()` fires nothing. Hold it while the game runs.
- **`random` in tests controls the enemy kind:**
  - `() => 0.5` (the default for `step()`) gives only red squares at x = 225.
  - `() => 0` gives only triangles, at x = 0, heading left.
  - Use a sequence for anything else (see `sequence()` in `04-…`).
- **Page tests can score points after Space is released,** because shots in flight still hit. Read scores at a stable point.
- **The Round 1 page test "full round"** uses real `Math.random` and expects Game Over within 20 s. It passed in three runs in a row. If it ever fails, the slower triangles are the likely cause.
- **The R9/rules test bans some words** in `index.html`, `style.css`, and `game.js`, even in comments: `http://`/`https://`, `fetch`, `XMLHttpRequest`, `WebSocket`, `<input`, `password`, `login`.
- **The input object is not reset on restart or on pause.** No spec item covers this. Held keys carry over, on purpose (see `0009`).
- **`spec.md` and `CLAUDE.md` use LF line endings,** escaped Markdown (`\-`, `\#`), one blank line between list items, and three blank lines before a `\##` heading. Check with `grep -n "" spec.md | cat -A` before an Edit.
- **Do not pipe a Python script into `python`/`py` through a bash heredoc.** It hangs. Use the Edit tool.
- **Git prints "LF will be replaced by CRLF" warnings** on commit. They are harmless.
- **Never commit a handoff file or `CLAUDE.md` changes yourself.**
- **Next numbers:** test file **06**, decision record **0010**.

## Manual play-check list (Round 5)

1. Run `py -m http.server 8000` and open http://localhost:8000. The hint line under the canvas includes "Pause: Esc".
2. During play, press Esc. Everything freezes and the game dims, with "Paused" and "Press Esc to resume" in the middle. The score and lives stay readable at the top left.
3. Wait a few seconds, then press Esc again. Play carries on from the same spot, with no jump and no burst of new enemies.
4. Hold Esc down for a second. The game pauses once and does not flicker.
5. While paused, the arrow keys and Space do nothing. Enter does not restart.
6. Lose all lives. On the Game Over screen, Esc does nothing and Enter restarts as before.
7. The High Score, the purple triangles, and moving in all four directions still work as in Round 4.
