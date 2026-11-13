// Shared helpers for the Node tests. Run all tests with: node --test
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.join(__dirname, "..");
const GAME_PATH = path.join(ROOT, "game.js");

function readProjectFile(name) {
  return fs.readFileSync(path.join(ROOT, name), "utf8");
}

// Advance the game in small 60 fps steps, like the browser loop does.
function step(game, state, input, seconds, random = () => 0.5) {
  const dt = 1 / 60;
  const frames = Math.round(seconds / dt);
  for (let i = 0; i < frames; i++) game.updateGame(state, input, dt, random);
}

// A stand-in for CanvasRenderingContext2D that records every call made on it,
// along with the fillStyle that was active at the time.
function createFakeContext() {
  const calls = [];
  const target = {};
  const ctx = new Proxy(target, {
    get(obj, prop) {
      if (prop in obj) return obj[prop];
      return (...args) => calls.push({ name: prop, args, fillStyle: obj.fillStyle });
    },
    set(obj, prop, value) {
      obj[prop] = value;
      return true;
    },
  });
  return {
    ctx,
    calls,
    texts: () => calls.filter((c) => c.name === "fillText").map((c) => c.args[0]),
    rectsWithColor: (color) => calls.filter((c) => c.name === "fillRect" && c.fillStyle === color),
  };
}

// A stand-in for the browser's localStorage. Like the real one, it stores
// strings and returns null for a missing key.
function createFakeStorage(initial = {}) {
  const items = new Map(Object.entries(initial).map(([key, value]) => [key, String(value)]));
  return {
    items,
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => void items.set(key, String(value)),
  };
}

// Load game.js the way a browser would (as a plain script with a document and
// window), using fakes for the canvas, keyboard events and animation frames.
// Options:
//   storage - put on window.localStorage (left out: the page has no localStorage)
//   random  - replaces Math.random inside the page, to place enemies
function loadGameInFakePage({ storage, random } = {}) {
  const fake = createFakeContext();
  const listeners = { keydown: [], keyup: [] };
  let nextFrame = null;
  const canvas = { width: 480, height: 640, getContext: () => fake.ctx };
  const highScoreElement = { textContent: "" };
  const elements = { game: canvas, "high-score": highScoreElement };

  const sandbox = {
    document: { getElementById: (id) => elements[id] || null },
    addEventListener: (type, fn) => (listeners[type] ||= []).push(fn),
    requestAnimationFrame: (fn) => {
      nextFrame = fn;
      return 1;
    },
  };
  if (storage !== undefined) sandbox.localStorage = storage;
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  if (random) vm.runInContext("Math", sandbox).random = random;
  vm.runInContext(fs.readFileSync(GAME_PATH, "utf8"), sandbox, { filename: "game.js" });

  let now = 0;
  function sendKey(type, code) {
    const event = { code, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
    for (const fn of listeners[type]) fn(event);
    return event;
  }

  return {
    fake,
    listeners,
    highScoreText: () => highScoreElement.textContent,
    hasPendingFrame: () => nextFrame !== null,
    press: (code) => sendKey("keydown", code),
    release: (code) => sendKey("keyup", code),
    // Run one animation frame `ms` milliseconds after the previous one.
    // Only the latest frame's draw calls are kept in fake.calls.
    frame(ms = 1000 / 60) {
      now += ms;
      const run = nextFrame;
      nextFrame = null;
      fake.calls.length = 0;
      run(now);
    },
    runFor(seconds) {
      const frames = Math.round(seconds * 60);
      for (let i = 0; i < frames; i++) this.frame();
    },
  };
}

module.exports = { ROOT, readProjectFile, step, createFakeContext, createFakeStorage, loadGameInFakePage };
