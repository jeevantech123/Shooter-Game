// Tests for Round 7 of Shooter-Game: R15 lets the player press Ctrl to turn an
// auto shotgun on and off, and shows it under the Shotgun cooldown panel (see
// problem.md and spec.md). While auto is on, the shotgun fires by itself
// whenever it is ready: right away, then as soon as each 10-second cooldown
// ends. Ctrl only works during play, on a fresh press. Auto starts off in
// every game. The Auto Shotgun panel shows "On" or "Off".
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

// A fresh press and release of a key that acts on the press (Ctrl, Shift, Esc).
function tap(state, input, code) {
  game.handleKeyDown(state, input, code);
  game.handleKeyUp(input, code);
}

// Play for `seconds` and return the times (from now, in seconds) at which a
// shotgun blast fired. A blast is seen as the cooldown jumping back up.
function blastTimes(state, input, seconds) {
  const times = [];
  const frames = Math.round(seconds / FRAME);
  for (let i = 1; i <= frames; i++) {
    const before = state.shotgunTimer;
    playFor(state, input, FRAME);
    if (state.shotgunTimer > before) times.push(i * FRAME);
  }
  return times;
}

function near(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) <= 2 * FRAME, `${message}: expected about ${expected}, got ${actual}`);
}

// ---- R15: turning auto on and off ---------------------------------------------

test("R15: the auto shotgun is off at the start of a game and never fires by itself", () => {
  const { state, input } = newGame();
  assert.equal(game.autoShotgunText(state), "Off");
  assert.deepEqual(blastTimes(state, input, 12), [], "no blast without Shift or Ctrl");
});

test("R15: a fresh Ctrl press turns the auto shotgun on, and the next one turns it off", () => {
  const { state, input } = newGame();
  assert.equal(game.handleKeyDown(state, input, "ControlLeft"), true, "Ctrl is a game key");
  assert.equal(game.autoShotgunText(state), "On");
  game.handleKeyUp(input, "ControlLeft");
  assert.equal(game.handleKeyDown(state, input, "ControlRight"), true, "the right Ctrl key works too");
  assert.equal(game.autoShotgunText(state), "Off");
  game.handleKeyUp(input, "ControlRight");
  tap(state, input, "ControlRight");
  assert.equal(game.autoShotgunText(state), "On");
});

test("R15: holding Ctrl down (key repeat) does not flip the auto shotgun again", () => {
  const { state, input } = newGame();
  game.handleKeyDown(state, input, "ControlLeft");
  for (let i = 0; i < 31; i++) {
    assert.equal(game.handleKeyDown(state, input, "ControlLeft", true), true);
    assert.equal(game.autoShotgunText(state), "On", "a repeat never flips it");
  }
  game.handleKeyUp(input, "ControlLeft");
  tap(state, input, "ControlLeft");
  assert.equal(game.autoShotgunText(state), "Off", "a fresh press flips it");
});

// ---- R15: automatic blasts -----------------------------------------------------

test("R15: with auto on, a ready shotgun fires a five-pellet blast right away, without Shift", () => {
  const { state, input } = newGame();
  tap(state, input, "ControlLeft");
  playFor(state, input, FRAME);
  assert.equal(state.shots.length, 5, "a full blast on the first frame");
  const sideways = state.shots.map((p) => p.dx).sort((a, b) => a - b);
  assert.equal(sideways[2], 0, "the same fan as a Shift blast: one straight up");
  assert.ok(sideways[0] < sideways[1] && sideways[1] < 0, "two to the left");
  assert.ok(0 < sideways[3] && sideways[3] < sideways[4], "two to the right");
  assert.equal(game.shotgunCooldownText(state), "10", "the blast starts the cooldown");
});

test("R15: with auto on, the shotgun fires again as soon as each 10-second cooldown ends, never sooner", () => {
  const { state, input } = newGame();
  tap(state, input, "ControlLeft");
  const times = blastTimes(state, input, 3 * game.SHOTGUN_COOLDOWN + 1);
  assert.equal(times.length, 4, `blasts at about 0, 10, 20 and 30 s, got ${times}`);
  near(times[0], FRAME, "first blast");
  for (let i = 1; i < times.length; i++) near(times[i] - times[i - 1], game.SHOTGUN_COOLDOWN, "gap between blasts");
});

test("R15: turning auto on during a cooldown waits for the cooldown to end", () => {
  const { state, input } = newGame();
  tap(state, input, "ShiftLeft"); // a blast by hand starts the cooldown
  playFor(state, input, 4);
  tap(state, input, "ControlLeft");
  const times = blastTimes(state, input, 8);
  assert.equal(times.length, 1, "one automatic blast");
  near(times[0], game.SHOTGUN_COOLDOWN - 4, "it waits for the 6 s left on the cooldown");
});

test("R15: turning auto off stops the automatic blasts; the cooldown runs on and Shift fires by hand again", () => {
  const { state, input } = newGame();
  tap(state, input, "ControlLeft");
  playFor(state, input, 3.5); // one automatic blast at the start
  tap(state, input, "ControlLeft");
  assert.equal(game.autoShotgunText(state), "Off");
  assert.equal(game.shotgunCooldownText(state), "7", "the cooldown keeps counting down");
  assert.deepEqual(blastTimes(state, input, 15), [], "no automatic blasts once auto is off");
  assert.equal(game.shotgunCooldownText(state), "Ready");
  state.shots = [];
  tap(state, input, "ShiftLeft");
  assert.equal(state.shots.length, 5, "Shift fires by hand");
});

// ---- R15: pause, game over, and restart ---------------------------------------

test("R15: Ctrl does nothing while paused, and the auto shotgun stays as it was", () => {
  let { state, input } = newGame();
  tap(state, input, "Escape");
  assert.equal(game.handleKeyDown(state, input, "ControlLeft"), true, "still a game key while paused");
  game.handleKeyUp(input, "ControlLeft");
  assert.equal(game.autoShotgunText(state), "Off", "Ctrl while paused does not turn it on");
  tap(state, input, "Escape");
  assert.deepEqual(blastTimes(state, input, 1), [], "and nothing fires after the pause");

  ({ state, input } = newGame());
  tap(state, input, "ControlLeft");
  tap(state, input, "Escape");
  tap(state, input, "ControlLeft");
  assert.equal(game.autoShotgunText(state), "On", "Ctrl while paused does not turn it off");
});

test("R15: while paused, the auto shotgun does not fire and its cooldown is frozen; it carries on after", () => {
  const { state, input } = newGame();
  tap(state, input, "ControlLeft");
  playFor(state, input, 5.5); // one blast at the start, then 5.5 s of cooldown
  assert.equal(game.shotgunCooldownText(state), "5");
  tap(state, input, "Escape");
  assert.deepEqual(blastTimes(state, input, 20), [], "no blast while paused");
  assert.equal(game.shotgunCooldownText(state), "5", "no time passes while paused");
  assert.equal(game.autoShotgunText(state), "On", "auto stays on through the pause");
  tap(state, input, "Escape");
  const times = blastTimes(state, input, 6);
  assert.equal(times.length, 1);
  near(times[0], 4.5, "fires when the rest of the cooldown ends");
});

test("R15: auto turned on just before a pause fires only after un-pausing", () => {
  const { state, input } = newGame();
  tap(state, input, "ControlLeft");
  tap(state, input, "Escape");
  playFor(state, input, 5);
  assert.equal(state.shots.length, 0, "nothing fires during the pause");
  tap(state, input, "Escape");
  playFor(state, input, FRAME);
  assert.equal(state.shots.length, 5, "the shotgun is ready, so auto fires on resume");
});

test("R15: Ctrl does nothing on the game-over screen", () => {
  const { state, input } = newGame();
  state.lives = 0;
  playFor(state, input, FRAME);
  assert.equal(state.isOver, true, "setup: the game is over");
  assert.equal(game.handleKeyDown(state, input, "ControlLeft"), true);
  assert.equal(game.autoShotgunText(state), "Off");
  playFor(state, input, FRAME);
  assert.equal(state.shots.length, 0);
});

test("R15: restarting with Enter turns the auto shotgun off", () => {
  const { state, input } = newGame();
  tap(state, input, "ControlLeft");
  playFor(state, input, FRAME);
  state.lives = 0;
  playFor(state, input, FRAME);
  assert.equal(state.isOver, true, "setup: the game is over");
  assert.equal(game.autoShotgunText(state), "On", "the setting keeps its value on the game-over screen");
  game.handleKeyDown(state, input, "Enter");
  assert.equal(game.autoShotgunText(state), "Off");
  assert.equal(game.shotgunCooldownText(state), "Ready");
  assert.deepEqual(blastTimes(state, input, 2), [], "no automatic blast in the new game");
});

// ---- R15: the Auto Shotgun panel and hints -------------------------------------

test("R15/page: index.html has an Auto Shotgun panel directly under the Shotgun panel, starting Off", () => {
  const html = readProjectFile("index.html");
  const column = html.match(/<div class="side-panels">([\s\S]*?)<\/div>/);
  assert.ok(column, "the panels are stacked in one column");
  const shotgunAt = column[1].indexOf('id="shotgun-cooldown"');
  const autoAt = column[1].indexOf('id="auto-shotgun"');
  assert.ok(shotgunAt !== -1 && autoAt > shotgunAt, "the Auto Shotgun panel comes after (under) the Shotgun panel");
  assert.match(column[1], /Auto Shotgun/, "the panel has the label 'Auto Shotgun'");
  assert.match(column[1], /id="auto-shotgun"[^>]*>Off</, "it shows Off before the script runs");
  // Same style as the other panels: one CSS rule styles .shotgun and .auto-shotgun.
  const css = readProjectFile("style.css");
  const selectorLists = [...css.matchAll(/([^{}]+)\{[^}]*\}/g)].map((m) => m[1].split(",").map((s) => s.trim()));
  assert.ok(
    selectorLists.some((list) => list.includes(".shotgun") && list.includes(".auto-shotgun")),
    "the Auto Shotgun panel shares the Shotgun panel's box style",
  );
});

test("R15/page: Ctrl flips the Auto Shotgun panel, and auto fires pellets on the canvas", () => {
  const page = loadGameInFakePage({ random: () => 0 }); // slow triangles: no lives lost for 12 s
  page.frame();
  assert.equal(page.autoShotgunText(), "Off");
  const event = page.press("ControlLeft");
  assert.equal(event.defaultPrevented, true);
  page.release("ControlLeft");
  page.frame();
  assert.equal(page.autoShotgunText(), "On");
  assert.equal(page.fake.rectsWithColor(game.COLORS.shot).length, 5, "an automatic blast is drawn like shots");
  assert.equal(page.shotgunText(), "10");
  assert.ok(!page.fake.texts().some((t) => /auto/i.test(t)), "the setting is not drawn on the canvas");
  page.press("ControlRight");
  page.release("ControlRight");
  page.frame();
  assert.equal(page.autoShotgunText(), "Off");
  page.runFor(10.5);
  assert.equal(page.shotgunText(), "Ready");
  assert.equal(page.fake.rectsWithColor(game.COLORS.shot).length, 0, "no automatic blast once auto is off");
});

test("R15/page: Ctrl while paused leaves the Auto Shotgun panel Off and fires nothing", () => {
  const page = loadGameInFakePage({ random: () => 0 });
  page.frame();
  page.press("Escape");
  page.press("ControlLeft");
  page.release("ControlLeft");
  page.frame();
  assert.ok(page.fake.texts().includes("Paused"));
  assert.equal(page.autoShotgunText(), "Off");
  page.press("Escape");
  page.frame();
  assert.equal(page.autoShotgunText(), "Off");
  assert.equal(page.fake.rectsWithColor(game.COLORS.shot).length, 0);
});

test("R15/page: the control hint under the canvas lists Ctrl for the auto shotgun", () => {
  const html = readProjectFile("index.html");
  const hint = html.match(/<p class="controls">(.*)<\/p>/);
  assert.ok(hint, "control hint line exists");
  assert.match(hint[1], /Auto Shotgun: Ctrl/);
  assert.match(hint[1], /Shotgun: Shift/, "the older hints are kept");
  assert.match(hint[1], /Pause: Esc/, "the older hints are kept");
});
