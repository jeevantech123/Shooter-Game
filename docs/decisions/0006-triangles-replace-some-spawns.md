# 0006. Purple triangles replace some spawns instead of adding extra ones

- **Round:** 4 (requirement R1: a new purple triangle enemy)
- **Date:** 2026-11-14
- **Status:** Accepted
- **Chosen by:** the user, from options Claude offered before coding. The one-in-four share (`TRIANGLE_CHANCE = 0.25`) was a judgment call by Claude.

## Y-statement

In the context of **adding a second kind of enemy for Round 4 R1**,
facing **the question of how often purple triangles appear next to the red squares, which `problem.md` does not say**,
we decided for **keeping the single spawn timer (one enemy about every second) and making each new enemy a purple triangle with a chance of one in four, otherwise a red square**,
and neglected **a second timer that adds triangles on top of the squares, and strictly alternating square and triangle**,
to achieve **the same overall pace and difficulty as before, with a mix that feels random, and with one small change to `createEnemy()` instead of a new timer field in the game state**,
accepting that **runs of several squares or several triangles in a row can happen, and that each new enemy now uses one or two more `random()` calls (for its kind, and a triangle's direction)**.

## Alternatives considered

| Option | Why not chosen |
|---|---|
| A separate triangle timer (e.g. every 3 s) on top of the squares | More enemies overall makes the game harder, which the requirement does not ask for, and it adds a new timer to the game state. |
| Strictly alternate square, triangle, square, ... | Predictable, and half of all enemies would be triangles, which slows the game down a lot. |
| A different share (1 in 2, 1 in 3, ...) | Any share works. One in four keeps the red square as the main enemy, and the constant is easy to tune. |

## Consequences

- `createEnemy(random)` still uses the first `random()` for x, as before, so earlier tests that fix `random` at 0.5 still get only red squares in the same places.
- The spawn rule in `spec.md` ("about one enemy a second") is unchanged.
- Tests: "R1: a new enemy is a triangle when the kind roll is below TRIANGLE_CHANCE", "R1: about one new enemy in four is a purple triangle", "R1/R3: triangles do not add extra spawns, still about one enemy a second".
