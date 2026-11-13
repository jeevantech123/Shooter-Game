\# Spec: Shooter-Game



A very simple 2D space shooter that runs in a browser. It meets the requirements in `problem.md`.



\## How it is built



\- Plain HTML, CSS, and JavaScript, drawn on an HTML `<canvas>`. 

\- Files: `index.html`, `style.css`, `game.js`.

\- Shapes are drawn with canvas drawing calls. No image or sound files are needed.



\## How to run



```

py -m http.server 8000

```



Then open http://localhost:8000 in a browser.



\## Behavior



\- The canvas is 480 by 640 pixels. The player's ship starts near the bottom, centered.

\- Left and right arrow keys (or A and D) move the ship sideways. Up and down arrow keys (or W and S) move the ship up and down. The ship can move anywhere on the canvas but cannot leave it.

\- Up/down movement uses the same logic and speed as left/right movement. Each direction is handled on its own, so holding a horizontal and a vertical key at once moves the ship diagonally (each direction at full speed). Holding opposite keys (such as Up and Down) cancels out.

\- Space fires a shot that travels upward. There is a short delay between shots so the player cannot fire continuously.

\- A new enemy appears at a random position at the top about once a second, and moves downward. 

\- If a shot overlaps an enemy, both disappear and the score goes up by 10. 

\- The score is drawn in the top-left corner during play. 

\- The player starts with 3 lives, shown next to the score. An enemy that touches the ship or reaches the bottom is removed and costs one life. 

\- When lives reach 0, the game stops and shows "Game Over" with the final score.

\- Pressing Enter on the game-over screen resets the score and lives, puts the ship back at its starting position, and starts again, without reloading the page. 

\- No login or account is needed. 



\## How it works



\- A game loop using requestAnimationFrame. It updates positions, checks collisions, then redraws.

\- Collisions are simple rectangle overlap checks.

\- Game state (ship, shots, enemies, score, lives) is kept in plain JavaScript variables.



