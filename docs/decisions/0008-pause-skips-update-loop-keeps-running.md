# 0008. Pausing skips the game update while the animation loop keeps running

- **Round:** 5 (requirement R1: "Players can press ESC on their keyboard to pause and un-pause the game")
- **Date:** 2026-11-14
- **Status:** Accepted
- **Chosen by:** the user chose what the paused screen shows (the game dimmed, with "Paused" and "Press Esc to resume"), that Esc does nothing on Game Over, and that only Esc pauses (no auto-pause on blur). How the pause works inside the code was a judgment call by Claude.

## Y-statement

In the context of **freezing the game when the player presses Esc and carrying on afterwards**,
facing **the need for play to resume exactly where it stopped, with no burst of movement or new enemies after a long pause, and the rule that every game-state field lives in `createGame()`**,
we decided for **an `isPaused` field in the game state that makes `updateGame` return straight away, while the `requestAnimationFrame` loop keeps running and redrawing (so the paused screen is drawn by the normal `drawGame`)**,
and neglected **stopping the animation loop on pause and starting it again on resume, and keeping the update running with `dt` set to 0**,
to achieve **a pause where no game time passes at all (timers, positions, spawns), no time jump on resume because the loop's `lastTime` keeps moving forward, and a restart that always un-pauses because `resetGame` copies `createGame()`**,
accepting that **the loop still runs about 60 times a second while paused, redrawing a frame that does not change**.

## Alternatives considered

| Option | Why not chosen |
|---|---|
| Stop the loop with `cancelAnimationFrame` and start it again on resume | The paused screen must be drawn once before stopping. On resume, `lastTime` must be reset, or the first frame sees the whole pause as `dt` (it would be capped at 0.1 s, but still a jump). The loop's start-up code would have to be shared with the key handler. |
| Keep updating, but with `dt = 0` | Every update step would have to be checked to see that 0 really changes nothing. Firing would still work, because `updateFiring` fires whenever the shot timer is 0, so Space would fire during the pause. |
| Keep the pause flag outside the game state, like the high score | A pause should not survive a restart. Keeping it in `createGame()` follows the CLAUDE.md rule and keeps the R8 `deepEqual(state, createGame())` tests true. |

## Consequences

- `drawGame` draws the paused overlay (`drawPaused`) before the HUD, so the score and lives stay readable on top of the dim layer. Game Over and Paused share `dimCanvas` and the `COLORS.dim` colour.
- The high score cannot change while paused, because the score does not change.
- Tests: "R1: while paused nothing in the game moves, spawns, scores, or counts down", "R1: after un-pausing, play continues exactly where it stopped", and "R1/page: Esc pauses the running game, and it resumes with no jump".
