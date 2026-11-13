# Handoff: Shooter-Game, after Round 3

Notes for a fresh session that will do the next round. Standing rules for every session are in `CLAUDE.md`. This file covers the state of the project after Round 3 (2026-11-13).

Read in this order: `CLAUDE.md`, `problem.md`, `spec.md`, this file, then `docs/decisions/` (`decisions.md` for D1–D13, then `0001-…` to `0005-…`).

> `handoff-round-2.md` and `handoff.md` (Round 1) are older handoffs. Where they disagree with this file, trust this file.

## Current state

- **Round 3 is complete.** `problem.md` has one Round 3 requirement. **R1: there is a High Score snippet to the right of the canvas, showing the top high score ever recorded.** This R1 *adds* a feature. It does not replace the ship-movement R1 from Rounds 1 and 2, which still holds, as do R2–R9.
- `spec.md` was updated for Round 3 and committed (`7e55876`).
- `node --test` passes **73 tests**: 39 in `01-initial-build`, 19 in `02-round2-move-up-down`, and 15 in `03-round3-high-score` (checked with Node v26.13.0).
- Server smoke check passed: `py -m http.server 8000` serves `/`, `/style.css`, and `/game.js` with status 200, and the served page contains the panel.
- **The browser play-check for Round 3 has not been confirmed.** Following D13, the user was given the checklist at the bottom of this file. Ask the user whether they ran it. The Round 2 check was never confirmed either.
- **Not committed:** the user's Round 3 edit to `problem.md` (left for the user to commit, as in earlier rounds), this file, and Claude's edits to `CLAUDE.md` (see "Unresolved" item 1).

### Round 3 commits (oldest first)

| Commit | What |
|---|---|
| `7e55876` | `spec.md`: High Score panel beside the canvas, live update, saved in local storage, kept on restart |
| `ef75387` | `tests/03-round3-high-score.test.js` and `tests/helpers.js` changes. 13 new tests failed before the code, on purpose. |
| `290a5d5` | `index.html` / `style.css`: the panel in a flex row with the canvas |
| `3ac8596` | `game.js`: high-score object, load and save, live panel update |
| `64d3b9d` | Fixed one test that read the high score too early (the game code was right) |
| `07a2034` | `README.md`: High Score explained; the Round 3 test file named |
| `7438c95` | Decision records `0003`, `0004`, `0005` |

## How to run

**Game.** From the project folder:

```
py -m http.server 8000
```

Then open http://localhost:8000. Controls: arrow keys or W/A/S/D to move, Space to fire, Enter to restart after Game Over. The High Score panel is to the right of the canvas.

**Tests.** Needs Node 18 or newer, and nothing to install:

```
node --test
```

This runs every `tests/*.test.js` file. For a short summary, run `node --test 2>&1 | grep -E "^(✖|ℹ (tests|pass|fail))"`.

**Server smoke check.** Start `py -m http.server 8000` as a *background* task. Then `curl` `/`, `/style.css`, and `/game.js` and expect status 200, retrying a few times while the server starts. Then stop that task with TaskStop (load it with ToolSearch `select:TaskStop` if it is deferred). Do **not** kill every `py.exe`.

**Resetting the high score by hand** (useful for the play-check): in the browser's DevTools console, run `localStorage.removeItem("shooter-game-high-score")` and reload. Or clear the site's data for `localhost:8000`.

## Files

| File | What it is |
|---|---|
| `index.html` | `<div class="game-row">` holding the 480×640 `<canvas id="game">` and `<aside class="high-score">`. The aside has a "High Score" label and `<span id="high-score">0</span>`. Then the control-hint line (`<p class="controls">`). Loads `style.css` and `game.js`. |
| `style.css` | Dark page. `.game-row` is `display: flex; flex-wrap: wrap; gap: 16px`. `.high-score` is a small bordered box with the value in yellow `#ffe14f`. |
| `game.js` | All game code: constants, state, update, high score, keyboard, drawing, browser start-up |
| `tests/helpers.js` | `step()`, the fake canvas context, **`createFakeStorage()`** (new), and `loadGameInFakePage({ storage, random })` (options new in Round 3) |
| `tests/01-…`, `02-…`, `03-round3-high-score.test.js` | One file per round |
| `docs/decisions/decisions.md` | Round 1 records D1–D13 |
| `docs/decisions/0001-…` to `0005-…` | Rounds 2–3 records, as Y-statements. The next number is **0006**. |
| `README.md` | Player-facing: how to play, run, and test |
| `handoff-round-2.md`, `HANDOFF.md` | Older handoffs (see "Warnings") |

## How `game.js` is organised

- `updateGame(state, input, dt, random)` is the single step. **It did not change in Round 3** and knows nothing about the high score.
- **New in Round 3:** the "High score" section (around line 188). It has:
  - `createHighScore(storage)`, which returns `{ best, storage }`.
  - `updateHighScore(highScore, score)`, which raises `best` and saves it when `score > best`, and returns `true` when it changed.
  - `loadHighScore(storage)`. A missing, broken, negative, or non-finite value, or a storage error, gives 0.
  - `saveHighScore(storage, value)`, which ignores storage errors.
- **New in Round 3:** the constant `HIGH_SCORE_KEY = "shooter-game-high-score"`.
- **Changed in Round 3:** in `startGame()` (around line 320), `browserStorage()` gets `window.localStorage` inside a try/catch, or `null`. Then `createHighScore` runs, and the panel `#high-score` gets its first value. In each frame, after `updateGame`, the code calls `updateHighScore(highScore, state.score)` and writes the panel only when the value changed.
- The high score is **not** in `createGame()`. That is on purpose: `resetGame()` would clear it (decision 0005, now also a rule in `CLAUDE.md`).
- The two guards at the end of the file stay. `module.exports` now also exports `HIGH_SCORE_KEY`, `createHighScore`, `updateHighScore`, `loadHighScore`, and `saveHighScore`.

## Decisions made in Round 3

### Chosen by the user (asked before any code was written)

1. **The high score is saved in `localStorage`**, so it survives restarts, reloads, and closing the browser. If storage is unavailable, it lasts until the page closes. Why: it fits "ever recorded" with no server, login, or network. See `0003-high-score-saved-in-local-storage.md`.
2. **The panel is an HTML element beside the canvas.** The canvas was not widened. Why: it is literally "to the right of the canvas", and the canvas, drawing, and earlier tests stay the same. See `0004-high-score-panel-is-html-beside-canvas.md`.
3. **The high score updates live** during play, as soon as the score passes it. The other option was to update only at Game Over. (Recorded in 0003.)
4. **D13 is kept:** Claude does not play in a browser. It gives the user a checklist.

### Judgment calls by Claude (all reported to the user at the end of Round 3)

- The high score lives **outside the game state**, as a separate object made in `startGame()`. This keeps `resetGame()` from clearing it, and keeps the R8 test "restarted state deep-equals `createGame()`" passing. See `0005-high-score-kept-outside-game-state.md`.
- The score is saved every time it goes up, not only at Game Over, so closing the tab mid-game keeps it.
- A blocked or broken storage, or a bad saved value, gives 0 and an in-memory high score. It never throws.
- The panel shows a static "High Score" label over the number, in the shot yellow, inside a bordered box like the canvas's. It is not uppercased, so the text matches the spec.
- On screens narrower than about 640 px, the panel wraps below the canvas (written into the spec).
- No in-game way to reset the high score, and it is not shown on the Game Over screen. Neither is in the spec.
- `tests/helpers.js` gained a fake storage, a fake `#high-score` element, and a `random` option. With `random: () => 0.5`, every enemy spawns right above the ship's start, so holding Space scores points in page tests.
- The failing tests were committed before the code. Three decision records were written (at least one was asked for). The README was updated.
- `spec.md`'s "How it works" now says the high score is kept apart from the game state under one local storage key.

## Unresolved

1. **Claude edited `CLAUDE.md` (not committed) with three standing rules.** Ask the user whether they accepted them.
   - (a) Data that must outlive one game is kept outside `createGame()`.
   - (b) The "play the game in the browser" line now says Claude gives a checklist and the user plays, which settles the old conflict between `CLAUDE.md` and D13. The user chose D13 for Round 3; making it a standing rule is Claude's suggestion.
   - (c) Keep the escaped-Markdown style.
2. **The Round 3 (and Round 2) browser play-checks are unconfirmed.**
3. **`problem.md`'s Round 3 edit is uncommitted.** It also fixes "R1" to "R1." in Round 2. The user has committed their own round-start edits before (e.g. `161e3bd`). Do not commit it unless asked.
4. **Carried from Round 2:** shots vanish when the ship is at the very top edge. `createShot` puts the shot at `ship.y - SHOT_HEIGHT`, which is above the canvas, so `moveShots` removes it at once. The spec does not cover this. Ask before changing it.
5. **Carried from Round 2:** a ship parked at the top edge gets hit by every enemy that spawns above it. This is not a bug under the spec.
6. **D11 (the control-hint line)** is still not explicitly approved. Round 3 did not change it, and it does not mention the High Score.
7. **`HANDOFF.md` (Round 1) is out of date.** The user has not decided whether to keep, update, or delete it. Do not edit it unless asked.

## Warnings for the next session

- **Requirement IDs get reused, and not always the same way.** Round 2's R1 *replaced* Round 1's R1. Round 3's R1 *added* a new feature, and movement stayed as before. Tests labelled `R1` in `03-…` are about the high score. Read each new round's list carefully and ask if it is unclear whether an ID replaces or adds.
- **The R8 test does `assert.deepEqual(state, game.createGame())` after a restart.** Any field in the game state must come from `createGame()`. Anything that must survive restarts must stay out of it (like the high score).
- **Page tests can score points after Space is released.** Shots already in flight still hit enemies. Read scores or high scores at a stable point, such as Game Over, not right after releasing Space. One Round 3 test had to be fixed for this (`64d3b9d`).
- **Tests that move the ship vertically should keep enemies away.** `02-…` sets `state.spawnTimer = -100`.
- **`loadGameInFakePage()` without `storage`** gives a page with no `localStorage` at all, so the game uses an in-memory high score. Pass `storage: createFakeStorage(...)` to test saving.
- **The R9/rules test bans some words** in `index.html`, `style.css`, and `game.js`: `http://`/`https://`, `fetch`, `XMLHttpRequest`, `WebSocket`, `<input`, `password`, and `login`, case-insensitive. This applies even in comments.
- **The high score stays in your real browser between manual play-checks.** Clear it (see "How to run") to check the starting value of 0.
- **The input object is not reset on restart.** Keys held through Enter stay held. No spec item covers this.
- **Handoff files:** `handoff-round-2.md` was committed by the user (in `4a3ae07`, "Round 1 END"). Git tracks the Round 1 handoff as `HANDOFF.md`, but on disk it shows as `handoff.md` (Windows is case-insensitive). Never commit a handoff file yourself.
- **Git prints "LF will be replaced by CRLF" warnings** on commit. They are harmless.
- **Next numbers:** test file **04**, decision record **0006**.
- **Each round's prompt has asked for:** list the requirements and ask about anything unclear *before* coding; update and commit `spec.md`; write tests named by requirement ID; commit in small steps; write at least one Y-statement record; list unrequested decisions at the end; never undo or amend a commit; do not write the handoff until asked.

## Manual play-check list (Round 3)

1. Run `py -m http.server 8000` and open http://localhost:8000. A "High Score" box sits to the right of the canvas and shows 0 (on a fresh browser, or after clearing it).
2. Shoot enemies. As soon as your score passes the high score, the box goes up with it, during play.
3. Lose all lives, then press Enter. The score is back to 0, and the High Score keeps its value.
4. Reload the page. The High Score is still there.
5. Play a game with a lower score. The High Score does not go down.
6. Make the window narrow. The box moves below the canvas, and nothing overlaps.
7. Movement in all four directions, firing, enemies, lives, Game Over, and restart work as in Round 2.
