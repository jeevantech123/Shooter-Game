// Tests for Round 4 of Shooter-Game: R12 adds a new enemy, a purple triangle
// that points down, falls at half the red square's speed, and moves left and
// right, turning around at the canvas edges (see problem.md and spec.md).
// About one new enemy in four is a triangle; it scores and costs lives like a square.
// Run with: node --test
const test = require("node:test");
const assert = require("node:assert/strict");

const game = require("../game.js");
const { step, createFakeContext, loadGameInFakePage } = require("./helpers.js");

const MAX_X = game.CANVAS_WIDTH - game.ENEMY_SIZE;

function newGame() {
  const state = game.createGame();
  state.spawnTimer = -100; // no new enemies unless a test wants them
  return { state, input: game.createInput() };
}

function triangleAt(x, y, direction) {
  return { type: "triangle", x, y, width: game.ENEMY_SIZE, height: game.ENEMY_SIZE, direction };
}

function squareAt(x, y) {
  return { type: "square", x, y, width: game.ENEMY_SIZE, height: game.ENEMY_SIZE };
}

// A `random` that returns the given values in order, then repeats the last one.
function sequence(...values) {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

// A small repeatable pseudo-random generator, for tests over many spawns.
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

// ---- R12: speed and the spawn mix -------------------------------------------

test("R12: a purple triangle falls at half the speed of a red square", () => {
  assert.equal(game.TRIANGLE_FALL_SPEED, game.ENEMY_SPEED / 2);
  assert.equal(game.TRIANGLE_FALL_SPEED, 50);
  assert.ok(game.TRIANGLE_SIDE_SPEED > 0, "it has a sideways speed");
});

test("R12: a new enemy is a triangle when the kind roll is below TRIANGLE_CHANCE", () => {
  assert.equal(game.TRIANGLE_CHANCE, 0.25, "about one time in four");
  // random() is used for x, then the kind, then (triangles only) the direction.
  const left = game.createEnemy(sequence(0.5, 0.1, 0.2));
  assert.equal(left.type, "triangle");
  assert.equal(left.direction, -1);
  assert.equal(left.x, 0.5 * MAX_X, "x is placed the same way as before");
  assert.equal(left.y, -game.ENEMY_SIZE, "starts just above the top");
  assert.equal(left.width, game.ENEMY_SIZE, "same size as a square");
  assert.equal(left.height, game.ENEMY_SIZE);

  const right = game.createEnemy(sequence(0.5, 0.1, 0.9));
  assert.equal(right.type, "triangle");
  assert.equal(right.direction, 1);

  const square = game.createEnemy(sequence(0.5, 0.25));
  assert.equal(square.type, "square");
  assert.equal(game.createEnemy(() => 0.5).type, "square");
});

test("R12: about one new enemy in four is a purple triangle", () => {
  const random = seededRandom(42);
  let triangles = 0;
  const total = 2000;
  for (let i = 0; i < total; i++) if (game.createEnemy(random).type === "triangle") triangles++;
  const share = triangles / total;
  assert.ok(share > 0.2 && share < 0.3, `triangle share was ${share}`);
});

test("R12/R3: triangles do not add extra spawns, still about one enemy a second", () => {
  const state = game.createGame();
  step(game, state, game.createInput(), 5.05, () => 0); // every roll makes a triangle
  assert.equal(state.enemies.length, 5);
  assert.ok(state.enemies.every((enemy) => enemy.type === "triangle"));
});

// ---- R12: movement ------------------------------------------------------------

test("R12: a triangle moves down at half speed and sideways at the same time", () => {
  const { state, input } = newGame();
  state.enemies.push(triangleAt(200, 100, 1), triangleAt(200, 100, -1));
  game.updateGame(state, input, 0.5);
  const [right, left] = state.enemies;
  assert.equal(right.y, 100 + game.TRIANGLE_FALL_SPEED * 0.5);
  assert.equal(right.x, 200 + game.TRIANGLE_SIDE_SPEED * 0.5);
  assert.equal(left.y, 100 + game.TRIANGLE_FALL_SPEED * 0.5);
  assert.equal(left.x, 200 - game.TRIANGLE_SIDE_SPEED * 0.5);
});

test("R12: a red square still falls straight down at full speed", () => {
  const { state, input } = newGame();
  state.enemies.push(squareAt(200, 100));
  game.updateGame(state, input, 0.5);
  assert.equal(state.enemies[0].x, 200);
  assert.equal(state.enemies[0].y, 100 + game.ENEMY_SPEED * 0.5);
});

test("R12: a triangle turns around at the right edge without leaving the canvas", () => {
  const { state, input } = newGame();
  state.enemies.push(triangleAt(MAX_X - 5, 50, 1));
  game.updateGame(state, input, 0.1);
  const enemy = state.enemies[0];
  assert.equal(enemy.x, MAX_X, "stops at the edge");
  assert.equal(enemy.direction, -1, "now heading left");
  game.updateGame(state, input, 0.1);
  assert.ok(enemy.x < MAX_X, "moves back to the left");
});

test("R12: a triangle turns around at the left edge without leaving the canvas", () => {
  const { state, input } = newGame();
  state.enemies.push(triangleAt(5, 50, -1));
  game.updateGame(state, input, 0.1);
  const enemy = state.enemies[0];
  assert.equal(enemy.x, 0, "stops at the edge");
  assert.equal(enemy.direction, 1, "now heading right");
  game.updateGame(state, input, 0.1);
  assert.ok(enemy.x > 0, "moves back to the right");
});

test("R12: over a long game, every enemy stays inside the canvas sideways", () => {
  const state = game.createGame();
  const input = game.createInput();
  const random = seededRandom(7);
  let triangleSeen = false;
  for (let i = 0; i < 60 * 30 && !state.isOver; i++) {
    game.updateGame(state, input, 1 / 60, random);
    for (const enemy of state.enemies) {
      if (enemy.type === "triangle") triangleSeen = true;
      assert.ok(enemy.x >= 0 && enemy.x <= MAX_X, `enemy x ${enemy.x} out of bounds`);
    }
  }
  assert.ok(triangleSeen, "the run should include triangles");
});

// ---- R12 with the existing rules (R4, R6, R8) ---------------------------------

test("R12/R4: shooting a triangle removes it and scores 10, like a square", () => {
  const { state, input } = newGame();
  const ship = state.ship;
  // Close above the ship, so the shot reaches it before it drifts sideways.
  state.enemies.push(triangleAt(ship.x + (ship.width - game.ENEMY_SIZE) / 2, ship.y - 60, 1));
  game.handleKeyDown(state, input, "Space"); // held while the game runs, so a shot fires
  step(game, state, input, 0.2);
  assert.equal(state.enemies.length, 0);
  assert.equal(state.score, game.POINTS_PER_ENEMY);
});

test("R12/R6: a triangle that touches the ship costs one life", () => {
  const { state, input } = newGame();
  state.enemies.push(triangleAt(state.ship.x, state.ship.y - 5, 1));
  game.updateGame(state, input, 1 / 60);
  assert.equal(state.enemies.length, 0);
  assert.equal(state.lives, game.STARTING_LIVES - 1);
});

test("R12/R6: a triangle that reaches the bottom costs one life", () => {
  const { state, input } = newGame();
  state.ship.x = 0; // out of the triangle's way
  state.enemies.push(triangleAt(300, game.CANVAS_HEIGHT - game.ENEMY_SIZE - 1, 1));
  game.updateGame(state, input, 0.1);
  assert.equal(state.enemies.length, 0);
  assert.equal(state.lives, game.STARTING_LIVES - 1);
});

test("R12/R8: restarting clears triangles along with everything else", () => {
  const { state, input } = newGame();
  state.enemies.push(triangleAt(100, 100, 1));
  state.lives = 0;
  game.updateGame(state, input, 1 / 60);
  assert.equal(state.isOver, true);
  game.handleKeyDown(state, input, "Enter");
  assert.deepEqual(state, game.createGame());
});

// ---- R12: how it is drawn -------------------------------------------------------

// The x,y points of the path calls (moveTo/lineTo) drawn in `color`.
function pathPointsIn(calls, color) {
  return calls
    .filter((c) => (c.name === "moveTo" || c.name === "lineTo") && c.fillStyle === color)
    .map((c) => c.args);
}

test("R12: the triangle enemy is drawn in purple", () => {
  const hex = game.COLORS.triangle;
  assert.match(hex, /^#[0-9a-f]{6}$/i);
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  assert.ok(r > g && b > g && b >= r * 0.8, `${hex} should be purple`);
  assert.notEqual(hex, game.COLORS.enemy);
});

test("R12: the triangle enemy is drawn as a filled triangle pointing downward", () => {
  const state = game.createGame();
  state.enemies.push(triangleAt(100, 200, 1));
  const fake = createFakeContext();
  game.drawGame(fake.ctx, state);
  const points = pathPointsIn(fake.calls, game.COLORS.triangle);
  assert.deepEqual(points, [[100, 200], [130, 200], [115, 230]], "flat top edge, point at the bottom middle");
  assert.ok(fake.calls.some((c) => c.name === "fill" && c.fillStyle === game.COLORS.triangle));
  assert.equal(fake.rectsWithColor(game.COLORS.enemy).length, 0, "not drawn as a red square");
});

test("R12: red squares are still drawn as red squares", () => {
  const state = game.createGame();
  state.enemies.push(squareAt(100, 200));
  const fake = createFakeContext();
  game.drawGame(fake.ctx, state);
  const rects = fake.rectsWithColor(game.COLORS.enemy);
  assert.equal(rects.length, 1);
  assert.deepEqual(rects[0].args, [100, 200, game.ENEMY_SIZE, game.ENEMY_SIZE]);
  assert.deepEqual(pathPointsIn(fake.calls, game.COLORS.triangle), []);
});

test("R12: in the page, a purple triangle appears and weaves while it falls", () => {
  // Every roll is 0: each enemy is a triangle at the left edge, heading left.
  const page = loadGameInFakePage({ random: () => 0 });
  page.runFor(1.1);
  const first = pathPointsIn(page.fake.calls, game.COLORS.triangle);
  assert.equal(first.length, 3, "one triangle drawn");
  page.runFor(1);
  const later = pathPointsIn(page.fake.calls, game.COLORS.triangle);
  assert.ok(later[0][0] > first[0][0], "bounced off the left edge and moved right");
  assert.ok(later[0][1] > first[0][1], "moved down");
});
