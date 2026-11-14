# 0009. Held-down Esc does not repeat, and other keys stay tracked while paused

- **Round:** 5 (requirement R1: Esc pauses and un-pauses)
- **Date:** 2026-11-14
- **Status:** Accepted
- **Chosen by:** judgment call by Claude. The requirement and the user's answers do not cover held keys.

## Y-statement

In the context of **reading the keyboard while the game can be paused**,
facing **browsers sending repeated `keydown` events while a key is held, and players who press or let go of keys during the pause**,
we decided for **ignoring repeated Esc keydowns (`event.repeat`), so one press toggles the pause once, and still recording move and fire keys while paused (they just have no effect until play resumes)**,
and neglected **toggling on every Esc keydown, ignoring all keys while paused, and clearing every held key when the game pauses or un-pauses**,
to achieve **a pause that does not flicker on and off when Esc is held, no key stuck "down" after it was let go during the pause, and a key still held at resume that works straight away**,
accepting that **a key pressed during the pause and still held at resume acts at once (for example, Space fires on the first frame back)**.

## Alternatives considered

| Option | Why not chosen |
|---|---|
| Toggle on every Esc keydown | Holding Esc for about half a second sends repeats, so the game would flash between paused and playing. |
| Ignore all keys while paused | A key released during the pause would stay "down" in `input`, so the ship would keep moving after resume until the key was pressed and released again. |
| Clear all held keys on pause or resume | A player still holding an arrow key at resume would have to press it again before the ship moved. |

## Consequences

- `handleKeyDown(state, input, code, repeat = false)` takes a fourth argument. The browser passes `event.repeat`. Older callers and tests pass three arguments and are unaffected.
- Esc returns `true` (so the browser's default is prevented) on every keydown, including on the Game Over screen, where it changes nothing. This matches how Enter is handled during play.
- `tests/helpers.js`: `page.press(code, extra)` can add event fields such as `{ repeat: true }`.
- Tests: "R1: holding Esc down (key repeat) does not flip the pause on and off", "R1/page: a held-down Esc that repeats does not un-pause", "R1: a key still held when the game un-pauses works as normal", and "R1: a key released while paused stays released after un-pausing".
