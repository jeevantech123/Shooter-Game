# 0004. The High Score panel is an HTML element beside the canvas

- **Round:** 3 (requirement R1: a High Score snippet to the right of the canvas)
- **Date:** 2026-11-13
- **Status:** Accepted
- **Chosen by:** the user, from options Claude offered before coding

## Y-statement

In the context of **placing the High Score snippet "to the right of the canvas" for Round 3 R1**,
facing **the choice between page markup and canvas drawing for something that sits outside the play area**,
we decided for **a small HTML `<aside class="high-score">` placed next to the unchanged 480×640 canvas in a flex row, with `game.js` writing the number into `#high-score`**,
and neglected **widening the canvas and drawing the High Score in a strip on its right side with canvas text**,
to achieve **the literal reading of "to the right of the canvas", no change to the canvas size, the game drawing, or the existing tests, and a layout that can wrap on narrow screens**,
accepting that **this is the first game information shown outside the canvas, so the page layout (`index.html`, `style.css`) now matters for the game and is checked by tests, and on a screen narrower than about 640 px the panel wraps below the canvas instead of sitting to its right**.

## Alternatives considered

| Option | Why not chosen |
|---|---|
| Wider canvas with a drawn side strip | It changes the 480×640 size in the spec and tests. Every drawing and clamp would have to tell the play area apart from the strip. And the panel would be *inside* the canvas, not to its right. |
| Draw it inside the play area (e.g. top-right HUD) | It is not "to the right of the canvas", and it would crowd the score and lives text. |

## Consequences

- `index.html` wraps the canvas and the panel in `<div class="game-row">`. `style.css` makes it `display: flex; flex-wrap: wrap`.
- The label "High Score" is static HTML. Only the number changes, and only when the high score goes up.
- The rule "draw everything with canvas shapes" (`CLAUDE.md`) is about not using image files. The panel is plain text and CSS, and has no images.
- Tests: `tests/03-round3-high-score.test.js`, "R1: index.html has a High Score panel next to the canvas…", "R1: style.css lays the canvas and the panel out side by side", and "R1: the High Score panel is outside the canvas…".
