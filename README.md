# Shooter-Game

A very simple 2D space shooter that runs in your browser. It needs no download, account, or login, so it suits a short break.

- Move the ship left, right, up, and down with the **arrow keys** or **W / A / S / D**. The ship can go anywhere on the screen but not off it.
- Press **Space** to fire. There is a short delay between shots.
- A new enemy appears at the top about once a second and moves down. Shooting one is worth **10 points**.
- You start with **3 lives**. You lose one when an enemy hits your ship or reaches the bottom.
- At 0 lives the game shows **Game Over** and your final score. Press **Enter** to play again.

Everything is drawn with canvas shapes using plain HTML, CSS, and JavaScript (`index.html`, `style.css`, `game.js`).

## Run the game

From the project folder:

```
py -m http.server 8000
```

Then open http://localhost:8000 in a browser.

## Run the tests

From the project folder (needs Node.js 18 or newer; nothing to install):

```
node --test
```

This runs every `tests/*.test.js` file with Node's built-in test runner. There is one test file per change to the project. `tests/01-initial-build.test.js` covers the first build, and `tests/02-round2-move-up-down.test.js` covers Round 2 (R1: up and down movement).
