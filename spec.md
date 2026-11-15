# Spec: Shooter-Game



A very simple 2D space shooter that runs in a browser. It meets the requirements in `problem.md`.



## How it is built



- Plain HTML, CSS, and JavaScript, drawn on an HTML `<canvas>`. 

- Files: `index.html`, `style.css`, `game.js`.

- Shapes are drawn with canvas drawing calls. No image or sound files are needed.



## How to run



```

py -m http.server 8000

```



Then open http://localhost:8000 in a browser.



## Behavior



- The canvas is 480 by 640 pixels. The player's ship starts near the bottom, centered.

- Left and right arrow keys (or A and D) move the ship sideways. Up and down arrow keys (or W and S) move the ship up and down. The ship can move anywhere on the canvas but cannot leave it.

- Up/down movement uses the same logic and speed as left/right movement. Each direction is handled on its own, so holding a horizontal and a vertical key at once moves the ship diagonally (each direction at full speed). Holding opposite keys (such as Up and Down) cancels out.

- Space fires a shot that travels upward. There is a short delay between shots so the player cannot fire continuously.

- A new enemy appears at a random position at the top about once a second, and moves downward. 

- There are two kinds of enemy. Each new enemy is a red square, or, about one time in four, a purple triangle instead. The total rate stays about one enemy a second.

- A red square falls straight down.

- A purple triangle is drawn pointing downward. It falls at half the speed of a red square. At the same time it moves sideways at a steady speed, starting left or right at random, and turns around when it reaches the left or right edge, so it never leaves the canvas.

- Both kinds are the same size and follow the same rules: shooting one scores 10, and one that touches the ship or reaches the bottom costs one life.

- If a shot overlaps an enemy, both disappear and the score goes up by 10. 

- The score is drawn in the top-left corner during play. 

- The player starts with 3 lives, shown next to the score. An enemy that touches the ship or reaches the bottom is removed and costs one life. 

- When lives reach 0, the game stops and shows "Game Over" with the final score.

- Pressing Enter on the game-over screen resets the score and lives, puts the ship back at its starting position, and starts again, without reloading the page. 

- Shift (left or right) fires a special shotgun blast. Five pellets leave the ship's nose at once and spread out in a fan: one goes straight up, two angle off to the left, and two angle off to the right.

- Pellets look like normal shots and follow the same rules. They fly until they leave the canvas (at the top or a side). A pellet that overlaps an enemy destroys it, disappears, and scores 10, so one blast can destroy several enemies.

- After a blast the shotgun has a 10-second cooldown. Pressing Shift during the cooldown does nothing. Each blast needs a fresh press of Shift: holding Shift down does not fire again when the cooldown ends.

- The shotgun is ready at the start of every game, including after restarting with Enter. Space and Shift are separate: normal shots do not start the shotgun cooldown, and a blast does not delay normal shots.

- Ctrl (left or right) turns the auto shotgun on or off during play. Each fresh press of Ctrl flips it once. Holding Ctrl down does not flip it again.

- While the auto shotgun is on, the shotgun fires by itself whenever it is ready. If it is ready when auto is turned on, it fires right away. After that it fires again as soon as each 10-second cooldown ends. An automatic blast is the same five-pellet fan as a Shift blast and starts the same cooldown, so the cooldown still applies: auto never fires more than once every 10 seconds. If a cooldown is already running when auto is turned on, the first automatic blast waits for it to end.

- Turning the auto shotgun off stops the automatic blasts. A cooldown that is already running keeps counting down, and Shift then fires by hand as before. Shift also still fires by hand while auto is on, if the shotgun is ready.

- The auto shotgun is off at the start of every game, including after restarting with Enter.

- Ctrl is also a browser shortcut key. Pressing Ctrl together with another key (for example Ctrl+W, which closes the tab) may still do what the browser does, and the game cannot always stop it. Ctrl pressed on its own is safe.

- Pressing Esc during play pauses the game. Everything in the game stops: the ship, shots, enemies, new enemies appearing, the delay between shots, the shotgun cooldown, and the auto shotgun. The game is dimmed and shows "Paused" with "Press Esc to resume" underneath. The score and lives stay visible.

- Pressing Esc again un-pauses the game, and play continues exactly where it stopped.

- While paused, the move keys, Space, Shift, and Ctrl do nothing in the game. A move key or Space that is still held down when the game un-pauses works as normal from then on. A Shift press during the pause is not saved up: it does not fire when the game un-pauses. A Ctrl press during the pause does not change the auto shotgun.

- If the auto shotgun is on when the game is paused, it stays on. It does not fire during the pause, and when the game un-pauses it carries on: it fires as soon as the shotgun is ready.

- Esc, Shift, and Ctrl do nothing on the game-over screen. Restarting with Enter always starts a game that is not paused.

- A line of control hints under the canvas lists the keys, including Esc to pause, Shift for the shotgun, and Ctrl for the auto shotgun.

- A High Score panel sits to the right of the canvas, outside it. It shows the label "High Score" and the highest score ever recorded in this browser. It shows 0 when no score has been recorded yet. On a screen too narrow for both, the panel may wrap below the canvas.

- The high score updates live: as soon as the current score is higher than the high score, the panel shows the new score and it is saved. A lower score never lowers it.

- The high score is saved in the browser's local storage, so it is kept when the game restarts and when the page is reloaded or the browser is closed. Restarting with Enter does not reset it. If local storage is not available, the game still works and keeps the high score until the page is closed.

- A Shotgun panel sits directly under the High Score panel, outside the canvas, in the same style. It shows the label "Shotgun" and the word "Ready" when the shotgun can fire. During the cooldown it shows the whole seconds left instead, counting down 10, 9, ... 1, and then "Ready" again. Its countdown stops while the game is paused. On the game-over screen it keeps its last value, and restarting makes it "Ready".

- An Auto Shotgun panel sits directly under the Shotgun panel, outside the canvas, in the same style. It shows the label "Auto Shotgun" and the word "On" or "Off". It always shows, and it changes as soon as Ctrl flips the setting. On the game-over screen it keeps its last value, and restarting makes it "Off".

- No login or account is needed. 



## How it works



- A game loop using requestAnimationFrame. It updates positions, checks collisions, then redraws.

- Collisions are simple rectangle overlap checks. The ship and the purple triangle are drawn as triangles, but each is hit-tested with its rectangle.

- While the game is paused, the game loop keeps running and redrawing but skips the update, so no game time passes.

- Game state (ship, shots, enemies, score, lives, whether the game is paused, the time left on the shotgun cooldown, and whether the auto shotgun is on) is kept in plain JavaScript variables. Each enemy records its kind (square or triangle), and a triangle also records its sideways direction.

- A shotgun pellet is a shot that also moves sideways at a steady speed. A normal shot has no sideways speed and goes straight up.

- The auto shotgun is checked in the game update, right after the cooldown counts down: when auto is on and the shotgun is ready, it fires a blast. Because this is part of the update, a pause stops it too.

- The high score is kept apart from the game state, so restarting does not clear it. It is stored under one local storage key in this browser only; nothing is sent over the network.



