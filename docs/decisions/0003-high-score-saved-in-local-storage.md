# 0003. The high score is saved in the browser's local storage

- **Round:** 3 (requirement R1: a High Score snippet showing the top high score ever recorded)
- **Date:** 2026-11-13
- **Status:** Accepted
- **Chosen by:** the user, from options Claude offered before coding

## Y-statement

In the context of **showing "the top high score ever recorded" for Round 3 R1**,
facing **the question of how long the high score must be remembered**,
we decided for **saving it in the browser's `localStorage` under one key (`HIGH_SCORE_KEY`), and updating it live as soon as the score passes it**,
and neglected **keeping it in memory only for one page visit, and updating it only at Game Over**,
to achieve **a high score that really is "ever recorded" (it survives restarts, reloads, and closing the browser) while keeping the rules: no login, no server, no network calls**,
accepting that **the high score belongs to one browser on one computer, clearing site data erases it, and in a browser that blocks storage it lasts only until the page closes**.

## Alternatives considered

| Option | Why not chosen |
|---|---|
| In memory only (lost on reload) | Simpler, but a reload wipes it, which does not match "ever recorded". |
| Save to a server or online leaderboard | Breaks the project rules (no network calls, no accounts). |
| Update only at Game Over | The user chose live updates, which give feedback during play. The saved value ends up the same either way. |

## Consequences

- `loadHighScore` treats a missing, broken, or negative saved value as 0. `saveHighScore` and `loadHighScore` catch storage errors, and `browserStorage()` catches a blocked `window.localStorage`, so the game never stops because of storage.
- The value is saved each time the high score goes up, not only at the end of a game, so closing the tab mid-game keeps it.
- There is no way in the game to reset the high score. The spec does not ask for one. Clearing the site's data in the browser resets it.
- Tests: `tests/03-round3-high-score.test.js`, especially "R1: the High Score is kept when the page is reloaded", "R1/R4: the High Score rises during play as soon as the score passes it", and the two "without localStorage" / "storage throws" tests.
