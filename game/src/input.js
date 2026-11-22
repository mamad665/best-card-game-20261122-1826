// Shadow Deck — Card Duel: mouse and keyboard input.
// The canvas is scaled to the window; this module converts screen pixels
// back to logical table coordinates and keeps the pointer and the keys
// pressed, so main.js can ask "what is under the pointer" and "was the
// End Turn key just pressed" without touching DOM events itself.

import { FIELD } from './config.js';

export function createInput(canvas) {
  const input = {
    pointer: { x: -1, y: -1, inside: false },
    clicked: null,
    keys: new Set(),
    pressed: new Set(),
  };

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = FIELD.width / rect.width;
    const scaleY = FIELD.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  canvas.addEventListener('pointermove', (event) => {
    const point = toLogical(event);
    input.pointer.x = point.x;
    input.pointer.y = point.y;
    input.pointer.inside = true;
  });
  canvas.addEventListener('pointerleave', () => {
    input.pointer.inside = false;
  });
  canvas.addEventListener('pointerdown', (event) => {
    input.clicked = toLogical(event);
  });
  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if ([' ', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(key)) event.preventDefault();
    if (!event.repeat) input.pressed.add(key);
    input.keys.add(key);
  });
  window.addEventListener('keyup', (event) => {
    input.keys.delete(event.key.toLowerCase());
  });
  return input;
}

/** The click point of this frame, if any; call once per frame. */
export function takeClick(input) {
  const click = input.clicked;
  input.clicked = null;
  return click;
}

/** True once for the frame the key went down. */
export function takeKey(input, key) {
  if (!input.pressed.has(key)) return false;
  input.pressed.delete(key);
  return true;
}

/** True when point (x, y) lies inside rect {x, y, w, h}. */
export function insideRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
