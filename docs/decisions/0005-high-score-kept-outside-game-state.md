# 0005. The high score is kept outside the game state

- **Round:** 3 (requirement R1: the top high score ever recorded)
- **Date:** 2026-11-13
- **Status:** Accepted
- **Chosen by:** judgment call by Claude (reported to the user at the end of Round 3)

## Y-statement

In the context of **adding a high score that must survive restarting with Enter**,
facing **the `CLAUDE.md` rule that every game-state field is created in `createGame()` so that `resetGame()` resets it, which would set the high score back to 0 on every restart**,
we decided for **a separate high-score object `{ best, storage }` made by `createHighScore()` in `startGame()`, and updated each frame by `updateHighScore(highScore, state.score)`**,
and neglected **adding `highScore` to the game state and having `resetGame()` copy it over, or passing it into `createGame(highScore)`**,
to achieve **a clear split (the game state is one game, and resets; the high score spans all games, and does not), with no change to `createGame()`/`resetGame()`, and the Round 1 test that a restarted state deep-equals `createGame()` kept as it is**,
accepting that **the browser start-up code now holds two pieces of state, and the high score update runs in the frame loop instead of inside `updateGame()`**.

## Alternatives considered

| Option | Why not chosen |
|---|---|
| `state.highScore`, kept by a special case in `resetGame()` | It breaks the "`createGame()` resets every field" rule, and it would make `resetGame()` more than a one-liner. |
| `createGame(highScore)` parameter | Every caller and the R8 deep-equal test would need to pass it. It also mixes saved data with one game's state. |
| A global variable | Harder to test, and it hides the storage dependency. |

## Consequences

- `updateGame()` does not change and knows nothing about the high score.
- Test: "R1/R8: the game state has no high score in it, so resetGame cannot clear it" and "R1/R8: restarting with Enter resets the score but keeps the High Score".
