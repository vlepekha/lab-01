/**
 * createInput() — приклад замикання.
 * Набір натиснутих клавіш живе всередині функції: жоден інший модуль
 * не має до нього доступу, тільки через повернені методи.
 */
const DEFAULT_BINDINGS = {
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  ArrowUp: "thrust",
  KeyW: "thrust",
  ArrowDown: "brake",
  KeyS: "brake",
  Space: "fire",
};

export function createInput(target = window, bindings = DEFAULT_BINDINGS) {
  const pressed = new Set();

  const onKeyDown = (event) => {
    const action = bindings[event.code];
    if (!action) return;
    event.preventDefault();
    pressed.add(action);
  };

  const onKeyUp = (event) => {
    const action = bindings[event.code];
    if (!action) return;
    event.preventDefault();
    pressed.delete(action);
  };

  // Якщо вкладка втратила фокус — клавіші "залипнуть" назавжди без цього.
  const onBlur = () => pressed.clear();

  target.addEventListener("keydown", onKeyDown);
  target.addEventListener("keyup", onKeyUp);
  target.addEventListener("blur", onBlur);

  return {
    /** Знімок стану для одного кроку симуляції (простий незмінний об'єкт). */
    snapshot() {
      return {
        left: pressed.has("left"),
        right: pressed.has("right"),
        thrust: pressed.has("thrust"),
        brake: pressed.has("brake"),
        fire: pressed.has("fire"),
      };
    },
    isDown(action) {
      return pressed.has(action);
    },
    dispose() {
      target.removeEventListener("keydown", onKeyDown);
      target.removeEventListener("keyup", onKeyUp);
      target.removeEventListener("blur", onBlur);
      pressed.clear();
    },
  };
}
