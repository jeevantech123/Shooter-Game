// Tests for Round 3 of Shooter-Game: R1 adds a High Score panel to the right
// of the canvas showing the top score ever recorded (see problem.md and
// spec.md). The high score is saved in localStorage and updates live.
// Run with: node --test
const test = require("node:test");
const assert = require("node:assert/strict");

const game = require("../game.js");
const { readProjectFile, createFakeStorage, loadGameInFakePage } = require("./helpers.js");

// With Math.random fixed at 0.5 every enemy spawns straight above the ship's
// starting position, so holding Space destroys each one for 10 points.
const CENTER = () => 0.5;

function savedStorage(value) {
  return createFakeStorage({ [game.HIGH_SCORE_KEY]: value });
}

// Hold Space for `seconds`, then let go. Returns the page.
function shootFor(page, seconds) {
  page.press("Space");
  page.runFor(seconds);
  page.release("Space");
  return page;
}

// The score part of the HUD text, e.g. 30 from "Score: 30   Lives: 3".
function hudScore(page) {
  const hud = page.fake.texts().find((t) => t.startsWith("Score:"));
  return Number(hud.match(/Score: (\d+)/)[1]);
}

// ---- R1: the panel on the page ---------------------------------------------

test("R1: index.html has a High Score panel next to the canvas, after it in a row", () => {
  const html = readProjectFile("index.html");
  const row = html.match(/<div class="game-row">([\s\S]*?)<\/div>\s*<p class="controls">/);
  assert.ok(row, "canvas and panel share a game-row container, above the control hint");
  const canvasAt = row[1].indexOf('<canvas id="game"');
  const panelAt = row[1].indexOf('class="high-score"');
  assert.ok(canvasAt !== -1, "canvas is in the row");
  assert.ok(panelAt > canvasAt, "panel comes after (to the right of) the canvas");
  assert.match(row[1], /High Score/, "panel has the label 'High Score'");
  assert.match(row[1], /id="high-score"[^>]*>0</, "the value starts at 0 before the script runs");
});

test("R1: style.css lays the canvas and the panel out side by side", () => {
  const css = readProjectFile("style.css");
  const rule = css.match(/\.game-row\s*\{([^}]*)\}/);
  assert.ok(rule, ".game-row rule exists");
  assert.match(rule[1], /display:\s*flex/);
  assert.doesNotMatch(rule[1], /flex-direction:\s*column/, "the row is not stacked");
});

test("R1: the High Score panel is outside the canvas, so the canvas is still 480x640", () => {
  const html = readProjectFile("index.html");
  assert.match(html, /<canvas[^>]*id="game"[^>]*width="480"[^>]*height="640"/);
  const page = loadGameInFakePage();
  page.frame();
  assert.ok(!page.fake.texts().some((t) => /high score/i.test(t)), "not drawn on the canvas");
});

// ---- R1: showing the top score ever recorded --------------------------------

test("R1: with nothing recorded yet the High Score shows 0", () => {
  const page = loadGameInFakePage({ storage: createFakeStorage() });
  page.frame();
  assert.equal(page.highScoreText(), "0");
});

test("R1: the High Score shows a score recorded on an earlier visit", () => {
  const page = loadGameInFakePage({ storage: savedStorage(150) });
  assert.equal(page.highScoreText(), "150", "shown as soon as the page loads");
  page.frame();
  assert.equal(page.highScoreText(), "150");
});

test("R1: a broken or negative saved value counts as no high score", () => {
  for (const bad of ["abc", "-5", "", "NaN", "Infinity"]) {
    assert.equal(game.loadHighScore(savedStorage(bad)), 0, `saved "${bad}"`);
  }
  assert.equal(game.loadHighScore(savedStorage("40")), 40);
});

// ---- R1: live update and saving ---------------------------------------------

test("R1/R4: the High Score rises during play as soon as the score passes it", () => {
  const storage = createFakeStorage();
  const page = loadGameInFakePage({ storage, random: CENTER });
  page.press("Space");
  page.runFor(1);
  assert.equal(page.highScoreText(), "0", "no points yet");
  page.runFor(1);
  const score = hudScore(page);
  assert.ok(score >= 10, `should have scored, HUD score is ${score}`);
  assert.equal(page.highScoreText(), String(score), "panel matches the score during play");
  assert.equal(storage.getItem(game.HIGH_SCORE_KEY), String(score), "new high score is saved");
});

test("R1: a lower score does not lower the High Score", () => {
  const storage = savedStorage(500);
  const page = shootFor(loadGameInFakePage({ storage, random: CENTER }), 3);
  page.frame();
  assert.ok(hudScore(page) > 0 && hudScore(page) < 500);
  assert.equal(page.highScoreText(), "500");
  assert.equal(storage.getItem(game.HIGH_SCORE_KEY), "500");
});

test("R1: updateHighScore only goes up, and saves each new high score", () => {
  const storage = createFakeStorage();
  const highScore = game.createHighScore(storage);
  assert.equal(highScore.best, 0);
  assert.equal(game.updateHighScore(highScore, 0), false, "0 is not a new high score");
  assert.equal(game.updateHighScore(highScore, 30), true);
  assert.equal(highScore.best, 30);
  assert.equal(storage.getItem(game.HIGH_SCORE_KEY), "30");
  assert.equal(game.updateHighScore(highScore, 30), false, "equal is not higher");
  assert.equal(game.updateHighScore(highScore, 20), false);
  assert.equal(highScore.best, 30);
  assert.equal(storage.getItem(game.HIGH_SCORE_KEY), "30");
});

// ---- R1 with restart and reload ---------------------------------------------

test("R1/R8: restarting with Enter resets the score but keeps the High Score", () => {
  const page = shootFor(loadGameInFakePage({ storage: createFakeStorage(), random: CENTER }), 2);
  page.runFor(20); // no more shooting: enemies hit the ship until Game Over
  assert.ok(page.fake.texts().includes("Game Over"));
  // Read it at Game Over: shots still in flight after Space was released can score too.
  const best = page.highScoreText();
  assert.ok(Number(best) >= 10);
  assert.equal(best, String(hudScore(page)), "high score equals this game's final score");

  page.press("Enter");
  page.frame();
  assert.ok(page.fake.texts().includes("Score: 0   Lives: 3"), "new game started");
  assert.equal(page.highScoreText(), best, "high score kept after restart");
});

test("R1/R8: the game state has no high score in it, so resetGame cannot clear it", () => {
  assert.ok(!("highScore" in game.createGame()));
});

test("R1: the High Score is kept when the page is reloaded", () => {
  const storage = createFakeStorage();
  const first = shootFor(loadGameInFakePage({ storage, random: CENTER }), 2);
  first.frame();
  const best = first.highScoreText();
  assert.ok(Number(best) >= 10);

  const reloaded = loadGameInFakePage({ storage });
  reloaded.frame();
  assert.equal(reloaded.highScoreText(), best);
  assert.ok(reloaded.fake.texts().includes("Score: 0   Lives: 3"), "the new visit starts at score 0");
});

// ---- R1 when local storage is not available ---------------------------------

test("R1: without localStorage the game still runs and the High Score still updates", () => {
  const page = shootFor(loadGameInFakePage({ random: CENTER }), 2);
  page.frame();
  assert.ok(Number(page.highScoreText()) >= 10);
});

test("R1: if storage throws on read or write, the game still runs and keeps the High Score in memory", () => {
  const broken = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
  };
  const page = loadGameInFakePage({ storage: broken, random: CENTER });
  assert.equal(page.highScoreText(), "0");
  shootFor(page, 2);
  page.frame();
  assert.ok(Number(page.highScoreText()) >= 10);
  assert.ok(page.hasPendingFrame(), "the game loop keeps running");
});

test("R1: loadHighScore and saveHighScore accept a missing storage", () => {
  assert.equal(game.loadHighScore(null), 0);
  assert.doesNotThrow(() => game.saveHighScore(null, 10));
});
