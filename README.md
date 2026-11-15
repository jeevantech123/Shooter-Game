# Shooter-Game

A very simple 2D space shooter that runs in your browser. It needs no download, account, or login, so it suits a short break.

- Move the ship left, right, up, and down with the **arrow keys** or **W / A / S / D**. The ship can go anywhere on the screen but not off it.
- Press **Space** to fire. There is a short delay between shots.
- Press **Shift** for a **shotgun blast**: five shots spread out in a fan. It then needs **10 seconds** to recharge. The **Shotgun** panel under the High Score counts down the seconds and shows **Ready** when you can fire again. Each blast needs a new press of Shift.
- Press **Esc** to pause. Everything stops and the game shows **Paused**. Press **Esc** again to carry on exactly where you left off.
- A new enemy appears at the top about once a second and moves down. Shooting one is worth **10 points**.
- Most enemies are **red squares** that fall straight down. About one in four is a **purple triangle** pointing down. It falls at half the speed but weaves left and right, bouncing off the sides, so it is harder to hit.
- You start with **3 lives**. You lose one when an enemy hits your ship or reaches the bottom.
- At 0 lives the game shows **Game Over** and your final score. Press **Enter** to play again.
- The **High Score** panel to the right of the game shows your best score ever. It goes up as soon as you beat it. It is saved in this browser only (local storage), so it is still there after you restart or reload the page. Nothing is sent anywhere.

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

This runs every `tests/*.test.js` file with Node's built-in test runner. There is one test file per change to the project. `tests/01-initial-build.test.js` covers the first build, `tests/02-round2-move-up-down.test.js` covers Round 2 (R1: up and down movement), `tests/03-round3-high-score.test.js` covers Round 3 (R1: the High Score panel), `tests/04-round4-triangle-enemy.test.js` covers Round 4 (R1: the purple triangle enemy), `tests/05-round5-pause.test.js` covers Round 5 (R1: pausing with Esc), and `tests/06-round6-shotgun.test.js` covers Round 6 (R1: the Shift shotgun blast and its cooldown).
