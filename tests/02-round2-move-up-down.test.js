// Tests for Round 2 of Shooter-Game: R1 changed so the ship moves left, right,
// up, and down (see problem.md and spec.md). Run with: node --test
const test = require("node:test");
const assert = require("node:assert/strict");

const game = require("../game.js");
const { readProjectFile, step, loadGameInFakePage } = require("./helpers.js");

// A new game with enemies kept away so they cannot hit the ship mid-test.
function newGame() {
  const state = game.createGame();
  state.spawnTimer = -100;
  return { state, input: game.createInput() };
}

function near(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 1, `${message}: expected about ${expected}, got ${actual}`);
}

// Put the ship in the middle of the canvas so it has room to move every way.
function centerShip(state) {
  state.ship.x = (game.CANVAS_WIDTH - state.ship.width) / 2;
  state.ship.y = (game.CANVAS_HEIGHT - state.ship.height) / 2;
}

// ---- R1: up and down keys --------------------------------------------------

for (const [code, direction] of [["ArrowUp", -1], ["KeyW", -1], ["ArrowDown", 1], ["KeyS", 1]]) {
  test(`R1: holding ${code} moves the ship ${direction < 0 ? "up" : "down"}`, () => {
    const { state, input } = newGame();
    centerShip(state);
    const startY = state.ship.y;
    assert.equal(game.handleKeyDown(state, input, code), true, `${code} is a game key`);
    step(game, state, input, 0.5);
    near(state.ship.y, startY + direction * game.SHIP_SPEED * 0.5, "ship y");
  });
}

test("R1: up/down moves at the same speed as left/right", () => {
  const { state, input } = newGame();
  centerShip(state);
  const start = { ...state.ship };
  game.handleKeyDown(state, input, "ArrowUp");
  step(game, state, input, 0.25);
  game.handleKeyUp(input, "ArrowUp");
  const upDistance = start.y - state.ship.y;

  centerShip(state);
  game.handleKeyDown(state, input, "ArrowRight");
  step(game, state, input, 0.25);
  const rightDistance = state.ship.x - start.x;
  near(upDistance, rightDistance, "distance moved up vs right");
});

test("R1: releasing an up/down key stops the ship", () => {
  const { state, input } = newGame();
  centerShip(state);
  game.handleKeyDown(state, input, "ArrowUp");
  step(game, state, input, 0.2);
  assert.equal(game.handleKeyUp(input, "ArrowUp"), true);
  const stoppedY = state.ship.y;
  step(game, state, input, 0.5);
  assert.equal(state.ship.y, stoppedY);
});

test("R1: up/down keys do not move the ship sideways, and left/right do not move it up or down", () => {
  const { state, input } = newGame();
  centerShip(state);
  const startX = state.ship.x;
  game.handleKeyDown(state, input, "KeyW");
  step(game, state, input, 0.3);
  game.handleKeyUp(input, "KeyW");
  assert.equal(state.ship.x, startX);

  const startY = state.ship.y;
  game.handleKeyDown(state, input, "KeyA");
  step(game, state, input, 0.3);
  assert.equal(state.ship.y, startY);
});

test("R1: the ship cannot leave the top or bottom of the canvas", () => {
  const { state, input } = newGame();
  game.handleKeyDown(state, input, "ArrowUp");
  step(game, state, input, 5);
  assert.equal(state.ship.y, 0, "ship stops at the top edge");
  game.handleKeyUp(input, "ArrowUp");
  game.handleKeyDown(state, input, "ArrowDown");
  step(game, state, input, 5);
  assert.equal(state.ship.y, game.CANVAS_HEIGHT - state.ship.height, "ship stops at the bottom edge");
});

test("R1: the ship can reach every corner of the canvas but never leaves it", () => {
  const corners = [
    [["ArrowUp", "ArrowLeft"], 0, 0],
    [["ArrowUp", "ArrowRight"], game.CANVAS_WIDTH - game.SHIP_WIDTH, 0],
    [["ArrowDown", "ArrowLeft"], 0, game.CANVAS_HEIGHT - game.SHIP_HEIGHT],
    [["ArrowDown", "ArrowRight"], game.CANVAS_WIDTH - game.SHIP_WIDTH, game.CANVAS_HEIGHT - game.SHIP_HEIGHT],
  ];
  for (const [codes, x, y] of corners) {
    const { state, input } = newGame();
    for (const code of codes) game.handleKeyDown(state, input, code);
    step(game, state, input, 5);
    assert.deepEqual([state.ship.x, state.ship.y], [x, y], codes.join(" + "));
  }
});

test("R1: holding a vertical and a horizontal key moves diagonally at full speed on each axis", () => {
  const { state, input } = newGame();
  centerShip(state);
  const start = { ...state.ship };
  game.handleKeyDown(state, input, "ArrowUp");
  game.handleKeyDown(state, input, "ArrowRight");
  step(game, state, input, 0.2);
  near(state.ship.x, start.x + game.SHIP_SPEED * 0.2, "ship x");
  near(state.ship.y, start.y - game.SHIP_SPEED * 0.2, "ship y");
});

test("R1: holding Up and Down together cancels out", () => {
  const { state, input } = newGame();
  centerShip(state);
  const startY = state.ship.y;
  game.handleKeyDown(state, input, "ArrowUp");
  game.handleKeyDown(state, input, "KeyS");
  step(game, state, input, 0.5);
  assert.equal(state.ship.y, startY);
});

// ---- R1 together with the other requirements -------------------------------

test("R1/R2: after moving up, shots start from the ship's new position and still travel upward", () => {
  const { state, input } = newGame();
  game.handleKeyDown(state, input, "ArrowUp");
  step(game, state, input, 0.5);
  game.handleKeyUp(input, "ArrowUp");
  game.handleKeyDown(state, input, "Space");
  game.updateGame(state, input, 0);
  const shot = state.shots[0];
  assert.equal(shot.y, state.ship.y - shot.height, "shot starts just above the moved ship");
  const startY = shot.y;
  game.handleKeyUp(input, "Space");
  game.updateGame(state, input, 0.1);
  assert.ok(state.shots[0].y < startY, "shot moves up");
});

test("R1/R6: an enemy touching the ship after it has moved up still costs one life", () => {
  const { state, input } = newGame();
  centerShip(state);
  state.enemies.push({ x: state.ship.x, y: state.ship.y - 5, width: game.ENEMY_SIZE, height: game.ENEMY_SIZE });
  game.updateGame(state, input, 0);
  assert.equal(state.enemies.length, 0);
  assert.equal(state.lives, 2);
});

test("R1/R6: an enemy that passes below a raised ship still costs a life at the bottom", () => {
  const { state, input } = newGame();
  state.ship.y = 100;
  state.enemies.push({ x: state.ship.x, y: game.CANVAS_HEIGHT - game.ENEMY_SIZE - 1, width: game.ENEMY_SIZE, height: game.ENEMY_SIZE });
  game.updateGame(state, input, 0.1);
  assert.equal(state.enemies.length, 0);
  assert.equal(state.lives, 2);
});

test("R1/R7: the ship does not move up or down after game over", () => {
  const { state, input } = newGame();
  state.lives = 0;
  state.isOver = true;
  const shipY = state.ship.y;
  game.handleKeyDown(state, input, "ArrowUp");
  step(game, state, input, 1);
  assert.equal(state.ship.y, shipY);
});

test("R1/R8: restarting puts the ship back at its starting position", () => {
  const { state, input } = newGame();
  game.handleKeyDown(state, input, "ArrowUp");
  game.handleKeyDown(state, input, "ArrowLeft");
  step(game, state, input, 1);
  game.handleKeyUp(input, "ArrowUp");
  game.handleKeyUp(input, "ArrowLeft");
  state.lives = 0;
  state.isOver = true;
  game.handleKeyDown(state, input, "Enter");
  assert.deepEqual(state.ship, game.createGame().ship);
});

// ---- R1 in the page --------------------------------------------------------

test("R1/page: up and down keys stop the page from scrolling", () => {
  const page = loadGameInFakePage();
  for (const code of ["ArrowUp", "ArrowDown", "KeyW", "KeyS"]) {
    assert.equal(page.press(code).defaultPrevented, true, `${code} keydown`);
    assert.equal(page.release(code).defaultPrevented, true, `${code} keyup`);
  }
});

test("R1/page: holding the up arrow moves the drawn ship to the top edge", () => {
  const page = loadGameInFakePage();
  page.press("ArrowUp");
  page.runFor(3);
  const nose = page.fake.calls.find((c) => c.name === "moveTo");
  assert.equal(nose.args[1], 0, "ship's nose should be at the top edge");
});

test("R1/page: the control hint under the canvas mentions up/down movement", () => {
  const html = readProjectFile("index.html");
  const hint = html.match(/<p class="controls">(.*)<\/p>/);
  assert.ok(hint, "control hint line exists");
  assert.match(hint[1], /&uarr;|↑/);
  assert.match(hint[1], /&darr;|↓/);
  assert.match(hint[1], /W A S D/);
});
