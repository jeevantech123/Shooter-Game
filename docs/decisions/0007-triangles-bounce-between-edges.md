# 0007. Purple triangles move sideways by bouncing between the canvas edges

- **Round:** 4 (requirement R1: a purple triangle that "moves left and right sideways")
- **Date:** 2026-11-14
- **Status:** Accepted
- **Chosen by:** the user chose the bounce and the half fall speed, from options Claude offered before coding. The sideways speed (`TRIANGLE_SIDE_SPEED = 80` px/s) was a judgment call by Claude.

## Y-statement

In the context of **making the purple triangle move left and right while it falls**,
facing **a requirement that says it moves sideways but not how, and the rule that enemies stay on the canvas**,
we decided for **a steady sideways speed of 80 px/s in a random starting direction, turning around (and being placed exactly on the edge) when it reaches the left or right edge, while it falls at half the red square's speed (50 px/s)**,
and neglected **a smooth sine-wave weave around its spawn point, and random changes of direction**,
to achieve **movement the player can read and aim at, that always stays inside the canvas, using only a `direction` of -1 or 1 on each triangle and no time or phase state**,
accepting that **its path is a zigzag with sharp turns, and a triangle that spawns near an edge turns around almost at once**.

## Alternatives considered

| Option | Why not chosen |
|---|---|
| Sine-wave weave | Smoother, but each triangle needs a start x and a phase or age, and the sway width must be fitted to the canvas edges. |
| Random direction changes | Hard to aim at, and each frame would need `random()`, which makes the movement harder to test. |
| Sideways speed equal to the fall speed (50 px/s), or faster than 100 px/s | 50 px/s barely moves it across the 480 px canvas before it lands. Above 100 px/s it gets hard to hit. 80 px/s crosses the canvas in about 6 s, while it takes about 13 s to fall. |

## Consequences

- `moveTriangle()` clamps x into `[0, CANVAS_WIDTH - width]` and flips `direction` at either edge.
- "Half as slow" was read as half the speed (the user's choice). Only the downward speed is halved. The sideways speed is its own constant.
- Tests: "R1: a triangle moves down at half speed and sideways at the same time", the two "turns around at the ... edge" tests, and "R1: over a long game, every enemy stays inside the canvas sideways".
