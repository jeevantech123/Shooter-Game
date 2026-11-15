// Shooter-Game: a very simple 2D space shooter drawn on a <canvas>.
// The game logic is plain functions over a state object so it can be tested
// in Node; the browser wiring at the bottom only runs when there is a page.

// ---- Constants -------------------------------------------------------------

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;

const SHIP_WIDTH = 40;
const SHIP_HEIGHT = 24;
const SHIP_BOTTOM_MARGIN = 20; // gap between the ship and the bottom edge
const SHIP_SPEED = 300; // pixels per second

const SHOT_WIDTH = 4;
const SHOT_HEIGHT = 12;
const SHOT_SPEED = 500; // pixels per second, upward
const SHOT_DELAY = 0.25; // seconds between shots

// Shotgun (Round 6): Shift fires a fan of pellets, then has to cool down.
const SHOTGUN_COOLDOWN = 10; // seconds before the next blast
const SHOTGUN_PELLETS = 5; // pellets in one blast
const SHOTGUN_SPREAD_SPEED = 100; // extra sideways speed between neighbouring pellets, px/s

const ENEMY_SIZE = 30;
const ENEMY_SPEED = 100; // pixels per second, downward
const ENEMY_SPAWN_DELAY = 1.0; // seconds between new enemies

// Purple triangle enemy (Round 4): falls slower and bounces left and right.
const TRIANGLE_CHANCE = 0.25; // share of new enemies that are triangles
const TRIANGLE_FALL_SPEED = ENEMY_SPEED / 2; // pixels per second, downward
const TRIANGLE_SIDE_SPEED = 80; // pixels per second, sideways

const POINTS_PER_ENEMY = 10;
const STARTING_LIVES = 3;

const MAX_FRAME_TIME = 0.1; // cap on one frame's step, e.g. after a tab switch

const HIGH_SCORE_KEY = "shooter-game-high-score"; // localStorage key

const COLORS = {
  background: "#000010",
  ship: "#4fd1ff",
  shot: "#ffe14f",
  enemy: "#ff4f6a",
  triangle: "#b44fff",
  text: "#ffffff",
  dim: "rgba(0, 0, 0, 0.6)", // laid over the game when paused or over
};

// ---- Game state ------------------------------------------------------------

function createShip() {
  return {
    x: (CANVAS_WIDTH - SHIP_WIDTH) / 2,
    y: CANVAS_HEIGHT - SHIP_BOTTOM_MARGIN - SHIP_HEIGHT,
    width: SHIP_WIDTH,
    height: SHIP_HEIGHT,
  };
}

function createGame() {
  return {
    ship: createShip(),
    shots: [],
    enemies: [],
    score: 0,
    lives: STARTING_LIVES,
    isOver: false,
    isPaused: false, // Esc pauses and un-pauses during play
    shotTimer: 0, // time left until the ship may fire again
    shotgunTimer: 0, // time left until the shotgun may fire again (0 = ready)
    autoShotgun: false, // Ctrl toggles: fire the shotgun by itself whenever it is ready
    spawnTimer: 0, // time since the last enemy appeared
  };
}

// Put a finished game back to its starting values, in place.
function resetGame(state) {
  Object.assign(state, createGame());
}

function createInput() {
  return { left: false, right: false, up: false, down: false, fire: false };
}

// ---- Update ----------------------------------------------------------------

// Advance the game by dt seconds. `random` returns a number in [0, 1).
// Nothing changes while the game is over or paused, so no game time passes.
function updateGame(state, input, dt, random = Math.random) {
  if (state.isOver || state.isPaused) return;
  moveShip(state, input, dt);
  updateFiring(state, input, dt);
  updateShotgunCooldown(state, dt);
  if (state.autoShotgun) fireShotgun(state); // fires only when the cooldown is over
  moveShots(state, dt);
  moveEnemies(state, dt);
  updateSpawning(state, dt, random); // after moving, so new enemies start at the top
  handleShotHits(state);
  handleEnemyLosses(state);
  if (state.lives <= 0) state.isOver = true;
}

// Each axis moves on its own at SHIP_SPEED, so diagonals are not slowed down.
function moveShip(state, input, dt) {
  const ship = state.ship;
  const dx = axisDirection(input.left, input.right);
  const dy = axisDirection(input.up, input.down);
  ship.x = clamp(ship.x + dx * SHIP_SPEED * dt, 0, CANVAS_WIDTH - ship.width);
  ship.y = clamp(ship.y + dy * SHIP_SPEED * dt, 0, CANVAS_HEIGHT - ship.height);
}

// -1, 0, or 1 along one axis; holding both keys cancels out.
function axisDirection(negative, positive) {
  return (positive ? 1 : 0) - (negative ? 1 : 0);
}

function updateFiring(state, input, dt) {
  state.shotTimer = Math.max(0, state.shotTimer - dt);
  if (input.fire && state.shotTimer === 0) {
    state.shots.push(createShot(state.ship));
    state.shotTimer = SHOT_DELAY;
  }
}

// A shot starts just above the middle of the ship's nose.
function createShot(ship) {
  return {
    x: ship.x + (ship.width - SHOT_WIDTH) / 2,
    y: ship.y - SHOT_HEIGHT,
    width: SHOT_WIDTH,
    height: SHOT_HEIGHT,
  };
}

// The cooldown only counts down during play, so a pause freezes it.
function updateShotgunCooldown(state, dt) {
  state.shotgunTimer = Math.max(0, state.shotgunTimer - dt);
}

// Called on a fresh Shift press. Does nothing while paused, over, or cooling down.
function fireShotgun(state) {
  if (state.isOver || state.isPaused || state.shotgunTimer > 0) return;
  for (let i = 0; i < SHOTGUN_PELLETS; i++) {
    const side = i - (SHOTGUN_PELLETS - 1) / 2; // -2, -1, 0, 1, 2 for five pellets
    state.shots.push(createPellet(state.ship, side * SHOTGUN_SPREAD_SPEED));
  }
  state.shotgunTimer = SHOTGUN_COOLDOWN;
}

// A pellet is a normal shot that also drifts sideways at `dx` pixels per second.
function createPellet(ship, dx) {
  return { ...createShot(ship), dx };
}

// "Ready", or the whole seconds left on the cooldown (10, 9, ... 1).
function shotgunCooldownText(state) {
  return state.shotgunTimer > 0 ? String(Math.ceil(state.shotgunTimer)) : "Ready";
}

// Ctrl turns the auto shotgun on or off, only during play (not paused or over).
function toggleAutoShotgun(state) {
  if (!state.isOver && !state.isPaused) state.autoShotgun = !state.autoShotgun;
}

// "On" or "Off", for the Auto Shotgun panel.
function autoShotgunText(state) {
  return state.autoShotgun ? "On" : "Off";
}

// Normal shots go straight up; pellets also move sideways. Both are removed
// once they have left the canvas.
function moveShots(state, dt) {
  for (const shot of state.shots) {
    shot.y -= SHOT_SPEED * dt;
    if (shot.dx) shot.x += shot.dx * dt;
  }
  state.shots = state.shots.filter(isOnCanvas);
}

function isOnCanvas(rect) {
  return rectsOverlap(rect, { x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
}

function updateSpawning(state, dt, random) {
  state.spawnTimer += dt;
  while (state.spawnTimer >= ENEMY_SPAWN_DELAY) {
    state.spawnTimer -= ENEMY_SPAWN_DELAY;
    state.enemies.push(createEnemy(random));
  }
}

// An enemy starts just above the top edge at a random x, then slides in.
// random() is used for x, then the kind, then a triangle's starting direction.
function createEnemy(random) {
  const enemy = {
    type: "square",
    x: random() * (CANVAS_WIDTH - ENEMY_SIZE),
    y: -ENEMY_SIZE,
    width: ENEMY_SIZE,
    height: ENEMY_SIZE,
  };
  if (random() < TRIANGLE_CHANCE) {
    enemy.type = "triangle";
    enemy.direction = random() < 0.5 ? -1 : 1; // -1 left, 1 right
  }
  return enemy;
}

function isTriangle(enemy) {
  return enemy.type === "triangle";
}

function moveEnemies(state, dt) {
  for (const enemy of state.enemies) {
    if (isTriangle(enemy)) moveTriangle(enemy, dt);
    else enemy.y += ENEMY_SPEED * dt;
  }
}

// A triangle falls slowly and moves sideways, turning around at either edge.
function moveTriangle(enemy, dt) {
  const maxX = CANVAS_WIDTH - enemy.width;
  enemy.y += TRIANGLE_FALL_SPEED * dt;
  enemy.x += enemy.direction * TRIANGLE_SIDE_SPEED * dt;
  if (enemy.x <= 0) {
    enemy.x = 0;
    enemy.direction = 1;
  } else if (enemy.x >= maxX) {
    enemy.x = maxX;
    enemy.direction = -1;
  }
}

// Each shot destroys at most one enemy; both disappear and the score goes up.
function handleShotHits(state) {
  const enemiesLeft = [...state.enemies];
  const shotsLeft = [];
  for (const shot of state.shots) {
    const hitIndex = enemiesLeft.findIndex((enemy) => rectsOverlap(shot, enemy));
    if (hitIndex === -1) {
      shotsLeft.push(shot);
    } else {
      enemiesLeft.splice(hitIndex, 1);
      state.score += POINTS_PER_ENEMY;
    }
  }
  state.shots = shotsLeft;
  state.enemies = enemiesLeft;
}

// An enemy that touches the ship or reaches the bottom is removed and costs a life.
function handleEnemyLosses(state) {
  const enemiesLeft = [];
  for (const enemy of state.enemies) {
    if (rectsOverlap(enemy, state.ship) || reachedBottom(enemy)) {
      state.lives = Math.max(0, state.lives - 1);
    } else {
      enemiesLeft.push(enemy);
    }
  }
  state.enemies = enemiesLeft;
}

function reachedBottom(enemy) {
  return enemy.y + enemy.height >= CANVAS_HEIGHT;
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// ---- High score ------------------------------------------------------------
// Kept apart from the game state so that restarting (resetGame) never clears it.
// `storage` is localStorage, or null when the browser does not allow it.

function createHighScore(storage) {
  return { best: loadHighScore(storage), storage };
}

// Raise the high score as soon as the score passes it, and save it.
// Returns true when it changed.
function updateHighScore(highScore, score) {
  if (score <= highScore.best) return false;
  highScore.best = score;
  saveHighScore(highScore.storage, score);
  return true;
}

// A missing, broken, or negative saved value counts as no high score (0).
function loadHighScore(storage) {
  try {
    const saved = Number(storage.getItem(HIGH_SCORE_KEY));
    return Number.isFinite(saved) && saved > 0 ? Math.floor(saved) : 0;
  } catch {
    return 0; // no storage, or reading it is blocked
  }
}

function saveHighScore(storage, value) {
  try {
    storage.setItem(HIGH_SCORE_KEY, String(value));
  } catch {
    // No storage or writing is blocked: the high score lasts until the page closes.
  }
}

// ---- Keyboard --------------------------------------------------------------

const LEFT_KEYS = ["ArrowLeft", "KeyA"];
const RIGHT_KEYS = ["ArrowRight", "KeyD"];
const UP_KEYS = ["ArrowUp", "KeyW"];
const DOWN_KEYS = ["ArrowDown", "KeyS"];
const FIRE_KEYS = ["Space"];
const RESTART_KEYS = ["Enter", "NumpadEnter"];
const PAUSE_KEYS = ["Escape"];
const SHOTGUN_KEYS = ["ShiftLeft", "ShiftRight"];
const AUTO_SHOTGUN_KEYS = ["ControlLeft", "ControlRight"];

// Returns true when the key belongs to the game (so the page should not scroll).
// `repeat` is true for the extra keydowns a browser sends while a key is held.
// Move and fire keys are still tracked while paused, so a key let go during
// the pause is not stuck down afterwards.
function handleKeyDown(state, input, code, repeat = false) {
  if (RESTART_KEYS.includes(code)) {
    if (state.isOver) resetGame(state);
    return true;
  }
  if (PAUSE_KEYS.includes(code)) {
    if (!repeat) togglePause(state);
    return true;
  }
  if (SHOTGUN_KEYS.includes(code)) {
    if (!repeat) fireShotgun(state); // one blast per press, never on a held key
    return true;
  }
  if (AUTO_SHOTGUN_KEYS.includes(code)) {
    if (!repeat) toggleAutoShotgun(state); // a held Ctrl does not flip it back and forth
    return true;
  }
  return setKey(input, code, true);
}

// Esc pauses or un-pauses during play; it does nothing on the game-over screen.
function togglePause(state) {
  if (!state.isOver) state.isPaused = !state.isPaused;
}

function handleKeyUp(input, code) {
  return setKey(input, code, false);
}

function setKey(input, code, isDown) {
  if (LEFT_KEYS.includes(code)) input.left = isDown;
  else if (RIGHT_KEYS.includes(code)) input.right = isDown;
  else if (UP_KEYS.includes(code)) input.up = isDown;
  else if (DOWN_KEYS.includes(code)) input.down = isDown;
  else if (FIRE_KEYS.includes(code)) input.fire = isDown;
  else return false;
  return true;
}

// ---- Drawing ---------------------------------------------------------------

function drawGame(ctx, state) {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawShip(ctx, state.ship);
  for (const shot of state.shots) drawRect(ctx, shot, COLORS.shot);
  for (const enemy of state.enemies) drawEnemy(ctx, enemy);
  if (state.isPaused) drawPaused(ctx);
  drawHud(ctx, state); // after the pause dimming, so score and lives stay readable
  if (state.isOver) drawGameOver(ctx, state);
}

// The ship is drawn as a triangle pointing up; collisions use its rectangle.
function drawShip(ctx, ship) {
  ctx.fillStyle = COLORS.ship;
  ctx.beginPath();
  ctx.moveTo(ship.x + ship.width / 2, ship.y);
  ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
  ctx.lineTo(ship.x, ship.y + ship.height);
  ctx.closePath();
  ctx.fill();
}

function drawEnemy(ctx, enemy) {
  if (isTriangle(enemy)) drawTriangleEnemy(ctx, enemy);
  else drawRect(ctx, enemy, COLORS.enemy);
}

// A purple triangle with a flat top and its point at the bottom middle.
// Collisions still use its rectangle.
function drawTriangleEnemy(ctx, enemy) {
  ctx.fillStyle = COLORS.triangle;
  ctx.beginPath();
  ctx.moveTo(enemy.x, enemy.y);
  ctx.lineTo(enemy.x + enemy.width, enemy.y);
  ctx.lineTo(enemy.x + enemy.width / 2, enemy.y + enemy.height);
  ctx.closePath();
  ctx.fill();
}

function drawRect(ctx, rect, color) {
  ctx.fillStyle = color;
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
}

function drawHud(ctx, state) {
  ctx.fillStyle = COLORS.text;
  ctx.font = "18px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(hudText(state), 10, 10);
}

function hudText(state) {
  return `Score: ${state.score}   Lives: ${state.lives}`;
}

// Dim the frozen game and say how to resume.
function drawPaused(ctx) {
  dimCanvas(ctx);
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "40px monospace";
  ctx.fillText("Paused", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  ctx.font = "16px monospace";
  ctx.fillText("Press Esc to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 25);
}

function dimCanvas(ctx) {
  ctx.fillStyle = COLORS.dim;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawGameOver(ctx, state) {
  dimCanvas(ctx);
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "40px monospace";
  ctx.fillText("Game Over", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  ctx.font = "22px monospace";
  ctx.fillText(`Final score: ${state.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  ctx.font = "16px monospace";
  ctx.fillText("Press Enter to play again", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

// ---- Browser start-up ------------------------------------------------------

// Reading window.localStorage itself can throw when site data is blocked.
function browserStorage() {
  try {
    return window.localStorage || null;
  } catch {
    return null;
  }
}

function startGame() {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const highScoreElement = document.getElementById("high-score");
  const shotgunElement = document.getElementById("shotgun-cooldown");
  const autoShotgunElement = document.getElementById("auto-shotgun");
  const state = createGame();
  const input = createInput();
  const highScore = createHighScore(browserStorage());
  highScoreElement.textContent = String(highScore.best);
  showShotgunPanels(shotgunElement, autoShotgunElement, state);

  window.addEventListener("keydown", (event) => {
    if (handleKeyDown(state, input, event.code, event.repeat)) event.preventDefault();
  });
  window.addEventListener("keyup", (event) => {
    if (handleKeyUp(input, event.code)) event.preventDefault();
  });

  // requestAnimationFrame game loop: update, check collisions, redraw.
  let lastTime = null;
  function frame(now) {
    const dt = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, MAX_FRAME_TIME);
    lastTime = now;
    updateGame(state, input, dt);
    if (updateHighScore(highScore, state.score)) highScoreElement.textContent = String(highScore.best);
    showShotgunPanels(shotgunElement, autoShotgunElement, state);
    drawGame(ctx, state);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// Update the Shotgun cooldown panel and the Auto Shotgun panel under it.
function showShotgunPanels(shotgunElement, autoShotgunElement, state) {
  showPanelText(shotgunElement, shotgunCooldownText(state));
  showPanelText(autoShotgunElement, autoShotgunText(state));
}

// Write a side panel's text only when it changes.
function showPanelText(element, text) {
  if (element.textContent !== text) element.textContent = text;
}

if (typeof document !== "undefined") startGame();

// Let the Node tests load the game logic; ignored in the browser.
if (typeof module !== "undefined") {
  module.exports = {
    CANVAS_WIDTH, CANVAS_HEIGHT, SHIP_WIDTH, SHIP_HEIGHT, SHIP_BOTTOM_MARGIN, SHIP_SPEED,
    SHOT_WIDTH, SHOT_HEIGHT, SHOT_SPEED, SHOT_DELAY, ENEMY_SIZE, ENEMY_SPEED,
    ENEMY_SPAWN_DELAY, POINTS_PER_ENEMY, STARTING_LIVES, MAX_FRAME_TIME, HIGH_SCORE_KEY,
    TRIANGLE_CHANCE, TRIANGLE_FALL_SPEED, TRIANGLE_SIDE_SPEED, COLORS,
    SHOTGUN_COOLDOWN, SHOTGUN_PELLETS, SHOTGUN_SPREAD_SPEED,
    createGame, resetGame, createInput, updateGame, rectsOverlap, createEnemy,
    handleKeyDown, handleKeyUp, drawGame, hudText, shotgunCooldownText, autoShotgunText,
    createHighScore, updateHighScore, loadHighScore, saveHighScore,
  };
}
