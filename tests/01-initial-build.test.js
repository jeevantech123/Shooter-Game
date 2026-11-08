// Tests for the first build of Shooter-Game (requirements R1-R9 in problem.md
// and the behavior in spec.md). Run with: node --test
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const game = require("../game.js");
const { ROOT, readProjectFile, step, createFakeContext, loadGameInFakePage } = require("./helpers.js");

function newGame() {
  return { state: game.createGame(), input: game.createInput() };
}

function enemyAt(x, y) {
  return { x, y, width: game.ENEMY_SIZE, height: game.ENEMY_SIZE };
}

function shotAt(x, y) {
  return { x, y, width: game.SHOT_WIDTH, height: game.SHOT_HEIGHT };
}

// ---- R1: ship moves left and right with the keyboard ------------------------

test("R1: canvas is 480x640 and the ship starts centered near the bottom", () => {
  const { state } = newGame();
  assert.equal(game.CANVAS_WIDTH, 480);
  assert.equal(game.CANVAS_HEIGHT, 640);
  assert.equal(state.ship.x + state.ship.width / 2, game.CANVAS_WIDTH / 2);
  assert.ok(state.ship.y > game.CANVAS_HEIGHT * 0.8, "ship should be near the bottom");
  assert.ok(state.ship.y + state.ship.height <= game.CANVAS_HEIGHT, "ship should be on screen");
});

for (const [code, direction] of [["ArrowLeft", -1], ["KeyA", -1], ["ArrowRight", 1], ["KeyD", 1]]) {
  test(`R1: holding ${code} moves the ship ${direction < 0 ? "left" : "right"}`, () => {
    const { state, input } = newGame();
    const startX = state.ship.x;
    assert.equal(game.handleKeyDown(state, input, code), true);
    step(game, state, input, 0.5);
    const expected = startX + direction * game.SHIP_SPEED * 0.5;
    assert.ok(Math.abs(state.ship.x - expected) < 1, `expected x near ${expected}, got ${state.ship.x}`);
  });
}

test("R1: releasing the key stops the ship", () => {
  const { state, input } = newGame();
  game.handleKeyDown(state, input, "ArrowRight");
  step(game, state, input, 0.2);
  game.handleKeyUp(input, "ArrowRight");
  const stoppedX = state.ship.x;
  step(game, state, input, 0.5);
  assert.equal(state.ship.x, stoppedX);
});

test("R1: the ship cannot leave the canvas on either side", () => {
  const { state, input } = newGame();
  game.handleKeyDown(state, input, "ArrowLeft");
  step(game, state, input, 5);
  assert.equal(state.ship.x, 0);
  game.handleKeyUp(input, "ArrowLeft");
  game.handleKeyDown(state, input, "ArrowRight");
  step(game, state, input, 5);
  assert.equal(state.ship.x, game.CANVAS_WIDTH - state.ship.width);
});

// ---- R2: firing shots --------------------------------------------------------

test("R2: Space fires a shot from the ship that travels upward", () => {
  const { state, input } = newGame();
  assert.equal(game.handleKeyDown(state, input, "Space"), true);
  game.updateGame(state, input, 0);
  assert.equal(state.shots.length, 1);
  const shot = state.shots[0];
  assert.ok(shot.y < state.ship.y, "shot should start above the ship");
  assert.equal(shot.x + shot.width / 2, state.ship.x + state.ship.width / 2);
  const startY = shot.y;
  game.handleKeyUp(input, "Space");
  game.updateGame(state, input, 0.1);
  assert.ok(state.shots[0].y < startY, "shot should move up");
});

test("R2: there is a short delay between shots", () => {
  const { state, input } = newGame();
  game.handleKeyDown(state, input, "Space");
  game.updateGame(state, input, 0);
  game.updateGame(state, input, game.SHOT_DELAY / 2);
  assert.equal(state.shots.length, 1, "no second shot before the delay is over");
  game.updateGame(state, input, game.SHOT_DELAY / 2 + 0.001);
  assert.equal(state.shots.length, 2, "a second shot after the delay");
});

test("R2: holding Space cannot fire every frame", () => {
  const { state, input } = newGame();
  game.handleKeyDown(state, input, "Space");
  let fired = 0;
  for (let i = 0; i < 60; i++) {
    const before = state.shots.length;
    game.updateGame(state, input, 1 / 60, () => 0.5);
    if (state.shots.length > before) fired++;
  }
  assert.ok(fired <= Math.ceil(1 / game.SHOT_DELAY) + 1, `fired ${fired} shots in one second`);
  assert.ok(fired >= 2, "holding Space should still fire repeatedly after the delay");
});

test("R2: shots are removed after leaving the top of the canvas", () => {
  const { state, input } = newGame();
  game.handleKeyDown(state, input, "Space");
  game.updateGame(state, input, 0);
  game.handleKeyUp(input, "Space");
  state.spawnTimer = -100; // keep enemies out of the way
  step(game, state, input, 2);
  assert.equal(state.shots.length, 0);
});

// ---- R3: enemies appear and move toward the player --------------------------

test("R3: no enemy at the start, one appears after about a second", () => {
  const { state, input } = newGame();
  step(game, state, input, 0.9);
  assert.equal(state.enemies.length, 0);
  step(game, state, input, 0.15);
  assert.equal(state.enemies.length, 1);
});

test("R3: a new enemy appears about once a second", () => {
  const { state, input } = newGame();
  step(game, state, input, 5.05);
  assert.equal(state.enemies.length, 5);
});

test("R3: enemies appear at a random x position at the top", () => {
  for (const r of [0, 0.25, 0.999]) {
    const { state, input } = newGame();
    game.updateGame(state, input, game.ENEMY_SPAWN_DELAY, () => r);
    const enemy = state.enemies[0];
    assert.ok(Math.abs(enemy.x - r * (game.CANVAS_WIDTH - game.ENEMY_SIZE)) < 1e-9);
    assert.ok(enemy.x >= 0 && enemy.x + enemy.width <= game.CANVAS_WIDTH, "enemy fully inside horizontally");
    assert.ok(enemy.y <= 0, "enemy starts at the top");
  }
});

test("R3: enemies move downward", () => {
  const { state, input } = newGame();
  state.enemies.push(enemyAt(10, 100));
  game.updateGame(state, input, 0.5);
  assert.equal(state.enemies[0].y, 100 + game.ENEMY_SPEED * 0.5);
});

// ---- R4: shots destroy enemies and add score --------------------------------

test("R4: a shot overlapping an enemy removes both and adds 10 points", () => {
  const { state, input } = newGame();
  state.enemies.push(enemyAt(100, 200));
  state.shots.push(shotAt(110, 210));
  game.updateGame(state, input, 0);
  assert.equal(state.enemies.length, 0);
  assert.equal(state.shots.length, 0);
  assert.equal(state.score, 10);
  assert.equal(game.POINTS_PER_ENEMY, 10);
});

test("R4: a shot that misses changes nothing", () => {
  const { state, input } = newGame();
  state.enemies.push(enemyAt(100, 200));
  state.shots.push(shotAt(300, 210));
  game.updateGame(state, input, 0);
  assert.equal(state.enemies.length, 1);
  assert.equal(state.shots.length, 1);
  assert.equal(state.score, 0);
});

test("R4: one shot destroys only one enemy", () => {
  const { state, input } = newGame();
  state.enemies.push(enemyAt(100, 200), enemyAt(100, 200));
  state.shots.push(shotAt(110, 210));
  game.updateGame(state, input, 0);
  assert.equal(state.enemies.length, 1);
  assert.equal(state.score, 10);
});

test("R4: a fired shot flies up and destroys an enemy above the ship", () => {
  const { state, input } = newGame();
  const ship = state.ship;
  state.spawnTimer = -100;
  state.enemies.push(enemyAt(ship.x + (ship.width - game.ENEMY_SIZE) / 2, 200));
  game.handleKeyDown(state, input, "Space");
  game.updateGame(state, input, 0);
  game.handleKeyUp(input, "Space");
  step(game, state, input, 1);
  assert.equal(state.enemies.length, 0);
  assert.equal(state.score, 10);
});

test("rectangle overlap check", () => {
  const a = { x: 0, y: 0, width: 10, height: 10 };
  assert.equal(game.rectsOverlap(a, { x: 5, y: 5, width: 10, height: 10 }), true);
  assert.equal(game.rectsOverlap(a, { x: 20, y: 0, width: 10, height: 10 }), false);
  assert.equal(game.rectsOverlap(a, { x: 0, y: 20, width: 10, height: 10 }), false);
});

// ---- R5: score is visible ----------------------------------------------------

test("R5: score and lives are drawn in the top-left corner", () => {
  const { state } = newGame();
  state.score = 30;
  const fake = createFakeContext();
  game.drawGame(fake.ctx, state);
  const hud = fake.calls.find((c) => c.name === "fillText" && c.args[0].startsWith("Score"));
  assert.ok(hud, "score text should be drawn");
  assert.equal(hud.args[0], "Score: 30   Lives: 3");
  assert.ok(hud.args[1] < 50 && hud.args[2] < 50, "text should be in the top-left corner");
});

// ---- R6: losing lives --------------------------------------------------------

test("R6: an enemy touching the ship is removed and costs one life", () => {
  const { state, input } = newGame();
  state.enemies.push(enemyAt(state.ship.x, state.ship.y - 5));
  game.updateGame(state, input, 0);
  assert.equal(state.enemies.length, 0);
  assert.equal(state.lives, 2);
  assert.equal(state.score, 0);
});

test("R6: an enemy reaching the bottom is removed and costs one life", () => {
  const { state, input } = newGame();
  state.enemies.push(enemyAt(0, game.CANVAS_HEIGHT - game.ENEMY_SIZE - 1)); // far from the ship
  game.updateGame(state, input, 0.1);
  assert.equal(state.enemies.length, 0);
  assert.equal(state.lives, 2);
});

test("R6: the player starts with 3 lives", () => {
  assert.equal(game.STARTING_LIVES, 3);
  assert.equal(game.createGame().lives, 3);
});

// ---- R7: game over -----------------------------------------------------------

test("R7: the game stops when lives reach 0", () => {
  const { state, input } = newGame();
  state.score = 40;
  state.lives = 1;
  state.enemies.push(enemyAt(0, game.CANVAS_HEIGHT));
  game.updateGame(state, input, 0);
  assert.equal(state.lives, 0);
  assert.equal(state.isOver, true);

  // Nothing moves, spawns or scores after game over.
  const shipX = state.ship.x;
  game.handleKeyDown(state, input, "ArrowLeft");
  game.handleKeyDown(state, input, "Space");
  step(game, state, input, 3);
  assert.equal(state.ship.x, shipX);
  assert.equal(state.enemies.length, 0);
  assert.equal(state.shots.length, 0);
  assert.equal(state.score, 40);
});

test("R7: lives never go below 0 when several enemies hit at once", () => {
  const { state, input } = newGame();
  state.lives = 1;
  state.enemies.push(enemyAt(0, game.CANVAS_HEIGHT), enemyAt(100, game.CANVAS_HEIGHT));
  game.updateGame(state, input, 0);
  assert.equal(state.lives, 0);
  assert.equal(state.isOver, true);
});

test("R7: the game-over screen shows 'Game Over' and the final score", () => {
  const { state } = newGame();
  state.score = 120;
  state.lives = 0;
  state.isOver = true;
  const fake = createFakeContext();
  game.drawGame(fake.ctx, state);
  const texts = fake.texts();
  assert.ok(texts.includes("Game Over"));
  assert.ok(texts.some((t) => t.includes("120") && /final score/i.test(t)));
});

test("R7: 'Game Over' is not shown during play", () => {
  const fake = createFakeContext();
  game.drawGame(fake.ctx, game.createGame());
  assert.ok(!fake.texts().includes("Game Over"));
});

// ---- R8: restart -------------------------------------------------------------

test("R8: Enter on the game-over screen resets score and lives and starts again", () => {
  const { state, input } = newGame();
  state.score = 90;
  state.lives = 0;
  state.isOver = true;
  state.enemies.push(enemyAt(10, 10));
  state.shots.push(shotAt(10, 10));
  state.ship.x = 0;
  assert.equal(game.handleKeyDown(state, input, "Enter"), true);
  assert.equal(state.isOver, false);
  assert.equal(state.score, 0);
  assert.equal(state.lives, 3);
  assert.equal(state.enemies.length, 0);
  assert.equal(state.shots.length, 0);
  assert.deepEqual(state, game.createGame());
});

test("R8: Enter during play does nothing", () => {
  const { state, input } = newGame();
  state.score = 50;
  state.lives = 2;
  game.handleKeyDown(state, input, "Enter");
  assert.equal(state.score, 50);
  assert.equal(state.lives, 2);
});

test("R8: a restarted game plays normally", () => {
  const { state, input } = newGame();
  state.lives = 0;
  state.isOver = true;
  game.handleKeyDown(state, input, "Enter");
  game.handleKeyDown(state, input, "ArrowLeft");
  step(game, state, input, 1.05);
  assert.ok(state.ship.x < game.createGame().ship.x, "ship moves after restart");
  assert.equal(state.enemies.length, 1, "enemies spawn after restart");
});

// ---- Browser wiring (game.js loaded as a page script) -----------------------

test("page: game starts on load and draws score and lives", () => {
  const page = loadGameInFakePage();
  assert.ok(page.hasPendingFrame(), "a requestAnimationFrame loop should be running");
  page.frame();
  assert.ok(page.fake.texts().includes("Score: 0   Lives: 3"));
  assert.ok(page.hasPendingFrame(), "the loop keeps going");
});

test("page: game keys stop the page from scrolling; other keys do not", () => {
  const page = loadGameInFakePage();
  for (const code of ["ArrowLeft", "ArrowRight", "KeyA", "KeyD", "Space", "Enter"]) {
    assert.equal(page.press(code).defaultPrevented, true, `${code} keydown`);
  }
  assert.equal(page.release("Space").defaultPrevented, true);
  assert.equal(page.press("KeyQ").defaultPrevented, false);
});

test("page: holding the left arrow moves the drawn ship to the left edge", () => {
  const page = loadGameInFakePage();
  page.press("ArrowLeft");
  page.runFor(3);
  const nose = page.fake.calls.find((c) => c.name === "moveTo");
  assert.equal(nose.args[0], game.SHIP_WIDTH / 2, "ship's nose should be at the left edge");
});

test("page: a long pause between frames is capped (no burst of enemies)", () => {
  const page = loadGameInFakePage();
  page.frame();
  page.frame(5000);
  assert.equal(page.fake.rectsWithColor("#ff4f6a").length, 0, "no enemy after a capped 0.1s step");
});

test("page: full round - lose all lives, see Game Over, press Enter to restart", () => {
  const page = loadGameInFakePage();
  page.runFor(20); // no input: every enemy reaches the ship or the bottom
  assert.ok(page.fake.texts().includes("Game Over"));
  assert.ok(page.fake.texts().includes("Final score: 0"));
  assert.ok(page.fake.texts().includes("Score: 0   Lives: 0"));

  page.press("Enter");
  page.frame();
  assert.ok(!page.fake.texts().includes("Game Over"));
  assert.ok(page.fake.texts().includes("Score: 0   Lives: 3"));
});

// ---- R9 and project rules ----------------------------------------------------

test("R9/rules: index.html has a 480x640 canvas and loads style.css and game.js", () => {
  const html = readProjectFile("index.html");
  assert.match(html, /<canvas[^>]*id="game"[^>]*width="480"[^>]*height="640"/);
  assert.match(html, /<link[^>]*href="style\.css"/);
  assert.match(html, /<script[^>]*src="game\.js"/);
});

test("R9/rules: no login, no network calls to other sites", () => {
  for (const file of ["index.html", "style.css", "game.js"]) {
    const text = readProjectFile(file);
    assert.doesNotMatch(text, /https?:\/\//, `${file} should not reference other sites`);
    assert.doesNotMatch(text, /\b(fetch|XMLHttpRequest|WebSocket)\b/, `${file} should not make network calls`);
    assert.doesNotMatch(text, /<input|password|login/i, `${file} should not ask for a login`);
  }
});

test("rules: no image or sound files in the project", () => {
  const mediaPattern = /\.(png|jpe?g|gif|bmp|svg|webp|ico|mp3|wav|ogg|m4a|flac)$/i;
  const found = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (mediaPattern.test(entry.name)) found.push(full);
    }
  })(ROOT);
  assert.deepEqual(found, []);
});
