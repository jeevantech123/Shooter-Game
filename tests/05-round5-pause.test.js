// Tests for Round 5 of Shooter-Game: R1 lets the player press Esc to pause and
// un-pause the game (see problem.md and spec.md). While paused nothing in the
// game moves or counts down, the game is dimmed with "Paused" and
// "Press Esc to resume", and play then continues exactly where it stopped.
// Esc does nothing on the game-over screen, and the game never pauses by itself.
// Run with: node --test
const test = require("node:test");
const assert = require("node:assert/strict");

const game = require("../game.js");
const { step, readProjectFile, createFakeContext, loadGameInFakePage } = require("./helpers.js");

function newGame() {
  return { state: game.createGame(), input: game.createInput() };
}

function triangleAt(x, y, direction) {
  return { type: "triangle", x, y, width: game.ENEMY_SIZE, height: game.ENEMY_SIZE, direction };
}

// A game in the middle of play: shots in flight, enemies falling, timers running.
function gameInPlay() {
  const { state, input } = newGame();
  game.handleKeyDown(state, input, "Space");
  game.handleKeyDown(state, input, "ArrowLeft");
  step(game, state, input, 1.2);
  state.enemies.push(triangleAt(100, 100, 1));
  assert.ok(state.shots.length > 0 && state.enemies.length > 0, "setup: game is busy");
  assert.ok(state.shotTimer > 0 && state.spawnTimer > 0, "setup: timers are running");
  return { state, input };
}

const isOverlay = (c) =>
  c.name === "fillRect" &&
  c.args.join() === [0, 0, game.CANVAS_WIDTH, game.CANVAS_HEIGHT].join() &&
  c.fillStyle !== game.COLORS.background;

// ---- R1: Esc toggles pause ---------------------------------------------------

test("R1: a new game is not paused", () => {
  assert.equal(game.createGame().isPaused, false);
});

test("R1: Esc during play pauses the game, and Esc again un-pauses it", () => {
  const { state, input } = newGame();
  assert.equal(game.handleKeyDown(state, input, "Escape"), true, "Esc is a game key");
  assert.equal(state.isPaused, true);
  assert.equal(game.handleKeyDown(state, input, "Escape"), true);
  assert.equal(state.isPaused, false);
});

test("R1: holding Esc down (key repeat) does not flip the pause on and off", () => {
  const { state, input } = newGame();
  game.handleKeyDown(state, input, "Escape");
  game.handleKeyDown(state, input, "Escape", true);
  game.handleKeyDown(state, input, "Escape", true);
  assert.equal(state.isPaused, true, "repeats are ignored");
  game.handleKeyUp(input, "Escape");
  game.handleKeyDown(state, input, "Escape");
  assert.equal(state.isPaused, false, "a fresh press un-pauses");
});

// ---- R1: what stops while paused ---------------------------------------------

test("R1: while paused nothing in the game moves, spawns, scores, or counts down", () => {
  const { state, input } = gameInPlay();
  game.handleKeyDown(state, input, "Escape");
  const frozen = structuredClone(state);
  step(game, state, input, 5); // ArrowLeft and Space are still held
  assert.deepEqual(state, frozen);
});

test("R1: after un-pausing, play continues exactly where it stopped", () => {
  const paused = newGame();
  const unpaused = newGame();
  for (const { state, input } of [paused, unpaused]) {
    game.handleKeyDown(state, input, "ArrowRight");
    game.handleKeyDown(state, input, "Space");
  }
  step(game, paused.state, paused.input, 1);
  game.handleKeyDown(paused.state, paused.input, "Escape");
  step(game, paused.state, paused.input, 3);
  game.handleKeyDown(paused.state, paused.input, "Escape");
  step(game, paused.state, paused.input, 1);

  step(game, unpaused.state, unpaused.input, 1);
  step(game, unpaused.state, unpaused.input, 1);

  assert.deepEqual(paused.state, unpaused.state, "the 3 paused seconds left no trace");
});

test("R1: move and fire keys do nothing while paused", () => {
  const { state, input } = newGame();
  game.handleKeyDown(state, input, "Escape");
  const startX = state.ship.x;
  const startY = state.ship.y;
  for (const code of ["ArrowLeft", "ArrowUp", "Space"]) game.handleKeyDown(state, input, code);
  step(game, state, input, 1);
  assert.equal(state.ship.x, startX);
  assert.equal(state.ship.y, startY);
  assert.equal(state.shots.length, 0);
});

test("R1: a key still held when the game un-pauses works as normal", () => {
  const { state, input } = newGame();
  game.handleKeyDown(state, input, "Escape");
  game.handleKeyDown(state, input, "ArrowLeft"); // pressed while paused, still held
  game.handleKeyDown(state, input, "Escape");
  const startX = state.ship.x;
  step(game, state, input, 0.5);
  assert.ok(state.ship.x < startX, "the ship moves left once play resumes");
});

test("R1: a key released while paused stays released after un-pausing", () => {
  const { state, input } = newGame();
  game.handleKeyDown(state, input, "ArrowRight");
  game.handleKeyDown(state, input, "Escape");
  game.handleKeyUp(input, "ArrowRight");
  game.handleKeyDown(state, input, "Escape");
  const startX = state.ship.x;
  step(game, state, input, 0.5);
  assert.equal(state.ship.x, startX);
});

// ---- R1 with Game Over and restart (R7, R8) ----------------------------------

test("R1/R7: Esc does nothing on the game-over screen", () => {
  const { state, input } = newGame();
  state.lives = 0;
  state.isOver = true;
  game.handleKeyDown(state, input, "Escape");
  assert.equal(state.isPaused, false);
  assert.equal(state.isOver, true);
  const fake = createFakeContext();
  game.drawGame(fake.ctx, state);
  assert.ok(!fake.texts().includes("Paused"));
  assert.ok(fake.texts().includes("Game Over"));
});

test("R1/R8: Enter while paused does not restart or un-pause", () => {
  const { state, input } = newGame();
  state.score = 50;
  game.handleKeyDown(state, input, "Escape");
  game.handleKeyDown(state, input, "Enter");
  assert.equal(state.isPaused, true);
  assert.equal(state.score, 50);
});

test("R1/R8: restarting always gives a game that is not paused", () => {
  const { state } = newGame();
  state.isPaused = true;
  game.resetGame(state);
  assert.equal(state.isPaused, false);
  assert.deepEqual(state, game.createGame());
});

// ---- R1: the paused screen ---------------------------------------------------

test("R1: while paused the game is dimmed and shows 'Paused' and 'Press Esc to resume'", () => {
  const { state, input } = gameInPlay();
  state.score = 70;
  game.handleKeyDown(state, input, "Escape");
  const fake = createFakeContext();
  game.drawGame(fake.ctx, state);
  const texts = fake.texts();
  assert.ok(texts.includes("Paused"));
  assert.ok(texts.includes("Press Esc to resume"));

  const overlay = fake.calls.findIndex(isOverlay);
  assert.ok(overlay !== -1, "a dim layer covers the whole canvas");
  const shipNose = fake.calls.findIndex((c) => c.name === "moveTo" && c.fillStyle === game.COLORS.ship);
  assert.ok(shipNose !== -1 && shipNose < overlay, "the game is still drawn, under the dim layer");
  const hud = fake.calls.findIndex((c) => c.name === "fillText" && c.args[0] === "Score: 70   Lives: 3");
  assert.ok(hud > overlay, "score and lives are drawn on top, so they stay readable");
});

test("R1: 'Paused' and the dim layer are not shown during normal play", () => {
  const fake = createFakeContext();
  game.drawGame(fake.ctx, game.createGame());
  assert.ok(!fake.texts().includes("Paused"));
  assert.ok(!fake.texts().includes("Press Esc to resume"));
  assert.equal(fake.calls.filter(isOverlay).length, 0);
});

// ---- R1 in the page -----------------------------------------------------------

// The y of the one red square drawn in the latest frame.
function squareY(page) {
  const rects = page.fake.rectsWithColor(game.COLORS.enemy);
  assert.equal(rects.length, 1, "one red square on screen");
  return rects[0].args[1];
}

test("R1/page: Esc pauses the running game, and it resumes with no jump", () => {
  const page = loadGameInFakePage({ random: () => 0.5 }); // red squares only
  page.runFor(1.5);
  const before = squareY(page);

  assert.equal(page.press("Escape").defaultPrevented, true, "Esc is handled by the game");
  page.release("Escape");
  page.runFor(5);
  assert.equal(squareY(page), before, "the enemy did not move while paused");
  assert.ok(page.fake.texts().includes("Paused"));
  assert.ok(page.hasPendingFrame(), "the loop keeps running while paused");

  page.press("Escape");
  page.frame();
  const moved = squareY(page) - before;
  assert.ok(moved > 0, "moving again");
  assert.ok(moved <= game.ENEMY_SPEED / 60 + 1e-9, `one frame of movement, not a jump (moved ${moved})`);
  assert.ok(!page.fake.texts().includes("Paused"));
});

test("R1/page: a held-down Esc that repeats does not un-pause", () => {
  const page = loadGameInFakePage({ random: () => 0.5 });
  page.frame();
  page.press("Escape");
  page.press("Escape", { repeat: true });
  page.press("Escape", { repeat: true });
  page.frame();
  assert.ok(page.fake.texts().includes("Paused"));
});

test("R1/page: the game does not pause by itself, only on Esc", () => {
  const page = loadGameInFakePage({ random: () => 0.5 });
  assert.deepEqual(Object.keys(page.listeners).sort(), ["keydown", "keyup"], "no blur or focus listeners");
  page.runFor(2);
  assert.ok(!page.fake.texts().includes("Paused"));
});

test("R1/page: the control hint under the canvas lists Esc to pause", () => {
  const html = readProjectFile("index.html");
  const hint = html.match(/<p class="controls">(.*)<\/p>/);
  assert.ok(hint, "control hint line exists");
  assert.match(hint[1], /Pause: Esc/);
  assert.match(hint[1], /Restart: Enter/, "the older hints are kept");
});
