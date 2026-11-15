# Handoff: Shooter-Game, after Round 7

These are notes for a fresh session that will do the next round. The standing rules for every session are in `CLAUDE.md`. This file covers the state of the project after Round 7 (2026-11-15).

Read in this order: `CLAUDE.md`, `problem.md`, `spec.md`, this file, then `docs/decisions/`. Start with `decisions.md` (D1–D13), then read `0001-…` to `0013-…`.

> `handoff-round-6.md` and older handoffs (`handoff-round-5.md` … `handoff-round-2.md`, `handoff.md` for Round 1) describe earlier states. Where they disagree with this file, trust this file.

## Current state

- **Round 7 is complete.** `problem.md` has one Round 7 requirement. **R15: "Players can press ctrl to enable auto usage of the special shotgun attack. This is a toggleable feature, and the cooldown still applies. This being enabled is also shown below the cooldown of the shotgun attack."** R15 *adds* a feature beside R14 (the Shift shotgun). Ship movement (R10), R2–R9, the High Score (R11), the purple triangle (R12), pausing with Esc (R13), and the Shift shotgun (R14) all still hold.
- **Requirement IDs:** `problem.md` now numbers requirements globally (R1–R15). Round 7 tests use `R15:`. Tests and decision records from Rounds 2–6 were written when each round's requirement was called "R1". The user has since renamed the Round 2–6 test names to R10–R14 (commit `ac97f68`), and `decisions.md` has a note that older records may still say R1. The README still says "R1" for Rounds 2–6 and "R15" for Round 7.
- `spec.md` was updated for Round 7 and committed in one commit (`c13d381`). All edits applied (checked with `git diff`).
- `node --test` passes **141 tests**: 39 in `01-initial-build`, 19 in `02-round2-move-up-down`, 15 in `03-round3-high-score`, 17 in `04-round4-triangle-enemy`, 17 in `05-round5-pause`, 18 in `06-round6-shotgun`, and 16 in `07-round7-auto-shotgun`. Counted file by file with `node --test <file>`, using Node v26.13.0. The suite was run three times in a row, because one Round 1 page test uses real randomness.
- The server smoke check passed. `py -m http.server 8000` served `/`, `/style.css`, and `/game.js` with status 200. The served page has `id="auto-shotgun"`, and the served `game.js` has `toggleAutoShotgun`.
- **The Round 7 browser play-check has not been confirmed.** Following D13, the user got the checklist at the bottom of this file. Ask whether they ran it. The Round 2–6 checks were not confirmed either.
- **Not committed:** this file, and Claude's Round 7 edits to `CLAUDE.md` (see "Unresolved", item 1). The Round 7 `problem.md` edit was committed by the user (`26caeb0`).

### Round 7 commits (oldest first)

| Commit | What |
|---|---|
| `c13d381` | `spec.md`: Ctrl toggles auto on a fresh press, during play only; auto fires whenever ready (right away, then after each cooldown); a running cooldown makes the first auto blast wait; turning off stops it; off at every game start; pause and Game Over behaviour; the Ctrl+W browser-shortcut note; the hint line; the Auto Shotgun panel; the state field and where auto is checked |
| `f3af7dc` | `tests/07-round7-auto-shotgun.test.js` (16 tests) and `tests/helpers.js` (a fake `auto-shotgun` element and `page.autoShotgunText()`). All 16 failed before the code, on purpose. |
| `770338c` | `game.js`: `autoShotgun` state field, `toggleAutoShotgun`, `autoShotgunText`, `AUTO_SHOTGUN_KEYS`, the auto line in `updateGame`, and `showShotgunPanels`/`showPanelText` (replacing `showShotgunCooldown`). `index.html`: the Auto Shotgun `<aside>` and "Auto Shotgun: Ctrl" in the hint line. `style.css`: `.auto-shotgun` in the shared panel rule. |
| `f551951` | `README.md`: the Ctrl key, the Auto Shotgun panel, the Ctrl+W warning, and the Round 7 test file |
| `c284760` | Decision records `0012` and `0013` |

## How to run

**Game.** From the project folder:

```
py -m http.server 8000
```

Then open http://localhost:8000. Use the arrow keys or W/A/S/D to move, Space to fire, Shift for the shotgun, Ctrl to turn the auto shotgun on or off, Esc to pause and un-pause, and Enter to restart after Game Over. The High Score panel is to the right of the canvas, with the Shotgun panel and then the Auto Shotgun panel under it.

**Tests.** These need Node 18 or newer, and nothing to install:

```
node --test
```

This runs every `tests/*.test.js` file. For a short summary, run `node --test 2>&1 | grep -E "^(✖|ℹ (tests|pass|fail))"`. To count the tests in one file, run `node --test tests/07-round7-auto-shotgun.test.js`.

**Server smoke check.** Start `py -m http.server 8000` as a *background* task. Then `curl` `/`, `/style.css`, and `/game.js` and expect status 200, retrying a few times while the server starts. Then stop that task with TaskStop (load it with ToolSearch `select:TaskStop` if it is deferred). Do **not** kill every `py.exe`.

**Play-check tips:** triangles are random, about one enemy in four. To clear the high score, run `localStorage.removeItem("shooter-game-high-score")` in the DevTools console and reload. Press Ctrl on its own: Ctrl+W closes the tab.

## Files

| File | What it is |
|---|---|
| `index.html` | `.game-row` holds the 480×640 `<canvas id="game">` and a `<div class="side-panels">` column with three `<aside>`s: High Score (`#high-score`, starts `0`), Shotgun (`#shotgun-cooldown`, starts `Ready`), and, **new in Round 7**, Auto Shotgun (`<aside class="auto-shotgun">`, value `#auto-shotgun`, starts `Off`). Then the hint line: "Move: ← → ↑ ↓ or W A S D · Fire: Space · Shotgun: Shift · Auto Shotgun: Ctrl · Pause: Esc · Restart: Enter". |
| `style.css` | `.side-panels` stacks the panels. **Round 7:** `.auto-shotgun` joins `.high-score, .shotgun` in the shared box rule; its label/value use `.panel-label`/`.panel-value`. |
| `game.js` | All the game code: constants, state, update, high score, keyboard, drawing, and browser start-up |
| `tests/helpers.js` | `step()`, the fake canvas context, `createFakeStorage()`, and `loadGameInFakePage({ storage, random })`. **Round 7:** the fake page has an `auto-shotgun` element, and `page.autoShotgunText()` reads it. |
| `tests/01-…` to `07-round7-auto-shotgun.test.js` | One file per round |
| `docs/decisions/decisions.md` | Round 1 records D1–D13 |
| `docs/decisions/0001-…` to `0013-…` | Records from Rounds 2–7, as Y-statements. The next number is **0014**. |
| `README.md` | For players: how to play, run, and test |

## How `game.js` is organised (Round 7 changes)

- **No new constants.** Auto uses `SHOTGUN_COOLDOWN` (10 s) through the existing cooldown.
- **`createGame()`** has a new field, **`autoShotgun: false`**. Because it is created there, restarting with Enter turns auto off (the user's choice, `0013`).
- **`updateGame()`** has one new line right after `updateShotgunCooldown(state, dt)`: **`if (state.autoShotgun) fireShotgun(state);`**. `fireShotgun` already does nothing while the cooldown is running, so auto fires on the first frame the cooldown is 0. It is behind the over/paused early return, so a pause freezes it (`0012`).
- **Keyboard:** `AUTO_SHOTGUN_KEYS = ["ControlLeft", "ControlRight"]`. `handleKeyDown` calls **`toggleAutoShotgun(state)`** on a non-repeat Ctrl press and always returns `true`. `toggleAutoShotgun` does nothing while `isPaused` or `isOver`. Ctrl is **not** in `input`, and `handleKeyUp` ignores it (returns `false`).
- **`autoShotgunText(state)`** returns `"On"` or `"Off"`. It is exported.
- **Browser start-up:** `startGame()` looks up `#auto-shotgun`. **`showShotgunPanels(shotgunElement, autoShotgunElement, state)`** writes both shotgun panels at start-up and every frame, through **`showPanelText(element, text)`**, which writes only when the text changes. These replace Round 6's `showShotgunCooldown`.
- **Not changed:** movement, normal firing, the shotgun blast itself (`fireShotgun`, `createPellet`), spawning, triangles, collisions, the high score, pause, and drawing. Nothing about auto is drawn on the canvas. `toggleAutoShotgun`, `showShotgunPanels`, and `showPanelText` are **not exported**; tests reach them through `handleKeyDown` and the fake page.

## Decisions made in Round 7

### Chosen by the user (asked before any code was written)

1. **Auto fires right away** if the shotgun is ready when auto is turned on, then again as soon as each 10 s cooldown ends. The alternative was firing automatically only after a cooldown started by a manual blast.
2. **A new "Auto Shotgun" panel** under the Shotgun panel, same style, always showing "On" or "Off". The alternatives were a line inside the Shotgun panel, or showing something only while auto is on.
3. **Auto resets to Off on each new game** (it is game state). The alternatives were keeping it across restarts, or saving it in local storage.
4. **Ctrl only works during play.** It does nothing while paused or on Game Over, like Shift. The alternatives were also allowing it while paused, or at any time.

### Judgment calls by Claude (all reported to the user at the end of Round 7)

- **Automatic blasts happen in `updateGame`, through the same `fireShotgun` as Shift** (`0012`). Firing in the Ctrl handler and a separate auto timer were rejected. "Right away" therefore means the next frame (about 1/60 s).
- **Ctrl then Esc before the next frame:** the first auto blast fires only after un-pausing. Auto is a standing setting, not a saved-up press, so this does not contradict the "Shift is not saved up" rule.
- **Turning auto on during a cooldown waits for it to end. Turning auto off leaves a running cooldown alone,** and Shift fires by hand once it ends.
- **Shift still works with auto on,** but auto takes the blast in the same update the cooldown ends, so Shift almost never finds the shotgun ready.
- **Both Ctrl keys toggle; holding Ctrl does not flip it again** (`event.repeat`). Ctrl always returns `true` (prevents the default), like Esc and Shift.
- **An automatic blast is the same five-pellet fan** as a Shift blast and starts the same cooldown.
- **On Game Over the Auto Shotgun panel keeps its last value;** restarting shows "Off".
- **Names:** label "Auto Shotgun", hint "Auto Shotgun: Ctrl", id `auto-shotgun`.
- **`showShotgunCooldown` was replaced** by `showShotgunPanels` + `showPanelText`.
- **A Ctrl+W warning** was added to `spec.md` and the README. The key was not changed.
- **README:** the Round 7 test file is described as "R15"; Rounds 2–6 were left as "R1".
- **Two decision records** were written (at least one was asked for) and the README got its own commit.

## Unresolved

1. **Claude edited `CLAUDE.md` (not committed) with Round 7 standing rules.** Ask the user whether they accept them:
   - (a) The fresh-press rule now names Ctrl (auto shotgun) as a toggle example, beside Esc.
   - (b) Every shotgun blast, by hand or automatic, goes through `fireShotgun(state)`.
   - (c) Each side panel is an `<aside>` inside `.side-panels`, listed in the shared panel CSS rule, with no `<div>` inside `.side-panels` (the HTML tests read up to its first `</div>`).
   Also ask whether the Round 6 `CLAUDE.md` rules (listed in `handoff-round-6.md`) were accepted; they appear in the committed `CLAUDE.md`, so they look accepted.
2. **The Round 7, 6, 5, 4, 3, and 2 browser play-checks are unconfirmed.** The auto shotgun has only been checked by tests, not by eye: how the three stacked panels look, and whether a blast every 10 s feels right.
3. **The judgment calls above have not been confirmed by the user.** The most visible are: auto fires on the next frame, a Ctrl-then-Esc press fires on resume, and the panel keeps its value on Game Over.
4. **Ctrl+W (close tab) cannot be blocked by a web page.** Ctrl with other keys can also trigger browser shortcuts (Ctrl+S and Ctrl+D are blocked because S and D are move keys; Ctrl+A, Ctrl+Space are blocked as game keys too, but Ctrl+W, Ctrl+T, Ctrl+N are not). The user kept Ctrl as the requirement says. Changing the key would change R15, so ask first.
5. **Windows Sticky Keys (carried from Round 6):** pressing Shift five times quickly can open the Sticky Keys dialog. Not raised with the user yet.
6. **Carried from Round 2:** shots vanish when the ship is at the very top edge, because `createShot` puts the shot fully above the canvas and `moveShots` removes it at once. This applies to shotgun pellets, **including automatic blasts**: with auto on and the ship parked at the top, every blast is wasted and still starts the cooldown. Ask before changing this.
7. **Carried from Round 2:** a ship parked at the top edge gets hit by every enemy that spawns above it. Under the spec, this is not a bug.
8. **Carried from Round 4:** the triangle's hit box is its full 30×30 rectangle, so its empty top corners count as hits. Ask before changing it.
9. **Carried from Round 5:** the game does not pause when the tab is hidden (the user's choice). `MAX_FRAME_TIME` (0.1 s) caps the jump when the tab comes back.
10. **D11 (the control-hint line)** was never formally approved. "Auto Shotgun: Ctrl" was a Claude judgment call. Do not edit `decisions.md`.
11. **README requirement IDs are mixed** ("R1" for Rounds 2–6, "R15" for Round 7). Ask the user before rewriting the older ones.
12. **`handoff.md` (Round 1) is out of date.** Git tracks it as `HANDOFF.md`. Do not edit it unless asked.

## Warnings for the next session

- **Every new game-state field must be in `createGame()`.** The R8 tests `assert.deepEqual(state, game.createGame())` after a restart, and the Round 5 freeze test `structuredClone`s the whole state. `autoShotgun` is a plain boolean and passes both. Do not put functions in the state.
- **Auto fires in `updateGame`, not on the key press.** A test sees no new shots right after `handleKeyDown(state, input, "ControlLeft")`; the five pellets appear after the next `updateGame`. Manual Shift is the opposite: it fires in the key handler.
- **With auto on, the shotgun is almost never "Ready" between frames.** A test that turns auto on and then expects Shift to fire will usually see nothing. Turn auto off first.
- **`shotgunCooldownText` uses `Math.ceil`, and an auto blast fires during the first update, after the cooldown step.** After `playFor(N)` from an auto start, the time left is `10 - (N - 1/60)`, so 3 s of play shows "8", not "7". Read the text at half-second points (3.5 s → "7", 5.5 s → "5").
- **`blastTimes()` in `07-…` detects a blast as `state.shotgunTimer` jumping up between steps.** Reuse it for timing tests; it does not depend on pellets staying on screen.
- **Long timing tests clear `state.enemies` after every step** (`playFor` in `06-…` and `07-…`). Long page tests use `random: () => 0` (slow triangles at x = 0), which loses no lives for about 12 s; `random: () => 0.5` loses the game by about 10 s.
- **The fake page knows the ids `game`, `high-score`, `shotgun-cooldown`, and `auto-shotgun`.** A new `getElementById` in `startGame()` throws in every page test until `tests/helpers.js` has it. The fake `document` has no `addEventListener`.
- **The Round 5 test "the game does not pause by itself"** checks that the page registers only `keydown` and `keyup` listeners. A new `window.addEventListener` will fail it.
- **HTML structure tests:** the Round 3 test matches `<div class="game-row">…</div>` followed by `<p class="controls">` (lazy). The Round 6 and Round 7 tests read `<div class="side-panels">` up to the **first** `</div>`. The Round 7 test also checks that one CSS selector list contains both `.shotgun` and `.auto-shotgun`.
- **Hint-line tests** match `Shotgun: Shift`, `Auto Shotgun: Ctrl`, `Pause: Esc`, and `Restart: Enter` in `<p class="controls">`. Keep all of them when adding a key.
- **Page tests count pellets as `rectsWithColor(COLORS.shot)`.** If pellets ever get their own colour, update the Round 6 and Round 7 page tests.
- **`random` in tests controls the enemy kind:** `() => 0.5` (the default for `step()`) gives only red squares at x = 225; `() => 0` gives only triangles at x = 0 heading left; use a sequence for anything else (see `sequence()` in `04-…`).
- **The R9/rules test bans some words** in `index.html`, `style.css`, and `game.js`, even in comments: `http://`/`https://`, `fetch`, `XMLHttpRequest`, `WebSocket`, `<input`, `password`, `login`.
- **The input object is not reset on restart or on pause.** Held move and fire keys carry over, on purpose (`0009`). Shift and Ctrl are not in `input` at all.
- **Line endings changed:** `spec.md` and `CLAUDE.md` now use **CRLF** (since the user's commit `a14d3fc`), not LF as `handoff-round-6.md` says. They use one blank line between list items and three blank lines before a `##` heading. The Edit tool handled CRLF fine in Round 7. Check with `grep -n "" spec.md | cat -A` before an Edit.
- **Do not pipe a Python script into `python`/`py` through a bash heredoc.** It hangs. Use the Edit tool.
- **Git prints "LF will be replaced by CRLF" warnings** on commit. They are harmless.
- **Never commit a handoff file or `CLAUDE.md` changes yourself.**
- **Next numbers:** test file **08**, decision record **0014**, requirement **R16**.

## Manual play-check list (Round 7)

1. Run `py -m http.server 8000` and open http://localhost:8000. An "Auto Shotgun" box showing "Off" sits under the "Shotgun" box, in the same style. The hint line includes "Auto Shotgun: Ctrl".
2. Press Ctrl. The box shows "On" and a five-pellet blast fires at once. The Shotgun box counts down 10 … 1, then another blast fires by itself, and this repeats every 10 s.
3. Press Ctrl again. The box shows "Off" and no more automatic blasts fire. When the countdown reaches "Ready", Shift fires by hand.
4. Fire with Shift, then turn auto on partway through the countdown. Nothing fires until the countdown ends.
5. Hold Ctrl down. The setting flips only once.
6. Pause with Esc while auto is on. Nothing fires and the countdown stops. Ctrl does not change the box while paused. Un-pause, and auto carries on.
7. On Game Over, Ctrl does nothing. Press Enter: the box shows "Off".
8. Shift, Space, pause, the High Score, the triangles, and moving in all four directions still work as in Round 6.
