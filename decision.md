# Decision Records

Each record says what was decided, why, and whether the user chose it or it was a judgment call. Newest records go at the bottom.

---

## D1. Tests use Node's built-in test runner

- **Decision:** Automated tests are written with `node:test` and `node:assert`. One command runs them all: `node --test`.
- **Why:** Node v26 was already installed. Nothing needs to be installed and there is no `package.json` or `node_modules`. Playwright was considered and rejected: it adds an npm install and a browser download of about 150 MB.
- **Chosen by:** the user (2026-11-08).

## D2. One test file per change

- **Decision:** Tests live in `tests/NN-short-name.test.js`. `01-initial-build.test.js` covers the first build. Each later change requested by the user gets a new numbered file. Shared fakes live in `tests/helpers.js`.
- **Why:** The user asked for a test after the first build and a test for each change. `node --test` still runs all of them, so older behavior keeps getting checked.
- **Chosen by:** judgment call based on the user's request.

## D3. Game loop uses `requestAnimationFrame` with time-based movement

- **Decision:** The browser loop calls `requestAnimationFrame`. Each frame computes `dt` in seconds, capped at `MAX_FRAME_TIME` (0.1 s), then updates and redraws. All speeds are in pixels per second.
- **Why:** spec.md stops mid-sentence ("A game loop using."). `requestAnimationFrame` is the standard choice, and scaling by `dt` makes the game run at the same speed on 60 Hz and 144 Hz screens. The cap stops a burst of enemies after the tab was hidden.
- **Chosen by:** the user. **spec.md was not edited.** The unfinished sentence is still there for the user to fix.

## D4. Game logic is testable plain functions; browser start-up is guarded

- **Decision:** `game.js` is one plain browser script. The logic (`createGame`, `updateGame`, `handleKeyDown`, `drawGame`, ...) works on a plain state object. The end of the file runs `startGame()` only when `document` exists, and sets `module.exports` only when `module` exists (Node).
- **Why:** The spec calls for plain HTML/CSS/JS with no build step, and the tests still need to load the same file. The tests also load `game.js` the way a browser would, inside a `vm` context with a fake canvas, fake keyboard events, and fake animation frames. That checks the real start-up wiring without a browser.
- **Chosen by:** judgment call.

## D5. Gameplay numbers

All numbers are named constants at the top of `game.js`:

| Constant | Value | Note |
|---|---|---|
| `SHIP_SPEED` | 300 px/s | crosses the 480 px canvas in about 1.5 s |
| `SHOT_SPEED` | 500 px/s | |
| `SHOT_DELAY` | 0.25 s | the spec's "short delay between shots" |
| `ENEMY_SPEED` | 100 px/s | about 6.7 s to fall the full height |
| `ENEMY_SPAWN_DELAY` | 1.0 s | the spec's "about once a second" |
| `POINTS_PER_ENEMY` | 10 | from the spec |
| `STARTING_LIVES` | 3 | from the spec |
| ship / enemy / shot size | 40×24 / 30×30 / 4×12 px | |

- **Chosen by:** judgment call where the spec gives no number. All of these are easy to tune.

## D6. Holding Space fires repeatedly at the shot delay

- **Decision:** While Space is held, the ship fires one shot every `SHOT_DELAY` seconds. The first press fires right away.
- **Why:** The spec's goal ("cannot fire continuously") is met by the delay. Requiring a re-press for every shot was not in the spec.
- **Chosen by:** judgment call.

## D7. Enemy spawning details

- **Decision:** The first enemy appears after 1 s, not at time 0. New enemies start just above the top edge (`y = -ENEMY_SIZE`) at a random x that keeps them fully inside the canvas, then slide into view. Enemies spawned during a frame are not moved in that same frame.
- **Chosen by:** judgment call.

## D8. Collisions and losing lives

- **Decision:** Collisions are rectangle-overlap checks. Touching edges do not count as a hit. Each frame runs in this order: move, then shots against enemies, then enemies against the ship or the bottom, then the game-over check. An enemy "reaches the bottom" when its bottom edge reaches the canvas bottom. Each shot destroys at most one enemy. Lives never go below 0, even when two enemies hit in the same frame.
- **Note:** The ship is *drawn* as a triangle, but its hit box is its rectangle, as the spec requires.
- **Chosen by:** spec, with the details filled in by judgment.

## D9. Keys are read with `event.code`

- **Decision:** The game reads `ArrowLeft`/`KeyA`, `ArrowRight`/`KeyD`, `Space`, and `Enter`/`NumpadEnter` from `event.code`. Game keys call `preventDefault()` so the page does not scroll. Enter does nothing during play.
- **Why:** `event.code` does not change with Caps Lock or Shift.
- **Chosen by:** judgment call.

## D10. No start screen; play starts on page load

- **Decision:** The game starts as soon as the page loads.
- **Why:** The spec has no start screen, CLAUDE.md says not to add features, and the problem asks for a game you can "start immediately".
- **Chosen by:** judgment call.

## D11. One line of control hints under the canvas

- **Decision:** `index.html` shows one line of plain text under the canvas: "Move: ← → or A D · Fire: Space · Restart: Enter".
- **Why:** Without it a first-time player cannot discover the controls, and the problem asks for no long tutorial. This is static text, not game behavior, but the spec does not mention it. **Flagged for the user:** remove the `<p class="controls">` line if you do not want it.
- **Chosen by:** judgment call.

## D12. Commits include only the files Claude created

- **Decision:** The user's uncommitted edits to `CLAUDE.md` and `spec.md` (`python3` → `py`) are left uncommitted and unchanged.
- **Chosen by:** the user.

## D13. Browser play-checks are done by the user

- **Decision:** Claude does not drive a browser. After each change Claude runs `node --test`, checks that `py -m http.server 8000` serves `index.html`, `style.css`, and `game.js`, and gives the user a short manual checklist (see `HANDOFF.md`).
- **Chosen by:** the user.
