// Tests for Round 6 of Shooter-Game: R1 lets the player press Shift to fire a
// special shotgun blast with a 10-second cooldown, and shows the cooldown under
// the High Score panel (see problem.md and spec.md). A blast is five pellets in
// a fan that act like normal shots. Each blast needs a fresh Shift press. The
// shotgun is ready at the start of every game, and its cooldown freezes while
// the game is paused. The Shotgun panel counts down whole seconds, then shows "Ready".
// Run with: node --test
const test = require("node:test");
const assert = require("node:assert/strict");

const game = require("../game.js");
const { readProjectFile, loadGameInFakePage } = require("./helpers.js");

const FRAME = 1 / 60;

function newGame() {
  return { state: game.createGame(), input: game.createInput() };
}

// Run the game in 60 fps steps with no enemies, so nothing costs a life or
// gets in the way of the shots. Calls `eachFrame` before every step if given.
function playFor(state, input, seconds, eachFrame = () => {}) {
  const frames = Math.round(seconds / FRAME);
  for (let i = 0; i < frames; i++) {
    eachFrame();
    game.updateGame(state, input, FRAME, () => 0.5);
    state.enemies = [];
  }
}

// A fresh press of Shift followed by one frame of play.
function blast(state, input, code = "ShiftLeft") {
  game.handleKeyDown(state, input, code);
  playFor(state, input, FRAME);
  game.handleKeyUp(input, code);
}

// Where a normal shot fired now would start (just above the ship's nose).
function noseX(ship) {
  return ship.x + (ship.width - game.SHOT_WIDTH) / 2;
}

// ---- R1: the blast -----------------------------------------------------------

test("R1: the shotgun cooldown is 10 seconds and a blast has 5 pellets", () => {
  assert.equal(game.SHOTGUN_COOLDOWN, 10);
  assert.equal(game.SHOTGUN_PELLETS, 5);
});

test("R1: pressing Shift fires five pellets at once from the ship's nose", () => {
  const { state, input } = newGame();
  assert.equal(game.handleKeyDown(state, input, "ShiftLeft"), true, "Shift is a game key");
  playFor(state, input, FRAME);
  assert.equal(state.shots.length, 5);
  for (const pellet of state.shots) {
    assert.equal(pellet.width, game.SHOT_WIDTH, "pellets look like normal shots");
    assert.equal(pellet.height, game.SHOT_HEIGHT);
    assert.ok(Math.abs(pellet.x - noseX(state.ship)) < 10, "starts at the nose");
    assert.ok(Math.abs(pellet.y - (state.ship.y - game.SHOT_HEIGHT)) < 10, "starts at the nose");
  }
});

test("R1: the right Shift key fires a blast too", () => {
  const { state, input } = newGame();
  assert.equal(game.handleKeyDown(state, input, "ShiftRight"), true);
  playFor(state, input, FRAME);
  assert.equal(state.shots.length, 5);
});

test("R1: the pellets spread in a fan: one straight up, two to the left, two to the right", () => {
  const { state, input } = newGame();
  const startX = noseX(state.ship);
  const startY = state.ship.y - game.SHOT_HEIGHT;
  blast(state, input);
  playFor(state, input, 0.5);
  assert.equal(state.shots.length, 5);
  const offsets = state.shots.map((p) => p.x - startX).sort((a, b) => a - b);
  assert.ok(Math.abs(offsets[2]) < 1e-9, "the middle pellet goes straight up");
  assert.ok(offsets[0] < offsets[1] && offsets[1] < 0, "two pellets go left, at different angles");
  assert.ok(0 < offsets[3] && offsets[3] < offsets[4], "two pellets go right, at different angles");
  assert.ok(Math.abs(offsets[0] + offsets[4]) < 1e-9, "the fan is even on both sides");
  assert.ok(Math.abs(offsets[1] + offsets[3]) < 1e-9, "the fan is even on both sides");
  for (const pellet of state.shots) assert.ok(pellet.y < startY - 100, "every pellet flies upward");
});

test("R1: pellets fly until they leave the canvas, at the top or a side", () => {
  const { state, input } = newGame();
  state.ship.x = 0; // at the left edge, so the left pellets leave by the side
  blast(state, input);
  const canvas = { x: 0, y: 0, width: game.CANVAS_WIDTH, height: game.CANVAS_HEIGHT };
  const onCanvas = () => state.shots.every((p) => game.rectsOverlap(p, canvas));
  playFor(state, input, 1.0, () => assert.ok(onCanvas(), "pellets off the canvas are removed"));
  assert.ok(state.shots.length < 5, "pellets that left by the left side are gone");
  assert.ok(state.shots.length > 0, "pellets still on the canvas keep flying");
  assert.ok(state.shots.every((p) => p.y > 0), "the rest have not reached the top yet");
  playFor(state, input, 1.0, () => assert.ok(onCanvas()));
  assert.equal(state.shots.length, 0, "every pellet has left the canvas");
});

test("R1: a pellet that hits an enemy destroys it and scores 10; one blast can destroy several", () => {
  const { state, input } = newGame();
  blast(state, input);
  playFor(state, input, 0.5); // the pellets are now spread out
  assert.equal(state.shots.length, 5);
  // Put a plain enemy right on top of each pellet.
  state.enemies = state.shots.map((p) => ({
    x: p.x + p.width / 2 - game.ENEMY_SIZE / 2,
    y: p.y + p.height / 2 - game.ENEMY_SIZE / 2,
    width: game.ENEMY_SIZE,
    height: game.ENEMY_SIZE,
  }));
  game.updateGame(state, input, FRAME, () => 0.5);
  assert.equal(state.enemies.length, 0, "every enemy was destroyed");
  assert.equal(state.shots.length, 0, "every pellet disappeared");
  assert.equal(state.score, 5 * game.POINTS_PER_ENEMY);
});

// ---- R1: the cooldown --------------------------------------------------------

test("R1: Shift during the 10-second cooldown does nothing; a fresh press after it fires again", () => {
  const { state, input } = newGame();
  blast(state, input);
  assert.equal(state.shots.length, 5);
  playFor(state, input, game.SHOTGUN_COOLDOWN - 0.1);
  state.shots = [];
  blast(state, input);
  assert.equal(state.shots.length, 0, "still cooling down just before 10 s");
  playFor(state, input, 0.2);
  blast(state, input);
  assert.equal(state.shots.length, 5, "ready again after 10 s");
});

test("R1: holding Shift down (key repeat) does not fire again when the cooldown ends", () => {
  const { state, input } = newGame();
  game.handleKeyDown(state, input, "ShiftLeft");
  playFor(state, input, 2); // the first blast's pellets have all left by now
  assert.equal(state.shots.length, 0);
  const holdShift = () => game.handleKeyDown(state, input, "ShiftLeft", true);
  playFor(state, input, game.SHOTGUN_COOLDOWN + 2, () => {
    holdShift();
    assert.equal(state.shots.length, 0, "no second blast while Shift is held");
  });
  game.handleKeyUp(input, "ShiftLeft");
  blast(state, input);
  assert.equal(state.shots.length, 5, "a fresh press fires");
});

test("R1: the shotgun is ready at the start of a game and again after restarting", () => {
  const { state, input } = newGame();
  assert.equal(game.shotgunCooldownText(state), "Ready");
  blast(state, input);
  assert.equal(state.shots.length, 5);
  state.lives = 0;
  playFor(state, input, FRAME);
  assert.equal(state.isOver, true, "setup: the game is over");
  game.handleKeyDown(state, input, "Enter");
  assert.equal(game.shotgunCooldownText(state), "Ready", "restarting resets the cooldown");
  blast(state, input);
  assert.equal(state.shots.length, 5);
});

test("R1: Space and Shift are separate: neither one's delay holds back the other", () => {
  // Space held and Shift pressed together: one normal shot and five pellets.
  let { state, input } = newGame();
  game.handleKeyDown(state, input, "Space");
  blast(state, input);
  assert.equal(state.shots.length, 6);
  playFor(state, input, 0.3);
  assert.ok(state.shots.length > 6, "normal shots keep firing while the shotgun cools down");

  // A normal shot was just fired, so its delay is running; Shift still fires.
  ({ state, input } = newGame());
  game.handleKeyDown(state, input, "Space");
  playFor(state, input, FRAME);
  assert.equal(state.shots.length, 1);
  blast(state, input);
  assert.equal(state.shots.length, 6, "five pellets and no extra normal shot");
});

test("R1: while paused, Shift does nothing and is not saved up for later", () => {
  const { state, input } = newGame();
  game.handleKeyDown(state, input, "Escape");
  assert.equal(game.handleKeyDown(state, input, "ShiftLeft"), true, "still a game key while paused");
  playFor(state, input, 1);
  game.handleKeyUp(input, "ShiftLeft");
  game.handleKeyDown(state, input, "Escape");
  playFor(state, input, FRAME);
  assert.equal(state.shots.length, 0, "no blast during or after the pause");
  assert.equal(game.shotgunCooldownText(state), "Ready", "the cooldown never started");
});

test("R1: the shotgun cooldown stops while the game is paused", () => {
  const { state, input } = newGame();
  blast(state, input);
  playFor(state, input, 5.5);
  assert.equal(game.shotgunCooldownText(state), "5");
  game.handleKeyDown(state, input, "Escape");
  playFor(state, input, 20);
  assert.equal(game.shotgunCooldownText(state), "5", "no time passes while paused");
  game.handleKeyDown(state, input, "Escape");
  state.shots = [];
  blast(state, input);
  assert.equal(state.shots.length, 0, "still cooling down after the pause");
  playFor(state, input, 4.6);
  assert.equal(game.shotgunCooldownText(state), "Ready");
  blast(state, input);
  assert.equal(state.shots.length, 5);
});

test("R1: Shift does nothing on the game-over screen", () => {
  const { state, input } = newGame();
  state.lives = 0;
  playFor(state, input, FRAME);
  assert.equal(state.isOver, true, "setup: the game is over");
  assert.equal(game.handleKeyDown(state, input, "ShiftLeft"), true);
  playFor(state, input, FRAME);
  assert.equal(state.shots.length, 0);
  assert.equal(game.shotgunCooldownText(state), "Ready");
});

// ---- R1: the cooldown timer ---------------------------------------------------

test("R1: the cooldown timer counts down whole seconds 10 to 1, then shows Ready", () => {
  const { state, input } = newGame();
  assert.equal(game.shotgunCooldownText(state), "Ready");
  game.handleKeyDown(state, input, "ShiftLeft");
  const shown = [];
  playFor(state, input, game.SHOTGUN_COOLDOWN + 0.5, () => {
    const text = game.shotgunCooldownText(state);
    if (shown[shown.length - 1] !== text) shown.push(text);
  });
  assert.deepEqual(shown, ["10", "9", "8", "7", "6", "5", "4", "3", "2", "1", "Ready"]);
});

test("R1/page: index.html has a Shotgun panel directly under the High Score panel", () => {
  const html = readProjectFile("index.html");
  const row = html.match(/<div class="game-row">([\s\S]*?)<\/div>\s*<p class="controls">/);
  assert.ok(row, "the panels share the game-row with the canvas");
  const column = row[1].match(/<div class="side-panels">([\s\S]*?)<\/div>/);
  assert.ok(column, "the two panels are stacked in one column");
  const highScoreAt = column[1].indexOf('id="high-score"');
  const shotgunAt = column[1].indexOf('id="shotgun-cooldown"');
  assert.ok(highScoreAt !== -1 && shotgunAt > highScoreAt, "the Shotgun panel comes after (under) High Score");
  assert.match(column[1], /Shotgun/, "the panel has the label 'Shotgun'");
  assert.match(column[1], /id="shotgun-cooldown"[^>]*>Ready</, "the timer starts as Ready before the script runs");
  const css = readProjectFile("style.css");
  const rule = css.match(/\.side-panels\s*\{([^}]*)\}/);
  assert.ok(rule, ".side-panels rule exists");
  assert.match(rule[1], /flex-direction:\s*column/, "the panels are stacked, one under the other");
});

test("R1/page: Shift fires five pellets on the canvas and the Shotgun panel counts down", () => {
  const page = loadGameInFakePage({ random: () => 0 }); // slow triangles: no lives lost for 12 s
  page.frame();
  assert.equal(page.shotgunText(), "Ready");
  const event = page.press("ShiftLeft");
  assert.equal(event.defaultPrevented, true);
  page.frame();
  assert.equal(page.fake.rectsWithColor(game.COLORS.shot).length, 5, "five pellets drawn like shots");
  assert.equal(page.shotgunText(), "10");
  assert.ok(!page.fake.texts().some((t) => /shotgun/i.test(t)), "the timer is not drawn on the canvas");
  page.release("ShiftLeft");
  page.runFor(1.5);
  assert.equal(page.shotgunText(), "9");
  page.runFor(9);
  assert.equal(page.shotgunText(), "Ready");
});

test("R1/page: Shift while paused fires nothing, and the panel stays Ready", () => {
  const page = loadGameInFakePage({ random: () => 0 });
  page.frame();
  page.press("Escape");
  page.press("ShiftRight");
  page.frame();
  assert.ok(page.fake.texts().includes("Paused"));
  page.release("ShiftRight");
  page.press("Escape");
  page.frame();
  assert.equal(page.fake.rectsWithColor(game.COLORS.shot).length, 0);
  assert.equal(page.shotgunText(), "Ready");
});

test("R1/page: the control hint under the canvas lists Shift for the shotgun", () => {
  const html = readProjectFile("index.html");
  const hint = html.match(/<p class="controls">(.*)<\/p>/);
  assert.ok(hint, "control hint line exists");
  assert.match(hint[1], /Shotgun: Shift/);
  assert.match(hint[1], /Pause: Esc/, "the older hints are kept");
  assert.match(hint[1], /Restart: Enter/, "the older hints are kept");
});
