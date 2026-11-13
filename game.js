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

const ENEMY_SIZE = 30;
const ENEMY_SPEED = 100; // pixels per second, downward
const ENEMY_SPAWN_DELAY = 1.0; // seconds between new enemies

const POINTS_PER_ENEMY = 10;
const STARTING_LIVES = 3;

const MAX_FRAME_TIME = 0.1; // cap on one frame's step, e.g. after a tab switch

const COLORS = {
  background: "#000010",
  ship: "#4fd1ff",
  shot: "#ffe14f",
  enemy: "#ff4f6a",
  text: "#ffffff",
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
    shotTimer: 0, // time left until the ship may fire again
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
function updateGame(state, input, dt, random = Math.random) {
  if (state.isOver) return;
  moveShip(state, input, dt);
  updateFiring(state, input, dt);
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

function moveShots(state, dt) {
  for (const shot of state.shots) shot.y -= SHOT_SPEED * dt;
  state.shots = state.shots.filter((shot) => shot.y + shot.height > 0);
}

function updateSpawning(state, dt, random) {
  state.spawnTimer += dt;
  while (state.spawnTimer >= ENEMY_SPAWN_DELAY) {
    state.spawnTimer -= ENEMY_SPAWN_DELAY;
    state.enemies.push(createEnemy(random));
  }
}

// An enemy starts just above the top edge at a random x, then slides in.
function createEnemy(random) {
  return {
    x: random() * (CANVAS_WIDTH - ENEMY_SIZE),
    y: -ENEMY_SIZE,
    width: ENEMY_SIZE,
    height: ENEMY_SIZE,
  };
}

function moveEnemies(state, dt) {
  for (const enemy of state.enemies) enemy.y += ENEMY_SPEED * dt;
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

// ---- Keyboard --------------------------------------------------------------

const LEFT_KEYS = ["ArrowLeft", "KeyA"];
const RIGHT_KEYS = ["ArrowRight", "KeyD"];
const UP_KEYS = ["ArrowUp", "KeyW"];
const DOWN_KEYS = ["ArrowDown", "KeyS"];
const FIRE_KEYS = ["Space"];
const RESTART_KEYS = ["Enter", "NumpadEnter"];

// Returns true when the key belongs to the game (so the page should not scroll).
function handleKeyDown(state, input, code) {
  if (RESTART_KEYS.includes(code)) {
    if (state.isOver) resetGame(state);
    return true;
  }
  return setKey(input, code, true);
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
  for (const enemy of state.enemies) drawRect(ctx, enemy, COLORS.enemy);
  drawHud(ctx, state);
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

function drawGameOver(ctx, state) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
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

function startGame() {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const state = createGame();
  const input = createInput();

  window.addEventListener("keydown", (event) => {
    if (handleKeyDown(state, input, event.code)) event.preventDefault();
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
    drawGame(ctx, state);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

if (typeof document !== "undefined") startGame();

// Let the Node tests load the game logic; ignored in the browser.
if (typeof module !== "undefined") {
  module.exports = {
    CANVAS_WIDTH, CANVAS_HEIGHT, SHIP_WIDTH, SHIP_HEIGHT, SHIP_BOTTOM_MARGIN, SHIP_SPEED,
    SHOT_WIDTH, SHOT_HEIGHT, SHOT_SPEED, SHOT_DELAY, ENEMY_SIZE, ENEMY_SPEED,
    ENEMY_SPAWN_DELAY, POINTS_PER_ENEMY, STARTING_LIVES, MAX_FRAME_TIME,
    createGame, resetGame, createInput, updateGame, rectsOverlap,
    handleKeyDown, handleKeyUp, drawGame, hudText,
  };
}
