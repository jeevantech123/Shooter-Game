\# CLAUDE.md



\## Project



Shooter-Game: a very simple 2D space shooter that runs in a browser.



\## Read first



\- `problem.md` says who has the problem and lists the requirements

\- `spec.md` says how the game should work. Build what the spec describes.



Do not edit `problem.md`. If the spec and the code disagree, tell me before changing either.



\## Rules



\- Use plain HTML, CSS, and JavaScript with a `<canvas>`.

\- The game must run with one command: `py -m http.server 8000`, then open http://localhost:8000.

\- No API keys, no login, no paid services, no network calls to other sites.

\- Draw everything with canvas shapes. Do not add image or sound files.

\- Keep it simple. Do not add features that are not in the spec.



\## Code style



\- Small functions with clear names.

\- Put numbers like speeds, delays, and lives in named constants at the top of `game.js`.

\- Short comments where the code is not obvious.

\- Keep the two guards at the end of `game.js`: `startGame()` runs only when `document` exists, and `module.exports` is set only when `module` exists. The browser and the Node tests both depend on them.

\- Any new game-state field must be created in `createGame()`, so `resetGame()` resets it.

\- Data that must outlive one game (such as the high score) is kept outside the game state, not in `createGame()`, so restarting does not clear it.

\- Every enemy has a `type` (`"square"` or `"triangle"`). An enemy with no `type` must still act as a red square, because older tests build enemies as plain `{ x, y, width, height }`.

\- `createEnemy(random)` uses `random()` for x first, then for the kind, then for a triangle's direction. Keep x first: tests that fix `random` at 0.5 rely on getting only red squares, centered above the ship.

\- Esc pauses the game (`isPaused`). Put any new per-frame game logic inside `updateGame()`, after its first line, which returns early while the game is over or paused, so a pause freezes it too. Do not add timers outside the game state: they would keep running during a pause.

\- A key that toggles something (like Esc for pause) acts only on a fresh press. `handleKeyDown` receives the browser's `event.repeat` and ignores repeats, so holding the key down does not flip it on and off.



\## Tests



\- Run all tests with `node --test` (Node 18 or newer, nothing to install). Every test from earlier rounds must keep passing.

\- Each round or change gets a new numbered file, `tests/NN-short-name.test.js`. Shared fakes live in `tests/helpers.js`.

\- Each test name starts with the requirement ID it checks, such as `R1:`. A test that checks two requirements together uses `R1/R2:`.



\## Decision records



\- Write decision records in `docs/decisions/` as `NNNN-short-slug.md` (0001, 0002, ...), each as a Y-statement for a decision with real alternatives. Say who chose it: the user, or a judgment call.

\- `docs/decisions/decisions.md` holds the Round 1 records D1-D13. Do not renumber or rewrite them.



\## Working



\- Make a commit after every major change. After building initial project, commit. If asked to make a major change to a project, do that then commit.

\- After each change, the game must be play-checked in the browser for the requirements it touches. Claude does not drive a browser (decision D13): run `node --test` and the server smoke check, then give me a short manual play-check list, and I play it.

\- `problem.md`, `spec.md`, and `CLAUDE.md` use escaped Markdown (`\#`, `\-`) with blank lines between items. Keep that style when editing `spec.md` or `CLAUDE.md`.

\- Never undo or amend a commit. Commit in small steps with messages that say what changed and why.

\- Before each commit, check `git diff` and confirm that every edit you meant to make is there.

\- At the start of a round, list that round's requirements from `problem.md` and ask about anything unclear before writing code. Requirement IDs can be reused: a later round's R1 can replace an earlier R1 (Round 2) or add a new feature beside it (Rounds 3 and 4). Ask if it is not clear which.

\- Order of work in a round: update `spec.md` and commit it, then write the tests and commit them (failing is fine), then write the code until every test passes, then write the decision records. At the end, list every decision the user did not ask for.

\- Leave the user's round-start edits to `problem.md` uncommitted unless asked; the user commits them.

\- Edit files with the Edit and Write tools. Do not pipe a script into `python` or `py` through a heredoc: on this machine it hangs. Before editing `spec.md` or `CLAUDE.md`, check the exact blank lines around the text, because an edit whose text does not match is not applied.

\- Server smoke check: start `py -m http.server 8000` as a background task, request `/`, `/style.css`, and `/game.js` (expect status 200), then stop that task. Do not kill every `py.exe`.

\- Write a handoff file (`handoff-round-N.md`) only when asked. Do not commit handoff files or changes to `CLAUDE.md`; I read and edit them first.

