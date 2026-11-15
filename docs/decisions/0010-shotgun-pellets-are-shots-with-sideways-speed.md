# 0010. Shotgun pellets are normal shots with a sideways speed

- **Round:** 6 (requirement R1: Shift fires a shotgun attack with a 10-second cooldown)
- **Date:** 2026-11-15
- **Status:** Accepted
- **Chosen by:** the user chose the shape (a fan of 5 pellets that fly until they leave the screen). How the pellets are built and how wide the fan is were judgment calls by Claude.

## Y-statement

In the context of **adding a five-pellet shotgun blast that spreads out in a fan**,
facing **the need for pellets to hit, score, and be drawn exactly like normal shots while also moving at an angle**,
we decided for **making each pellet a normal shot object with one extra field, `dx` (sideways speed in px/s), kept in the same `state.shots` list, with the upward speed unchanged (`SHOT_SPEED`) and sideways speeds of -200, -100, 0, 100, 200 px/s (`SHOTGUN_SPREAD_SPEED` = 100)**,
and neglected **a separate `state.pellets` list with its own move, hit, and draw code, and true angles where each pellet's speed along its path equals `SHOT_SPEED` (so angled pellets climb more slowly)**,
to achieve **one collision, scoring, and drawing path for every shot, no new state field for pellets, and older code and tests that build shots as plain `{ x, y, width, height }` still working (no `dx` means straight up)**,
accepting that **angled pellets move slightly faster overall than the middle one (about 539 px/s at the edge of the fan against 500 px/s) and that `moveShots` now also has to remove shots that leave by a side, not just the top**.

## Alternatives considered

| Option | Why not chosen |
|---|---|
| Separate `pellets` list | It would duplicate the shot movement, the hit check (`handleShotHits`), and the drawing, and add a new state field, for objects that the spec says follow the same rules as shots. |
| True angles (speed split by sine and cosine) | It needs an angle constant and trigonometry, and gives each pellet a second speed field, for a difference a player would hardly notice. All pellets also stay on one level line, which makes the fan easy to read. |
| A narrower or wider fan | The outer pellets angle out about 22° from straight up. A narrower fan barely beats a normal shot. A much wider one sends the outer pellets off the sides before they reach most enemies. The value is one named constant, so it is easy to tune. |

## Consequences

- `createPellet(ship, dx)` returns `{ ...createShot(ship), dx }`. `moveShots` adds `dx * dt` to `x` when `dx` is set, and keeps a shot only while it overlaps the canvas (`isOnCanvas`). A normal shot behaves exactly as before.
- All five pellets start at the same point (the ship's nose) and spread out as they fly.
- One blast can destroy up to five enemies, 10 points each, through the existing `handleShotHits`.
- Tests: "R1: the pellets spread in a fan: one straight up, two to the left, two to the right", "R1: pellets fly until they leave the canvas, at the top or a side", and "R1: a pellet that hits an enemy destroys it and scores 10; one blast can destroy several".
