# Handoff: Shooter-Game

Notes for a fresh session picking up this project. Read `CLAUDE.md`, `problem.md`, and `spec.md` first, then `decision.md`.

## Current state (2026-11-08)

- **First build is complete.** All behavior in `spec.md` is built and covers requirements R1–R9 in `problem.md`.
- `node --test` passes all 39 tests.
- The server smoke check passed: `py -m http.server 8000` serves `/`, `/style.css`, and `/game.js` with status 200.
- The first build is committed. The user's own uncommitted edits to `CLAUDE.md` and `spec.md` (`python3` → `py`) were **intentionally left uncommitted**. Do not commit or change them unless asked.

## Files

| File | What it is |
|---|---|
| `index.html` | Page with the 480×640 `<canvas id="game">`, one line of control hints, and loads `style.css` and `game.js` |
| `style.css` | Centers the canvas on a dark page |
| `game.js` | All game code. Constants at the top, then state, update, keyboard, drawing, and browser start-up |
| `tests/helpers.js` | Test helpers: `step()`, a recording fake canvas context, and `loadGameInFakePage()`, which runs `game.js` as a browser script in a Node `vm` with fake document, keys, and animation frames |
| `tests/01-initial-build.test.js` | Tests for the first build, grouped by requirement R1–R9, plus page-wiring and project-rule checks |
| `README.md` | What the game is, how to run it, and how to test it |
| `decision.md` | Decision records D1–D13 |
| `problem.md` | Requirements. **Never edit.** |
| `spec.md` / `CLAUDE.md` | User-owned. If the spec and code disagree, tell the user before changing either. |

## How `game.js` is organised

- `updateGame(state, input, dt, random)` is the single step. The order is: move ship → fire → move shots → move enemies → spawn → shot hits → enemy losses → game-over check. It does nothing once `state.isOver` is true.
- `handleKeyDown(state, input, code)` / `handleKeyUp(input, code)` take `event.code` values and return `true` for game keys. The page then calls `preventDefault()`.
- Enter on the game-over screen calls `resetGame(state)`, which resets the state in place.
- `drawGame(ctx, state)` draws everything. HUD text is `"Score: N   Lives: N"`. The game-over screen shows `"Game Over"`, `"Final score: N"`, and `"Press Enter to play again"`. The tests match these strings.
- The end of the file runs `startGame()` only when `document` exists and sets `module.exports` only when `module` exists. Keep both guards.

## Working rules for the next change

1. Build what the user asks, staying inside `spec.md`. If the request conflicts with the spec, ask first.
2. Add a new test file `tests/NN-<change-name>.test.js` (the next number is **02**) that covers the change. Keep the older test files passing.
3. Run `node --test`.
4. Smoke-check the server. Start `py -m http.server 8000` as a background task, then request the three files with `curl`, then stop the task. Do not kill every `py.exe`: an earlier attempt to do that was blocked.
5. Add a record to `decision.md`, update this file, and update `README.md` if run or test steps changed.
6. Commit only the files you changed (not the user's `CLAUDE.md`/`spec.md` edits).
7. Give the user a short manual play-check list for what the change touches. The user does the browser play-check themselves (decision D13).

## Manual play-check list (first build)

1. Run `py -m http.server 8000` and open http://localhost:8000. The game starts right away and shows "Score: 0   Lives: 3" top-left.
2. Arrow keys and A/D move the ship. It stops at both edges, and the page does not scroll.
3. Space fires upward. Holding it fires at a steady, limited rate.
4. An enemy appears at the top about once a second and moves down.
5. Shooting an enemy removes it and adds 10 to the score.
6. Letting an enemy reach the bottom, or hit the ship, costs one life.
7. At 0 lives you see "Game Over" and the final score, and nothing moves.
8. Enter starts a new game with score 0 and 3 lives, without reloading.

## Open items for the user

- `spec.md` still has the unfinished sentence "A game loop using." (decision D3: `requestAnimationFrame` was used).
- Decide whether to keep the control-hint line under the canvas (decision D11).
