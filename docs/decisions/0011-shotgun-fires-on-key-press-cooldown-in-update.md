# 0011. The shotgun fires in the key handler; its cooldown counts down in `updateGame`

- **Round:** 6 (requirement R1: Shift fires a shotgun attack with a 10-second cooldown)
- **Date:** 2026-11-15
- **Status:** Accepted
- **Chosen by:** the user chose "one blast per press" (holding Shift does not fire again). Where the firing and the countdown happen in the code was a judgment call by Claude.

## Y-statement

In the context of **firing the shotgun only on a fresh Shift press, while the game can be paused or over**,
facing **browsers sending repeated `keydown` events while Shift is held, and a pause that must freeze every timer**,
we decided for **firing the blast directly in `handleKeyDown` on a non-repeat Shift press (through `fireShotgun`, which does nothing while paused, over, or cooling down), and counting the cooldown (`state.shotgunTimer`) down inside `updateGame`, after its early return**,
and neglected **tracking Shift as a held key in `input` and firing from `updateGame` (like Space), and saving a "fire requested" flag on keydown that `updateGame` uses up on the next frame**,
to achieve **exactly one blast per press with no extra state, a Shift press during a pause or on the game-over screen that is simply ignored (never saved up to fire later), and a cooldown that freezes with the pause**,
accepting that **the pellets are created between frames, at the ship's position in the last drawn frame, and that this is the second key (after Esc) that changes the game state inside the key handler**.

## Alternatives considered

| Option | Why not chosen |
|---|---|
| Shift as a held key, fired from `updateGame` | Firing whenever Shift is held and the cooldown is 0 is the "auto-fire when ready" behaviour the user turned down. Telling a fresh press apart would still need extra state. |
| A "fire requested" flag used up by `updateGame` | It is one more field, either in `input` (not reset by a restart) or in the game state. A press made just before Esc would sit in the flag through the whole pause and fire on resume, which the spec now rules out. |

## Consequences

- `SHOTGUN_KEYS = ["ShiftLeft", "ShiftRight"]`. `handleKeyDown` returns `true` for Shift every time, even when nothing fires (paused, over, cooling down, or a repeat), like Esc and Enter.
- `handleKeyUp` does not need to know about Shift. The fresh-press check uses `event.repeat`, as Esc does (`0009`).
- `shotgunTimer` is created in `createGame()`, so restarting with Enter makes the shotgun ready again. It is plain data, so the Round 5 `structuredClone` freeze test still covers it.
- The Shotgun panel's text comes from `shotgunCooldownText(state)`: `"Ready"` at 0, otherwise `Math.ceil` of the seconds left (10 down to 1). The browser loop writes it to `#shotgun-cooldown` only when it changes.
- Tests: "R1: holding Shift down (key repeat) does not fire again when the cooldown ends", "R1: while paused, Shift does nothing and is not saved up for later", "R1: the shotgun cooldown stops while the game is paused", and "R1: Shift does nothing on the game-over screen".
