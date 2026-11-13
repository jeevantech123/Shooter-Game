# 0001. Diagonal ship movement uses full speed on each axis

- **Round:** 2 (requirement R1: the ship moves left, right, up, and down)
- **Date:** 2026-11-13
- **Status:** Accepted
- **Chosen by:** the user, from options Claude offered before coding

## Y-statement

In the context of **adding up/down movement to the ship for Round 2 R1**,
facing **the question of how fast the ship should move when a horizontal and a vertical key are held together**,
we decided for **moving each axis independently at `SHIP_SPEED`, the same clamp-and-speed logic the left/right code already used**,
and neglected **normalizing the movement vector so the total speed is always `SHIP_SPEED`**,
to achieve **the "same logic as the previous code" that R1 asks for, the smallest code change (one `axisDirection` helper used for both axes), and movement that is easy to predict and test**,
accepting that **the ship moves about 1.41× faster (√2) diagonally than straight, which a player could use to dodge a little faster**.

## Alternatives considered

| Option | Why not chosen |
|---|---|
| Normalize the direction vector (divide by its length) | Needs a square root and a special case for zero length. It changes the old left/right logic instead of just extending it. The faster diagonal does not matter much in a simple casual game. |
| Allow only one axis at a time (last key wins) | It feels stiff, and it needs extra state to track which key was pressed last. Nothing in R1 asks for it. |

## Consequences

- `moveShip` in `game.js` computes `dx` and `dy` with `axisDirection()` and clamps each axis to the canvas.
- Holding opposite keys on one axis (Up + Down, or Left + Right) cancels out on that axis.
- Tests: `tests/02-round2-move-up-down.test.js`, "R1: holding a vertical and a horizontal key moves diagonally at full speed on each axis" and "R1: holding Up and Down together cancels out".
- To change this later, normalize `(dx, dy)` in `moveShip`. The tests named above would then need new expected values.
