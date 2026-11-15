# 0013. The auto shotgun setting is game state and turns off on restart

- **Round:** 7 (requirement R15: Ctrl toggles automatic use of the shotgun, shown below the cooldown)
- **Date:** 2026-11-15
- **Status:** Accepted
- **Chosen by:** the user (asked before any code was written): auto resets to Off on each new game, and is shown in a new "Auto Shotgun" panel with On/Off.

## Y-statement

In the context of **storing whether the auto shotgun is on, and showing it below the Shotgun cooldown panel**,
facing **a choice between treating it as part of one game or as a player preference that outlives the game**,
we decided for **a plain `autoShotgun: false` field created in `createGame()`, so `resetGame()` turns it off when the player restarts with Enter, shown in a third side panel ("Auto Shotgun": "On" / "Off") under the Shotgun panel**,
and neglected **keeping the setting outside the game state so it survives a restart (like the high score), saving it in local storage so it survives a page reload, and showing it only while it is on, or as a line inside the Shotgun panel**,
to achieve **the simplest rule (every new game starts the same way, as the shotgun is Ready at every start), no new storage key, the existing R8 restart test (`deepEqual(state, createGame())`) and the Round 5 pause-freeze test still covering the new field, and a panel that always shows the current setting in the same style as the others**,
accepting that **a player who likes auto has to press Ctrl again at the start of each game**.

## Alternatives considered

| Option | Why not chosen |
|---|---|
| Kept outside the game state (survives restart) | Needs state outside `createGame()`, like the high score, for a setting the user wanted reset. |
| Saved in local storage | Adds a second storage key and load/save code. Not asked for. |
| Shown only while on | The player could not tell "off" from "panel missing". |
| A line inside the Shotgun panel | A separate panel matches the existing High Score and Shotgun panels and keeps each value large and readable. |

## Consequences

- `index.html` has a third `<aside class="auto-shotgun">` in `.side-panels` (no nested `<div>`, so the Round 6 HTML test still works), starting as "Off". `style.css` adds `.auto-shotgun` to the shared panel rule.
- On the game-over screen the panel keeps its last value. Restarting makes it "Off".
- Tests: "R15: restarting with Enter turns the auto shotgun off" and "R15/page: index.html has an Auto Shotgun panel directly under the Shotgun panel, starting Off".
