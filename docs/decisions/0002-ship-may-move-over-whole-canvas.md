# 0002. The ship may move over the whole canvas

- **Round:** 2 (requirement R1: the ship moves left, right, up, and down)
- **Date:** 2026-11-13
- **Status:** Accepted
- **Chosen by:** the user, from options Claude offered before coding

## Y-statement

In the context of **letting the ship move up and down for Round 2 R1**,
facing **the question of how far up the ship is allowed to go**,
we decided for **clamping the ship to the full canvas (top edge to bottom edge), the same rule already used for left and right**,
and neglected **limiting the ship to the bottom half or the bottom third of the canvas**,
to achieve **one consistent rule for both axes, no new constants, and the plain reading of R1 ("moves left, right, up, and down", same logic as before)**,
accepting that **a player can fly to the very top, where enemies appear. This makes some enemies much easier to hit and others harder to avoid, and it changes how the game feels compared with a classic bottom-row shooter**.

## Alternatives considered

| Option | Why not chosen |
|---|---|
| Bottom half only | Needs a new constant and a different clamp for y than for x. The spec and R1 give no reason for a limit. |
| Bottom third only | Same as above, and it leaves very little vertical room to dodge. |

## Consequences

- `moveShip` clamps `ship.y` to `[0, CANVAS_HEIGHT - ship.height]`.
- Enemies still cost a life when they reach the bottom, even if the ship is above them (R6 is unchanged).
- Shots still start just above the ship's current position and travel upward (R2 is unchanged).
- Tests: `tests/02-round2-move-up-down.test.js`, "R1: the ship cannot leave the top or bottom of the canvas" and "R1: the ship can reach every corner of the canvas but never leaves it".
