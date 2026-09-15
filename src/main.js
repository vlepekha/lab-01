import "./style.css";
import { runBenchmark } from "./bench.js";
import { createHud } from "./engine/hud.js";
import { createInput } from "./engine/input.js";
import { createLoop } from "./engine/loop.js";
import { createIntervalLoop, createVariableLoop } from "./engine/loop-variants.js";
import { createShip, integrate, interpolate } from "./engine/physics.js";
import { createRenderer } from "./engine/renderer.js";
import { burnMilliseconds, EXPERIMENTS } from "./experiments.js";

const canvas = document.querySelector("#arena");
const hudRoot = document.querySelector("#hud");
const modeSelect = document.querySelector("#mode");
const blockInput = document.querySelector("#block-ms");
const noteEl = document.querySelector("#note");

const input = createInput();
const renderer = createRenderer(canvas);
const hud = createHud(hudRoot);

// Два стани: попередній крок і поточний. Рендер малює щось між ними.
let previousState = createShip();
let currentState = previousState;
let loop = null;
let mode = "none";

function update(dt) {
  previousState = currentState;
  currentState = integrate(currentState, input.snapshot(), dt);
}

function render(alpha) {
  // Експеримент 1: синхронна робота всередині кадру, один раз на кадр.
  if (mode === "block") {
    burnMilliseconds(Number(blockInput.value) || 0);
  }
  const view = mode === "variable" ? currentState : interpolate(previousState, currentState, alpha);
  renderer.render(view);
  hud.update(loop.stats, currentState, EXPERIMENTS[mode].label, performance.now());
}

function buildLoop() {
  if (mode === "interval")
    return createIntervalLoop({ update, render, stepHz: 60, intervalMs: 16 });
  if (mode === "variable") return createVariableLoop({ update, render });
  return createLoop({ update, render, stepHz: 60 });
}

function applyMode(next) {
  mode = next;
  loop?.stop();
  previousState = currentState;
  loop = buildLoop();
  loop.start();
  noteEl.textContent = EXPERIMENTS[mode].description;
  blockInput.disabled = mode !== "block";
}

for (const [value, meta] of Object.entries(EXPERIMENTS)) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = meta.label;
  modeSelect.appendChild(option);
}
modeSelect.value = "none";
modeSelect.addEventListener("change", (event) => applyMode(event.target.value));

const benchButton = document.querySelector("#bench");
benchButton.addEventListener("click", async () => {
  benchButton.disabled = true;
  modeSelect.disabled = true;
  await runBenchmark({
    setMode: (next) => {
      modeSelect.value = next;
      applyMode(next);
    },
    getStats: () => loop.stats,
    onProgress: (text) => {
      noteEl.textContent = `Benchmark: ${text}`;
    },
  });
  benchButton.disabled = false;
  modeSelect.disabled = false;
});

document.querySelector("#reset").addEventListener("click", () => {
  currentState = createShip();
  previousState = currentState;
});

applyMode("none");

// Демонстрація порядку черг у консолі: див. розділ Reflection у README.
console.log("1 sync");
setTimeout(() => console.log("4 macrotask (setTimeout)"), 0);
queueMicrotask(() => console.log("3 microtask (queueMicrotask)"));
requestAnimationFrame(() => console.log("5 rAF (before paint)"));
Promise.resolve().then(() => console.log("3.1 microtask (Promise)"));
console.log("2 sync");

// Дебаг-хук: дозволяє знімати цифри для README прямо з консолі.
window.starfall = {
  get stats() {
    return loop.stats;
  },
  get ship() {
    return currentState;
  },
  setMode(next) {
    modeSelect.value = next;
    applyMode(next);
  },
};
