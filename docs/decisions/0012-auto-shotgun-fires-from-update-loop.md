# 0012. The auto shotgun fires from `updateGame`, through the same `fireShotgun` as Shift

- **Round:** 7 (requirement R15: Ctrl toggles automatic use of the shotgun; the cooldown still applies)
- **Date:** 2026-11-15
- **Status:** Accepted
- **Chosen by:** the user chose the behaviour: auto fires whenever the shotgun is ready, right away if it is ready when turned on, and Ctrl works only during play. Where and how the automatic blast happens in the code was a judgment call by Claude.

## Y-statement

In the context of **an auto shotgun that must fire by itself every time the 10-second cooldown ends, and also right away when turned on**,
facing **a cooldown that already counts down inside `updateGame` and must freeze during a pause, and the need for an automatic blast to obey exactly the same rules as a Shift blast**,
we decided for **one boolean in the game state, `autoShotgun`, flipped by a fresh Ctrl press in `handleKeyDown`, and one line in `updateGame` right after `updateShotgunCooldown`: `if (state.autoShotgun) fireShotgun(state)`, which reuses the existing paused/over/cooldown checks**,
and neglected **firing the first blast inside the Ctrl key handler and then scheduling later ones, a separate auto timer that counts up to 10 seconds on its own, and holding Ctrl down to keep auto on (like Space for normal shots)**,
to achieve **automatic blasts that can never fire faster than the cooldown allows, that stop with the pause because they sit behind `updateGame`'s early return, that are the same five-pellet fan as a Shift blast, and no new timer to keep in step with `shotgunTimer`**,
accepting that **"right away" means on the next frame (about 1/60 s after Ctrl), so a Ctrl press followed by Esc before that frame fires only after un-pausing, and that while auto is on Shift almost never finds the shotgun ready, because auto takes the blast in the same update that the cooldown ends**.

## Alternatives considered

| Option | Why not chosen |
|---|---|
| Fire in the Ctrl key handler, then schedule later blasts | Two places would fire automatically (the handler and the update), with the paused/over checks needed in both. The next frame is only about 16 ms later, which a player cannot tell apart from "at once". |
| A separate auto timer | A second timer could drift from `shotgunTimer` (for example after a manual Shift blast or a pause) and fire during a cooldown, which breaks "the cooldown still applies". It is also one more field that a pause has to freeze. |
| Hold Ctrl to keep auto on | The requirement says the feature is toggleable. Holding Ctrl while pressing W would also close the tab (Ctrl+W). |

## Consequences

- `AUTO_SHOTGUN_KEYS = ["ControlLeft", "ControlRight"]`. `handleKeyDown` always returns `true` for Ctrl, even when nothing changes (a repeat, paused, or over), like Esc and Shift. A held Ctrl (`event.repeat`) does not flip it again.
- `toggleAutoShotgun(state)` does nothing while paused or on the game-over screen. `autoShotgunText(state)` returns `"On"` or `"Off"` for the new `#auto-shotgun` panel. `showShotgunPanels` writes both shotgun panels each frame, only when the text changes.
- Turning auto off during a cooldown leaves that cooldown running; Shift fires by hand once it ends.
- Ctrl combined with other keys can still trigger browser shortcuts; Ctrl+W cannot be blocked by a page. The spec and README say to press Ctrl on its own.
- Tests: "R15: with auto on, a ready shotgun fires a five-pellet blast right away, without Shift", "R15: with auto on, the shotgun fires again as soon as each 10-second cooldown ends, never sooner", "R15: turning auto on during a cooldown waits for the cooldown to end", and "R15: auto turned on just before a pause fires only after un-pausing".
